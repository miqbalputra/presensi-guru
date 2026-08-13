package compat

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

const maxReportRangeDays = 366

func validReportRange(start, end time.Time) bool {
	return !end.Before(start) && end.Sub(start) <= time.Duration(maxReportRangeDays-1)*24*time.Hour
}

func dateRange(start, end time.Time) []time.Time {
	result := []time.Time{}
	for date := start; !date.After(end); date = date.AddDate(0, 0, 1) {
		result = append(result, date)
	}
	return result
}

type workdayCalendar struct {
	holidays map[string]models.Holiday
	optional map[string]struct{}
	settings map[string]string
}

// loadWorkdayCalendar collapses the per-user/per-day rule lookups used by
// reports into three bounded queries. The old implementation performed one
// holiday and one optional-workday query for every user/day combination.
func (h *Handler) loadWorkdayCalendar(start, end time.Time) (workdayCalendar, error) {
	calendar := workdayCalendar{holidays: map[string]models.Holiday{}, optional: map[string]struct{}{}}
	var holidays []models.Holiday
	if err := h.db.Where("tanggal BETWEEN ? AND ?", start.Format("2006-01-02"), end.Format("2006-01-02")).Find(&holidays).Error; err != nil {
		return calendar, err
	}
	for _, holiday := range holidays {
		calendar.holidays[holiday.Tanggal.Format("2006-01-02")] = holiday
	}
	var optional []models.OptionalWorkday
	if err := h.db.Where("tanggal BETWEEN ? AND ?", start.Format("2006-01-02"), end.Format("2006-01-02")).Find(&optional).Error; err != nil {
		return calendar, err
	}
	for _, row := range optional {
		calendar.optional[row.Tanggal.Format("2006-01-02")] = struct{}{}
	}
	settings, err := settingsMap(h.db)
	if err != nil {
		return calendar, err
	}
	calendar.settings = settings
	return calendar, nil
}

func (calendar workdayCalendar) isWorkday(user models.User, date time.Time) (bool, bool) {
	dateString := date.Format("2006-01-02")
	if _, ok := calendar.optional[dateString]; ok {
		return false, true
	}
	if holiday, ok := calendar.holidays[dateString]; ok {
		return holiday.IsWorkday, false
	}
	if date.Weekday() != time.Saturday && date.Weekday() != time.Sunday {
		return true, false
	}
	if calendar.settings["weekend_workday_enabled"] == "1" {
		return true, false
	}
	gender := ""
	if user.JenisKelamin != nil {
		gender = *user.JenisKelamin
	}
	if date.Weekday() == time.Saturday {
		return genderSetting(calendar.settings, "saturday", gender), false
	}
	return genderSetting(calendar.settings, "sunday", gender), false
}

func (h *Handler) isWorkday(user models.User, date time.Time) (bool, bool, error) {
	dateString := date.Format("2006-01-02")
	var holiday models.Holiday
	holidayQuery := h.db.Where("tanggal = ?", dateString).First(&holiday)
	if holidayQuery.Error != nil && !errors.Is(holidayQuery.Error, gorm.ErrRecordNotFound) {
		return false, false, holidayQuery.Error
	}
	var optional models.OptionalWorkday
	optionalQuery := h.db.Where("tanggal = ?", dateString).First(&optional)
	isOptional := optionalQuery.Error == nil
	if isOptional {
		return false, true, nil
	}
	if holidayQuery.Error == nil {
		return holiday.IsWorkday, false, nil
	}
	if date.Weekday() != time.Saturday && date.Weekday() != time.Sunday {
		return true, false, nil
	}
	settings, err := settingsMap(h.db)
	if err != nil {
		return false, false, err
	}
	if value := settings["weekend_workday_enabled"]; value == "1" {
		return true, false, nil
	}
	gender := ""
	if user.JenisKelamin != nil {
		gender = *user.JenisKelamin
	}
	if date.Weekday() == time.Saturday {
		return genderSetting(settings, "saturday", gender), false, nil
	}
	return genderSetting(settings, "sunday", gender), false, nil
}

func genderSetting(settings map[string]string, day, gender string) bool {
	suffix := "female"
	if gender == "Laki-laki" {
		suffix = "male"
	}
	return settings[day+"_"+suffix+"_workday_enabled"] == "1"
}

