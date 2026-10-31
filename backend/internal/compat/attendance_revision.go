package compat

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

const (
	attendanceRevisionPending  = "pending"
	attendanceRevisionApproved = "approved"
	attendanceRevisionRejected = "rejected"
)

type attendanceRevisionAPIError struct {
	status  int
	code    string
	message string
}

func (e *attendanceRevisionAPIError) Error() string { return e.message }

func revisionAPIError(status int, code, message string) error {
	return &attendanceRevisionAPIError{status: status, code: code, message: message}
}

func respondAttendanceRevisionError(c *fiber.Ctx, err error) error {
	var apiErr *attendanceRevisionAPIError
	if errors.As(err, &apiErr) {
		return httpx.Error(c, apiErr.status, apiErr.code, apiErr.message)
	}
	return err
}

type attendanceRevisionInput struct {
	Tanggal   string `json:"tanggal"`
	Alasan    string `json:"alasan"`
	JamMasuk  string `json:"jamMasuk"`
	JamPulang string `json:"jamPulang"`
}

func (h *Handler) teacherAttendanceRevisions(c *fiber.Ctx) error {
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	user, err := h.revisionTeacher(claims.UserID)
	if err != nil {
		return err
	}
	start, end, hasRange, err := revisionQueryRange(c, appLocation(h))
	if err != nil {
		return invalid(c, err.Error())
	}

	query := h.db.Where("user_id = ?", user.ID)
	var requests []models.AttendanceRevisionRequest
	if err := query.Order("created_at DESC, id DESC").Find(&requests).Error; err != nil {
		return err
	}

	eligibleDates := []string{}
	if hasRange {
		eligibleDates, err = h.eligibleAttendanceRevisionDates(user, start, end)
		if err != nil {
			return err
		}
	}
	items, err := h.attendanceRevisionPayloads(requests, false)
	if err != nil {
		return err
	}
	return httpx.Success(c, "Pengajuan revisi presensi berhasil diambil", fiber.Map{
		"requests":      items,
		"eligibleDates": eligibleDates,
	})
}

func revisionQueryRange(c *fiber.Ctx, location *time.Location) (time.Time, time.Time, bool, error) {
	startValue, endValue := c.Query("start_date"), c.Query("end_date")
	if startValue == "" && endValue == "" {
		return time.Time{}, time.Time{}, false, nil
	}
	if startValue == "" || endValue == "" {
		return time.Time{}, time.Time{}, false, fmt.Errorf("Tanggal awal dan akhir harus diisi bersama")
	}
	start, err := parseDate(startValue, location)
	if err != nil {
		return time.Time{}, time.Time{}, false, fmt.Errorf("Format tanggal awal tidak valid")
	}
	end, err := parseDate(endValue, location)
	if err != nil || end.Before(start) || end.Sub(start) > 366*24*time.Hour {
		return time.Time{}, time.Time{}, false, fmt.Errorf("Rentang tanggal tidak valid")
	}
	return start, end, true, nil
}

