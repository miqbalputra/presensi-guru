package compat

import (
	"encoding/json"
	"fmt"
	"io"
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

func TestAttendanceRevisionApprovalLifecycle(t *testing.T) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		t.Fatal(err)
	}
	today := dateOnly(time.Now().In(location))
	if today.Day() <= 1 {
		t.Skip("current month has no earlier date to use for a revision")
	}
	var targetDate time.Time
	for candidate := today.AddDate(0, 0, -1); candidate.Month() == today.Month(); candidate = candidate.AddDate(0, 0, -1) {
		if candidate.Weekday() != time.Saturday && candidate.Weekday() != time.Sunday {
			targetDate = candidate
			break
		}
	}
	if targetDate.IsZero() {
		t.Skip("current month has no earlier weekday to use for a revision")
	}

	dbName := strings.ReplaceAll(t.Name(), "/", "-")
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", dbName)), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.AttendanceRevisionRequest{}, &models.Setting{}, &models.Holiday{}, &models.OptionalWorkday{}, &models.WeekendOverride{}, &models.JadwalPiket{}, &models.ActivityLog{}); err != nil {
		t.Fatal(err)
	}
	teacher := models.User{Username: "revision-teacher", Role: "guru", Nama: "Guru Revisi", TipeGuru: "full_time"}
	admin := models.User{Username: "revision-admin", Role: "admin", Nama: "Admin Revisi", TipeGuru: "full_time"}
	if err := db.Create(&teacher).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&admin).Error; err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta"}
	h := NewHandler(db, cfg, auth.NewJWTManager(cfg))
	app := fiber.New()
	app.Post("/teacher/revisions", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: teacher.ID, Role: "guru"})
		return h.createTeacherAttendanceRevision(c)
	})
	app.Put("/teacher/revisions/:id", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: teacher.ID, Role: "guru"})
		return h.updateTeacherAttendanceRevision(c)
	})
	app.Post("/admin/revisions/:id/decision", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: admin.ID, Role: "admin"})
		return h.decideAttendanceRevision(c)
	})

	dateText := targetDate.Format("2006-01-02")
	request := func(method, path, body string) struct {
		Code int
		Body []byte
	} {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		response, testErr := app.Test(req)
		if testErr != nil {
			t.Fatal(testErr)
		}
		defer response.Body.Close()
		responseBody, readErr := io.ReadAll(response.Body)
		if readErr != nil {
			t.Fatal(readErr)
		}
		return struct {
			Code int
			Body []byte
		}{Code: response.StatusCode, Body: responseBody}
	}

	missingCheckIn := request("POST", "/teacher/revisions", fmt.Sprintf(`{"tanggal":%q,"alasan":"lupa","jamPulang":"15:00"}`, dateText))
	if missingCheckIn.Code != fiber.StatusBadRequest {
		t.Fatalf("missing check-in status = %d, want %d", missingCheckIn.Code, fiber.StatusBadRequest)
	}

	created := request("POST", "/teacher/revisions", fmt.Sprintf(`{"tanggal":%q,"alasan":"kendala_teknis","jamMasuk":"07:10","jamPulang":"15:00"}`, dateText))
	if created.Code != fiber.StatusOK {
		t.Fatalf("create status = %d, want %d: %s", created.Code, fiber.StatusOK, string(created.Body))
	}
	var createdEnvelope struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(created.Body, &createdEnvelope); err != nil {
		t.Fatal(err)
	}
	requestID := createdEnvelope.Data.ID
	if requestID == 0 {
		t.Fatal("create response did not include the revision request ID")
	}
	edited := request("PUT", fmt.Sprintf("/teacher/revisions/%d", requestID), `{"alasan":"lupa","jamMasuk":"07:15","jamPulang":"15:00"}`)
	if edited.Code != fiber.StatusOK {
		t.Fatalf("pending edit status = %d, want %d: %s", edited.Code, fiber.StatusOK, string(edited.Body))
	}
	var attendanceCount int64
	if err := db.Model(&models.AttendanceLog{}).Where("user_id = ? AND tanggal = ?", teacher.ID, targetDate).Count(&attendanceCount).Error; err != nil {
		t.Fatal(err)
	}
	if attendanceCount != 0 {
		t.Fatal("attendance changed before admin approval")
	}

	duplicate := request("POST", "/teacher/revisions", fmt.Sprintf(`{"tanggal":%q,"alasan":"lupa","jamMasuk":"07:20"}`, dateText))
	if duplicate.Code != fiber.StatusConflict {
		t.Fatalf("duplicate pending status = %d, want %d", duplicate.Code, fiber.StatusConflict)
	}

	approved := request("POST", fmt.Sprintf("/admin/revisions/%d/decision", requestID), `{"decision":"approved"}`)
	if approved.Code != fiber.StatusOK {
		t.Fatalf("approval status = %d, want %d: %s", approved.Code, fiber.StatusOK, string(approved.Body))
	}
	var saved models.AttendanceLog
	if err := db.Where("user_id = ? AND tanggal = ?", teacher.ID, targetDate).First(&saved).Error; err != nil {
		t.Fatalf("approval did not create attendance for Alfa: %v", err)
	}
	if got := stringPointerValue(saved.JamMasuk); got != "07:15:00" {
		t.Fatalf("saved check-in = %q, want 07:15:00", got)
	}
	if got := stringPointerValue(saved.JamPulang); got != "15:00:00" {
		t.Fatalf("saved check-out = %q, want 15:00:00", got)
	}
	if saved.Status != "hadir" {
		t.Fatalf("saved status = %q, want hadir", saved.Status)
	}
	var reviewed models.AttendanceRevisionRequest
	if err := db.First(&reviewed, requestID).Error; err != nil {
		t.Fatal(err)
	}
	if reviewed.Status != attendanceRevisionApproved || reviewed.PendingKey != nil {
		t.Fatalf("reviewed request status/key = %q/%v, want approved/nil", reviewed.Status, reviewed.PendingKey)
	}
	lockedUpdate := request("PUT", fmt.Sprintf("/teacher/revisions/%d", requestID), `{"alasan":"lupa","jamMasuk":"07:20"}`)
	if lockedUpdate.Code != fiber.StatusConflict {
		t.Fatalf("reviewed request edit status = %d, want %d", lockedUpdate.Code, fiber.StatusConflict)
	}

	second := request("POST", "/teacher/revisions", fmt.Sprintf(`{"tanggal":%q,"alasan":"lupa","jamPulang":"15:30"}`, dateText))
	if second.Code != fiber.StatusOK {
		t.Fatalf("new request after approval status = %d, want %d: %s", second.Code, fiber.StatusOK, string(second.Body))
	}
	var secondEnvelope struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(second.Body, &secondEnvelope); err != nil {
		t.Fatal(err)
	}
	missingRejectNote := request("POST", fmt.Sprintf("/admin/revisions/%d/decision", secondEnvelope.Data.ID), `{"decision":"rejected","note":"   "}`)
	if missingRejectNote.Code != fiber.StatusBadRequest {
		t.Fatalf("rejection without a note status = %d, want %d", missingRejectNote.Code, fiber.StatusBadRequest)
	}
	rejected := request("POST", fmt.Sprintf("/admin/revisions/%d/decision", secondEnvelope.Data.ID), `{"decision":"rejected","note":"Mohon periksa kembali jam yang diajukan."}`)
	if rejected.Code != fiber.StatusOK {
		t.Fatalf("rejection status = %d, want %d: %s", rejected.Code, fiber.StatusOK, string(rejected.Body))
	}
	var historyCount int64
	if err := db.Model(&models.AttendanceRevisionRequest{}).Where("user_id = ? AND tanggal = ?", teacher.ID, targetDate).Count(&historyCount).Error; err != nil {
		t.Fatal(err)
	}
	if historyCount != 2 {
		t.Fatalf("stored revision history count = %d, want 2", historyCount)
	}
}

