package compat

import (
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/config"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

func TestAttendanceRevisionAbsenceApproval(t *testing.T) {
	for _, reason := range []string{"izin", "sakit"} {
		for _, existing := range []bool{false, true} {
			for _, decision := range []string{"approved", "rejected"} {
				t.Run(fmt.Sprintf("%s/existing=%v/%s", reason, existing, decision), func(t *testing.T) {
					db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
					if err != nil {
						t.Fatal(err)
					}
					if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.AttendanceRevisionRequest{}, &models.ActivityLog{}); err != nil {
						t.Fatal(err)
					}
					teacher := models.User{Username: "absence-teacher", Role: "guru", Nama: "Guru Uji"}
					if err := db.Create(&teacher).Error; err != nil {
						t.Fatal(err)
					}
					date := time.Date(2026, time.October, 27, 0, 0, 0, 0, time.UTC)
					attendance := models.AttendanceLog{UserID: teacher.ID, Nama: teacher.Nama, Tanggal: date, Status: "hadir", Metode: "manual", JamMasuk: pointerString("07:00:00"), JamHadir: pointerString("07:00:00"), JamPulang: pointerString("14:00:00")}
					if existing {
						if err := db.Create(&attendance).Error; err != nil {
							t.Fatal(err)
						}
					}
					request := models.AttendanceRevisionRequest{UserID: teacher.ID, Tanggal: date, Alasan: reason, Status: "pending"}
					if err := db.Create(&request).Error; err != nil {
						t.Fatal(err)
					}
					var before models.AttendanceLog
					if existing && (db.First(&before, attendance.ID).Error != nil || before.Status != "hadir") {
						t.Fatal("pending request changed attendance")
					}
					h := NewHandler(db, config.Config{AppTimezone: "Asia/Jakarta"}, auth.NewJWTManager(config.Config{}))
					if _, err := h.applyAttendanceRevisionDecision(request.ID, decision, "Ditinjau admin", teacher.ID); err != nil {
						t.Fatal(err)
					}
					var saved models.AttendanceLog
					query := db.Where("user_id = ? AND tanggal = ?", teacher.ID, date).Find(&saved)
					if query.Error != nil {
						t.Fatal(query.Error)
					}
					if decision == "approved" {
						if saved.ID == 0 || saved.Status != reason || saved.JamMasuk != nil || saved.JamHadir != nil || saved.JamPulang != nil {
							t.Fatalf("approved absence has wrong status/times: %+v", saved)
						}
					} else if existing {
						if saved.Status != "hadir" || stringPointerValue(saved.JamMasuk) != "07:00:00" || stringPointerValue(saved.JamPulang) != "14:00:00" {
							t.Fatal("rejection changed attendance")
						}
					} else if saved.ID != 0 {
						t.Fatal("rejection created attendance")
					}
					if _, err := h.applyAttendanceRevisionDecision(request.ID, "approved", "", teacher.ID); err == nil {
						t.Fatal("reviewed request accepted twice")
					}
				})
			}
		}
	}
}

func TestAttendanceRevisionAbsenceInput(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		input, err := readAttendanceRevisionInput(c)
		if err == nil {
			_, _, err = validateAttendanceRevisionTimes(input, models.AttendanceLog{})
		}
		if err != nil {
			return c.SendStatus(fiber.StatusBadRequest)
		}
		return c.SendStatus(fiber.StatusOK)
	})
	for _, reason := range []string{"izin", "sakit"} {
		for _, withTime := range []bool{false, true} {
			body := fmt.Sprintf(`{"alasan":%q}`, reason)
			want := fiber.StatusOK
			if withTime {
				body = fmt.Sprintf(`{"alasan":%q,"jamMasuk":"07:00"}`, reason)
				want = fiber.StatusBadRequest
			}
			req := httptest.NewRequest("POST", "/", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			response, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			response.Body.Close()
			if response.StatusCode != want {
				t.Fatalf("%s withTime=%v: status=%d want=%d", reason, withTime, response.StatusCode, want)
			}
		}
	}
}
