package compat

import (
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/models"
)

// checkInTarget uses the configured active piket time on every weekday,
// including Mondays with or without apel. Special workdays keep their explicit
// override; Monday apel applies to teachers without an active duty roster.
func (h *Handler) checkInTarget(userID uint, date time.Time, settings map[string]string) (string, string, error) {
	target := settingTime(settings["jam_masuk_normal"], "07:20")
	label := ""

	var holiday models.Holiday
	holidayQuery := h.db.
		Where("tanggal >= ? AND tanggal < ?", date, date.AddDate(0, 0, 1)).
		First(&holiday)
	if holidayQuery.Error != nil && holidayQuery.Error != gorm.ErrRecordNotFound {
		return "", "", holidayQuery.Error
	}
	if holidayQuery.Error == nil && holiday.IsWorkday && holiday.JamMasukKhusus != nil && strings.TrimSpace(*holiday.JamMasukKhusus) != "" {
		return settingTime(*holiday.JamMasukKhusus, target), " (Event: " + holiday.Nama + ")", nil
	}

	var piket models.JadwalPiket
	piketQuery := h.db.Where("user_id = ? AND hari = ? AND is_active = ?", userID, dayName(date.Weekday()), true).First(&piket)
	if piketQuery.Error != nil && piketQuery.Error != gorm.ErrRecordNotFound {
		return "", "", piketQuery.Error
	}
	if piketQuery.Error == nil {
		fallback := settingTime(settings["jam_piket_default"], "07:00")
		return settingTime(stringPointerValue(piket.JamPiket), fallback), " (Piket)", nil
	}
	if date.Weekday() == time.Monday && settings["apel_senin_enabled"] == "1" {
		return "07:00:00", " (Apel Senin)", nil
	}

	return target, label, nil
}

func classifyCheckIn(user models.User, checkedInAt time.Time, target, targetLabel, toleranceValue, note string) (string, string) {
	// Part-time flexibility applies to normal school hours. Assigned piket and
	// Monday apel still have a required arrival time for every teacher.
	scheduled := targetLabel == " (Piket)" || targetLabel == " (Piket Apel)" || targetLabel == " (Apel Senin)"
	if strings.EqualFold(strings.TrimSpace(user.TipeGuru), "partime") && !scheduled {
		if strings.TrimSpace(note) == "" {
			note = "Guru Partime"
		}
		return "hadir", note
	}

	targetMinutes, validTarget := timeToMinutes(target)
	if !validTarget {
		targetMinutes, _ = timeToMinutes("07:20")
	}
	lateMinutes := checkedInAt.Hour()*60 + checkedInAt.Minute() - targetMinutes
	if lateMinutes <= 0 {
		return "hadir", note
	}

	tolerance := 15
	if parsed, err := strconv.Atoi(strings.TrimSpace(toleranceValue)); err == nil && parsed >= 0 {
		tolerance = parsed
	}
	severity := ""
	if lateMinutes > tolerance {
		severity = " (Parah)"
	}
	return "hadir_terlambat", "Terlambat " + strconv.Itoa(lateMinutes) + " menit" + severity + targetLabel
}

// lateMinutesForAttendance calculates the delay relative to the same effective
// target used when classifying check-ins. It deliberately returns nil when a
// check-in time is absent or not later than its target, so the peer-status API
// never invents a delay for manually corrected records.
func (h *Handler) lateMinutesForAttendance(user models.User, attendance models.AttendanceLog, date time.Time, settings map[string]string) (*int, error) {
	checkInTime := attendance.JamMasuk
	if checkInTime == nil || strings.TrimSpace(*checkInTime) == "" {
		checkInTime = attendance.JamHadir
	}
	if checkInTime == nil || strings.TrimSpace(*checkInTime) == "" {
		return nil, nil
	}

	actualMinutes, validActual := timeToMinutes(*checkInTime)
	if !validActual {
		return nil, nil
	}
	target, _, err := h.checkInTarget(user.ID, date, settings)
	if err != nil {
		return nil, err
	}
	targetMinutes, validTarget := timeToMinutes(target)
	if !validTarget {
		return nil, nil
	}
	lateMinutes := actualMinutes - targetMinutes
	if lateMinutes <= 0 {
		return nil, nil
	}
	return &lateMinutes, nil
}