func TestValidateAttendanceRevisionTimes(t *testing.T) {
	checkIn := "08:00:00"
	checkoutOnly := attendanceRevisionInput{JamPulang: "16:00"}
	requestedIn, requestedOut, err := validateAttendanceRevisionTimes(checkoutOnly, models.AttendanceLog{JamMasuk: &checkIn})
	if err != nil {
		t.Fatalf("checkout-only revision with existing check-in was rejected: %v", err)
	}
	if requestedIn != nil || requestedOut == nil || *requestedOut != "16:00:00" {
		t.Fatalf("unexpected normalized values: in=%v out=%v", requestedIn, requestedOut)
	}

	for _, input := range []attendanceRevisionInput{
		{},
		{JamPulang: "16:00"},
		{JamMasuk: "not-a-time"},
		{JamMasuk: "16:00", JamPulang: "15:00"},
	} {
		if _, _, err := validateAttendanceRevisionTimes(input, models.AttendanceLog{}); err == nil {
			t.Fatalf("invalid revision times were accepted: %+v", input)
		}
	}
}

func TestPartTimePiketRevisionKeepsLateMinutesAndPiketNote(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.Setting{}, &models.Holiday{}, &models.JadwalPiket{}); err != nil {
		t.Fatal(err)
	}
	teacher := models.User{Username: "partime-piket", Role: "guru", Nama: "Guru Partime Piket", TipeGuru: "partime"}
	if err := db.Create(&teacher).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.Setting{Key: "apel_senin_enabled", Value: "1"}).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.JadwalPiket{UserID: teacher.ID, Hari: "Senin", JamPiket: pointerString("06:40"), IsActive: true}).Error; err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta"}
	h := NewHandler(db, cfg, auth.NewJWTManager(cfg))
	request := models.AttendanceRevisionRequest{UserID: teacher.ID, Tanggal: time.Date(2026, time.August, 17, 0, 0, 0, 0, appLocation(h)), JamMasuk: pointerString("06:50"), Alasan: "kendala_teknis"}
	if err := db.Transaction(func(tx *gorm.DB) error { return h.applyAttendanceRevision(tx, &request) }); err != nil {
		t.Fatal(err)
	}
	var saved models.AttendanceLog
	if err := db.Where("user_id = ?", teacher.ID).First(&saved).Error; err != nil {
		t.Fatal(err)
	}
	if saved.Status != "hadir_terlambat" || stringPointerValue(saved.Keterangan) != "Terlambat 10 menit (Piket) · Revisi kendala_teknis" {
		t.Fatalf("revised attendance = %q / %q, want late minutes, piket marker and revision reason", saved.Status, stringPointerValue(saved.Keterangan))
	}
}
