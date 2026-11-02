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

func leaveTestHandler(t *testing.T) *Handler {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.Setting{}, &models.Holiday{}, &models.OptionalWorkday{}, &models.WeekendOverride{}, &models.JadwalPiket{}); err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta"}
	return NewHandler(db, cfg, auth.NewJWTManager(cfg))
}

func TestTeacherLeaveHistoryPreservesPastDatesAfterActivation(t *testing.T) {
	h := leaveTestHandler(t)
	loc := appLocation(h)
	date := func(s string) time.Time { d, _ := parseDate(s, loc); return d }
	user := models.User{Username: "leave-teacher", Nama: "Guru Cuti", Role: "guru"}
	updates, err := teacherLeaveUpdates(user, map[string]any{"isOnLeave": true, "leaveStartDate": "2026-10-30"}, date("2026-10-30"))
	if err != nil {
		t.Fatal(err)
	}
	user.IsOnLeave, user.LeavePeriods = true, updates["leave_periods"].(string)
	updates, err = teacherLeaveUpdates(user, map[string]any{"isOnLeave": false}, date("2026-11-02"))
	if err != nil {
		t.Fatal(err)
	}
	user.IsOnLeave, user.LeavePeriods = false, updates["leave_periods"].(string)
	for day, want := range map[string]bool{"2026-10-29": false, "2026-10-30": true, "2026-11-01": true, "2026-11-02": false} {
		if user.OnLeaveOn(date(day)) != want {
			t.Errorf("leave on %s = %v, want %v", day, !want, want)
		}
	}
	if _, err := teacherLeaveUpdates(user, map[string]any{"isOnLeave": true, "leaveStartDate": "2026-10-31"}, date("2026-11-02")); err == nil {
		t.Fatal("overlapping history was accepted")
	}
	if err := h.db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	report, err := h.buildTeacherAttendanceReport(user, date("2026-10-29"), date("2026-11-03"))
	if err != nil {
		t.Fatal(err)
	}
	summary := report["summary"].(fiber.Map)
	if summary["total_hari"] != 3 || summary["alfa"] != 3 {
		t.Fatalf("leave was counted as work/Alfa: %+v", summary)
	}
	cuti := 0
	for _, row := range report["rows"].([]fiber.Map) {
		if row["status"] == "cuti" {
			cuti++
		}
	}
	if cuti != 3 {
		t.Fatalf("cuti rows = %d, want 3", cuti)
	}
	calendar, err := h.loadWorkdayCalendar(date("2026-10-30"), date("2026-11-02"))
	if err != nil {
		t.Fatal(err)
	}
	if workday, optional := calendar.isWorkday(user, date("2026-10-30")); workday || optional {
		t.Fatal("leave remains a required/optional workday")
	}
	if workday, _ := calendar.isWorkday(user, date("2026-11-02")); !workday {
		t.Fatal("activation did not restore workday")
	}
}

func TestTeacherLeaveAdminOnlyAndAttendanceReminderExclusion(t *testing.T) {
	h := leaveTestHandler(t)
	user := models.User{Username: "teacher", Nama: "Guru", Role: "guru", Email: pointerString("guru@gmail.com")}
	if err := h.db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("db", h.db)
		c.Locals("authClaims", &auth.Claims{UserID: user.ID, Role: c.Get("Test-Role")})
		return c.Next()
	})
	app.Put("/users", h.guru)
	app.Post("/attendance", func(c *fiber.Ctx) error {
		body, err := readJSON(c)
		if err != nil {
			return err
		}
		return h.createAttendance(c, &auth.Claims{UserID: user.ID, Role: "guru"}, body)
	})
	request := func(role, method, path, body string) int {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("Test-Role", role)
		res, err := app.Test(r)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		return res.StatusCode
	}
	body := fmt.Sprintf(`{"id":%d,"isOnLeave":true,"leaveStartDate":%q}`, user.ID, today(h))
	if code := request("guru", "PUT", "/users", body); code != 403 {
		t.Fatalf("teacher changed own leave: %d", code)
	}
	if code := request("admin", "PUT", "/users", body); code != 200 {
		t.Fatalf("admin leave update failed: %d", code)
	}
	if err := h.db.First(&user, user.ID).Error; err != nil {
		t.Fatal(err)
	}
	if !user.IsOnLeave || !user.OnLeaveOn(time.Now().In(appLocation(h))) {
		t.Fatal("leave state was not persisted")
	}
	if code := request("guru", "POST", "/attendance", `{"status":"hadir"}`); code != 409 {
		t.Fatalf("attendance on leave accepted: %d", code)
	}
	missing, err := h.missingTeachers(today(h))
	if err != nil {
		t.Fatal(err)
	}
	if len(missing) != 0 {
		t.Fatalf("teacher on leave remains in daily reminders: %+v", missing)
	}
	var count int64
	h.db.Model(&models.AttendanceLog{}).Count(&count)
	if count != 0 {
		t.Fatal("a real attendance record was created during leave")
	}
	activeBody, _ := json.Marshal(map[string]any{"id": user.ID, "isOnLeave": false})
	if code := request("admin", "PUT", "/users", string(activeBody)); code != 200 {
		t.Fatalf("activation failed: %d", code)
	}
	if err := h.db.First(&user, user.ID).Error; err != nil {
		t.Fatal(err)
	}
	if user.IsOnLeave || user.OnLeaveOn(time.Now().In(appLocation(h))) {
		t.Fatal("teacher is still on leave after activation")
	}
}