func (h *Handler) eligibleAttendanceRevisionDates(user models.User, start, end time.Time) ([]string, error) {
	location := appLocation(h)
	todayDate := dateOnly(time.Now().In(location))
	monthStart := time.Date(todayDate.Year(), todayDate.Month(), 1, 0, 0, 0, 0, location)
	if start.Before(monthStart) || start.Year() != todayDate.Year() || start.Month() != todayDate.Month() {
		return []string{}, nil
	}
	if end.After(todayDate) {
		end = todayDate
	}
	if end.Before(start) {
		return []string{}, nil
	}

	calendar, err := h.loadWorkdayCalendar(start, end)
	if err != nil {
		return nil, err
	}
	var overrides []models.WeekendOverride
	if err := h.db.Where("user_id = ? AND tanggal >= ? AND tanggal < ?", user.ID, start.Format("2006-01-02"), end.AddDate(0, 0, 1).Format("2006-01-02")).Find(&overrides).Error; err != nil {
		return nil, err
	}
	overrideByDate := make(map[string]models.WeekendOverride, len(overrides))
	for _, row := range overrides {
		overrideByDate[row.Tanggal.Format("2006-01-02")] = row
	}
	var logs []models.AttendanceLog
	if err := h.db.Where("user_id = ? AND tanggal >= ? AND tanggal < ?", user.ID, start.Format("2006-01-02"), end.AddDate(0, 0, 1).Format("2006-01-02")).Find(&logs).Error; err != nil {
		return nil, err
	}
	logByDate := make(map[string]bool, len(logs))
	for _, log := range logs {
		logByDate[log.Tanggal.Format("2006-01-02")] = true
	}

	eligible := make([]string, 0)
	for _, date := range dateRange(start, end) {
		isWorkday, optional, _ := journalReportDayType(calendar, user, date, overrideByDate)
		dateString := date.Format("2006-01-02")
		if isWorkday || optional && logByDate[dateString] {
			eligible = append(eligible, dateString)
		}
	}
	return eligible, nil
}

func (h *Handler) createTeacherAttendanceRevision(c *fiber.Ctx) error {
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	user, err := h.revisionTeacher(claims.UserID)
	if err != nil {
		return err
	}
	input, err := readAttendanceRevisionInput(c)
	if err != nil {
		return invalid(c, err.Error())
	}
	date, err := parseDate(input.Tanggal, appLocation(h))
	if err != nil {
		return invalid(c, "Format tanggal tidak valid")
	}
	if err := h.validateNewAttendanceRevisionDate(user, date); err != nil {
		return respondAttendanceRevisionError(c, err)
	}
	var attendance models.AttendanceLog
	findErr := h.db.Where("user_id = ? AND tanggal = ?", user.ID, date).First(&attendance).Error
	if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
		return findErr
	}
	if errors.Is(findErr, gorm.ErrRecordNotFound) {
		attendance = models.AttendanceLog{}
	}
	jamMasuk, jamPulang, err := validateAttendanceRevisionTimes(input, attendance)
	if err != nil {
		return invalid(c, err.Error())
	}
	var attendanceID *uint
	if attendance.ID != 0 {
		attendanceID = &attendance.ID
	}
	pendingKey := attendanceRevisionPendingKey(user.ID, date)
	request := models.AttendanceRevisionRequest{
		UserID: user.ID, AttendanceID: attendanceID, Tanggal: date,
		Alasan: input.Alasan, JamMasuk: jamMasuk, JamPulang: jamPulang,
		Status: attendanceRevisionPending, PendingKey: &pendingKey,
	}
	if err := h.db.Create(&request).Error; err != nil {
		if isDuplicateError(err) {
			return httpx.Error(c, fiber.StatusConflict, "REVISION_ALREADY_PENDING", "Pengajuan revisi untuk tanggal ini sudah menunggu. Silakan pilih Edit Pengajuan.")
		}
		return err
	}
	items, err := h.attendanceRevisionPayloads([]models.AttendanceRevisionRequest{request}, false)
	if err != nil {
		return err
	}
	if err := h.sendAttendanceRevisionTelegramNotification(user, request); err != nil {
		log.Printf("Telegram notification failed for attendance revision %d: %v", request.ID, err)
	}
	return httpx.Success(c, "Pengajuan revisi berhasil dikirim", items[0])
}

