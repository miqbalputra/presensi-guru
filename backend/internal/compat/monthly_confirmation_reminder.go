package compat

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

func monthlyConfirmationReminderWindow(now time.Time) (bool, string) {
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	lastDay := monthStart.AddDate(0, 1, -1).Day()
	if now.Day() == lastDay {
		return true, "month_end"
	}
	if now.Day() >= 1 && now.Day() <= 3 {
		return true, "follow_up"
	}
	return false, ""
}

func (h *Handler) n8nMonthlyConfirmationReminders(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet {
		return fiber.ErrMethodNotAllowed
	}

	now := monthlyConfirmationNow().In(appLocation(h))
	start, end, active := monthlyConfirmationPeriod(now)
	if !active {
		return httpx.Success(c, "Pengingat konfirmasi bulanan belum aktif", fiber.Map{
			"active": false, "shouldSend": false, "total": 0, "data": []fiber.Map{},
		})
	}

	shouldSend, reminderType := monthlyConfirmationReminderWindow(now)
	items := make([]fiber.Map, 0)
	if shouldSend {
		var users []models.User
		if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Order("nama ASC").Find(&users).Error; err != nil {
			return err
		}
		var confirmations []models.MonthlyAttendanceConfirmation
		if err := monthlyConfirmationPeriodScope(h.db, start).Find(&confirmations).Error; err != nil {
			return err
		}
		byUserID := make(map[uint]models.MonthlyAttendanceConfirmation, len(confirmations))
		for _, confirmation := range confirmations {
			byUserID[confirmation.UserID] = confirmation
		}

		for _, user := range users {
			if _, _, eligible := monthlyConfirmationTarget(user, now); !eligible {
				continue
			}
			confirmation, found := byUserID[user.ID]
			if found && monthlyConfirmationIsConfirmed(confirmation.Status) {
				continue
			}
			phone := ""
			if user.NoHP != nil {
				phone = normalizeWhatsAppPhone(*user.NoHP)
			}
			if phone == "" {
				continue
			}
			status := "pending"
			if found {
				status = confirmation.Status
			}
			items = append(items, fiber.Map{
				"id": user.ID, "nama": user.Nama, "phone": phone, "status": status,
			})
		}
	}

	return httpx.Success(c, "Daftar pengingat konfirmasi bulanan berhasil diambil", fiber.Map{
		"active": true, "shouldSend": shouldSend, "reminderType": reminderType,
		"tanggal": now.Format("2006-01-02"), "total": len(items), "data": items,
		"period": fiber.Map{
			"label":     monthlyConfirmationPeriodLabel(start),
			"startDate": start.Format("2006-01-02"), "endDate": end.Format("2006-01-02"),
		},
	})
}