// derivedAttendanceStatus restores the effective status for a same-day record
// that was saved as hadir before timing rules were applied by the API. It is
// intentionally read-only: administrators' historical/manual corrections stay
// untouched, while teacher-facing views still show the rule that applies now.
func (h *Handler) derivedAttendanceStatus(user models.User, attendance models.AttendanceLog, date time.Time, settings map[string]string) (string, error) {
	if attendance.Status != "hadir" {
		return attendance.Status, nil
	}

	checkInTime := attendance.JamMasuk
	if checkInTime == nil || strings.TrimSpace(*checkInTime) == "" {
		checkInTime = attendance.JamHadir
	}
	if checkInTime == nil || strings.TrimSpace(*checkInTime) == "" {
		return attendance.Status, nil
	}

	minutes, valid := timeToMinutes(*checkInTime)
	if !valid {
		return attendance.Status, nil
	}
	target, targetLabel, err := h.checkInTarget(user.ID, date, settings)
	if err != nil {
		return attendance.Status, err
	}
	checkedInAt := time.Date(date.Year(), date.Month(), date.Day(), minutes/60, minutes%60, 0, 0, date.Location())
	status, _ := classifyCheckIn(user, checkedInAt, target, targetLabel, settings["toleransi_terlambat"], "")
	return status, nil
}

// checkoutTarget returns the effective minimum checkout time. An active piket
// schedule takes precedence over the school-wide setting, unless the date is a
// special workday. Both targets can be overridden from Pengaturan Harian.
func (h *Handler) checkoutTarget(userID uint, date time.Time, settings map[string]string) (string, bool, error) {
	target := settingTime(settings["jam_min_pulang"], "12:30")

	var daily models.PengaturanHarian
	dailyQuery := h.db.Where("DATE(tanggal) = ?", date.Format("2006-01-02")).First(&daily)
	if dailyQuery.Error != nil && dailyQuery.Error != gorm.ErrRecordNotFound {
		return "", false, dailyQuery.Error
	}
	if dailyQuery.Error == nil && daily.JamPulangKhususAktif && daily.JamPulangKhusus != nil && strings.TrimSpace(*daily.JamPulangKhusus) != "" {
		target = settingTime(*daily.JamPulangKhusus, target)
	}

	var holiday models.Holiday
	holidayQuery := h.db.
		Where("tanggal >= ? AND tanggal < ?", date, date.AddDate(0, 0, 1)).
		First(&holiday)
	if holidayQuery.Error != nil && holidayQuery.Error != gorm.ErrRecordNotFound {
		return "", false, holidayQuery.Error
	}
	if holidayQuery.Error == nil && holiday.IsWorkday {
		return target, false, nil
	}

	var piket models.JadwalPiket
	piketQuery := h.db.Where("user_id = ? AND hari = ? AND is_active = ?", userID, dayName(date.Weekday()), true).First(&piket)
	if piketQuery.Error != nil && piketQuery.Error != gorm.ErrRecordNotFound {
		return "", false, piketQuery.Error
	}
	if piketQuery.Error != nil || piket.JamPulangPiket == nil || strings.TrimSpace(*piket.JamPulangPiket) == "" {
		return target, false, nil
	}

	target = settingTime(*piket.JamPulangPiket, target)
	if dailyQuery.Error == nil && daily.JamPulangPiketAktif && daily.JamPulangPiketKhusus != nil && strings.TrimSpace(*daily.JamPulangPiketKhusus) != "" {
		target = settingTime(*daily.JamPulangPiketKhusus, target)
	}
	return target, true, nil
}

func addPiketEarlyCheckoutNote(note string) string {
	const marker = "Izin Pulang Awal Piket"
	if strings.Contains(note, marker) {
		return note
	}
	if strings.TrimSpace(note) == "" {
		return "(" + marker + ")"
	}
	return strings.TrimSpace(note) + " (" + marker + ")"
}

func settingTime(value, fallback string) string {
	if _, ok := timeToMinutes(value); ok {
		return normalizeTime(strings.TrimSpace(value))
	}
	return normalizeTime(fallback)
}

func timeToMinutes(value string) (int, bool) {
	normalized := normalizeTime(value)
	parsed, err := time.Parse("15:04:05", normalized)
	if err != nil {
		return 0, false
	}
	return parsed.Hour()*60 + parsed.Minute(), true
}