func (h *Handler) updateTeacherAttendanceRevision(c *fiber.Ctx) error {
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	user, err := h.revisionTeacher(claims.UserID)
	if err != nil {
		return err
	}
	id, err := parseUint(c.Params("id"))
	if err != nil {
		return invalid(c, "ID pengajuan tidak valid")
	}
	input, err := readAttendanceRevisionInput(c)
	if err != nil {
		return invalid(c, err.Error())
	}
	var request models.AttendanceRevisionRequest
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", id, user.ID).First(&request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return revisionAPIError(fiber.StatusNotFound, "REVISION_NOT_FOUND", "Pengajuan revisi tidak ditemukan")
			}
			return err
		}
		if request.Status != attendanceRevisionPending {
			return revisionAPIError(fiber.StatusConflict, "REVISION_ALREADY_REVIEWED", "Pengajuan sudah diproses dan tidak dapat diedit")
		}
		var attendance models.AttendanceLog
		findErr := tx.Where("user_id = ? AND tanggal = ?", user.ID, request.Tanggal).First(&attendance).Error
		if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}
		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			attendance = models.AttendanceLog{}
		}
		jamMasuk, jamPulang, err := validateAttendanceRevisionTimes(input, attendance)
		if err != nil {
			return revisionAPIError(fiber.StatusBadRequest, "REVISION_TIME_INVALID", err.Error())
		}
		request.Alasan = input.Alasan
		request.JamMasuk = jamMasuk
		request.JamPulang = jamPulang
		if attendance.ID != 0 {
			request.AttendanceID = &attendance.ID
		}
		return tx.Save(&request).Error
	})
	if err != nil {
		return respondAttendanceRevisionError(c, err)
	}
	items, err := h.attendanceRevisionPayloads([]models.AttendanceRevisionRequest{request}, false)
	if err != nil {
		return err
	}
	return httpx.Success(c, "Pengajuan revisi berhasil diperbarui", items[0])
}

func (h *Handler) validateNewAttendanceRevisionDate(user models.User, date time.Time) error {
	location := appLocation(h)
	todayDate := dateOnly(time.Now().In(location))
	monthStart := time.Date(todayDate.Year(), todayDate.Month(), 1, 0, 0, 0, 0, location)
	if date.Before(monthStart) || date.Year() != todayDate.Year() || date.Month() != todayDate.Month() || date.After(todayDate) {
		return revisionAPIError(fiber.StatusBadRequest, "REVISION_DATE_OUT_OF_RANGE", "Revisi hanya dapat diajukan untuk hari kerja pada bulan berjalan sampai hari ini")
	}
	calendar, err := h.loadWorkdayCalendar(date, date)
	if err != nil {
		return err
	}
	var overrides []models.WeekendOverride
	if err := h.db.Where("user_id = ? AND tanggal = ?", user.ID, date.Format("2006-01-02")).Find(&overrides).Error; err != nil {
		return err
	}
	overrideByDate := make(map[string]models.WeekendOverride, len(overrides))
	for _, row := range overrides {
		overrideByDate[row.Tanggal.Format("2006-01-02")] = row
	}
	workday, optional, _ := journalReportDayType(calendar, user, date, overrideByDate)
	var attendance models.AttendanceLog
	queryErr := h.db.Where("user_id = ? AND tanggal = ?", user.ID, date).First(&attendance).Error
	if queryErr != nil && !errors.Is(queryErr, gorm.ErrRecordNotFound) {
		return queryErr
	}
	if !workday && !(optional && queryErr == nil) {
		return revisionAPIError(fiber.StatusBadRequest, "REVISION_DATE_NOT_WORKDAY", "Tanggal ini bukan hari kerja yang dapat direvisi")
	}
	return nil
}

func readAttendanceRevisionInput(c *fiber.Ctx) (attendanceRevisionInput, error) {
	var input attendanceRevisionInput
	if err := c.BodyParser(&input); err != nil {
		return input, fmt.Errorf("Payload pengajuan tidak valid")
	}
	input.Tanggal = strings.TrimSpace(input.Tanggal)
	input.Alasan = strings.TrimSpace(input.Alasan)
	input.JamMasuk = strings.TrimSpace(input.JamMasuk)
	input.JamPulang = strings.TrimSpace(input.JamPulang)
	if !contains([]string{"lupa", "kendala_teknis", "izin", "sakit"}, input.Alasan) {
		return input, fmt.Errorf("Pilih alasan Lupa, Kendala Teknis, Izin, atau Sakit")
	}
	return input, nil
}

