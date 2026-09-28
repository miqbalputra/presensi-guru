package compat

import (
	"bytes"
	"encoding/json"
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
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

type monthlyConfirmationTestResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Required              bool             `json:"required"`
		Status                string           `json:"status"`
		CorrectionWhatsAppURL string           `json:"correctionWhatsAppUrl"`
		Rows                  []map[string]any `json:"rows"`
		Period                struct {
			StartDate string `json:"startDate"`
			EndDate   string `json:"endDate"`
		} `json:"period"`
	} `json:"data"`
}

type monthlyConfirmationAdminTestResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Active  bool `json:"active"`
		Summary struct {
			Confirmed           int `json:"confirmed"`
			CorrectionRequested int `json:"correctionRequested"`
			Pending             int `json:"pending"`
		} `json:"summary"`
		Items []struct {
			Nama   string `json:"nama"`
			Status string `json:"status"`
		} `json:"items"`
	} `json:"data"`
}

func TestMonthlyConfirmationPeriodStartsInOctoberAndSkipsNewTeachers(t *testing.T) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		t.Fatal(err)
	}
	beforeActivation := time.Date(2026, time.September, 30, 23, 59, 0, 0, location)
	if _, _, active := monthlyConfirmationPeriod(beforeActivation); active {
		t.Fatal("confirmation was active before 1 October 2026")
	}

	now := time.Date(2026, time.October, 1, 8, 0, 0, 0, location)
	start, end, active := monthlyConfirmationPeriod(now)
	if !active || start.Format("2006-01-02") != "2026-09-01" || end.Format("2006-01-02") != "2026-09-30" {
		t.Fatalf("period = %s through %s, active=%v", start, end, active)
	}

	existing := models.User{CreatedAt: time.Date(2026, time.September, 30, 10, 0, 0, 0, location)}
	if _, _, eligible := monthlyConfirmationTarget(existing, now); !eligible {
		t.Fatal("teacher created before period ended should be asked for confirmation")
	}
	newTeacher := models.User{CreatedAt: time.Date(2026, time.October, 1, 10, 0, 0, 0, location)}
	if _, _, eligible := monthlyConfirmationTarget(newTeacher, now); eligible {
		t.Fatal("teacher created after period ended must not be blocked")
	}
}

