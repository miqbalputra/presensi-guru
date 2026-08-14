package compat

import (
	"strings"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/griyaquran/geopresensi/backend/internal/models"
	"gorm.io/gorm"
)

func TestClassifyCheckInMarksLateAfterConfiguredTime(t *testing.T) {
	user := models.User{TipeGuru: "full_time"}
	checkedInAt := time.Date(2026, time.August, 14, 7, 24, 49, 0, time.FixedZone("WIB", 7*60*60))

	status, note := classifyCheckIn(user, checkedInAt, "07:20", "", "15", "")
	if status != "hadir_terlambat" {
		t.Fatalf("status = %q, want hadir_terlambat", status)
	}
	if note != "Terlambat 4 menit" {
		t.Fatalf("note = %q, want late-minute explanation", note)
	}
}

func TestClassifyCheckInKeepsLegacyPartTimeException(t *testing.T) {
	user := models.User{TipeGuru: "partime"}
	checkedInAt := time.Date(2026, time.August, 14, 8, 0, 0, 0, time.FixedZone("WIB", 7*60*60))

	status, note := classifyCheckIn(user, checkedInAt, "07:20", "", "15", "")
	if status != "hadir" || note != "Guru Partime" {
		t.Fatalf("part-time result = (%q, %q), want (hadir, Guru Partime)", status, note)
	}
}

func TestCheckInTargetUsesOnlyActivePiketSchedule(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	if err := db.AutoMigrate(&models.Holiday{}, &models.JadwalPiket{}); err != nil {
		t.Fatalf("migrate database: %v", err)
	}

	inactiveTime := "06:45"
	activeTime := "07:00"
	for _, schedule := range []models.JadwalPiket{
		{UserID: 42, Hari: "Selasa", JamPiket: &inactiveTime, IsActive: false},
		{UserID: 42, Hari: "Selasa", JamPiket: &activeTime, IsActive: true},
	} {
		if err := db.Create(&schedule).Error; err != nil {
			t.Fatalf("create piket schedule: %v", err)
		}
	}

	h := &Handler{db: db}
	target, label, err := h.checkInTarget(42, time.Date(2026, time.August, 18, 0, 0, 0, 0, time.UTC), map[string]string{
		"jam_masuk_normal": "07:20",
	})
	if err != nil {
		t.Fatalf("check in target: %v", err)
	}
	if target != "07:00:00" || label != " (Piket)" {
		t.Fatalf("piket target = (%q, %q), want (07:00:00,  (Piket))", target, label)
	}
}

func TestDerivedAttendanceStatusMarksStoredHadirLate(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	if err := db.AutoMigrate(&models.Holiday{}, &models.JadwalPiket{}); err != nil {
		t.Fatalf("migrate database: %v", err)
	}

	h := &Handler{db: db}
	checkInTime := "07:24:49"
	status, err := h.derivedAttendanceStatus(
		models.User{ID: 42, TipeGuru: "full_time"},
		models.AttendanceLog{Status: "hadir", JamMasuk: &checkInTime},
		time.Date(2026, time.August, 14, 0, 0, 0, 0, time.FixedZone("WIB", 7*60*60)),
		map[string]string{"jam_masuk_normal": "07:20", "toleransi_terlambat": "15"},
	)
	if err != nil {
		t.Fatalf("derive attendance status: %v", err)
	}
	if status != "hadir_terlambat" {
		t.Fatalf("status = %q, want hadir_terlambat", status)
	}
}