func validateAttendanceRevisionTimes(input attendanceRevisionInput, attendance models.AttendanceLog) (*string, *string, error) {
	if isAttendanceRevisionAbsence(input.Alasan) {
		if input.JamMasuk != "" || input.JamPulang != "" {
			return nil, nil, fmt.Errorf("Pengajuan Izin atau Sakit tidak memerlukan jam masuk dan jam pulang")
		}
		return nil, nil, nil
	}
	if input.JamMasuk == "" && input.JamPulang == "" {
		return nil, nil, fmt.Errorf("Isi setidaknya satu jam yang ingin direvisi")
	}
	if input.JamMasuk != "" && !validTime(input.JamMasuk) {
		return nil, nil, fmt.Errorf("Format jam masuk tidak valid")
	}
	if input.JamPulang != "" && !validTime(input.JamPulang) {
		return nil, nil, fmt.Errorf("Format jam pulang tidak valid")
	}
	jamMasuk := input.JamMasuk
	if jamMasuk == "" {
		jamMasuk = stringPointerValue(attendance.JamMasuk)
		if jamMasuk == "" {
			jamMasuk = stringPointerValue(attendance.JamHadir)
		}
	}
	if jamMasuk == "" {
		return nil, nil, fmt.Errorf("Jam masuk sebenarnya wajib diisi untuk tanggal yang belum memiliki catatan jam masuk")
	}
	jamPulang := input.JamPulang
	if jamPulang == "" {
		jamPulang = stringPointerValue(attendance.JamPulang)
	}
	if jamPulang != "" {
		masukMinutes, validMasuk := timeToMinutes(jamMasuk)
		pulangMinutes, validPulang := timeToMinutes(jamPulang)
		if !validMasuk || !validPulang || pulangMinutes < masukMinutes {
			return nil, nil, fmt.Errorf("Jam pulang tidak boleh lebih awal daripada jam masuk")
		}
	}
	var requestedIn, requestedOut *string
	if input.JamMasuk != "" {
		value := normalizeTime(input.JamMasuk)
		requestedIn = &value
	}
	if input.JamPulang != "" {
		value := normalizeTime(input.JamPulang)
		requestedOut = &value
	}
	return requestedIn, requestedOut, nil
}

func (h *Handler) revisionTeacher(userID uint) (models.User, error) {
	var user models.User
	if err := h.db.Where("id = ? AND role = ? AND archived_at IS NULL", userID, "guru").First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return user, fiber.ErrNotFound
		}
		return user, err
	}
	return user, nil
}

func attendanceRevisionPendingKey(userID uint, date time.Time) string {
	return fmt.Sprintf("%d:%s", userID, date.Format("2006-01-02"))
}

func (h *Handler) adminAttendanceRevisionPendingCount(c *fiber.Ctx) error {
	var count int64
	if err := h.db.Model(&models.AttendanceRevisionRequest{}).Where("status = ?", attendanceRevisionPending).Count(&count).Error; err != nil {
		return err
	}
	return httpx.Success(c, "Jumlah pengajuan menunggu berhasil diambil", fiber.Map{"pending": count})
}

func (h *Handler) adminAttendanceRevisions(c *fiber.Ctx) error {
	status := strings.TrimSpace(c.Query("status", attendanceRevisionPending))
	if !contains([]string{"pending", "approved", "rejected", "all"}, status) {
		return invalid(c, "Filter status pengajuan tidak valid")
	}
	query := h.db.Model(&models.AttendanceRevisionRequest{})
	if status != "all" {
		query = query.Where("status = ?", status)
	}
	var requests []models.AttendanceRevisionRequest
	if err := query.Order("CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC, id DESC").Find(&requests).Error; err != nil {
		return err
	}
	items, err := h.attendanceRevisionPayloads(requests, true)
	if err != nil {
		return err
	}
	return httpx.Success(c, "Daftar pengajuan revisi berhasil diambil", items)
}

