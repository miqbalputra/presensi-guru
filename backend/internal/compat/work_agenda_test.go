package compat

import (
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

func TestWorkAgendaDateControlsAllTeacherCheckInsAndCanBeRescheduled(t *testing.T) {
	h, app := rangeRecalculationFixture(t)
	if err := h.db.AutoMigrate(&models.OptionalWorkday{}, &models.PengaturanHarian{}); err != nil {
		t.Fatal(err)
	}
	app.All("/calendar", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: 1, Role: c.Get("X-Test-Role", "admin")})
		return h.holidays(c)
	})
	request := func(method, path, body string, want int) []byte {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		res, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var raw json.RawMessage
		if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
			t.Fatal(err)
		}
		if res.StatusCode != want {
			t.Fatalf("%s %s: status = %d, want %d; body = %s", method, path, res.StatusCode, want, raw)
		}
		return raw
	}
	date := func(value string) time.Time {
		parsed, err := parseDate(value, appLocation(h))
		if err != nil {
			t.Fatal(err)
		}
		return parsed
	}
	users := []models.User{
		{Username: "normal", Nama: "Normal", Role: "guru", TipeGuru: "full_time"},
		{Username: "piket", Nama: "Piket", Role: "guru", TipeGuru: "full_time"},
		{Username: "partime", Nama: "Partime", Role: "guru", TipeGuru: "partime"},
		{Username: "partime-piket", Nama: "Partime Piket", Role: "guru", TipeGuru: "partime"},
	}
	for i := range users {
		if err := h.db.Create(&users[i]).Error; err != nil {
			t.Fatal(err)
		}
		if i == 1 || i == 3 {
			if err := h.db.Create(&models.JadwalPiket{UserID: users[i].ID, Hari: "Rabu", JamPiket: pointerString("06:40"), IsActive: true}).Error; err != nil {
				t.Fatal(err)
			}
		}
	}
	for _, meetingDate := range []string{"2026-11-04", "2026-12-09"} {
		request("POST", "/calendar", fmt.Sprintf(`{"tanggal":%q,"nama":"Rapat Asatidz dan Karyawan","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:00"}`, meetingDate), 200)
	}
	settings, err := settingsMap(h.db)
	if err != nil {
		t.Fatal(err)
	}
	for _, user := range users {
		for _, meetingDate := range []string{"2026-11-04", "2026-12-09"} {
			target, label, err := h.checkInTarget(user.ID, date(meetingDate), settings)
			if err != nil || target != "07:00:00" || label != " (Event: Rapat Asatidz dan Karyawan)" {
				t.Fatalf("%s meeting target = %q / %q / %v", user.Username, target, label, err)
			}
			for _, tc := range []struct{ time, status, note string }{
				{"06:50", "hadir", ""},
				{"07:00", "hadir", ""},
				{"07:01", "hadir_terlambat", "Terlambat 1 menit (Event: Rapat Asatidz dan Karyawan)"},
			} {
				minutes, _ := timeToMinutes(tc.time)
				status, note := classifyCheckIn(user, date(meetingDate).Add(time.Duration(minutes)*time.Minute), target, label, "15", "")
				if status != tc.status || note != tc.note {
					t.Fatalf("%s at %s: got %q / %q, want %q / %q", user.Username, tc.time, status, note, tc.status, tc.note)
				}
			}
		}
	}
	// Another Wednesday in the same month keeps its original piket schedule.
	if target, _, err := h.checkInTarget(users[1].ID, date("2026-11-11"), settings); err != nil || target != "06:40:00" {
		t.Fatalf("non-meeting Wednesday target = %q / %v", target, err)
	}
	for _, regularDate := range []string{"2026-11-03", "2026-11-05"} {
		if target, _, err := h.checkInTarget(users[0].ID, date(regularDate), settings); err != nil || target != "07:20:00" {
			t.Fatalf("neighboring date %s target = %q / %v", regularDate, target, err)
		}
	}
	var checked struct {
		Data struct {
			IsWorkday bool    `json:"isWorkday"`
			IsHoliday bool    `json:"isHoliday"`
			Time      *string `json:"jamMasukKhusus"`
		} `json:"data"`
	}
	if err := json.Unmarshal(request("GET", "/calendar?check=2026-11-04", "", 200), &checked); err != nil || !checked.Data.IsWorkday || checked.Data.IsHoliday || stringPointerValue(checked.Data.Time) != "07:00:00" {
		t.Fatalf("meeting date unavailable for attendance: %#v / %v", checked, err)
	}
	var agenda models.Holiday
	if err := h.db.Where("tanggal >= ? AND tanggal < ?", date("2026-11-04"), date("2026-11-05")).First(&agenda).Error; err != nil {
		t.Fatal(err)
	}
	// The administrator can move a meeting and change its arrival time.
	request("PUT", "/calendar", fmt.Sprintf(`{"id":%d,"tanggal":"2026-11-11","nama":"Rapat Asatidz dan Karyawan","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:30"}`, agenda.ID), 200)
	if target, _, err := h.checkInTarget(users[1].ID, date("2026-11-04"), settings); err != nil || target != "06:40:00" {
		t.Fatalf("old meeting date did not revert to piket: %q / %v", target, err)
	}
	if target, _, err := h.checkInTarget(users[3].ID, date("2026-11-11"), settings); err != nil || target != "07:30:00" {
		t.Fatalf("rescheduled meeting target = %q / %v", target, err)
	}
	// Cancellation removes the dated override without changing attendance data.
	row := models.AttendanceLog{UserID: users[0].ID, Tanggal: date("2026-11-11"), Status: "hadir", JamMasuk: pointerString("07:20:00"), Keterangan: pointerString("Catatan admin")}
	if err := h.db.Create(&row).Error; err != nil {
		t.Fatal(err)
	}
	request("DELETE", fmt.Sprintf("/calendar?id=%d", agenda.ID), "", 200)
	if target, _, err := h.checkInTarget(users[1].ID, date("2026-11-11"), settings); err != nil || target != "06:40:00" {
		t.Fatalf("cancelled meeting target = %q / %v", target, err)
	}
	assertRecalculatedStatus(t, h.db, row.ID, "hadir")
	assertRecalculatedNote(t, h.db, row.ID, "Catatan admin")
	// The other month remains scheduled.
	if target, _, err := h.checkInTarget(users[1].ID, date("2026-12-09"), settings); err != nil || target != "07:00:00" {
		t.Fatalf("another month's meeting changed: %q / %v", target, err)
	}
}

