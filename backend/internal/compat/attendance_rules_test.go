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

func TestLateMinutesForAttendanceUsesEffectivePiketTarget(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	if err := db.AutoMigrate(&models.Holiday{}, &models.JadwalPiket{}); err != nil {
		t.Fatalf("migrate database: %v", err)
	}
	piketTime, checkInTime := "07:00", "07:12"
	if err := db.Create(&models.JadwalPiket{UserID: 42, Hari: "Selasa", JamPiket: &piketTime, IsActive: true}).Error; err != nil {
		t.Fatalf("create piket schedule: %v", err)
	}

	minutes, err := (&Handler{db: db}).lateMinutesForAttendance(
		models.User{ID: 42},
		models.AttendanceLog{JamMasuk: &checkInTime},
		time.Date(2026, time.August, 18, 0, 0, 0, 0, time.UTC),
		map[string]string{"jam_masuk_normal": "07:20"},
	)
	if err != nil {
		t.Fatalf("calculate late minutes: %v", err)
	}
	if minutes == nil || *minutes != 12 {
		t.Fatalf("late minutes = %v, want 12", minutes)
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

func TestMondayCheckInUsesConfiguredPiketBeforeApelAndPartTimeRules(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.Holiday{}, &models.JadwalPiket{}); err != nil {
		t.Fatal(err)
	}
	piketTime := "06:40"
	for _, schedule := range []models.JadwalPiket{
		{UserID: 42, Hari: "Senin", JamPiket: &piketTime, IsActive: true},
		{UserID: 43, Hari: "Senin", JamPiket: &piketTime, IsActive: false},
		{UserID: 44, Hari: "Senin", IsActive: true},
	} {
		if err := db.Create(&schedule).Error; err != nil {
			t.Fatal(err)
		}
	}
	date := time.Date(2026, time.August, 17, 0, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	h := &Handler{db: db}
	for _, tc := range []struct {
		name, apel, teacherType, checkIn, target, label, status, note string
		userID                                                        uint
	}{
		{"piket before target", "1", "full_time", "06:39", "06:40:00", " (Piket)", "hadir", "", 42},
		{"piket at target", "1", "full_time", "06:40", "06:40:00", " (Piket)", "hadir", "", 42},
		{"piket one minute late", "1", "full_time", "06:41", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 1 menit (Piket)", 42},
		{"piket before apel", "1", "full_time", "06:50", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 10 menit (Piket)", 42},
		{"piket without apel", "0", "full_time", "06:50", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 10 menit (Piket)", 42},
		{"partime piket", "1", "partime", "06:50", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 10 menit (Piket)", 42},
		{"partime piket without apel", "0", "partime", "06:50", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 10 menit (Piket)", 42},
		{"late beyond tolerance", "1", "full_time", "07:01", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 21 menit (Parah) (Piket)", 42},
		{"inactive piket", "1", "full_time", "06:50", "07:00:00", " (Apel Senin)", "hadir", "", 43},
		{"apel at target", "1", "full_time", "07:00", "07:00:00", " (Apel Senin)", "hadir", "", 43},
		{"apel late", "1", "full_time", "07:01", "07:00:00", " (Apel Senin)", "hadir_terlambat", "Terlambat 1 menit (Apel Senin)", 43},
		{"partime apel late", "1", "partime", "07:01", "07:00:00", " (Apel Senin)", "hadir_terlambat", "Terlambat 1 menit (Apel Senin)", 43},
		{"partime normal hours remain flexible", "0", "partime", "08:00", "07:20:00", "", "hadir", "Guru Partime", 43},
		{"missing piket time uses default", "1", "full_time", "06:50", "06:40:00", " (Piket)", "hadir_terlambat", "Terlambat 10 menit (Piket)", 44},
	} {
		t.Run(tc.name, func(t *testing.T) {
			settings := map[string]string{"jam_masuk_normal": "07:20", "apel_senin_enabled": tc.apel, "jam_piket_default": "06:40", "toleransi_terlambat": "15", "piket_terlambat_adalah_terlambat": "0"}
			target, label, err := h.checkInTarget(tc.userID, date, settings)
			if err != nil {
				t.Fatal(err)
			}
			if target != tc.target || label != tc.label {
				t.Fatalf("target = (%q, %q), want (%q, %q)", target, label, tc.target, tc.label)
			}
			minutes, _ := timeToMinutes(tc.checkIn)
			user := models.User{ID: tc.userID, TipeGuru: tc.teacherType}
			checkedInAt := date.Add(time.Duration(minutes) * time.Minute)
			status, note := classifyCheckIn(user, checkedInAt, target, label, "15", "")
			if status != tc.status || note != tc.note {
				t.Fatalf("check-in = (%q, %q), want (%q, %q)", status, note, tc.status, tc.note)
			}
			storedTime := normalizeTime(tc.checkIn)
			derived, err := h.derivedAttendanceStatus(user, models.AttendanceLog{Status: "hadir", JamMasuk: &storedTime}, date, settings)
			if err != nil || derived != tc.status {
				t.Fatalf("derived status = %q, %v; want %q", derived, err, tc.status)
			}
		})
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
	status, note := classifyCheckIn(models.User{TipeGuru: "full_time"}, time.Date(2026, time.August, 18, 7, 1, 0, 0, time.UTC), target, label, "15", "")
	if status != "hadir_terlambat" || note != "Terlambat 1 menit (Piket)" {
		t.Fatalf("piket check in = (%q, %q), want (hadir_terlambat, Terlambat 1 menit (Piket))", status, note)
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

func TestCheckoutTargetUsesPiketScheduleAndDailyOverride(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	if err := db.AutoMigrate(&models.Holiday{}, &models.JadwalPiket{}, &models.PengaturanHarian{}); err != nil {
		t.Fatalf("migrate database: %v", err)
	}

	piketPulang := "13:00"
	if err := db.Create(&models.JadwalPiket{UserID: 42, Hari: "Selasa", JamPulangPiket: &piketPulang, IsActive: true}).Error; err != nil {
		t.Fatalf("create piket schedule: %v", err)
	}
	date := time.Date(2026, time.August, 18, 0, 0, 0, 0, time.UTC)
	overridePiket := "14:00"
	if err := db.Create(&models.PengaturanHarian{Tanggal: date, JamPulangPiketKhusus: &overridePiket, JamPulangPiketAktif: true}).Error; err != nil {
		t.Fatalf("create daily override: %v", err)
	}

	target, isPiket, err := (&Handler{db: db}).checkoutTarget(42, date, map[string]string{"jam_min_pulang": "12:30"})
	if err != nil {
		t.Fatalf("checkout target: %v", err)
	}
	if target != "14:00:00" || !isPiket {
		t.Fatalf("checkout target = (%q, %t), want (14:00:00, true)", target, isPiket)
	}
}
