package compat

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http/httptest"
	"strconv"
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

func TestAdminClosesPreviousMonthRevisionsUntilNextPeriod(t *testing.T) {
	location, _ := time.LoadLocation("Asia/Jakarta")
	clock := time.Date(2026, time.November, 2, 10, 0, 0, 0, location)
	previousClock := attendanceRevisionNow
	attendanceRevisionNow = func() time.Time { return clock }
	t.Cleanup(func() { attendanceRevisionNow = previousClock })
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Setting{}, &models.AttendanceLog{}, &models.AttendanceRevisionRequest{}, &models.Holiday{}, &models.OptionalWorkday{}, &models.WeekendOverride{}, &models.JadwalPiket{}, &models.ActivityLog{}); err != nil {
		t.Fatal(err)
	}
	admin := models.User{Username: "access-admin", Nama: "Admin Uji", Role: "admin", TipeGuru: "full_time"}
	teacher := models.User{Username: "access-teacher", Nama: "Guru Uji", Role: "guru", TipeGuru: "full_time"}
	head := models.User{Username: "access-head", Nama: "Kepala Sekolah Uji", Role: "kepala_sekolah"}
	for _, user := range []*models.User{&admin, &teacher, &head} {
		if err := db.Create(user).Error; err != nil {
			t.Fatal(err)
		}
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta", JWTSecret: "revision-access-test-secret-long-enough", JWTIssuer: "test", JWTAudience: "web", JWTAccessTTL: time.Hour}
	manager := auth.NewJWTManager(cfg)
	h := NewHandler(db, cfg, manager)
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error { c.Locals("db", db); return c.Next() })
	h.RegisterCoreRoutes(app)
	var adminToken, teacherToken, headToken string
	for _, token := range []struct {
		user   models.User
		target *string
	}{{admin, &adminToken}, {teacher, &teacherToken}, {head, &headToken}} {
		*token.target, _, err = manager.IssueAccess(token.user)
		if err != nil {
			t.Fatal(err)
		}
	}
	request := func(method, path, token, body string, want int) []byte {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		if token != "" {
			req.Header.Set(fiber.HeaderAuthorization, "Bearer "+token)
		}
		response, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		bytes, err := io.ReadAll(response.Body)
		if err != nil {
			t.Fatal(err)
		}
		if response.StatusCode != want {
			t.Fatalf("%s %s status = %d, want %d: %s", method, path, response.StatusCode, want, bytes)
		}
		return bytes
	}
	decodeAccess := func(body []byte) attendanceRevisionAccess {
		t.Helper()
		var envelope struct {
			Data attendanceRevisionAccess `json:"data"`
		}
		if err := json.Unmarshal(body, &envelope); err != nil {
			t.Fatal(err)
		}
		return envelope.Data
	}
	const adminPath = "/api/v1/admin/attendance-revision-access"
	const teacherPath = "/api/v1/guru/attendance-revision-access"
	const revisionPath = "/api/v1/guru/attendance-revisions"
	const closeBody = `{"periodStart":"2026-10-01","hidden":true}`
	const reopenBody = `{"periodStart":"2026-10-01","hidden":false}`
	request("GET", teacherPath, "", "", fiber.StatusUnauthorized)
	request("GET", adminPath, teacherToken, "", fiber.StatusForbidden)
	request("PUT", adminPath, teacherToken, closeBody, fiber.StatusForbidden)
	request("GET", adminPath, headToken, "", fiber.StatusOK)
	request("PUT", adminPath, headToken, closeBody, fiber.StatusForbidden)
	request("PUT", adminPath, adminToken, `{"periodStart":"2026-10-01"}`, fiber.StatusBadRequest)
	request("PUT", adminPath, adminToken, `{"periodStart":"2026-09-01","hidden":true}`, fiber.StatusConflict)
	access := decodeAccess(request("GET", teacherPath, teacherToken, "", fiber.StatusOK))
	if !access.PreviousMonthOpen || access.ClosedByAdmin || access.PeriodStart != "2026-10-01" {
		t.Fatalf("unexpected initial access: %+v", access)
	}
	created := request("POST", revisionPath, teacherToken, `{"tanggal":"2026-10-30","alasan":"lupa","jamMasuk":"07:00"}`, fiber.StatusOK)
	var envelope struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(created, &envelope); err != nil {
		t.Fatal(err)
	}
	requestID := envelope.Data.ID
	if requestID == 0 {
		t.Fatal("pending request missing")
	}
	access = decodeAccess(request("PUT", adminPath, adminToken, closeBody, fiber.StatusOK))
	if access.PreviousMonthOpen || !access.ClosedByAdmin || access.StartDate != "2026-11-01" || access.ClosedAt == nil {
		t.Fatalf("manual close failed: %+v", access)
	}
	closedAt := *access.ClosedAt
	var setting models.Setting
	if err := db.Where("setting_key = ?", "attendance_revision_access_2026-10").First(&setting).Error; err != nil {
		t.Fatal(err)
	}
	if stringPointerValue(setting.UpdatedBy) != strconv.Itoa(int(admin.ID)) {
		t.Fatal("admin identity was not saved")
	}
	access = decodeAccess(request("GET", teacherPath, teacherToken, "", fiber.StatusOK))
	if access.PreviousMonthOpen || !access.ClosedByAdmin {
		t.Fatal("teacher still sees previous-month access")
	}
	for _, reason := range []string{"lupa", "kendala_teknis", "izin", "sakit"} {
		body := fmt.Sprintf(`{"tanggal":"2026-10-29","alasan":%q}`, reason)
		if reason == "lupa" || reason == "kendala_teknis" {
			body = fmt.Sprintf(`{"tanggal":"2026-10-29","alasan":%q,"jamMasuk":"07:00"}`, reason)
		}
		request("POST", revisionPath, teacherToken, body, fiber.StatusConflict)
	}
	request("PUT", fmt.Sprintf("%s/%d", revisionPath, requestID), teacherToken, `{"alasan":"lupa","jamMasuk":"08:00"}`, fiber.StatusConflict)
	var eligible struct {
		Data struct {
			EligibleDates []string `json:"eligibleDates"`
		} `json:"data"`
	}
	if err := json.Unmarshal(request("GET", revisionPath+"?start_date=2026-10-01&end_date=2026-10-31", teacherToken, "", fiber.StatusOK), &eligible); err != nil {
		t.Fatal(err)
	}
	if len(eligible.Data.EligibleDates) != 0 {
		t.Fatal("hidden month still has eligible revision dates")
	}
	request("POST", revisionPath, teacherToken, `{"tanggal":"2026-11-02","alasan":"lupa","jamMasuk":"07:00"}`, fiber.StatusOK)
	request("POST", fmt.Sprintf("/api/v1/admin/attendance-revisions/%d/decision", requestID), adminToken, `{"decision":"approved"}`, fiber.StatusOK)
	var saved models.AttendanceLog
	date, _ := parseDate("2026-10-30", location)
	if err := db.Where("user_id = ? AND tanggal = ?", teacher.ID, date).First(&saved).Error; err != nil {
		t.Fatal(err)
	}
	if stringPointerValue(saved.JamMasuk) != "07:00:00" {
		t.Fatal("closed access allowed submitted request to change")
	}
	clock = clock.Add(time.Hour)
	access = decodeAccess(request("PUT", adminPath, adminToken, closeBody, fiber.StatusOK))
	if access.ClosedAt == nil || !access.ClosedAt.Equal(closedAt) {
		t.Fatal("repeated close overwrote the original close time")
	}
	access = decodeAccess(request("PUT", adminPath, adminToken, reopenBody, fiber.StatusOK))
	if !access.PreviousMonthOpen || access.ClosedByAdmin {
		t.Fatal("admin could not reopen before deadline")
	}
	request("POST", revisionPath, teacherToken, `{"tanggal":"2026-10-29","alasan":"izin"}`, fiber.StatusOK)
	request("PUT", adminPath, adminToken, closeBody, fiber.StatusOK)
	clock = time.Date(2026, time.November, 6, 0, 0, 0, 0, location)
	access = decodeAccess(request("GET", adminPath, adminToken, "", fiber.StatusOK))
	if access.PreviousMonthOpen || access.CanChangeVisibility {
		t.Fatal("deadline did not close access")
	}
	request("PUT", adminPath, adminToken, reopenBody, fiber.StatusConflict)
	request("POST", revisionPath, teacherToken, `{"tanggal":"2026-11-06","alasan":"sakit"}`, fiber.StatusOK)
	clock = time.Date(2026, time.December, 1, 8, 0, 0, 0, location)
	access = decodeAccess(request("GET", teacherPath, teacherToken, "", fiber.StatusOK))
	if !access.PreviousMonthOpen || access.ClosedByAdmin || access.PeriodStart != "2026-11-01" {
		t.Fatalf("old period closure leaked into next month: %+v", access)
	}
	request("POST", revisionPath, teacherToken, `{"tanggal":"2026-10-29","alasan":"izin"}`, fiber.StatusBadRequest)
}

func TestRevisionWriteRechecksAdminClosureInsideTransaction(t *testing.T) {
	location, _ := time.LoadLocation("Asia/Jakarta")
	previousClock := attendanceRevisionNow
	attendanceRevisionNow = func() time.Time { return time.Date(2026, time.November, 2, 10, 0, 0, 0, location) }
	t.Cleanup(func() { attendanceRevisionNow = previousClock })
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.Setting{}); err != nil {
		t.Fatal(err)
	}
	h := NewHandler(db, config.Config{AppTimezone: "Asia/Jakarta"}, nil)
	date, _ := parseDate("2026-10-30", location)
	if err := h.validateAttendanceRevisionDateRange(date); err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.Setting{Key: "attendance_revision_access_2026-10", Value: "closed"}).Error; err != nil {
		t.Fatal(err)
	}
	err = db.Transaction(func(tx *gorm.DB) error { return h.validateLockedAttendanceRevisionAccess(tx, date) })
	var accessError *attendanceRevisionAPIError
	if !errors.As(err, &accessError) || accessError.code != "REVISION_PREVIOUS_MONTH_CLOSED" {
		t.Fatalf("write transaction ignored admin closure: %v", err)
	}
}
