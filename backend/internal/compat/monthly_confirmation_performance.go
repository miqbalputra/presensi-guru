package compat

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
	"gorm.io/gorm"
)

const monthlyPerformanceWebhookTimeout = 8 * time.Second

func (h *Handler) n8nMonthlyPerformanceReport(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet {
		return fiber.ErrMethodNotAllowed
	}

	userID, err := queryUint(c, "user_id")
	if err != nil {
		return invalid(c, "user_id wajib diisi dan harus valid")
	}
	location := appLocation(h)
	periodStart, err := parseDate(c.Query("period_start"), location)
	if err != nil {
		return invalid(c, "period_start harus berformat YYYY-MM-01")
	}
	periodStart = dateOnly(periodStart)
	if periodStart.Day() != 1 {
		return invalid(c, "period_start harus merupakan tanggal pertama bulan")
	}

	var teacher models.User
	if err := h.db.Where("id = ? AND role = ? AND archived_at IS NULL", userID, "guru").First(&teacher).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return httpx.Error(c, fiber.StatusNotFound, "TEACHER_NOT_FOUND", "Guru aktif tidak ditemukan")
	} else if err != nil {
		return err
	}

	confirmation, err := h.findMonthlyConfirmation(teacher.ID, periodStart)
	if err != nil {
		return err
	}
	if confirmation == nil || confirmation.Status != monthlyConfirmationStatusConfirmed {
		return httpx.Error(c, fiber.StatusConflict, "MONTHLY_CONFIRMATION_NOT_CONFIRMED", "Laporan hanya tersedia setelah guru menyetujui rekap presensi")
	}
	if confirmation.Snapshot == nil || strings.TrimSpace(*confirmation.Snapshot) == "" {
		return httpx.Error(c, fiber.StatusConflict, "MONTHLY_CONFIRMATION_SNAPSHOT_MISSING", "Snapshot rekap presensi tidak tersedia")
	}

	var report struct {
		Rows []map[string]any `json:"rows"`
	}
	if err := json.Unmarshal([]byte(*confirmation.Snapshot), &report); err != nil {
		return fmt.Errorf("snapshot rekap presensi tidak valid: %w", err)
	}
	if teacher.Email == nil || normalizeReminderEmail(*teacher.Email) == "" {
		return httpx.Error(c, fiber.StatusConflict, "TEACHER_EMAIL_MISSING", "Email guru belum diisi atau tidak valid")
	}

	performance, err := h.monthlyPerformanceSummary(teacher, report.Rows)
	if err != nil {
		return err
	}
	honorific := "Ustadzah"
	if teacher.JenisKelamin != nil && strings.EqualFold(strings.TrimSpace(*teacher.JenisKelamin), "Laki-laki") {
		honorific = "Ustadz"
	}

	return httpx.Success(c, "Laporan performa bulanan berhasil diambil", fiber.Map{
		"teacher": fiber.Map{
			"nama":      strings.TrimSpace(teacher.Nama),
			"email":     normalizeReminderEmail(*teacher.Email),
			"sapaan":    honorific,
			"jenisGuru": teacher.TipeGuru,
		},
		"period": fiber.Map{
			"label":     monthlyConfirmationPeriodLabel(periodStart),
			"startDate": confirmation.PeriodStart.Format("2006-01-02"),
			"endDate":   confirmation.PeriodEnd.Format("2006-01-02"),
		},
		"confirmedAt": confirmation.ConfirmedAt,
		"summary":     performance.Summary,
		"rows":        performance.Rows,
	})
}

type monthlyPerformanceReport struct {
	Summary fiber.Map
	Rows    []fiber.Map
}

