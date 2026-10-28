package compat

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/config"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

func rangeRecalculationFixture(t *testing.T) (*Handler, *fiber.App) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "-")+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.AttendanceLog{}, &models.Setting{}, &models.Holiday{}, &models.JadwalPiket{}, &models.ActivityLog{}); err != nil {
		t.Fatal(err)
	}
	admin := models.User{Username: "admin", Nama: "Admin", Role: "admin"}
	if err := db.Create(&admin).Error; err != nil {
		t.Fatal(err)
	}
	for _, setting := range []models.Setting{{Key: "jam_masuk_normal", Value: "07:20"}, {Key: "toleransi_terlambat", Value: "15"}, {Key: "apel_senin_enabled", Value: "1"}} {
		if err := db.Create(&setting).Error; err != nil {
			t.Fatal(err)
		}
	}
	cfg := config.Config{AppTimezone: "Asia/Jakarta"}
	h := NewHandler(db, cfg, auth.NewJWTManager(cfg))
	app := fiber.New()
	app.All("/recalculate", func(c *fiber.Ctx) error {
		c.Locals("authClaims", &auth.Claims{UserID: admin.ID, Role: c.Get("X-Test-Role", "admin")})
		return h.todayCheckInRecalculation(c)
	})
	return h, app
}

func TestBulkCheckInRecalculationFiltersTuesdayThroughFridayAndPreservesData(t *testing.T) {
	h, app := rangeRecalculationFixture(t)
	date := func(value string) time.Time {
		parsed, err := parseDate(value, appLocation(h))
		if err != nil {
			t.Fatal(err)
		}
		return parsed
	}
	normal := models.User{Username: "normal", Nama: "Normal", Role: "guru", TipeGuru: "full_time"}
	piket := models.User{Username: "partime", Nama: "Partime Piket", Role: "guru", TipeGuru: "partime"}
	for _, user := range []*models.User{&normal, &piket} {
		if err := h.db.Create(user).Error; err != nil {
			t.Fatal(err)
		}
	}
	for _, day := range []string{"Selasa", "Rabu", "Kamis", "Jumat"} {
		if err := h.db.Create(&models.JadwalPiket{UserID: piket.ID, Hari: day, JamPiket: pointerString("06:40"), IsActive: true}).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := h.db.Create(&models.Holiday{Tanggal: date("2026-09-09"), Nama: "Rapat", IsWorkday: true, JamMasukKhusus: pointerString("08:00")}).Error; err != nil {
		t.Fatal(err)
	}
	latitude, longitude := -7.4, 109.3
	for day := date("2026-09-06"); !day.After(date("2026-09-19")); day = day.AddDate(0, 0, 1) {
		for _, user := range []models.User{normal, piket} {
			checkIn := "07:25:00"
			if user.ID == piket.ID {
				checkIn = "06:50:00"
			}
			status := "hadir"
			if day.Format("2006-01-02") == "2026-09-08" && user.ID == normal.ID {
				status = "hadir_terlambat" // Same status, but missing the automatic delay note.
			}
			row := models.AttendanceLog{UserID: user.ID, Nama: user.Nama, Tanggal: day, Status: status, JamMasuk: pointerString(checkIn), JamHadir: pointerString(checkIn), JamPulang: pointerString("13:00:00"), Keterangan: pointerString("Catatan admin"), Latitude: &latitude, Longitude: &longitude, Metode: "qr_scan"}
			if err := h.db.Create(&row).Error; err != nil {
				t.Fatal(err)
			}
		}
	}
	for _, status := range []string{"izin", "sakit", "hadir"} {
		user := models.User{Username: status, Nama: status, Role: "guru"}
		if err := h.db.Create(&user).Error; err != nil {
			t.Fatal(err)
		}
		if err := h.db.Create(&models.AttendanceLog{UserID: user.ID, Nama: user.Nama, Tanggal: date("2026-09-08"), Status: status, Keterangan: pointerString("Catatan tetap")}).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := h.db.Create(&models.AttendanceLog{UserID: 9999, Tanggal: date("2026-09-08"), Status: "hadir", JamMasuk: pointerString("07:25:00")}).Error; err != nil {
		t.Fatal(err)
	}
	var original []models.AttendanceLog
	if err := h.db.Order("id").Find(&original).Error; err != nil {
		t.Fatal(err)
	}
	var queryCount atomic.Int64
	if err := h.db.Callback().Query().After("gorm:query").Register("count_bulk_queries", func(*gorm.DB) { queryCount.Add(1) }); err != nil {
		t.Fatal(err)
	}
	request := func(method string) todayCheckInRecalculationResponse {
		t.Helper()
		req := httptest.NewRequest(method, "/recalculate?start_date=2026-09-07&end_date=2026-09-18&weekdays=2,3,4,5", nil)
		if method == fiber.MethodPost {
			req = httptest.NewRequest(method, "/recalculate", strings.NewReader(`{"start_date":"2026-09-07","end_date":"2026-09-18","weekdays":[2,3,4,5]}`))
			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		}
		res, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		if res.StatusCode != fiber.StatusOK {
			t.Fatalf("%s status = %d", method, res.StatusCode)
		}
		var payload struct {
			Data todayCheckInRecalculationResponse `json:"data"`
		}
		if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
			t.Fatal(err)
		}
		return payload.Data
	}
	preview := request(fiber.MethodGet)
	if queries := queryCount.Load(); queries > 8 {
		t.Fatalf("bulk preview used %d queries; rules must be loaded together", queries)
	}
	if preview.StartDate != "2026-09-07" || preview.EndDate != "2026-09-18" || preview.SelectedDays != 8 || preview.Processed != 18 || preview.Changed != 14 || preview.SkippedNoTime != 1 || preview.SkippedNoUser != 1 {
		t.Fatalf("unexpected bulk preview: %#v", preview)
	}
	if preview.Days[0].Date != "2026-09-08" || preview.Days[7].Date != "2026-09-18" || preview.Days[1].Changed != 0 {
		t.Fatalf("wrong selected dates or special-workday result: %#v", preview.Days)
	}
	var afterPreview []models.AttendanceLog
	if err := h.db.Order("id").Find(&afterPreview).Error; err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(original, afterPreview) {
		t.Fatal("preview mutated stored attendance")
	}
	request(fiber.MethodPost)
	for _, before := range original {
		var saved models.AttendanceLog
		if err := h.db.First(&saved, before.ID).Error; err != nil {
			t.Fatal(err)
		}
		key := before.Tanggal.Format("2006-01-02")
		weekday := before.Tanggal.Weekday()
		if key >= "2026-09-07" && key <= "2026-09-18" && weekday >= time.Tuesday && weekday <= time.Friday && key != "2026-09-09" && (before.UserID == normal.ID || before.UserID == piket.ID) {
			before.Status = "hadir_terlambat"
			note := "Catatan admin | Terlambat 5 menit"
			if before.UserID == piket.ID {
				note = "Catatan admin | Terlambat 10 menit (Piket)"
			}
			before.Keterangan = &note
		}
		saved.UpdatedAt = before.UpdatedAt
		if !reflect.DeepEqual(saved, before) {
			t.Fatalf("record %d changed beyond its permitted status/note correction:\n got %#v\nwant %#v", before.ID, saved, before)
		}
	}
	if again := request(fiber.MethodPost); again.Changed != 0 {
		t.Fatalf("second bulk correction still changes %d records", again.Changed)
	}
	var audit []models.ActivityLog
	if err := h.db.Find(&audit).Error; err != nil || len(audit) != 1 || !strings.Contains(audit[0].Status, "2026-09-07 s.d. 2026-09-18") || !strings.Contains(audit[0].Status, "Selasa, Rabu, Kamis, Jumat") {
		t.Fatalf("missing bulk correction audit: %#v / %v", audit, err)
	}
}

func TestBulkCheckInRecalculationValidationAndAuthorization(t *testing.T) {
	_, app := rangeRecalculationFixture(t)
	for _, tc := range []struct {
		name, method, path, body, role string
		want                           int
	}{
		{"default weekdays", "GET", "?start_date=2026-09-07&end_date=2026-09-18", "", "admin", 200},
		{"one weekday", "GET", "?start_date=2026-09-07&end_date=2026-09-18&weekdays=3,3", "", "admin", 200},
		{"legacy Monday", "GET", "?date=2026-09-07", "", "admin", 200},
		{"legacy tanggal", "POST", "", `{"tanggal":"2026-09-07"}`, "admin", 200},
		{"no matching weekday", "GET", "?start_date=2026-09-12&end_date=2026-09-13", "", "admin", 200},
		{"366 days inclusive", "GET", "?start_date=2024-01-01&end_date=2024-12-31", "", "admin", 200},
		{"missing end", "GET", "?start_date=2026-09-07", "", "admin", 400},
		{"reversed", "GET", "?start_date=2026-09-18&end_date=2026-09-07", "", "admin", 400},
		{"bad date", "GET", "?start_date=2026-02-30&end_date=2026-09-07", "", "admin", 400},
		{"future", "GET", "?start_date=2026-09-07&end_date=2099-01-01", "", "admin", 400},
		{"too long", "GET", "?start_date=2024-01-01&end_date=2025-01-01", "", "admin", 400},
		{"mixed date and range", "GET", "?date=2026-09-08&start_date=2026-09-07&end_date=2026-09-18", "", "admin", 400},
		{"empty GET weekdays", "GET", "?start_date=2026-09-07&end_date=2026-09-18&weekdays=", "", "admin", 400},
		{"invalid weekday", "GET", "?start_date=2026-09-07&end_date=2026-09-18&weekdays=7", "", "admin", 400},
		{"negative weekday", "GET", "?start_date=2026-09-07&end_date=2026-09-18&weekdays=-1", "", "admin", 400},
		{"empty POST weekdays", "POST", "", `{"start_date":"2026-09-07","end_date":"2026-09-18","weekdays":[]}`, "admin", 400},
		{"fractional weekday", "POST", "", `{"start_date":"2026-09-07","end_date":"2026-09-18","weekdays":[2.5]}`, "admin", 400},
		{"string weekdays", "POST", "", `{"start_date":"2026-09-07","end_date":"2026-09-18","weekdays":"2,3"}`, "admin", 400},
		{"teacher preview", "GET", "?start_date=2026-09-07&end_date=2026-09-18", "", "guru", 403},
		{"principal apply", "POST", "", `{"start_date":"2026-09-07","end_date":"2026-09-18"}`, "kepala_sekolah", 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/recalculate"+tc.path, strings.NewReader(tc.body))
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
			if tc.want == 200 {
				var payload struct {
					Data todayCheckInRecalculationResponse `json:"data"`
				}
				if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
					t.Fatal(err)
				}
				if tc.name == "default weekdays" && !reflect.DeepEqual(payload.Data.Weekdays, []int{2, 3, 4, 5}) || tc.name == "one weekday" && payload.Data.SelectedDays != 2 || tc.name == "legacy Monday" && payload.Data.SelectedDays != 1 || tc.name == "no matching weekday" && payload.Data.SelectedDays != 0 {
					t.Fatalf("unexpected date/weekday selection: %#v", payload.Data)
				}
			}
		})
	}
}

