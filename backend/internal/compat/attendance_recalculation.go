package compat

import (
	"encoding/json"
	"errors"
	"log"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

var errTodayCheckInRecalculationStale = errors.New("catatan presensi berubah saat perbaikan diproses")

var generatedLateNotePattern = regexp.MustCompile(`(?i)Terlambat\s+(\d+)\s+menit(?:\s+\(Parah\))?(?:\s+\((?:Piket(?:\s+Apel)?|Apel\s+Senin|Event:\s*[^)]*)\))?`)

// The legacy single-date API also accepts a bounded date range and weekdays.
// GET previews changes; POST applies all selected dates in one transaction.
func (h *Handler) todayCheckInRecalculation(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet && c.Method() != fiber.MethodPost {
		return fiber.ErrMethodNotAllowed
	}
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	if claims.Role != "admin" {
		return fiber.ErrForbidden
	}

	location := appLocation(h)
	selection, err := parseCheckInRecalculationSelection(c, location)
	if err != nil {
		return invalid(c, err.Error())
	}
	settings, err := settingsMap(h.db)
	if err != nil {
		return err
	}
	preview, err := h.checkInRecalculationPreview(selection, settings)
	if err != nil {
		return err
	}

	if c.Method() == fiber.MethodPost && preview.Changed > 0 {
		if err := h.applyCheckInRecalculation(preview); err != nil {
			if errors.Is(err, errTodayCheckInRecalculationStale) {
				return httpx.Error(c, fiber.StatusConflict, "ATTENDANCE_CHANGED", "Data presensi berubah saat diproses. Perbarui pratinjau lalu coba lagi.")
			}
			return err
		}

		var actor models.User
		if err := h.db.Select("nama").First(&actor, claims.UserID).Error; err == nil {
			period := preview.StartDate
			if preview.StartDate != preview.EndDate {
				period += " s.d. " + preview.EndDate
			}
			days := make([]string, 0, len(preview.Weekdays))
			for _, weekday := range preview.Weekdays {
				days = append(days, dayName(time.Weekday(weekday)))
			}
			if err := h.db.Create(&models.ActivityLog{
				Waktu:     time.Now().In(location),
				User:      actor.Nama,
				Aktivitas: "Hitung ulang status masuk",
				Status:    period + " · " + strings.Join(days, ", ") + " · " + strconv.Itoa(preview.Changed) + " presensi disesuaikan",
			}).Error; err != nil {
				// An unavailable legacy audit table must not roll back the actual fix.
				log.Printf("today check-in recalculation audit log failed: %v", err)
			}
		}
	}

	message := "Pratinjau status masuk berhasil dimuat"
	if c.Method() == fiber.MethodPost {
		message = "Status masuk berhasil disesuaikan"
	}
	return httpx.Success(c, message, preview)
}

func (h *Handler) applyCheckInRecalculation(preview todayCheckInRecalculationResponse) error {
	return h.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range preview.Items {
			if !item.Changed {
				continue
			}
			result := tx.Model(&models.AttendanceLog{}).
				Where("id = ? AND status = ?", item.ID, item.OldStatus).
				Where("COALESCE(keterangan, '') = ?", item.OldKeterangan).
				Where("COALESCE(jam_masuk, '') = ?", item.oldJamMasuk).
				Where("COALESCE(jam_hadir, '') = ?", item.oldJamHadir).
				Updates(map[string]any{"status": item.NewStatus, "keterangan": pointerString(item.NewKeterangan)})
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected != 1 {
				return errTodayCheckInRecalculationStale
			}
		}
		return nil
	})
}

type checkInRecalculationSelection struct {
	Start, End time.Time
	Weekdays   []int
	Dates      []time.Time
}

