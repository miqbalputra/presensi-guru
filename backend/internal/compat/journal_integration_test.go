package compat

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/config"
	"github.com/griyaquran/geopresensi/backend/internal/models"
	"gorm.io/gorm"
)

func TestJournalAttendanceIntegrationReturnsFilteredMinimalRows(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}); err != nil {
		t.Fatal(err)
	}

	firstID := "GURU001"
	secondID := "GURU002"
	first := models.User{IDGuru: &firstID, Username: "guru1", Role: "guru", Nama: "Guru Satu", CreatedAt: time.Now(), UpdatedAt: time.Now()}
	second := models.User{IDGuru: &secondID, Username: "guru2", Role: "guru", Nama: "Guru Dua", CreatedAt: time.Now(), UpdatedAt: time.Now()}
	if err := db.Create(&first).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&second).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.AttendanceLog{
		UserID:    first.ID,
		Nama:      first.Nama,
		Tanggal:   time.Date(2026, 8, 18, 0, 0, 0, 0, time.UTC),
		Status:    "izin",
		UpdatedAt: time.Date(2026, 8, 18, 0, 30, 0, 0, time.UTC),
	}).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.AttendanceLog{
		UserID:    second.ID,
		Nama:      second.Nama,
		Tanggal:   time.Date(2026, 8, 20, 0, 0, 0, 0, time.UTC),
		Status:    "sakit",
		UpdatedAt: time.Date(2026, 8, 20, 0, 30, 0, 0, time.UTC),
	}).Error; err != nil {
		t.Fatal(err)
	}

	cfg := config.Config{AppTimezone: "Asia/Jakarta", JournalAPIKey: "journal-test-key"}
	app := fiber.New()
	NewHandler(db, cfg, auth.NewJWTManager(cfg)).RegisterIntegrationRoutes(app)

	request := httptest.NewRequest("GET", "/api/v1/integrations/journal/attendance?teacher_ids=GURU001,GURU002&start_date=2026-08-18&end_date=2026-08-18", nil)
	request.Header.Set("X-API-Key", cfg.JournalAPIKey)
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want 200", response.StatusCode)
	}

	var payload struct {
		Success bool `json:"success"`
		Data    []struct {
			IDGuru    string `json:"id_guru"`
			Tanggal   string `json:"tanggal"`
			Status    string `json:"status"`
			UpdatedAt string `json:"updated_at"`
			Password  string `json:"password"`
		} `json:"data"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if !payload.Success || len(payload.Data) != 1 {
		t.Fatalf("payload = %#v, want one successful row", payload)
	}
	row := payload.Data[0]
	if row.IDGuru != firstID || row.Tanggal != "2026-08-18" || row.Status != "izin" || row.UpdatedAt == "" || row.Password != "" {
		t.Fatalf("unexpected minimal row: %#v", row)
	}
}

func TestJournalAttendanceIntegrationUsesDedicatedKeyAndReadOnlyMethod(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta", JournalAPIKey: "journal-test-key"}
	app := fiber.New()
	NewHandler(db, cfg, auth.NewJWTManager(cfg)).RegisterIntegrationRoutes(app)

	missing := httptest.NewRequest("GET", "/api/v1/integrations/journal/attendance?teacher_ids=GURU001&start_date=2026-08-18&end_date=2026-08-18", nil)
	missingResponse, err := app.Test(missing)
	if err != nil {
		t.Fatal(err)
	}
	if missingResponse.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("missing key status = %d, want 401", missingResponse.StatusCode)
	}

	wrong := httptest.NewRequest("GET", "/api/v1/integrations/journal/attendance?teacher_ids=GURU001&start_date=2026-08-18&end_date=2026-08-18", nil)
	wrong.Header.Set("X-API-Key", "other-key")
	wrongResponse, err := app.Test(wrong)
	if err != nil {
		t.Fatal(err)
	}
	if wrongResponse.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("wrong key status = %d, want 401", wrongResponse.StatusCode)
	}

	post := httptest.NewRequest("POST", "/api/v1/integrations/journal/attendance", nil)
	post.Header.Set("X-API-Key", cfg.JournalAPIKey)
	postResponse, err := app.Test(post)
	if err != nil {
		t.Fatal(err)
	}
	if postResponse.StatusCode != fiber.StatusMethodNotAllowed {
		t.Fatalf("POST status = %d, want 405", postResponse.StatusCode)
	}
}

func TestJournalTeachersIntegrationReturnsOnlyActiveGuruIdentities(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatal(err)
	}

	activeID := "GURU001"
	archivedID := "GURU002"
	adminID := "ADMIN001"
	archivedAt := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	users := []models.User{
		{IDGuru: &activeID, Username: "active-guru", Role: "guru", Nama: "Guru Aktif", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{IDGuru: &archivedID, Username: "archived-guru", Role: "guru", Nama: "Guru Arsip", ArchivedAt: &archivedAt, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{IDGuru: &adminID, Username: "admin", Role: "admin", Nama: "Admin", CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
	if err := db.Create(&users).Error; err != nil {
		t.Fatal(err)
	}

	cfg := config.Config{AppTimezone: "Asia/Jakarta", JournalAPIKey: "journal-test-key"}
	app := fiber.New()
	NewHandler(db, cfg, auth.NewJWTManager(cfg)).RegisterIntegrationRoutes(app)

	request := httptest.NewRequest("GET", "/api/v1/integrations/journal/teachers?teacher_ids=GURU001,GURU002,ADMIN001,UNKNOWN", nil)
	request.Header.Set("X-API-Key", cfg.JournalAPIKey)
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want 200", response.StatusCode)
	}

	var payload struct {
		Success bool             `json:"success"`
		Data    []map[string]any `json:"data"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if !payload.Success || len(payload.Data) != 1 || payload.Data[0]["id_guru"] != activeID {
		t.Fatalf("payload = %#v, want only active guru identity", payload)
	}
	if len(payload.Data[0]) != 1 {
		t.Fatalf("unexpected identity fields leaked: %#v", payload.Data[0])
	}

	post := httptest.NewRequest("POST", "/api/v1/integrations/journal/teachers", nil)
	post.Header.Set("X-API-Key", cfg.JournalAPIKey)
	postResponse, err := app.Test(post)
	if err != nil {
		t.Fatal(err)
	}
	if postResponse.StatusCode != fiber.StatusMethodNotAllowed {
		t.Fatalf("POST status = %d, want 405", postResponse.StatusCode)
	}
}

func TestJournalTeachersIntegrationRejectsMoreThan500IDs(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{JournalAPIKey: "journal-test-key"}
	app := fiber.New()
	NewHandler(db, cfg, auth.NewJWTManager(cfg)).RegisterIntegrationRoutes(app)

	ids := make([]string, 501)
	for i := range ids {
		ids[i] = fmt.Sprintf("%d", i)
	}
	request := httptest.NewRequest("GET", "/api/v1/integrations/journal/teachers?teacher_ids="+strings.Join(ids, ","), nil)
	request.Header.Set("X-API-Key", cfg.JournalAPIKey)
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d, want 400", response.StatusCode)
	}
}