func (h *Handler) adminSummary(c *fiber.Ctx) error {
	period := c.Query("period", "today")
	now := time.Now().In(appLocation(h))
	start := now
	end := now
	switch period {
	case "yesterday":
		start, end = now.AddDate(0, 0, -1), now.AddDate(0, 0, -1)
	case "7days":
		start = now.AddDate(0, 0, -6)
	case "14days":
		start = now.AddDate(0, 0, -13)
	case "30days":
		start = now.AddDate(0, 0, -29)
	case "today":
	default:
		return invalid(c, "Period tidak valid")
	}
	start = dateOnly(start)
	end = dateOnly(end)
	calendar, err := h.loadWorkdayCalendar(start, end)
	if err != nil {
		return err
	}
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Find(&users).Error; err != nil {
		return err
	}
	var logs []models.AttendanceLog
	if err := h.db.Where("tanggal BETWEEN ? AND ?", start.Format("2006-01-02"), end.Format("2006-01-02")).Order("tanggal DESC, id DESC").Find(&logs).Error; err != nil {
		return err
	}
	stats := map[string]int{"hadir": 0, "izin": 0, "sakit": 0, "alfa": 0}
	byUserDate := map[string]models.AttendanceLog{}
	for _, log := range logs {
		byUserDate[fmt.Sprintf("%d:%s", log.UserID, log.Tanggal.Format("2006-01-02"))] = log
	}
	expected := 0
	for _, user := range users {
		for _, date := range dateRange(start, end) {
			workday, _ := calendar.isWorkday(user, date)
			if !workday {
				continue
			}
			expected++
			log, ok := byUserDate[fmt.Sprintf("%d:%s", user.ID, date.Format("2006-01-02"))]
			if !ok {
				continue
			}
			switch {
			case contains([]string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}, log.Status):
				stats["hadir"]++
			case log.Status == "izin":
				stats["izin"]++
			case log.Status == "sakit":
				stats["sakit"]++
			}
		}
	}
	stats["alfa"] = maxInt(expected-stats["hadir"]-stats["izin"]-stats["sakit"], 0)
	missing := []map[string]any{}
	todayString := now.Format("2006-01-02")
	for _, user := range users {
		workday, _ := calendar.isWorkday(user, dateOnly(now))
		if !workday {
			continue
		}
		if _, ok := byUserDate[fmt.Sprintf("%d:%s", user.ID, todayString)]; !ok {
			missing = append(missing, mapUser(user))
		}
	}
	dataLogs := make([]map[string]any, 0, len(logs))
	for _, log := range logs {
		dataLogs = append(dataLogs, mapAttendance(log))
	}
	return httpx.Success(c, "Ringkasan dashboard berhasil diambil", fiber.Map{"period": period, "startDate": start.Format("2006-01-02"), "endDate": end.Format("2006-01-02"), "totalGuru": len(users), "totalHariAktif": workingDayCount(users, start, end, calendar), "stats": stats, "belumPresensiHariIni": missing, "logs": dataLogs})
}

func workingDayCount(users []models.User, start, end time.Time, calendar workdayCalendar) int {
	count := 0
	for _, date := range dateRange(start, end) {
		for _, user := range users {
			if ok, _ := calendar.isWorkday(user, date); ok {
				count++
				break
			}
		}
	}
	return count
}

func (h *Handler) adminCharts(c *fiber.Ctx) error {
	chart := c.Query("chart", "overview")
	if chart == "overview" {
		return h.overviewChart(c)
	}
	if chart == "leaderboard" {
		return h.leaderboardChart(c)
	}
	if chart == "checkout" {
		return h.checkoutChart(c)
	}
	if chart == "complete_stats" {
		return h.completeStatsChart(c)
	}
	return invalid(c, "Chart tidak valid")
}