func (h *Handler) attendanceRevisionPayloads(requests []models.AttendanceRevisionRequest, includeTeacher bool) ([]fiber.Map, error) {
	items := make([]fiber.Map, 0, len(requests))
	for _, request := range requests {
		payload := fiber.Map{
			"id": request.ID, "userId": request.UserID, "tanggal": request.Tanggal.Format("2006-01-02"),
			"alasan": request.Alasan, "jamMasuk": stringPointerValue(request.JamMasuk), "jamPulang": stringPointerValue(request.JamPulang),
			"status": request.Status, "catatanAdmin": stringPointerValue(request.CatatanAdmin), "reviewedBy": request.ReviewedBy,
			"reviewedAt": request.ReviewedAt, "createdAt": request.CreatedAt, "updatedAt": request.UpdatedAt,
			"currentJamMasuk": "", "currentJamPulang": "",
		}
		var attendance models.AttendanceLog
		attendanceErr := h.db.Where("user_id = ? AND tanggal = ?", request.UserID, request.Tanggal).First(&attendance).Error
		if attendanceErr != nil && !errors.Is(attendanceErr, gorm.ErrRecordNotFound) {
			return nil, attendanceErr
		}
		if attendanceErr == nil {
			currentIn := stringPointerValue(attendance.JamMasuk)
			if currentIn == "" {
				currentIn = stringPointerValue(attendance.JamHadir)
			}
			payload["currentJamMasuk"] = currentIn
			payload["currentJamPulang"] = stringPointerValue(attendance.JamPulang)
		}
		if includeTeacher {
			var teacher models.User
			if err := h.db.Select("id, nama, id_guru").First(&teacher, request.UserID).Error; err != nil {
				return nil, err
			}
			payload["namaGuru"] = teacher.Nama
			payload["idGuru"] = teacher.IDGuru
		}
		items = append(items, payload)
	}
	return items, nil
}

func (h *Handler) decideAttendanceRevision(c *fiber.Ctx) error {
	id, err := parseUint(c.Params("id"))
	if err != nil {
		return invalid(c, "ID pengajuan tidak valid")
	}
	body, err := readJSON(c)
	if err != nil {
		return invalid(c, err.Error())
	}
	decision := stringValue(body, "decision")
	note := strings.TrimSpace(stringValue(body, "note"))
	if !contains([]string{attendanceRevisionApproved, attendanceRevisionRejected}, decision) {
		return invalid(c, "Pilih keputusan Setujui atau Tolak")
	}
	if decision == attendanceRevisionRejected && note == "" {
		return invalid(c, "Catatan penolakan wajib diisi")
	}
	if len(note) > 1000 {
		return invalid(c, "Catatan maksimal 1000 karakter")
	}
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	request, err := h.applyAttendanceRevisionDecision(id, decision, note, claims.UserID)
	if err != nil {
		return respondAttendanceRevisionError(c, err)
	}
	items, err := h.attendanceRevisionPayloads([]models.AttendanceRevisionRequest{request}, true)
	if err != nil {
		return err
	}
	return httpx.Success(c, "Keputusan pengajuan revisi berhasil disimpan", items[0])
}