func parseCheckInRecalculationSelection(c *fiber.Ctx, location *time.Location) (checkInRecalculationSelection, error) {
	var input struct {
		Date      string `json:"date"`
		Tanggal   string `json:"tanggal"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
		Weekdays  *[]int `json:"weekdays"`
	}
	var selection checkInRecalculationSelection
	if c.Method() == fiber.MethodGet {
		input.Date, input.StartDate, input.EndDate = c.Query("date"), c.Query("start_date"), c.Query("end_date")
		if value, present := c.Queries()["weekdays"]; present {
			days := []int{}
			if strings.TrimSpace(value) != "" {
				for _, part := range strings.Split(value, ",") {
					day, err := strconv.Atoi(strings.TrimSpace(part))
					if err != nil {
						return selection, errors.New("hari harus berupa angka 0 (Minggu) sampai 6 (Sabtu)")
					}
					days = append(days, day)
				}
			}
			input.Weekdays = &days
		}
	} else if strings.TrimSpace(string(c.Body())) != "" {
		if err := json.Unmarshal(c.Body(), &input); err != nil {
			return selection, errors.New("payload perbaikan tidak valid")
		}
	}
	if input.Date == "" {
		input.Date = input.Tanggal
	}
	isRange := input.StartDate != "" || input.EndDate != ""
	if isRange && (input.Date != "" || input.StartDate == "" || input.EndDate == "") {
		return selection, errors.New("isi tanggal awal dan akhir tanpa tanggal tunggal")
	}
	if !isRange {
		if input.Date == "" {
			input.Date = time.Now().In(location).Format("2006-01-02")
		}
		input.StartDate, input.EndDate = input.Date, input.Date
	}
	var err error
	selection.Start, err = parseDate(input.StartDate, location)
	if err != nil {
		return selection, errors.New("format tanggal awal tidak valid")
	}
	selection.End, err = parseDate(input.EndDate, location)
	if err != nil {
		return selection, errors.New("format tanggal akhir tidak valid")
	}
	if selection.End.Before(selection.Start) {
		return selection, errors.New("tanggal akhir tidak boleh sebelum tanggal awal")
	}
	if selection.End.After(dateOnly(time.Now().In(location))) {
		return selection, errors.New("tanggal perbaikan tidak boleh melewati hari ini")
	}
	if selection.End.Sub(selection.Start) >= 366*24*time.Hour {
		return selection, errors.New("rentang perbaikan maksimal 366 hari")
	}
	selection.Weekdays = []int{0, 1, 2, 3, 4, 5, 6}
	if isRange {
		selection.Weekdays = []int{2, 3, 4, 5}
	}
	if input.Weekdays != nil {
		selection.Weekdays = *input.Weekdays
	}
	if len(selection.Weekdays) == 0 {
		return selection, errors.New("pilih minimal satu hari untuk diperiksa")
	}
	seen := map[int]bool{}
	for _, day := range selection.Weekdays {
		if day < 0 || day > 6 {
			return selection, errors.New("hari harus antara 0 (Minggu) dan 6 (Sabtu)")
		}
		seen[day] = true
	}
	selection.Weekdays = make([]int, 0, len(seen))
	for day := range seen {
		selection.Weekdays = append(selection.Weekdays, day)
	}
	sort.Ints(selection.Weekdays)
	for date := selection.Start; !date.After(selection.End); date = date.AddDate(0, 0, 1) {
		if seen[int(date.Weekday())] {
			selection.Dates = append(selection.Dates, date)
		}
	}
	return selection, nil
}

type todayCheckInRecalculationResponse struct {
	Date             string                          `json:"date"`
	StartDate        string                          `json:"start_date"`
	EndDate          string                          `json:"end_date"`
	Weekdays         []int                           `json:"weekdays"`
	SelectedDays     int                             `json:"selected_days"`
	Days             []checkInRecalculationDay       `json:"days"`
	NormalTarget     string                          `json:"normal_target"`
	ToleranceMinutes string                          `json:"tolerance_minutes"`
	Processed        int                             `json:"processed"`
	Changed          int                             `json:"changed"`
	Unchanged        int                             `json:"unchanged"`
	SkippedNoTime    int                             `json:"skipped_no_time"`
	SkippedNoUser    int                             `json:"skipped_no_user"`
	Items            []todayCheckInRecalculationItem `json:"items"`
}

type checkInRecalculationDay struct {
	Date          string `json:"date"`
	Processed     int    `json:"processed"`
	Changed       int    `json:"changed"`
	Unchanged     int    `json:"unchanged"`
	SkippedNoTime int    `json:"skipped_no_time"`
	SkippedNoUser int    `json:"skipped_no_user"`
}

type todayCheckInRecalculationItem struct {
	ID             uint   `json:"id"`
	Date           string `json:"date"`
	UserID         uint   `json:"user_id"`
	Nama           string `json:"nama"`
	JamMasuk       string `json:"jam_masuk"`
	OldStatus      string `json:"old_status"`
	NewStatus      string `json:"new_status"`
	OldKeterangan  string `json:"old_keterangan"`
	NewKeterangan  string `json:"new_keterangan"`
	OldLateMinutes *int   `json:"old_late_minutes,omitempty"`
	NewLateMinutes *int   `json:"new_late_minutes,omitempty"`
	Target         string `json:"target"`
	TargetLabel    string `json:"target_label"`
	StatusChanged  bool   `json:"status_changed"`
	NoteChanged    bool   `json:"note_changed"`
	Changed        bool   `json:"changed"`
	oldJamMasuk    string
	oldJamHadir    string
}

func (h *Handler) checkInRecalculationPreview(selection checkInRecalculationSelection, settings map[string]string) (todayCheckInRecalculationResponse, error) {
	response := todayCheckInRecalculationResponse{
		StartDate:        selection.Start.Format("2006-01-02"),
		EndDate:          selection.End.Format("2006-01-02"),
		Weekdays:         selection.Weekdays,
		SelectedDays:     len(selection.Dates),
		Days:             []checkInRecalculationDay{},
		NormalTarget:     settingTime(settings["jam_masuk_normal"], "07:20"),
		ToleranceMinutes: strings.TrimSpace(settings["toleransi_terlambat"]),
		Items:            []todayCheckInRecalculationItem{},
	}
	if response.ToleranceMinutes == "" {
		response.ToleranceMinutes = "15"
	}
	if response.StartDate == response.EndDate {
		response.Date = response.StartDate
	}
	datesByKey := make(map[string]time.Time, len(selection.Dates))
	daysByKey := make(map[string]int, len(selection.Dates))
	for _, date := range selection.Dates {
		key := date.Format("2006-01-02")
		datesByKey[key], daysByKey[key] = date, len(response.Days)
		response.Days = append(response.Days, checkInRecalculationDay{Date: key})
	}
	if len(selection.Dates) == 0 {
		return response, nil
	}

	var rows []models.AttendanceLog
	if err := h.db.
		Where("tanggal >= ? AND tanggal < ?", selection.Start, selection.End.AddDate(0, 0, 1)).
		Where("status IN ?", []string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}).
		Order("tanggal ASC, id ASC").
		Find(&rows).Error; err != nil {
		return response, err
	}
	selectedRows := make([]models.AttendanceLog, 0, len(rows))
	for _, row := range rows {
		if _, selected := datesByKey[row.Tanggal.Format("2006-01-02")]; selected {
			selectedRows = append(selectedRows, row)
		}
	}
	rows = selectedRows
	response.Processed = len(rows)
	if len(rows) == 0 {
		return response, nil
	}

	userIDs := make([]uint, 0, len(rows))
	seenUsers := make(map[uint]struct{}, len(rows))
	for _, row := range rows {
		if _, seen := seenUsers[row.UserID]; !seen {
			seenUsers[row.UserID] = struct{}{}
			userIDs = append(userIDs, row.UserID)
		}
	}
	var users []models.User
	if err := h.db.Select("id, nama, tipe_guru").Where("id IN ? AND role = ?", userIDs, "guru").Find(&users).Error; err != nil {
		return response, err
	}
	usersByID := make(map[uint]models.User, len(users))
	for _, user := range users {
		usersByID[user.ID] = user
	}
	var holidays []models.Holiday
	if err := h.db.Where("tanggal >= ? AND tanggal < ?", selection.Start, selection.End.AddDate(0, 0, 1)).Find(&holidays).Error; err != nil {
		return response, err
	}
	holidayByDate := make(map[string]*models.Holiday, len(holidays))
	for i := range holidays {
		holidayByDate[holidays[i].Tanggal.Format("2006-01-02")] = &holidays[i]
	}
	var schedules []models.JadwalPiket
	if err := h.db.Where("user_id IN ? AND is_active = ?", userIDs, true).Order("id ASC").Find(&schedules).Error; err != nil {
		return response, err
	}
	type scheduleKey struct {
		userID uint
		day    string
	}
	scheduleByUserDay := make(map[scheduleKey]*models.JadwalPiket, len(schedules))
	for i := range schedules {
		key := scheduleKey{schedules[i].UserID, schedules[i].Hari}
		if _, exists := scheduleByUserDay[key]; !exists {
			scheduleByUserDay[key] = &schedules[i]
		}
	}

	for _, row := range rows {
		dateKey := row.Tanggal.Format("2006-01-02")
		date := datesByKey[dateKey]
		day := &response.Days[daysByKey[dateKey]]
		day.Processed++
		user, found := usersByID[row.UserID]
		if !found {
			response.SkippedNoUser++
			day.SkippedNoUser++
			continue
		}
		checkIn := row.JamMasuk
		if checkIn == nil || strings.TrimSpace(*checkIn) == "" {
			checkIn = row.JamHadir
		}
		if checkIn == nil || strings.TrimSpace(*checkIn) == "" {
			response.SkippedNoTime++
			day.SkippedNoTime++
			continue
		}
		minutes, valid := timeToMinutes(*checkIn)
		if !valid {
			response.SkippedNoTime++
			day.SkippedNoTime++
			continue
		}
		target, targetLabel := effectiveCheckInTarget(date, settings, holidayByDate[dateKey], scheduleByUserDay[scheduleKey{user.ID, dayName(date.Weekday())}])
		checkedInAt := time.Date(date.Year(), date.Month(), date.Day(), minutes/60, minutes%60, 0, 0, date.Location())
		newStatus, generatedLateNote := classifyCheckIn(user, checkedInAt, target, targetLabel, response.ToleranceMinutes, "")
		oldNote := ""
		if row.Keterangan != nil {
			oldNote = *row.Keterangan
		}
		newNote := recalculatedCheckInNote(oldNote, generatedLateNote, newStatus)
		item := todayCheckInRecalculationItem{
			ID:             row.ID,
			Date:           dateKey,
			UserID:         row.UserID,
			Nama:           row.Nama,
			JamMasuk:       normalizeTime(*checkIn),
			OldStatus:      row.Status,
			NewStatus:      newStatus,
			OldKeterangan:  oldNote,
			NewKeterangan:  newNote,
			OldLateMinutes: lateMinutesFromNote(oldNote),
			NewLateMinutes: lateMinutesFromNote(newNote),
			Target:         target,
			TargetLabel:    strings.TrimSpace(targetLabel),
			StatusChanged:  row.Status != newStatus,
			NoteChanged:    oldNote != newNote,
			oldJamMasuk:    stringPointerValue(row.JamMasuk),
			oldJamHadir:    stringPointerValue(row.JamHadir),
		}
		item.Changed = item.StatusChanged || item.NoteChanged
		if item.Nama == "" {
			item.Nama = user.Nama
		}
		if item.Changed {
			response.Changed++
			day.Changed++
		} else {
			response.Unchanged++
			day.Unchanged++
		}
		response.Items = append(response.Items, item)
	}

	return response, nil
}

// recalculatedCheckInNote replaces only the automatic lateness sentence. Any
// note added manually by an administrator stays in place, including when a
// record becomes on-time and its automatic delay sentence is removed.
func recalculatedCheckInNote(current, generated, status string) string {
	match := generatedLateNotePattern.FindStringIndex(current)
	if status != "hadir_terlambat" {
		if match == nil {
			return current
		}
		return joinAttendanceNoteFragments(current[:match[0]], current[match[1]:])
	}
	if match == nil {
		if strings.TrimSpace(current) == "" {
			return generated
		}
		return joinAttendanceNoteFragments(current, generated)
	}
	return joinAttendanceNoteFragments(current[:match[0]], generated, current[match[1]:])
}

func joinAttendanceNoteFragments(parts ...string) string {
	clean := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.Trim(strings.TrimSpace(part), "| ")
		if part != "" {
			clean = append(clean, part)
		}
	}
	return strings.Join(clean, " | ")
}

func lateMinutesFromNote(note string) *int {
	match := generatedLateNotePattern.FindStringSubmatch(note)
	if len(match) < 2 {
		return nil
	}
	minutes, err := strconv.Atoi(match[1])
	if err != nil {
		return nil
	}
	return &minutes
}