func TestMonthlyConfirmationFlowBlocksThenUnlocksAttendanceAndKeepsSnapshot(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(
		&models.User{}, &models.AttendanceLog{}, &models.Setting{}, &models.Holiday{}, &models.OptionalWorkday{},
		&models.WeekendOverride{}, &models.WebhookConfig{}, &models.MonthlyAttendanceConfirmation{},
	); err != nil {
		t.Fatal(err)
	}
	location, _ := time.LoadLocation("Asia/Jakarta")
	teacher := models.User{
		Username: "monthly-teacher", Role: "guru", Nama: "Guru Konfirmasi", TipeGuru: "full_time",
		CreatedAt: time.Date(2026, time.September, 1, 8, 0, 0, 0, location),
	}
	admin := models.User{Username: "monthly-admin", Role: "admin", Nama: "Admin Konfirmasi", TipeGuru: "full_time"}
	if err := db.Create(&teacher).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&admin).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.WebhookConfig{ID: 1, AdminPhone: "081234567890"}).Error; err != nil {
		t.Fatal(err)
	}
	for key, value := range map[string]string{"qr_enabled": "1", "qr_secret": "monthly-qr-secret", "qr_active_nonce": "monthly-qr-nonce", "mode_testing": "1"} {
		if err := db.Create(&models.Setting{Key: key, Value: value}).Error; err != nil {
			t.Fatal(err)
		}
	}
	attendance := models.AttendanceLog{UserID: teacher.ID, Nama: teacher.Nama, Tanggal: time.Date(2026, time.September, 1, 0, 0, 0, 0, location), Status: "hadir"}
	if err := db.Create(&attendance).Error; err != nil {
		t.Fatal(err)
	}

	previousClock := monthlyConfirmationNow
	monthlyConfirmationNow = func() time.Time { return time.Date(2026, time.October, 1, 8, 0, 0, 0, location) }
	t.Cleanup(func() { monthlyConfirmationNow = previousClock })

	cfg := config.Config{AppTimezone: "Asia/Jakarta", JWTSecret: "monthly-confirmation-test-secret-that-is-long-enough", JWTIssuer: "test", JWTAudience: "web", JWTAccessTTL: time.Hour}
	manager := auth.NewJWTManager(cfg)
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("db", db)
		return c.Next()
	})
	h := NewHandler(db, cfg, manager)
	h.RegisterCoreRoutes(app)
	h.RegisterAttendanceRoutes(app)

	teacherToken, _, err := manager.IssueAccess(teacher)
	if err != nil {
		t.Fatal(err)
	}
	adminToken, _, err := manager.IssueAccess(admin)
	if err != nil {
		t.Fatal(err)
	}
	request := func(method, path, token string) *http.Request {
		r := httptest.NewRequest(method, path, nil)
		r.Header.Set(fiber.HeaderAuthorization, "Bearer "+token)
		return r
	}
	decode := func(response *http.Response) monthlyConfirmationTestResponse {
		t.Helper()
		defer response.Body.Close()
		var payload monthlyConfirmationTestResponse
		if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
			t.Fatal(err)
		}
		return payload
	}

	adminResponse, err := app.Test(request(http.MethodGet, "/api/v1/guru/monthly-confirmation", adminToken))
	if err != nil {
		t.Fatal(err)
	}
	if adminResponse.StatusCode != fiber.StatusForbidden {
		t.Fatalf("admin status = %d, want %d", adminResponse.StatusCode, fiber.StatusForbidden)
	}
	adminResponse.Body.Close()

	response, err := app.Test(request(http.MethodGet, "/api/v1/guru/monthly-confirmation", teacherToken))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.StatusCode, http.StatusOK)
	}
	payload := decode(response)
	if !payload.Success || !payload.Data.Required || payload.Data.Period.StartDate != "2026-09-01" || payload.Data.Period.EndDate != "2026-09-30" {
		t.Fatalf("unexpected confirmation payload: %+v", payload.Data)
	}
	if len(payload.Data.Rows) != 30 {
		t.Fatalf("rows = %d, want a complete September calendar of 30 dates", len(payload.Data.Rows))
	}

	manualRequest := httptest.NewRequest(http.MethodPost, "/api/v1/attendance", strings.NewReader(`{"status":"izin"}`))
	manualRequest.Header.Set(fiber.HeaderAuthorization, "Bearer "+teacherToken)
	manualRequest.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	manualResponse, err := app.Test(manualRequest)
	if err != nil {
		t.Fatal(err)
	}
	if manualResponse.StatusCode != fiber.StatusConflict {
		manualResponse.Body.Close()
		t.Fatalf("manual attendance status = %d, want %d before confirmation", manualResponse.StatusCode, fiber.StatusConflict)
	}
	manualResponse.Body.Close()

	qrPayload, err := json.Marshal(map[string]any{
		"type": "attendance", "secret": "monthly-qr-secret", "nonce": "monthly-qr-nonce", "expires_at": time.Now().UTC().Add(time.Hour).Format(time.RFC3339),
	})
	if err != nil {
		t.Fatal(err)
	}
	qrRequestBody, err := json.Marshal(map[string]any{"qr_data": string(qrPayload), "latitude": 0, "longitude": 0})
	if err != nil {
		t.Fatal(err)
	}
	qrRequest := httptest.NewRequest(http.MethodPost, "/api/v1/qr/scan", bytes.NewReader(qrRequestBody))
	qrRequest.Header.Set(fiber.HeaderAuthorization, "Bearer "+teacherToken)
	qrRequest.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	qrResponse, err := app.Test(qrRequest)
	if err != nil {
		t.Fatal(err)
	}
	if qrResponse.StatusCode != fiber.StatusConflict {
		qrResponse.Body.Close()
		t.Fatalf("QR attendance status = %d, want %d before confirmation", qrResponse.StatusCode, fiber.StatusConflict)
	}
	qrResponse.Body.Close()

	blocked, err := h.requiresMonthlyConfirmation(teacher, monthlyConfirmationNow())
	if err != nil || !blocked {
		t.Fatalf("attendance should be blocked before confirmation: blocked=%v err=%v", blocked, err)
	}

	response, err = app.Test(request(http.MethodPost, "/api/v1/guru/monthly-confirmation/correction-request", teacherToken))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK {
		t.Fatalf("correction status = %d, want %d", response.StatusCode, http.StatusOK)
	}
	payload = decode(response)
	if payload.Data.Status != monthlyConfirmationStatusCorrectionRequested || !strings.Contains(payload.Data.CorrectionWhatsAppURL, "https://wa.me/6281234567890") || !strings.Contains(payload.Data.CorrectionWhatsAppURL, "Pengajuan+Koreksi+Presensi+Kehadiran") {
		t.Fatalf("correction payload = %+v", payload.Data)
	}
	adminSummaryResponse, err := app.Test(request(http.MethodGet, "/api/v1/admin/monthly-confirmations", adminToken))
	if err != nil {
		t.Fatal(err)
	}
	if adminSummaryResponse.StatusCode != http.StatusOK {
		adminSummaryResponse.Body.Close()
		t.Fatalf("admin summary status = %d, want %d", adminSummaryResponse.StatusCode, http.StatusOK)
	}
	var adminSummary monthlyConfirmationAdminTestResponse
	if err := json.NewDecoder(adminSummaryResponse.Body).Decode(&adminSummary); err != nil {
		adminSummaryResponse.Body.Close()
		t.Fatal(err)
	}
	adminSummaryResponse.Body.Close()
	if !adminSummary.Success || !adminSummary.Data.Active || adminSummary.Data.Summary.CorrectionRequested != 1 || len(adminSummary.Data.Items) != 1 || adminSummary.Data.Items[0].Status != monthlyConfirmationStatusCorrectionRequested {
		t.Fatalf("admin correction summary = %+v", adminSummary.Data)
	}
	blocked, err = h.requiresMonthlyConfirmation(teacher, monthlyConfirmationNow())
	if err != nil || !blocked {
		t.Fatalf("attendance should remain blocked after correction request: blocked=%v err=%v", blocked, err)
	}

	response, err = app.Test(request(http.MethodPost, "/api/v1/guru/monthly-confirmation/confirm", teacherToken))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK {
		t.Fatalf("confirm status = %d, want %d", response.StatusCode, http.StatusOK)
	}
	payload = decode(response)
	if !payload.Success || payload.Data.Required {
		t.Fatalf("confirm did not unlock attendance: %+v", payload.Data)
	}
	adminSummaryResponse, err = app.Test(request(http.MethodGet, "/api/v1/admin/monthly-confirmations", adminToken))
	if err != nil {
		t.Fatal(err)
	}
	if adminSummaryResponse.StatusCode != http.StatusOK {
		adminSummaryResponse.Body.Close()
		t.Fatalf("admin confirmed summary status = %d, want %d", adminSummaryResponse.StatusCode, http.StatusOK)
	}
	if err := json.NewDecoder(adminSummaryResponse.Body).Decode(&adminSummary); err != nil {
		adminSummaryResponse.Body.Close()
		t.Fatal(err)
	}
	adminSummaryResponse.Body.Close()
	if adminSummary.Data.Summary.Confirmed != 1 || adminSummary.Data.Summary.CorrectionRequested != 0 || len(adminSummary.Data.Items) != 1 || adminSummary.Data.Items[0].Status != monthlyConfirmationStatusConfirmed {
		t.Fatalf("admin confirmed summary = %+v", adminSummary.Data)
	}
	blocked, err = h.requiresMonthlyConfirmation(teacher, monthlyConfirmationNow())
	if err != nil || blocked {
		t.Fatalf("attendance should be available after confirmation: blocked=%v err=%v", blocked, err)
	}

	var confirmation models.MonthlyAttendanceConfirmation
	if err := db.Where("user_id = ?", teacher.ID).First(&confirmation).Error; err != nil {
		t.Fatal(err)
	}
	if confirmation.Status != monthlyConfirmationStatusConfirmed || confirmation.Snapshot == nil || *confirmation.Snapshot == "" {
		t.Fatalf("confirmation did not retain an approved snapshot: %+v", confirmation)
	}
	if err := db.Model(&attendance).Update("status", "izin").Error; err != nil {
		t.Fatal(err)
	}
	if err := db.First(&confirmation, confirmation.ID).Error; err != nil {
		t.Fatal(err)
	}
	if confirmation.Status != monthlyConfirmationStatusConfirmed {
		t.Fatalf("admin attendance edit changed confirmation status to %q", confirmation.Status)
	}
}
