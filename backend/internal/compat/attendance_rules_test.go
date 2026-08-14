package compat

import (
	"testing"
	"time"

	"github.com/griyaquran/geopresensi/backend/internal/models"
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