func (h *Handler) overviewChart(c *fiber.Ctx) error {
	now := dateOnly(time.Now().In(appLocation(h)))
	start := now.AddDate(0, 0, -6)
	calendar, err := h.loadWorkdayCalendar(start, now)
	if err != nil {
		return err
	}
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Find(&users).Error; err != nil {
		return err
	}
	var logs []models.AttendanceLog
	if err := h.db.Where("tanggal BETWEEN ? AND ?", start.Format("2006-01-02"), now.Format("2006-01-02")).Find(&logs).Error; err != nil {
		return err
	}
	logsByDateUser := map[string]models.AttendanceLog{}
	for _, log := range logs {
		logsByDateUser[fmt.Sprintf("%s:%d", log.Tanggal.Format("2006-01-02"), log.UserID)] = log
	}
	trend := []map[string]any{}
	for _, date := range dateRange(start, now) {
		hadir, tidak := 0, 0
		for _, user := range users {
			workday, _ := calendar.isWorkday(user, date)
			if !workday {
				continue
			}
			log, ok := logsByDateUser[fmt.Sprintf("%s:%d", date.Format("2006-01-02"), user.ID)]
			if !ok {
				tidak++
			} else if contains([]string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}, log.Status) {
				hadir++
			} else {
				tidak++
			}
		}
		trend = append(trend, map[string]any{"tanggal": dayLabel(date), "date": date.Format("2006-01-02"), "hadir": hadir, "tidakHadir": tidak})
	}
	stats := map[string]int{"hadir": 0, "izin": 0, "sakit": 0, "alfa": 0}
	for _, log := range logs {
		if log.Tanggal.Format("2006-01-02") != now.Format("2006-01-02") {
			continue
		}
		if contains([]string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}, log.Status) {
			stats["hadir"]++
		} else if log.Status == "izin" {
			stats["izin"]++
		} else if log.Status == "sakit" {
			stats["sakit"]++
		}
	}
	stats["alfa"] = maxInt(len(users)-stats["hadir"]-stats["izin"]-stats["sakit"], 0)
	return httpx.Success(c, "Chart overview berhasil diambil", fiber.Map{"trend7Days": trend, "todayStats": stats, "totalGuru": len(users)})
}

func (h *Handler) leaderboardChart(c *fiber.Ctx) error {
	start, end := periodDates(c.Query("period", "month"), c.Query("start_date"), c.Query("end_date"), h)
	if !validReportRange(start, end) {
		return invalid(c, "Rentang laporan maksimal 366 hari dan tanggal akhir harus setelah tanggal awal")
	}
	calendar, err := h.loadWorkdayCalendar(start, end)
	if err != nil {
		return err
	}
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Find(&users).Error; err != nil {
		return err
	}
	var logs []models.AttendanceLog
	if err := h.db.Where("tanggal BETWEEN ? AND ?", start.Format("2006-01-02"), end.Format("2006-01-02")).Find(&logs).Error; err != nil {
		return err
	}
	logsByUserDate := map[string]models.AttendanceLog{}
	for _, log := range logs {
		logsByUserDate[fmt.Sprintf("%d:%s", log.UserID, log.Tanggal.Format("2006-01-02"))] = log
	}
	rows := []map[string]any{}
	for _, user := range users {
		workdays := 0
		hadir, izin, sakit := 0, 0, 0
		for _, date := range dateRange(start, end) {
			ok, _ := calendar.isWorkday(user, date)
			if !ok {
				continue
			}
			workdays++
			log, ok := logsByUserDate[fmt.Sprintf("%d:%s", user.ID, date.Format("2006-01-02"))]
			if !ok {
				continue
			}
			switch {
			case contains([]string{"hadir", "hadir_terlambat", "hadir_izin_terlambat"}, log.Status):
				hadir++
			case log.Status == "izin":
				izin++
			case log.Status == "sakit":
				sakit++
			}
		}
		pct := 0.0
		if workdays > 0 {
			pct = float64(hadir) / float64(workdays) * 100
		}
		rows = append(rows, map[string]any{"id": user.ID, "nama": user.Nama, "persentaseKehadiran": fmt.Sprintf("%.1f", pct), "skor": fmt.Sprintf("%.1f", pct), "hadir": hadir, "izin": izin, "sakit": sakit, "alfa": maxInt(workdays-hadir-izin-sakit, 0), "totalHari": workdays})
	}
	sort.Slice(rows, func(i, j int) bool {
		return fmt.Sprint(rows[i]["persentaseKehadiran"]) > fmt.Sprint(rows[j]["persentaseKehadiran"])
	})
	return httpx.Success(c, "Leaderboard berhasil diambil", rows)
}