func (h *Handler) applyAttendanceRevisionDecision(id uint, decision, note string, reviewerID uint) (models.AttendanceRevisionRequest, error) {
	if !contains([]string{attendanceRevisionApproved, attendanceRevisionRejected}, decision) {
		return models.AttendanceRevisionRequest{}, revisionAPIError(fiber.StatusBadRequest, "INVALID_DECISION", "Pilih keputusan Setujui atau Tolak")
	}
	if decision == attendanceRevisionRejected && note == "" {
		return models.AttendanceRevisionRequest{}, revisionAPIError(fiber.StatusBadRequest, "REJECTION_NOTE_REQUIRED", "Catatan penolakan wajib diisi")
	}
	if len(note) > 1000 {
		return models.AttendanceRevisionRequest{}, revisionAPIError(fiber.StatusBadRequest, "REJECTION_NOTE_TOO_LONG", "Catatan maksimal 1000 karakter")
	}
	var request models.AttendanceRevisionRequest
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&request, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return revisionAPIError(fiber.StatusNotFound, "REVISION_NOT_FOUND", "Pengajuan revisi tidak ditemukan")
			}
			return fmt.Errorf("load attendance revision %d: %w", id, err)
		}
		if request.Status != attendanceRevisionPending {
			return revisionAPIError(fiber.StatusConflict, "REVISION_ALREADY_REVIEWED", "Pengajuan ini sudah diproses")
		}
		if decision == attendanceRevisionApproved {
			if err := h.applyAttendanceRevision(tx, &request); err != nil {
				return fmt.Errorf("apply attendance revision %d: %w", id, err)
			}
		}
		now := time.Now().In(appLocation(h))
		request.Status = decision
		request.CatatanAdmin = pointerString(note)
		request.ReviewedBy = &reviewerID
		request.ReviewedAt = &now
		request.PendingKey = nil
		if err := tx.Save(&request).Error; err != nil {
			return fmt.Errorf("save attendance revision decision %d: %w", id, err)
		}
		return nil
	})
	if err != nil {
		return models.AttendanceRevisionRequest{}, err
	}
	var teacher models.User
	if h.db.Select("id, nama").First(&teacher, request.UserID).Error == nil {
		activity := "Pengajuan Revisi Presensi Ditolak"
		if decision == attendanceRevisionApproved {
			activity = "Pengajuan Revisi Presensi Disetujui"
		}
		_ = h.db.Create(&models.ActivityLog{Waktu: time.Now().In(appLocation(h)), User: teacher.Nama, Aktivitas: activity, Status: request.Tanggal.Format("2006-01-02")}).Error
	}
	return request, nil
}

