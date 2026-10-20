package compat

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/config"
	"github.com/griyaquran/geopresensi/backend/internal/middleware"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

type revisionTelegramTestTransport func(*http.Request) (*http.Response, error)

func (transport revisionTelegramTestTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return transport(request)
}

func TestAttendanceRevisionApprovalWithLegacyMethodConstraint(t *testing.T) {
	for _, channel := range []string{"web", "telegram"} {
		for _, existing := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/existing=%t", channel, existing), func(t *testing.T) {
				db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
				if err != nil {
					t.Fatal(err)
				}
				sqlDB, err := db.DB()
				if err != nil {
					t.Fatal(err)
				}
				t.Cleanup(func() { _ = sqlDB.Close() })
				if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.AttendanceRevisionRequest{}, &models.Setting{}, &models.Holiday{}, &models.JadwalPiket{}, &models.ActivityLog{}); err != nil {
					t.Fatal(err)
				}
				// geogqpresence.sql defines metode as ENUM('button','qr_scan','manual').
				// Enforce those values in SQLite too: an unconstrained model string
				// otherwise hides the production failure when approval creates a row.
				if err := db.Exec(`CREATE TRIGGER enforce_legacy_attendance_method
					BEFORE INSERT ON attendance_logs
					WHEN NEW.metode NOT IN ('button', 'qr_scan', 'manual')
					BEGIN
						SELECT RAISE(ABORT, 'attendance_logs.metode violates legacy ENUM');
					END`).Error; err != nil {
					t.Fatal(err)
				}
				teacher := models.User{Username: "revision-teacher", Role: "guru", Nama: "Guru Revisi", TipeGuru: "full_time"}
				admin := models.User{Username: "revision-admin", Role: "admin", Nama: "Admin Revisi", TipeGuru: "full_time"}
				for _, user := range []*models.User{&teacher, &admin} {
					if err := db.Create(user).Error; err != nil {
						t.Fatal(err)
					}
				}
				cfg := config.Config{
					AppTimezone: "Asia/Jakarta", TelegramBotToken: "test-token",
					TelegramWebhookSecret: "test-webhook-secret", TelegramAdminUserMap: fmt.Sprintf("123:%d", admin.ID),
				}
				h := NewHandler(db, cfg, auth.NewJWTManager(cfg))
				date := time.Date(2026, time.October, 19, 0, 0, 0, 0, appLocation(h))
				if existing {
					attendance := models.AttendanceLog{
						UserID: teacher.ID, Nama: teacher.Nama, Tanggal: date, Status: "hadir",
						JamMasuk: pointerString("07:00:00"), Metode: "qr_scan",
					}
					if err := db.Create(&attendance).Error; err != nil {
						t.Fatal(err)
					}
				}
				pendingKey := attendanceRevisionPendingKey(teacher.ID, date)
				revision := models.AttendanceRevisionRequest{
					UserID: teacher.ID, Tanggal: date, Alasan: "kendala_teknis", Status: attendanceRevisionPending,
					JamMasuk: pointerString("06:45:00"), JamPulang: pointerString("12:24:00"), PendingKey: &pendingKey,
				}
				if err := db.Create(&revision).Error; err != nil {
					t.Fatal(err)
				}
				app := fiber.New(fiber.Config{ErrorHandler: middleware.ErrorHandler("production")})
				app.Post("/admin/revisions/:id/decision", func(c *fiber.Ctx) error {
					c.Locals("authClaims", &auth.Claims{UserID: admin.ID, Role: "admin"})
					return h.decideAttendanceRevision(c)
				})
				app.Post("/api/telegram/webhook", h.telegramAttendanceRevisionWebhook)

				type telegramCall struct {
					method string
					text   string
				}
				var calls []telegramCall
				request := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/admin/revisions/%d/decision", revision.ID), strings.NewReader(`{"decision":"approved"}`))
				if channel == "telegram" {
					originalTransport := http.DefaultTransport
					t.Cleanup(func() { http.DefaultTransport = originalTransport })
					http.DefaultTransport = revisionTelegramTestTransport(func(request *http.Request) (*http.Response, error) {
						if request.URL.Host != "api.telegram.org" {
							return nil, fmt.Errorf("unexpected HTTP target in Telegram test")
						}
						var payload struct {
							Text string `json:"text"`
						}
						if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
							return nil, err
						}
						calls = append(calls, telegramCall{method: strings.TrimPrefix(request.URL.Path, "/bot"+cfg.TelegramBotToken+"/"), text: payload.Text})
						return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"ok":true}`)), Header: make(http.Header)}, nil
					})
					body, err := json.Marshal(telegramUpdate{CallbackQuery: &telegramCallbackQuery{
						ID: "test-callback", From: telegramUser{ID: 123},
						Message: &telegramMessage{MessageID: 42, Chat: telegramChat{ID: 123}, Text: "Pengajuan revisi presensi"},
						Data:    telegramRevisionCallbackData(cfg.TelegramBotToken, "a", revision.ID, ""),
					}})
					if err != nil {
						t.Fatal(err)
					}
					request = httptest.NewRequest(http.MethodPost, "/api/telegram/webhook", strings.NewReader(string(body)))
					request.Header.Set("X-Telegram-Bot-Api-Secret-Token", cfg.TelegramWebhookSecret)
				}
				request.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
				response, err := app.Test(request)
				if err != nil {
					t.Fatal(err)
				}
				defer response.Body.Close()
				body, err := io.ReadAll(response.Body)
				if err != nil {
					t.Fatal(err)
				}
				if response.StatusCode != fiber.StatusOK {
					t.Fatalf("approval status = %d, want 200: %s", response.StatusCode, body)
				}
				if err := db.First(&revision, revision.ID).Error; err != nil {
					t.Fatal(err)
				}
				if revision.Status != attendanceRevisionApproved || revision.PendingKey != nil {
					t.Fatalf("revision status/key = %s/%v, want approved/nil; Telegram calls: %+v", revision.Status, revision.PendingKey, calls)
				}
				var attendance models.AttendanceLog
				if err := db.Where("user_id = ? AND tanggal = ?", teacher.ID, date).First(&attendance).Error; err != nil {
					t.Fatalf("approved attendance missing: %v", err)
				}
				expectedMethod := "manual"
				if existing {
					expectedMethod = "qr_scan"
				}
				if attendance.Metode != expectedMethod || stringPointerValue(attendance.JamMasuk) != "06:45:00" || stringPointerValue(attendance.JamPulang) != "12:24:00" {
					t.Fatalf("attendance method/times = %s/%s/%s", attendance.Metode, stringPointerValue(attendance.JamMasuk), stringPointerValue(attendance.JamPulang))
				}
				if revision.AttendanceID == nil || *revision.AttendanceID != attendance.ID || revision.ReviewedBy == nil || *revision.ReviewedBy != admin.ID {
					t.Fatal("approval did not link its attendance and reviewer")
				}
				if channel == "telegram" && (len(calls) != 2 || calls[0].method != "answerCallbackQuery" || calls[1].method != "editMessageText" || !strings.Contains(calls[1].text, "DISETUJUI")) {
					t.Fatalf("Telegram did not acknowledge and confirm approval: %+v", calls)
				}
			})
		}
	}
}
