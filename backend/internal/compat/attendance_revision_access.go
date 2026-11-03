package compat

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

type attendanceRevisionAccess struct {
	Today               string     `json:"today"`
	StartDate           string     `json:"startDate"`
	PeriodStart         string     `json:"periodStart"`
	PeriodLabel         string     `json:"periodLabel"`
	DeadlineAt          string     `json:"deadlineAt"`
	PreviousMonthOpen   bool       `json:"previousMonthOpen"`
	ClosedByAdmin       bool       `json:"closedByAdmin"`
	ClosedAt            *time.Time `json:"closedAt"`
	CanChangeVisibility bool       `json:"canChangeVisibility"`
}

func attendanceRevisionAccessPeriod(now time.Time) (time.Time, time.Time) {
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	return monthStart.AddDate(0, -1, 0), monthStart.AddDate(0, 0, 5)
}

func attendanceRevisionAccessKey(period time.Time) string {
	return "attendance_revision_access_" + period.Format("2006-01")
}

func (h *Handler) attendanceRevisionAccessAt(db *gorm.DB, now time.Time) (attendanceRevisionAccess, error) {
	period, deadline := attendanceRevisionAccessPeriod(now)
	var setting models.Setting
	err := db.Where("setting_key = ?", attendanceRevisionAccessKey(period)).First(&setting).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return attendanceRevisionAccess{}, err
	}
	start, today := attendanceRevisionDateRange(now)
	closed := setting.Value == "closed"
	if closed {
		start = period.AddDate(0, 1, 0)
	}
	access := attendanceRevisionAccess{
		Today: today.Format("2006-01-02"), StartDate: start.Format("2006-01-02"),
		PeriodStart: period.Format("2006-01-02"), PeriodLabel: monthlyConfirmationPeriodLabel(period),
		DeadlineAt: deadline.Format(time.RFC3339), PreviousMonthOpen: now.Before(deadline) && !closed,
		ClosedByAdmin: closed, CanChangeVisibility: now.Before(deadline),
	}
	if closed {
		access.ClosedAt = &setting.UpdatedAt
	}
	return access, nil
}

// Both admin visibility updates and previous-month submissions lock this row.
// Once a close commits, later submissions cannot pass its access check.
func lockAttendanceRevisionAccess(db *gorm.DB, period time.Time) (models.Setting, error) {
	key := attendanceRevisionAccessKey(period)
	seed := models.Setting{Key: key, Value: "open"}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&seed).Error; err != nil {
		return models.Setting{}, err
	}
	var setting models.Setting
	err := db.Clauses(clause.Locking{Strength: "UPDATE"}).Where("setting_key = ?", key).First(&setting).Error
	return setting, err
}

func (h *Handler) validateLockedAttendanceRevisionAccess(tx *gorm.DB, date time.Time) error {
	now := attendanceRevisionNow().In(appLocation(h))
	start, today := attendanceRevisionDateRange(now)
	if date.Before(start) || date.After(today) {
		return attendanceRevisionRangeError()
	}
	period, _ := attendanceRevisionAccessPeriod(now)
	if !date.Before(period.AddDate(0, 1, 0)) {
		return nil
	}
	setting, err := lockAttendanceRevisionAccess(tx, period)
	if err != nil {
		return err
	}
	if setting.Value == "closed" {
		return attendanceRevisionClosedError()
	}
	// Re-check the deadline after waiting for the lock.
	start, today = attendanceRevisionDateRange(attendanceRevisionNow().In(appLocation(h)))
	if date.Before(start) || date.After(today) {
		return attendanceRevisionRangeError()
	}
	return nil
}

func attendanceRevisionClosedError() error {
	return revisionAPIError(fiber.StatusConflict, "REVISION_PREVIOUS_MONTH_CLOSED", "Revisi bulan kemarin sudah ditutup oleh admin. Hanya presensi bulan berjalan yang dapat direvisi")
}

func attendanceRevisionRangeError() error {
	return revisionAPIError(fiber.StatusBadRequest, "REVISION_DATE_OUT_OF_RANGE", "Revisi tersedia untuk bulan berjalan hingga hari ini. Revisi bulan kemarin hanya tersedia tanggal 1–5 setiap bulan")
}

func (h *Handler) getAttendanceRevisionAccess(c *fiber.Ctx) error {
	c.Set(fiber.HeaderCacheControl, "no-store")
	access, err := h.attendanceRevisionAccessAt(h.db, attendanceRevisionNow().In(appLocation(h)))
	if err != nil {
		return err
	}
	return httpx.Success(c, "Akses revisi presensi berhasil diambil", access)
}

func (h *Handler) updateAttendanceRevisionAccess(c *fiber.Ctx) error {
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	if claims.Role != "admin" {
		return fiber.ErrForbidden
	}
	var input struct {
		PeriodStart string `json:"periodStart"`
		Hidden      *bool  `json:"hidden"`
	}
	if err := c.BodyParser(&input); err != nil || input.Hidden == nil {
		return invalid(c, "Periode dan pilihan sembunyikan harus diisi")
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		now := attendanceRevisionNow().In(appLocation(h))
		period, _ := attendanceRevisionAccessPeriod(now)
		if input.PeriodStart != period.Format("2006-01-02") {
			return revisionAPIError(fiber.StatusConflict, "REVISION_PERIOD_CHANGED", "Periode sudah berubah. Muat ulang pengaturan revisi")
		}
		setting, err := lockAttendanceRevisionAccess(tx, period)
		if err != nil {
			return err
		}
		now = attendanceRevisionNow().In(appLocation(h))
		currentPeriod, deadline := attendanceRevisionAccessPeriod(now)
		if !period.Equal(currentPeriod) || !now.Before(deadline) {
			return revisionAPIError(fiber.StatusConflict, "REVISION_ACCESS_DEADLINE_PASSED", "Akses bulan kemarin sudah ditutup otomatis setelah tanggal 5 dan tidak dapat dibuka kembali")
		}
		value := "open"
		if *input.Hidden {
			value = "closed"
		}
		if setting.Value == value {
			return nil
		}
		return tx.Model(&setting).Updates(map[string]any{
			"setting_value": value, "updated_at": now, "updated_by": strconv.FormatUint(uint64(claims.UserID), 10),
		}).Error
	})
	if err != nil {
		return respondAttendanceRevisionError(c, err)
	}
	c.Set(fiber.HeaderCacheControl, "no-store")
	access, err := h.attendanceRevisionAccessAt(h.db, attendanceRevisionNow().In(appLocation(h)))
	if err != nil {
		return err
	}
	message := fmt.Sprintf("Akses revisi %s ditampilkan sampai tanggal 5", access.PeriodLabel)
	if !access.PreviousMonthOpen {
		message = fmt.Sprintf("Akses revisi %s ditutup dan disembunyikan", access.PeriodLabel)
	}
	return httpx.Success(c, message, access)
}