func (h *Handler) monthlyPerformanceSummary(teacher models.User, snapshotRows []map[string]any) (monthlyPerformanceReport, error) {
	var schedules []models.JadwalPiket
	if err := h.db.Where("user_id = ? AND is_active = ?", teacher.ID, true).Order("id ASC").Find(&schedules).Error; err != nil {
		return monthlyPerformanceReport{}, err
	}
	piketByDay := make(map[string]models.JadwalPiket, len(schedules))
	for _, schedule := range schedules {
		if _, exists := piketByDay[schedule.Hari]; !exists {
			piketByDay[schedule.Hari] = schedule
		}
	}

	workdays, present, punctual, late := 0, 0, 0, 0
	permission, sick, absent := 0, 0, 0
	missingCheckout := 0
	piketScheduled, piketPresent, piketNoAttendance, piketPermissionOrSick, piketLate := 0, 0, 0, 0, 0
	rows := make([]fiber.Map, 0, len(snapshotRows))
	location := appLocation(h)
	for _, row := range snapshotRows {
		dateValue := performanceString(row["tanggal"])
		date, err := time.ParseInLocation("2006-01-02", dateValue, location)
		if err != nil {
			continue
		}
		status := strings.ToLower(strings.TrimSpace(performanceString(row["status"])))
		checkIn := performanceString(row["jam_masuk"])
		checkOut := performanceString(row["jam_pulang"])
		isPresent := isPresentStatus(status)
		isLate := status == "hadir_terlambat" || status == "hadir_izin_terlambat"
		isWorkday := isMonthlyPerformanceWorkday(status)
		isPiket := isWorkday && piketByDay[dayName(date.Weekday())].ID != 0

		if isWorkday {
			workdays++
			switch status {
			case "izin":
				permission++
			case "sakit":
				sick++
			case "alfa":
				absent++
			default:
				if isPresent {
					present++
					if isLate {
						late++
					} else {
						punctual++
					}
					if isMissingMonthlyCheckout(checkOut) {
						missingCheckout++
					}
				}
			}
		}

		piketStatus := "—"
		if isPiket {
			piketScheduled++
			switch {
			case isPresent:
				piketPresent++
				if isLate {
					piketLate++
					piketStatus = "Presensi hadir tercatat, terlambat"
				} else {
					piketStatus = "Presensi hadir tercatat"
				}
			case status == "alfa":
				piketNoAttendance++
				piketStatus = "Tidak ada presensi"
			case status == "izin" || status == "sakit":
				piketPermissionOrSick++
				piketStatus = "" + strings.ToUpper(status[:1]) + status[1:]
			default:
				piketStatus = "Tidak ada catatan presensi"
			}
		}

		rows = append(rows, fiber.Map{
			"tanggal":        dateValue,
			"hari":           dayName(date.Weekday()),
			"hariKerja":      isWorkday,
			"status":         status,
			"jamMasuk":       checkIn,
			"jamPulang":      checkOut,
			"piketTerjadwal": isPiket,
			"statusPiket":    piketStatus,
		})
	}

	attendancePercent, punctualPercent := 0.0, 0.0
	if workdays > 0 {
		attendancePercent = roundedPercent(present, workdays)
	}
	if present > 0 {
		punctualPercent = roundedPercent(punctual, present)
	}

	return monthlyPerformanceReport{
		Summary: fiber.Map{
			"hariKerja":                  workdays,
			"hadir":                      present,
			"tepatWaktu":                 punctual,
			"terlambat":                  late,
			"izin":                       permission,
			"sakit":                      sick,
			"tidakPresensi":              absent,
			"pulangBelumTercatat":        missingCheckout,
			"persentaseKehadiran":        attendancePercent,
			"persentaseTepatWaktu":       punctualPercent,
			"hariPiketTerjadwal":         piketScheduled,
			"hadirPadaHariPiket":         piketPresent,
			"tanpaPresensiPadaHariPiket": piketNoAttendance,
			"izinSakitPadaHariPiket":     piketPermissionOrSick,
			"terlambatPadaHariPiket":     piketLate,
		},
		Rows: rows,
	}, nil
}

func isMonthlyPerformanceWorkday(status string) bool {
	return status == "hadir" || status == "hadir_terlambat" || status == "hadir_izin_terlambat" || status == "izin" || status == "sakit" || status == "alfa"
}

func isMissingMonthlyCheckout(value string) bool {
	value = strings.TrimSpace(value)
	return value == "" || value == "-" || value == "00:00:00"
}

func performanceString(value any) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprint(value))
}

func roundedPercent(numerator, denominator int) float64 {
	if denominator <= 0 {
		return 0
	}
	return float64(int(float64(numerator)*1000/float64(denominator)+0.5)) / 10
}

func (h *Handler) notifyN8NMonthlyPerformanceReport(userID uint, periodStart time.Time) {
	webhookURL := strings.TrimSpace(h.cfg.N8NReportWebhookURL)
	webhookSecret := strings.TrimSpace(h.cfg.N8NReportWebhookSecret)
	if webhookURL == "" || webhookSecret == "" {
		return
	}

	go func() {
		payload := map[string]any{
			"user_id":      userID,
			"period_start": periodStart.Format("2006-01-02"),
		}
		client := &http.Client{
			Timeout: monthlyPerformanceWebhookTimeout,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		}
		for attempt := 1; attempt <= 3; attempt++ {
			var body bytes.Buffer
			if err := json.NewEncoder(&body).Encode(payload); err != nil {
				log.Printf("monthly performance n8n webhook payload encode failed for user_id=%d", userID)
				return
			}
			ctx, cancel := context.WithTimeout(context.Background(), monthlyPerformanceWebhookTimeout)
			request, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, &body)
			if err != nil {
				cancel()
				log.Printf("monthly performance n8n webhook request could not be created for user_id=%d", userID)
				return
			}
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("X-GeoPresensi-Secret", webhookSecret)
			response, err := client.Do(request)
			cancel()
			if err == nil {
				response.Body.Close()
				if response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusMultipleChoices {
					return
				}
				if attempt == 3 {
					log.Printf("monthly performance n8n webhook returned HTTP %d for user_id=%d", response.StatusCode, userID)
				}
			} else if attempt == 3 {
				log.Printf("monthly performance n8n webhook request failed for user_id=%d", userID)
			}
			if attempt < 3 {
				time.Sleep(time.Duration(attempt) * time.Second)
			}
		}
	}()
}