func (h *Handler) applyAttendanceRevision(tx *gorm.DB, request *models.AttendanceRevisionRequest) error {
	var teacher models.User
	if err := tx.Where("id = ? AND role = ?", request.UserID, "guru").First(&teacher).Error; err != nil {
		return err
	}
	var attendance models.AttendanceLog
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("user_id = ? AND tanggal = ?", request.UserID, request.Tanggal).First(&attendance).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Legacy databases restrict metode to button, qr_scan, and manual.
		// The revision request and keterangan retain the correction history.
		attendance = models.AttendanceLog{UserID: teacher.ID, Nama: teacher.Nama, Tanggal: request.Tanggal, Metode: "manual"}
	}

	if isAttendanceRevisionAbsence(request.Alasan) {
		attendance.Status = request.Alasan
		attendance.JamMasuk = nil
		attendance.JamHadir = nil
		attendance.JamPulang = nil
		attendance.Keterangan = pointerString("Revisi " + attendanceRevisionReasonLabel(request.Alasan))
		return saveAttendanceRevision(tx, request, attendance)
	}
	jamMasuk := stringPointerValue(request.JamMasuk)
	if jamMasuk == "" {
		jamMasuk = stringPointerValue(attendance.JamMasuk)
		if jamMasuk == "" {
			jamMasuk = stringPointerValue(attendance.JamHadir)
		}
	}
	if jamMasuk == "" {
		return revisionAPIError(fiber.StatusConflict, "REVISION_CHECKIN_REQUIRED", "Jam masuk sebenarnya wajib tersedia untuk menyetujui revisi")
	}
	jamPulang := stringPointerValue(request.JamPulang)
	if jamPulang == "" {
		jamPulang = stringPointerValue(attendance.JamPulang)
	}
	if jamPulang != "" {
		inMinutes, _ := timeToMinutes(jamMasuk)
		outMinutes, _ := timeToMinutes(jamPulang)
		if outMinutes < inMinutes {
			return revisionAPIError(fiber.StatusConflict, "REVISION_TIME_ORDER_INVALID", "Jam pulang tidak boleh lebih awal daripada jam masuk")
		}
	}
	settings, err := settingsMap(tx)
	if err != nil {
		return err
	}
	target, targetLabel, err := (&Handler{db: tx, cfg: h.cfg, jwt: h.jwt}).checkInTarget(teacher.ID, request.Tanggal, settings)
	if err != nil {
		return err
	}
	minutes, valid := timeToMinutes(jamMasuk)
	if !valid {
		return revisionAPIError(fiber.StatusConflict, "REVISION_CHECKIN_INVALID", "Format jam masuk tidak valid")
	}
	checkedInAt := time.Date(request.Tanggal.Year(), request.Tanggal.Month(), request.Tanggal.Day(), minutes/60, minutes%60, 0, 0, appLocation(h))
	status, checkInNote := classifyCheckIn(teacher, checkedInAt, target, targetLabel, settings["toleransi_terlambat"], "")
	if checkInNote != "" {
		checkInNote += " · Revisi " + request.Alasan
	} else {
		checkInNote = "Revisi " + request.Alasan
	}
	attendance.Status = status
	attendance.JamMasuk = pointerString(normalizeTime(jamMasuk))
	attendance.JamHadir = pointerString(normalizeTime(jamMasuk))
	attendance.JamPulang = pointerString(jamPulang)
	attendance.Keterangan = pointerString(checkInNote)
	return saveAttendanceRevision(tx, request, attendance)
}

func isAttendanceRevisionAbsence(reason string) bool {
	return reason == "izin" || reason == "sakit"
}

func attendanceRevisionReasonLabel(reason string) string {
	switch reason {
	case "lupa":
		return "Lupa"
	case "kendala_teknis":
		return "Kendala Teknis"
	case "izin":
		return "Izin"
	case "sakit":
		return "Sakit"
	default:
		return reason
	}
}

func saveAttendanceRevision(tx *gorm.DB, request *models.AttendanceRevisionRequest, attendance models.AttendanceLog) error {
	if attendance.ID == 0 {
		if err := tx.Create(&attendance).Error; err != nil {
			if !isDuplicateError(err) {
				return err
			}
			approvedAttendance := attendance
			// An attendance row may be created by another request after the lookup
			// above. Re-read the row and apply the approved values instead of
			// failing the whole approval on the unique (user_id, tanggal) index.
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("user_id = ? AND tanggal = ?", request.UserID, request.Tanggal).First(&attendance).Error; err != nil {
				return err
			}
			attendance.Nama = approvedAttendance.Nama
			attendance.Status = approvedAttendance.Status
			attendance.JamMasuk = approvedAttendance.JamMasuk
			attendance.JamHadir = approvedAttendance.JamHadir
			attendance.JamPulang = approvedAttendance.JamPulang
			attendance.Keterangan = approvedAttendance.Keterangan
			if err := updateAttendanceForRevision(tx, attendance); err != nil {
				return err
			}
		}
	} else if err := updateAttendanceForRevision(tx, attendance); err != nil {
		return err
	}
	request.AttendanceID = &attendance.ID
	return nil
}

func updateAttendanceForRevision(tx *gorm.DB, attendance models.AttendanceLog) error {
	return tx.Model(&attendance).Updates(map[string]any{
		"nama": attendance.Nama, "status": attendance.Status, "jam_masuk": attendance.JamMasuk,
		"jam_hadir": attendance.JamHadir, "jam_pulang": attendance.JamPulang, "keterangan": attendance.Keterangan,
	}).Error
}
