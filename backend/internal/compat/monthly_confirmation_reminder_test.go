package compat

import (
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

func TestMonthlyConfirmationReminderWindow(t *testing.T) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		t.Fatal(err)
	}
	tests := []struct {
		name     string
		date     time.Time
		wantSend bool
		wantType string
	}{
		{name: "month end", date: time.Date(2026, time.October, 31, 15, 0, 0, 0, location), wantSend: true, wantType: "month_end"},
		{name: "first day", date: time.Date(2026, time.November, 1, 15, 0, 0, 0, location), wantSend: true, wantType: "follow_up"},
		{name: "third day", date: time.Date(2026, time.November, 3, 15, 0, 0, 0, location), wantSend: true, wantType: "follow_up"},
		{name: "fourth day", date: time.Date(2026, time.November, 4, 15, 0, 0, 0, location)},
		{name: "april month end", date: time.Date(2026, time.April, 30, 15, 0, 0, 0, location), wantSend: true, wantType: "month_end"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotSend, gotType := monthlyConfirmationReminderWindow(test.date)
			if gotSend != test.wantSend || gotType != test.wantType {
				t.Fatalf("monthlyConfirmationReminderWindow() = (%v, %q), want (%v, %q)", gotSend, gotType, test.wantSend, test.wantType)
			}
		})
	}
}

func TestN8nMonthlyConfirmationRemindersOnlyReturnsUnconfirmedTeachers(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.MonthlyAttendanceConfirmation{}); err != nil {
		t.Fatal(err)
	}
	location, _ := time.LoadLocation("Asia/Jakarta")
	clock := time.Date(2026, time.October, 31, 15, 0, 0, 0, location)
	previousClock := monthlyConfirmationNow
	monthlyConfirmationNow = func() time.Time { return clock }
	t.Cleanup(func() { monthlyConfirmationNow = previousClock })

	periodStart := time.Date(2026, time.September, 1, 0, 0, 0, 0, location)
	periodEnd := time.Date(2026, time.September, 30, 0, 0, 0, 0, location)
	createdAt := time.Date(2026, time.August, 1, 8, 0, 0, 0, location)
	phones := map[string]string{
		"pending": "081234567891", "confirmed": "081234567892", "admin-confirmed": "081234567893",
		"correction": "081234567894", "no-phone": "", "archived": "081234567895", "new-teacher": "081234567896",
	}
	teachers := make(map[string]models.User, len(phones))
	for name, phone := range phones {
		var phonePtr *string
		if phone != "" {
			phonePtr = &phone
		}
		created := createdAt
		if name == "new-teacher" {
			created = periodEnd.AddDate(0, 0, 1)
		}
		teacher := models.User{Username: "teacher-" + name, Role: "guru", Nama: name, NoHP: phonePtr, CreatedAt: created}
		if name == "archived" {
			archivedAt := time.Date(2026, time.October, 1, 8, 0, 0, 0, location)
			teacher.ArchivedAt = &archivedAt
		}
		if err := db.Create(&teacher).Error; err != nil {
			t.Fatal(err)
		}
		teachers[name] = teacher
	}
	for name, status := range map[string]string{
		"confirmed":       monthlyConfirmationStatusConfirmed,
		"admin-confirmed": monthlyConfirmationStatusAdminConfirmed,
		"correction":      monthlyConfirmationStatusCorrectionRequested,
	} {
		confirmation := models.MonthlyAttendanceConfirmation{UserID: teachers[name].ID, PeriodStart: periodStart, PeriodEnd: periodEnd, Status: status}
		if err := db.Create(&confirmation).Error; err != nil {
			t.Fatal(err)
		}
	}

	cfg := config.Config{AppTimezone: "Asia/Jakarta", N8NAPIKey: "monthly-confirmation-reminder-test-key", JWTSecret: "monthly-confirmation-reminder-test-secret-that-is-long-enough", JWTIssuer: "test", JWTAudience: "web", JWTAccessTTL: time.Hour}
	app := fiber.New()
	h := NewHandler(db, cfg, auth.NewJWTManager(cfg))
	h.RegisterIntegrationRoutes(app)
	request := func() *http.Request {
		r := httptest.NewRequest(http.MethodGet, "/api/v1/integrations/n8n/monthly-confirmation-reminders", nil)
		r.Header.Set("X-API-Key", cfg.N8NAPIKey)
		return r
	}
	type reminderResponse struct {
		Success bool `json:"success"`
		Data    struct {
			ShouldSend   bool   `json:"shouldSend"`
			ReminderType string `json:"reminderType"`
			Total        int    `json:"total"`
			Data         []struct {
				Nama   string `json:"nama"`
				Phone  string `json:"phone"`
				Status string `json:"status"`
			} `json:"data"`
		} `json:"data"`
	}
	decode := func(response *http.Response) reminderResponse {
		t.Helper()
		defer response.Body.Close()
		var payload reminderResponse
		if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
			t.Fatal(err)
		}
		return payload
	}

	response, err := app.Test(request())
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.StatusCode, http.StatusOK)
	}
	payload := decode(response)
	if !payload.Success || !payload.Data.ShouldSend || payload.Data.ReminderType != "month_end" || payload.Data.Total != 2 {
		t.Fatalf("unexpected reminder response: %+v", payload.Data)
	}
	got := map[string]string{}
	for _, item := range payload.Data.Data {
		got[item.Nama] = item.Status
	}
	if got["pending"] != "pending" || got["correction"] != monthlyConfirmationStatusCorrectionRequested || len(got) != 2 {
		t.Fatalf("reminders include wrong teachers: %+v", got)
	}

	confirmedAt := clock
	confirmation := models.MonthlyAttendanceConfirmation{
		UserID: teachers["pending"].ID, PeriodStart: periodStart, PeriodEnd: periodEnd,
		Status: monthlyConfirmationStatusConfirmed, ConfirmedAt: &confirmedAt,
	}
	if err := db.Create(&confirmation).Error; err != nil {
		t.Fatal(err)
	}
	response, err = app.Test(request())
	if err != nil {
		t.Fatal(err)
	}
	payload = decode(response)
	if payload.Data.Total != 1 || len(payload.Data.Data) != 1 || payload.Data.Data[0].Nama != "correction" {
		t.Fatalf("confirmed teacher was not removed from reminders: %+v", payload.Data.Data)
	}

	clock = time.Date(2026, time.November, 4, 15, 0, 0, 0, location)
	response, err = app.Test(request())
	if err != nil {
		t.Fatal(err)
	}
	payload = decode(response)
	if payload.Data.ShouldSend || payload.Data.Total != 0 {
		t.Fatalf("outside reminder window response = %+v", payload.Data)
	}
}
