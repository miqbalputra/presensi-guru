package compat

import (
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/models"
)

// checkInTarget keeps the attendance timing rules aligned with the previous
// PHP implementation. The school default applies unless a special workday or
// an active duty roster (piket) supplies an earlier target.
func (h *Handler) checkInTarget(userID uint, date time.Time, settings map[string]string) (string, string, error) {
	target := settingTime(settings["jam_masuk_normal"], "07:20")
	label := ""

	var holiday models.Holiday
	holidayQuery := h.db.Where("tanggal = ?", date.Format("2006-01-02")).First(&holiday)
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
	hasPiket := piketQuery.Error == nil

	if date.Weekday() == time.Monday {
		if settings["apel_senin_enabled"] == "1" {
			if hasPiket && piket.JamPiket != nil && strings.TrimSpace(*piket.JamPiket) != "" {
				return settingTime(*piket.JamPiket, "07:00"), " (Piket Apel)", nil
			}
			return "07:00:00", " (Apel Senin)", nil
		}
		if hasPiket {
			return "07:00:00", " (Piket)", nil
		}
	} else if hasPiket && piket.JamPiket != nil && strings.TrimSpace(*piket.JamPiket) != "" {
		return settingTime(*piket.JamPiket, target), " (Piket)", nil
	}

	return target, label, nil
}

func classifyCheckIn(user models.User, checkedInAt time.Time, target, targetLabel, toleranceValue, note string) (string, string) {
	if strings.EqualFold(strings.TrimSpace(user.TipeGuru), "partime") {
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

// derivedAttendanceStatus restores the effective status for a same-day record
// that was saved as hadir before timing rules were applied by the API. It is
// intentionally read-only: administrators' historical/manual corrections stay
// untouched, while teacher-facing views still show the rule that applies now.
func (h *Handler) derivedAttendanceStatus(user models.User, attendance models.AttendanceLog, date time.Time, settings map[string]string) (string, error) {
	if attendance.Status != "hadir" || strings.EqualFold(strings.TrimSpace(user.TipeGuru), "partime") {
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