func TestWorkAgendaRejectsInvalidTimesConflictingDatesAndUnauthorizedWrites(t *testing.T) {
	h, app := rangeRecalculationFixture(t)
	app.All("/calendar", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: 1, Role: c.Get("X-Test-Role", "admin")})
		return h.holidays(c)
	})
	date, _ := parseDate("2026-11-04", appLocation(h))
	holiday := models.Holiday{Tanggal: date, Nama: "Libur yang sudah disimpan", Jenis: "sekolah"}
	if err := h.db.Create(&holiday).Error; err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name, method, body, role string
		want                     int
	}{
		{"missing time", "POST", `{"tanggal":"2026-11-11","nama":"Rapat","jenis":"sekolah","isWorkday":1}`, "admin", 400},
		{"invalid time", "POST", `{"tanggal":"2026-11-11","nama":"Rapat","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:99"}`, "admin", 400},
		{"duplicate date", "POST", `{"tanggal":"2026-11-04","nama":"Rapat","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:00"}`, "admin", 409},
		{"invalid update time", "PUT", fmt.Sprintf(`{"id":%d,"tanggal":"2026-11-04","nama":"Rapat","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"bad"}`, holiday.ID), "admin", 400},
		{"teacher cannot schedule", "POST", `{"tanggal":"2026-11-11","nama":"Rapat","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:00"}`, "guru", 403},
		{"principal cannot schedule", "POST", `{"tanggal":"2026-11-11","nama":"Rapat","jenis":"sekolah","isWorkday":1,"jamMasukKhusus":"07:00"}`, "kepala_sekolah", 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/calendar", strings.NewReader(tc.body))
			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
			req.Header.Set("X-Test-Role", tc.role)
			res, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != tc.want {
				t.Fatalf("status = %d, want %d", res.StatusCode, tc.want)
			}
		})
	}
	var saved models.Holiday
	if err := h.db.First(&saved, holiday.ID).Error; err != nil || saved.Nama != holiday.Nama || saved.IsWorkday {
		t.Fatalf("existing holiday was overwritten: %#v / %v", saved, err)
	}
}

func TestGuruHomeShowsCurrentWorkAgendaInsteadOfPiket(t *testing.T) {
	h, app := rangeRecalculationFixture(t)
	if err := h.db.AutoMigrate(&models.OptionalWorkday{}, &models.PengaturanHarian{}); err != nil {
		t.Fatal(err)
	}
	user := models.User{Username: "partime", Nama: "Partime", Role: "guru", TipeGuru: "partime"}
	if err := h.db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	date, _ := parseDate(today(h), appLocation(h))
	for _, model := range []any{
		&models.Holiday{Tanggal: date, Nama: "Rapat Asatidz dan Karyawan", Jenis: "sekolah", IsWorkday: true, JamMasukKhusus: pointerString("07:00:00")},
		&models.JadwalPiket{UserID: user.ID, Hari: dayName(date.Weekday()), JamPiket: pointerString("06:40"), IsActive: true},
	} {
		if err := h.db.Create(model).Error; err != nil {
			t.Fatal(err)
		}
	}
	app.Get("/home", func(c *fiber.Ctx) error {
		c.Locals("db", h.db)
		c.Locals("authClaims", &auth.Claims{UserID: user.ID, Role: "guru"})
		return h.guruHome(c)
	})
	res, err := app.Test(httptest.NewRequest("GET", "/home", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		t.Fatalf("home status = %d", res.StatusCode)
	}
	var payload struct {
		Data struct {
			CheckinSchedule struct{ Time, Label string }
			Holiday         struct{ IsWorkday bool }
		}
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil || payload.Data.CheckinSchedule.Time != "07:00" || payload.Data.CheckinSchedule.Label != "Rapat Asatidz dan Karyawan" || !payload.Data.Holiday.IsWorkday {
		t.Fatalf("wrong teacher schedule: %#v / %v", payload, err)
	}
}