func (h *Handler) checkoutChart(c *fiber.Ctx) error {
	startA, endA := c.Query("startA"), c.Query("endA")
	startB, endB := c.Query("startB"), c.Query("endB")
	if startA == "" || endA == "" {
		return invalid(c, "Periode A wajib diisi")
	}
	if startB == "" || endB == "" {
		startB, endB = startA, endA
	}
	startADate, endADate, err := parseReportRange(startA, endA, appLocation(h))
	if err != nil || !validReportRange(startADate, endADate) {
		return invalid(c, "Rentang periode A maksimal 366 hari dan harus valid")
	}
	startBDate, endBDate, err := parseReportRange(startB, endB, appLocation(h))
	if err != nil || !validReportRange(startBDate, endBDate) {
		return invalid(c, "Rentang periode B maksimal 366 hari dan harus valid")
	}
	a, err := h.checkoutPeriod(startA, endA)
	if err != nil {
		return err
	}
	b, err := h.checkoutPeriod(startB, endB)
	if err != nil {
		return err
	}
	return httpx.Success(c, "Analisis checkout berhasil diambil", fiber.Map{"periodA": a, "periodB": b, "compare": []any{}, "guru": []any{}})
}

func (h *Handler) checkoutPeriod(start, end string) (map[string]any, error) {
	var rows []models.AttendanceLog
	if err := h.db.Select("tanggal, status, jam_pulang").Where("tanggal BETWEEN ? AND ?", start, end).Order("tanggal ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	rowsByDate := map[string][]models.AttendanceLog{}
	for _, log := range rows {
		key := log.Tanggal.Format("2006-01-02")
		rowsByDate[key] = append(rowsByDate[key], log)
	}
	result := []map[string]any{}
	normal, early, forgotten := 0, 0, 0
	for _, date := range dateRange(parseDateLoose(start), parseDateLoose(end)) {
		row := map[string]any{"tanggal": date.Format("2006-01-02"), "normal": 0, "early": 0, "forgotten": 0, "avgMinutes": nil}
		for _, log := range rowsByDate[row["tanggal"].(string)] {
			if !strings.HasPrefix(log.Status, "hadir") {
				continue
			}
			if log.JamPulang == nil || *log.JamPulang == "" || *log.JamPulang == "-" {
				if date.Before(dateOnly(time.Now().In(time.Local))) {
					row["forgotten"] = row["forgotten"].(int) + 1
					forgotten++
				}
			} else {
				row["normal"] = row["normal"].(int) + 1
				normal++
			}
		}
		result = append(result, row)
	}
	total := normal + early + forgotten
	pct := "0.0"
	if total > 0 {
		pct = fmt.Sprintf("%.1f", float64(forgotten)/float64(total)*100)
	}
	return map[string]any{"rows": result, "reasons": []any{}, "summary": map[string]any{"normal": normal, "early": early, "forgotten": forgotten, "avgMins": nil, "pctForgotten": pct}}, nil
}

func (h *Handler) completeStatsChart(c *fiber.Ctx) error {
	days := c.QueryInt("days", 30)
	if days < 1 || days > 365 {
		days = 30
	}
	return httpx.Success(c, "Statistik lengkap berhasil diambil", fiber.Map{"lateStats": fiber.Map{"totalLatePct": "0.0", "statsPerGuru": []any{}, "totalLate": 0}, "latePiket": []any{}, "earlyCheckouts": []any{}, "izinSakit": []any{}, "forgotten": []any{}, "days": days})
}

func (h *Handler) teacherWorkdays(c *fiber.Ctx) error {
	claims, err := userClaims(c)
	if err != nil {
		return err
	}
	userID, err := queryUint(c, "user_id")
	if claims.Role == "guru" {
		userID = claims.UserID
	}
	if err != nil && claims.Role != "guru" {
		return invalid(c, "user_id harus diisi")
	}
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return httpx.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User tidak ditemukan")
	}
	startValue := c.Query("start_date", time.Now().In(appLocation(h)).Format("2006-01-01"))
	endValue := c.Query("end_date", startValue)
	start, err := parseDate(startValue, appLocation(h))
	if err != nil {
		return invalid(c, "Format start_date tidak valid")
	}
	end, err := parseDate(endValue, appLocation(h))
	if err != nil || end.Before(start) {
		return invalid(c, "Rentang tanggal tidak valid")
	}
	if !validReportRange(start, end) {
		return invalid(c, "Rentang tanggal maksimal 366 hari")
	}
	calendar, err := h.loadWorkdayCalendar(start, end)
	if err != nil {
		return err
	}
	workdays, optional, nonWorkdays := []string{}, []string{}, []string{}
	breakdown := []map[string]any{}
	for _, date := range dateRange(start, end) {
		isWorkday, isOptional := calendar.isWorkday(user, date)
		item := map[string]any{"tanggal": date.Format("2006-01-02"), "day_of_week": int(date.Weekday()), "is_weekend": date.Weekday() == time.Saturday || date.Weekday() == time.Sunday, "is_workday": isWorkday, "is_optional": isOptional, "override": nil}
		breakdown = append(breakdown, item)
		if isWorkday {
			workdays = append(workdays, item["tanggal"].(string))
		} else if isOptional {
			optional = append(optional, item["tanggal"].(string))
		} else {
			nonWorkdays = append(nonWorkdays, item["tanggal"].(string))
		}
	}
	return httpx.Success(c, "Data hari kerja berhasil diambil", fiber.Map{"user_id": userID, "gender": user.JenisKelamin, "start_date": startValue, "end_date": endValue, "total_workdays": len(workdays), "workday_dates": workdays, "non_workday_dates": nonWorkdays, "optional_dates": optional, "optional_workdays": optional, "breakdown": breakdown})
}