func TestBulkCheckInRecalculationRollsBackIfCheckInChanges(t *testing.T) {
	h, _ := rangeRecalculationFixture(t)
	user := models.User{Username: "teacher", Nama: "Teacher", Role: "guru", TipeGuru: "full_time"}
	if err := h.db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	start, _ := parseDate("2026-09-08", appLocation(h))
	end := start.AddDate(0, 0, 1)
	rows := []models.AttendanceLog{
		{UserID: user.ID, Tanggal: start, Status: "hadir", JamMasuk: pointerString("07:25:00")},
		{UserID: user.ID, Tanggal: end, Status: "hadir", JamMasuk: pointerString("07:25:00")},
	}
	if err := h.db.Create(&rows).Error; err != nil {
		t.Fatal(err)
	}
	settings, err := settingsMap(h.db)
	if err != nil {
		t.Fatal(err)
	}
	preview, err := h.checkInRecalculationPreview(checkInRecalculationSelection{Start: start, End: end, Weekdays: []int{2, 3}, Dates: []time.Time{start, end}}, settings)
	if err != nil || preview.Changed != 2 {
		t.Fatalf("preview = %#v / %v", preview, err)
	}
	if err := h.db.Model(&rows[1]).Update("jam_masuk", "07:15:00").Error; err != nil {
		t.Fatal(err)
	}
	if err := h.applyCheckInRecalculation(preview); !errors.Is(err, errTodayCheckInRecalculationStale) {
		t.Fatalf("apply = %v, want stale attendance error", err)
	}
	assertRecalculatedStatus(t, h.db, rows[0].ID, "hadir")
	assertRecalculatedNote(t, h.db, rows[0].ID, "")
	assertRecalculatedStatus(t, h.db, rows[1].ID, "hadir")
	var saved models.AttendanceLog
	if err := h.db.First(&saved, rows[1].ID).Error; err != nil || stringPointerValue(saved.JamMasuk) != "07:15:00" {
		t.Fatalf("concurrent correction was lost: %#v / %v", saved, err)
	}
}
