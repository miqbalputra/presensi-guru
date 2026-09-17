package compat

import (
	"errors"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

var errTodayCheckInRecalculationStale = errors.New("catatan presensi berubah saat perbaikan diproses")

// todayCheckInRecalculation lets an administrator correct today's stored
// arrival statuses after updating the normal check-in time. It deliberately
// never accepts a date from the client: historical attendance must be changed
// through the existing correction workflow.
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
	date := dateOnly(time.Now().In(location))
	settings, err := settingsMap(h.db)
	if err != nil {
		return err
	}
	preview, err := h.todayCheckInRecalculationPreview(date, settings)
	if err != nil {
		return err
	}

	if c.Method() == fiber.MethodPost && preview.Changed > 0 {
		if err := h.db.Transaction(func(tx *gorm.DB) error {
			for _, item := range preview.Items {
				if !item.Changed {
					continue
				}
				result := tx.Model(&models.AttendanceLog{}).
					Where("id = ?", item.ID).
					Where("status = ?", item.OldStatus).
					Update("status", item.NewStatus)
				if result.Error != nil {
					return result.Error
				}
				if result.RowsAffected != 1 {
					return errTodayCheckInRecalculationStale
				}
			}
			return nil
		}); err != nil {
			if errors.Is(err, errTodayCheckInRecalculationStale) {
				return httpx.Error(c, fiber.StatusConflict, "ATTENDANCE_CHANGED", "Data presensi berubah saat diproses. Perbarui pratinjau lalu coba lagi.")
			}
			return err
		}

		var actor models.User
		if err := h.db.Select("nama").First(&actor, claims.UserID).Error; err == nil {
			if err := h.db.Create(&models.ActivityLog{
				Waktu:     time.Now().In(location),
				User:      actor.Nama,
				Aktivitas: "Hitung ulang status masuk hari ini",
				Status:    strconv.Itoa(preview.Changed) + " presensi disesuaikan",
			}).Error; err != nil {
				// An unavailable legacy audit table must not roll back the actual fix.
				log.Printf("today check-in recalculation audit log failed: %v", err)
			}
		}
	}

	message := "Pratinjau status masuk hari ini berhasil dimuat"
	if c.Method() == fiber.MethodPost {
		message = "Status masuk hari ini berhasil disesuaikan"
	}
	return httpx.Success(c, message, preview)
}

type todayCheckInRecalculationResponse struct {
	Date             string                          `json:"date"`
	NormalTarget     string                          `json:"normal_target"`
	ToleranceMinutes string                          `json:"tolerance_minutes"`
	Processed        int                             `json:"processed"`
	Changed          int                             `json:"changed"`
	Unchanged        int                             `json:"unchanged"`
	SkippedNoTime    int                             `json:"skipped_no_time"`
	SkippedNoUser    int                             `json:"skipped_no_user"`
	Items            []todayCheckInRecalculationItem `json:"items"`
}

type todayCheckInRecalculationItem struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	Nama        string `json:"nama"`
	JamMasuk    string `json:"jam_masuk"`
	OldStatus   string `json:"old_status"`
	NewStatus   string `json:"new_status"`
	Target      string `json:"target"`
	TargetLabel string `json:"target_label"`
	Changed     bool   `json:"changed"`
}

func (h *Handler) todayCheckInRecalculationPreview(date time.Time, settings map[string]string) (todayCheckInRecalculationResponse, error) {
	response := todayCheckInRecalculationResponse{
		Date:             date.Format("2006-01-02"),
		NormalTarget:     settingTime(settings["jam_masuk_normal"], "07:20"),
		ToleranceMinutes: strings.TrimSpace(settings["toleransi_terlambat"]),
		Items:            []todayCheckInRecalculationItem{},
	}
	if response.ToleranceMinutes == "" {
		response.ToleranceMinutes = "15"
	}

	var rows []models.AttendanceLog
	if err := h.db.
		Where("tanggal >= ? AND tanggal < ?", date, date.AddDate(0, 0, 1)).
		Where("status IN ?", []string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}).
		Order("id ASC").
		Find(&rows).Error; err != nil {
		return response, err
	}
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

	for _, row := range rows {
		user, found := usersByID[row.UserID]
		if !found {
			response.SkippedNoUser++
			continue
		}
		checkIn := row.JamMasuk
		if checkIn == nil || strings.TrimSpace(*checkIn) == "" {
			checkIn = row.JamHadir
		}
		if checkIn == nil || strings.TrimSpace(*checkIn) == "" {
			response.SkippedNoTime++
			continue
		}
		minutes, valid := timeToMinutes(*checkIn)
		if !valid {
			response.SkippedNoTime++
			continue
		}
		target, targetLabel, err := h.checkInTarget(user.ID, date, settings)
		if err != nil {
			return response, err
		}
		checkedInAt := time.Date(date.Year(), date.Month(), date.Day(), minutes/60, minutes%60, 0, 0, date.Location())
		newStatus, _ := classifyCheckIn(user, checkedInAt, target, targetLabel, response.ToleranceMinutes, "")
		item := todayCheckInRecalculationItem{
			ID:          row.ID,
			UserID:      row.UserID,
			Nama:        row.Nama,
			JamMasuk:    normalizeTime(*checkIn),
			OldStatus:   row.Status,
			NewStatus:   newStatus,
			Target:      target,
			TargetLabel: strings.TrimSpace(targetLabel),
			Changed:     row.Status != newStatus,
		}
		if item.Nama == "" {
			item.Nama = user.Nama
		}
		if item.Changed {
			response.Changed++
		} else {
			response.Unchanged++
		}
		response.Items = append(response.Items, item)
	}

	return response, nil
}