func (h *Handler) teachersWorkdays(c *fiber.Ctx) error {
	startValue := c.Query("start_date", time.Now().In(appLocation(h)).Format("2006-01-01"))
	endValue := c.Query("end_date", startValue)
	start, err := parseDate(startValue, appLocation(h))
	if err != nil {
		return invalid(c, "Format start_date tidak valid")
	}
	end, err := parseDate(endValue, appLocation(h))
	if err != nil || end.Before(start) {
		return invalid(c, "Rentang tanggal tidak valid")
	}
	if !validReportRange(start, end) {
		return invalid(c, "Rentang tanggal maksimal 366 hari")
	}
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Find(&users).Error; err != nil {
		return err
	}
	calendar, err := h.loadWorkdayCalendar(start, end)
	if err != nil {
		return err
	}
	teachers := map[string]any{}
	for _, user := range users {
		// Reuse the same shape used by the singular endpoint.
		dates := []string{}
		for _, date := range dateRange(start, end) {
			if workday, _ := calendar.isWorkday(user, date); workday {
				dates = append(dates, date.Format("2006-01-02"))
			}
		}
		teachers[fmt.Sprint(user.ID)] = map[string]any{"user_id": user.ID, "workday_dates": dates, "total_workdays": len(dates)}
	}
	return httpx.Success(c, "Data hari kerja semua guru berhasil diambil", fiber.Map{"start_date": startValue, "end_date": endValue, "teachers": teachers, "optional_dates": []string{}})
}

func periodDates(period, startValue, endValue string, h *Handler) (time.Time, time.Time) {
	now := dateOnly(time.Now().In(appLocation(h)))
	if startValue != "" && endValue != "" {
		start, errStart := parseDate(startValue, appLocation(h))
		end, errEnd := parseDate(endValue, appLocation(h))
		if errStart == nil && errEnd == nil {
			return start, end
		}
	}
	switch period {
	case "7days":
		return now.AddDate(0, 0, -6), now
	case "14days":
		return now.AddDate(0, 0, -13), now
	case "30days", "month":
		return now.AddDate(0, 0, -29), now
	default:
		return now, now
	}
}

func parseDateLoose(value string) time.Time {
	parsed, _ := time.Parse("2006-01-02", value)
	return parsed
}

func parseReportRange(start, end string, location *time.Location) (time.Time, time.Time, error) {
	startDate, err := parseDate(start, location)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	endDate, err := parseDate(end, location)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	return startDate, endDate, nil
}

func dateOnly(value time.Time) time.Time {
	y, m, d := value.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, value.Location())
}

func dayLabel(date time.Time) string {
	labels := []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}
	return labels[int(date.Weekday())] + " " + fmt.Sprintf("%d/%d", date.Day(), int(date.Month()))
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
