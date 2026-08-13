package compat

import (
	"bytes"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/auth"
	"github.com/griyaquran/geopresensi/backend/internal/httpx"
	"github.com/griyaquran/geopresensi/backend/internal/models"
	"gorm.io/gorm"
)

func (h *Handler) RegisterIntegrationRoutes(app fiber.Router) {
	app.All("/api/n8n_guru.php", h.integrationAuth, h.n8nGuru)
	app.All("/api/n8n_presensi.php", h.integrationAuth, h.n8nPresensi)
	app.All("/api/n8n_guru_belum_presensi.php", h.integrationAuth, h.n8nGuruBelumPresensi)
	app.All("/api/n8n_activity.php", h.integrationAuth, h.n8nActivity)
	app.All("/api/hermes_connect.php", h.integrationAuth, h.hermesConnect)
	app.All("/api/hermes_presensi.php", h.integrationAuth, h.hermesPresensi)
	app.All("/api/hermes_presensi_overview.php", h.integrationAuth, h.hermesOverview)
	app.All("/api/webhook_config.php", auth.RequireActiveUser(h.db, h.jwt), auth.RequireRoles("admin"), h.webhookConfig)
	app.All("/api/webhook_reminder.php", h.integrationAuth, h.webhookReminder)
	app.All("/api/webhook_reminder_direct.php", h.integrationAuth, h.webhookReminderDirect)

	v1 := app.Group("/api/v1/integrations")
	v1.All("/hermes", h.integrationAuth, h.hermesConnect)
	v1.All("/hermes/attendance", h.integrationAuth, h.hermesPresensi)
	v1.All("/hermes/overview", h.integrationAuth, h.hermesOverview)
	v1.All("/n8n/users", h.integrationAuth, h.n8nGuru)
	v1.All("/n8n/attendance", h.integrationAuth, h.n8nPresensi)
	v1.All("/n8n/missing-attendance", h.integrationAuth, h.n8nGuruBelumPresensi)
	v1.All("/n8n/activity", h.integrationAuth, h.n8nActivity)
	v1.All("/webhook", h.integrationAuth, h.webhookReminder)
	v1.All("/webhook/direct", h.integrationAuth, h.webhookReminderDirect)
}

func (h *Handler) integrationAuth(c *fiber.Ctx) error {
	provided := c.Get("X-API-Key")
	if provided == "" {
		provided = c.Query("api_key")
	}
	for _, expected := range []string{h.cfg.HermesAPIKey, h.cfg.N8NAPIKey} {
		if expected != "" && len(expected) == len(provided) && subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) == 1 {
			return c.Next()
		}
	}
	if raw := strings.TrimSpace(strings.TrimPrefix(c.Get(fiber.HeaderAuthorization), "Bearer ")); raw != "" {
		if claims, err := h.jwt.ParseAccess(raw); err == nil && (claims.Role == "admin" || claims.Role == "kepala_sekolah") {
			var user models.User
			if err := h.db.Select("id", "role", "archived_at").Where("id = ? AND role = ? AND archived_at IS NULL", claims.UserID, claims.Role).First(&user).Error; err == nil {
				return c.Next()
			}
		}
	}
	return httpx.Error(c, fiber.StatusUnauthorized, "INTEGRATION_UNAUTHORIZED", "API key integrasi tidak valid")
}

func integrationAdminClaims() *auth.Claims { return &auth.Claims{Role: "admin"} }

func (h *Handler) n8nGuru(c *fiber.Ctx) error {
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Order("nama ASC").Find(&users).Error; err != nil {
		return err
	}
	data := make([]map[string]any, 0, len(users))
	for _, user := range users {
		data = append(data, mapUser(user))
	}
	return httpx.Success(c, "Data guru berhasil diambil", data)
}

func (h *Handler) n8nPresensi(c *fiber.Ctx) error {
	claims := integrationAdminClaims()
	if c.Query("tanggal") != "" {
		c.Request().URI().QueryArgs().Set("tanggal", c.Query("tanggal"))
	}
	return h.listAttendance(c, claims)
}

func (h *Handler) n8nGuruBelumPresensi(c *fiber.Ctx) error {
	date := c.Query("tanggal", today(h))
	data, err := h.missingTeachers(date)
	if err != nil {
		var dateErr invalidDateError
		if errors.As(err, &dateErr) {
			return invalid(c, err.Error())
		}
		return err
	}
	return httpx.Success(c, "Data guru yang belum presensi berhasil diambil", fiber.Map{"tanggal": date, "total": len(data), "data": data})
}

func (h *Handler) missingTeachers(date string) ([]map[string]any, error) {
	parsed, err := time.ParseInLocation("2006-01-02", date, appLocation(h))
	if err != nil {
		return nil, invalidDateError{}
	}
	var users []models.User
	if err := h.db.Where("role = ? AND archived_at IS NULL", "guru").Order("nama ASC").Find(&users).Error; err != nil {
		return nil, err
	}
	var logs []models.AttendanceLog
	if err := h.db.Where("tanggal = ?", date).Find(&logs).Error; err != nil {
		return nil, err
	}
	present := map[uint]bool{}
	for _, log := range logs {
		present[log.UserID] = true
	}
	data := make([]map[string]any, 0)
	for _, user := range users {
		workday, _, err := h.isWorkday(user, parsed)
		if err != nil {
			return nil, err
		}
		if workday && !present[user.ID] {
			data = append(data, mapUser(user))
		}
	}
	return data, nil
}

type invalidDateError struct{}

func (invalidDateError) Error() string { return "tanggal tidak valid" }

func (h *Handler) n8nActivity(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodPost {
		return fiber.ErrMethodNotAllowed
	}
	return h.activity(c)
}

func (h *Handler) hermesConnect(c *fiber.Ctx) error {
	return httpx.Success(c, "Koneksi Hermes berhasil", fiber.Map{"service": "GeoPresensi Hermes API", "status": "ready", "database": "mysql", "auth": "api_key_or_admin_jwt"})
}

func (h *Handler) hermesPresensi(c *fiber.Ctx) error {
	claims := integrationAdminClaims()
	switch c.Method() {
	case fiber.MethodGet:
		return h.listAttendance(c, claims)
	case fiber.MethodPost:
		body, err := readJSON(c)
		if err != nil {
			return invalid(c, err.Error())
		}
		return h.createAttendance(c, claims, body)
	case fiber.MethodPut:
		body, err := readJSON(c)
		if err != nil {
			return invalid(c, err.Error())
		}
		return h.updateAttendance(c, claims, body)
	default:
		return fiber.ErrMethodNotAllowed
	}
}

func (h *Handler) hermesOverview(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet {
		return fiber.ErrMethodNotAllowed
	}
	return h.adminSummary(c)
}

func (h *Handler) webhookConfig(c *fiber.Ctx) error {
	if c.Method() == fiber.MethodGet {
		if c.Query("logs") == "1" {
			limit := 50
			if value := c.QueryInt("limit", 50); value > 0 && value <= 200 {
				limit = value
			}
			var logs []models.WebhookLog
			if err := h.db.Order("created_at DESC, id DESC").Limit(limit).Find(&logs).Error; err != nil {
				return err
			}
			return httpx.Success(c, "Logs webhook berhasil diambil", logs)
		}
		var row models.WebhookConfig
		query := h.db.First(&row, 1)
		if errors.Is(query.Error, gorm.ErrRecordNotFound) {
			row = models.WebhookConfig{ID: 1}
			if err := h.db.Create(&row).Error; err != nil {
				return err
			}
		} else if query.Error != nil {
			return query.Error
		}
		return httpx.Success(c, "Config webhook berhasil diambil", row)
	}
	if c.Method() != fiber.MethodPut {
		return fiber.ErrMethodNotAllowed
	}
	body, err := readJSON(c)
	if err != nil {
		return invalid(c, err.Error())
	}
	webhookURL := stringValue(body, "n8nWebhookUrl", "n8n_webhook_url")
	if webhookURL != "" {
		if err := validateWebhookURL(webhookURL, h.cfg.IsSecureEnvironment(), h.cfg.AllowPrivateWebhookTargets); err != nil {
			return invalid(c, err.Error())
		}
	}
	phone := normalizePhone(stringValue(body, "adminPhone", "admin_phone"))
	if phone != "" && (len(phone) < 10 || len(phone) > 15) {
		return invalid(c, "Nomor HP admin tidak valid")
	}
	var row models.WebhookConfig
	query := h.db.First(&row, 1)
	if errors.Is(query.Error, gorm.ErrRecordNotFound) {
		row.ID = 1
	}
	if query.Error != nil && !errors.Is(query.Error, gorm.ErrRecordNotFound) {
		return query.Error
	}
	row.Enabled = boolValue(body, "enabled")
	row.N8NWebhookURL = webhookURL
	row.AdminPhone = phone
	if err := h.db.Save(&row).Error; err != nil {
		return err
	}
	return httpx.Success(c, "Config webhook berhasil diupdate", row)
}

func (h *Handler) webhookReminder(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet && c.Method() != fiber.MethodPost {
		return fiber.ErrMethodNotAllowed
	}
	var config models.WebhookConfig
	if err := h.db.First(&config, 1).Error; err != nil {
		return httpx.Error(c, fiber.StatusNotFound, "WEBHOOK_NOT_CONFIGURED", "Config webhook belum tersedia")
	}
	if !config.Enabled {
		return httpx.Success(c, "Webhook disabled", fiber.Map{"skipped": true})
	}
	if config.N8NWebhookURL == "" {
		return httpx.Error(c, fiber.StatusConflict, "WEBHOOK_URL_MISSING", "URL n8n belum dikonfigurasi")
	}
	if err := validateWebhookURL(config.N8NWebhookURL, h.cfg.IsSecureEnvironment(), h.cfg.AllowPrivateWebhookTargets); err != nil {
		return httpx.Error(c, fiber.StatusConflict, "WEBHOOK_URL_INVALID", err.Error())
	}
	date := c.Query("tanggal", today(h))
	missing, err := h.missingTeachers(date)
	if err != nil {
		var dateErr invalidDateError
		if errors.As(err, &dateErr) {
			return invalid(c, err.Error())
		}
		return err
	}
	if len(missing) == 0 {
		return httpx.Success(c, "Semua guru sudah presensi", fiber.Map{"skipped": true, "tanggal": date})
	}
	reminderType := reminderType(time.Now().In(appLocation(h)).Hour())
	payload := fiber.Map{"timestamp": time.Now().In(appLocation(h)).Format(time.RFC3339), "reminder_type": reminderType, "total_belum_presensi": len(missing), "guru_list": missing, "admin_alert": reminderType == "final", "admin_phone": config.AdminPhone}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	request, err := http.NewRequest(http.MethodPost, config.N8NWebhookURL, strings.NewReader(string(body)))
	if err != nil {
		return invalid(c, "URL webhook tidak valid")
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Webhook-Event", "attendance-reminder")
	response, err := (&http.Client{Timeout: 10 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}).Do(request)
	status := "failed"
	responseText := ""
	if err == nil {
		defer response.Body.Close()
		limited, readErr := io.ReadAll(io.LimitReader(response.Body, 4096))
		if readErr == nil {
			responseText = string(limited)
		}
		if response.StatusCode >= 200 && response.StatusCode < 300 {
			status = "success"
		}
	} else {
		responseText = err.Error()
	}
	_ = h.db.Create(&models.WebhookLog{ReminderType: reminderType, TotalGuru: len(missing), Status: status, Response: responseText}).Error
	if status != "success" {
		return httpx.Error(c, fiber.StatusBadGateway, "WEBHOOK_DELIVERY_FAILED", "Pengiriman reminder webhook gagal")
	}
	return httpx.Success(c, "Reminder webhook terkirim", fiber.Map{"tanggal": date, "reminder_type": reminderType, "total_guru": len(missing)})
}

func (h *Handler) webhookReminderDirect(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet && c.Method() != fiber.MethodPost {
		return fiber.ErrMethodNotAllowed
	}
	if h.cfg.GowaWebhookURL == "" || h.cfg.GowaUsername == "" || h.cfg.GowaPassword == "" {
		return httpx.Error(c, fiber.StatusServiceUnavailable, "GOWA_NOT_CONFIGURED", "Integrasi GOWA belum dikonfigurasi")
	}
	if err := validateWebhookURL(h.cfg.GowaWebhookURL, h.cfg.IsSecureEnvironment(), h.cfg.AllowPrivateWebhookTargets); err != nil {
		return httpx.Error(c, fiber.StatusConflict, "GOWA_URL_INVALID", err.Error())
	}
	date := c.Query("tanggal", today(h))
	missing, err := h.missingTeachers(date)
	if err != nil {
		var dateErr invalidDateError
		if errors.As(err, &dateErr) {
			return invalid(c, err.Error())
		}
		return err
	}
	if len(missing) == 0 {
		return httpx.Success(c, "Semua guru sudah presensi", fiber.Map{"skipped": true, "tanggal": date})
	}

	kind := reminderType(time.Now().In(appLocation(h)).Hour())
	sent, failed := 0, 0
	for _, teacher := range missing {
		phone := normalizeWhatsAppPhone(valueString(teacher["noHP"]))
		name := valueString(teacher["nama"])
		if phone == "" || h.sendGowaMessage(phone, reminderMessage(kind, name, h.cfg.AppURL)) != nil {
			failed++
			continue
		}
		sent++
	}

	if kind == "final" {
		var config models.WebhookConfig
		if query := h.db.First(&config, 1); query.Error == nil {
			adminPhone := normalizeWhatsAppPhone(config.AdminPhone)
			if adminPhone != "" {
				names := make([]string, 0, len(missing))
				for index, teacher := range missing {
					names = append(names, fmt.Sprintf("%d. %s", index+1, valueString(teacher["nama"])))
				}
				if h.sendGowaMessage(adminPhone, fmt.Sprintf("📊 Laporan Presensi - 10:00 WIB\n\nTotal guru belum presensi: %d orang\n\n%s", len(missing), strings.Join(names, "\n"))) != nil {
					failed++
				}
			}
		}
	}

	status := "success"
	if failed > 0 {
		status = "partial"
	}
	_ = h.db.Create(&models.WebhookLog{ReminderType: kind, TotalGuru: len(missing), Status: status, Response: fmt.Sprintf("gowa_sent=%d,gowa_failed=%d", sent, failed)}).Error
	if failed > 0 {
		return httpx.Error(c, fiber.StatusBadGateway, "GOWA_DELIVERY_PARTIAL", fmt.Sprintf("Sebagian reminder gagal dikirim (berhasil %d, gagal %d)", sent, failed))
	}
	return httpx.Success(c, "Reminder WhatsApp terkirim", fiber.Map{"tanggal": date, "reminder_type": kind, "total_guru": len(missing), "sent": sent, "failed": failed})
}

func (h *Handler) sendGowaMessage(phone, message string) error {
	payload, err := json.Marshal(fiber.Map{"phone": phone, "message": message})
	if err != nil {
		return err
	}
	request, err := http.NewRequest(http.MethodPost, h.cfg.GowaWebhookURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	request.SetBasicAuth(h.cfg.GowaUsername, h.cfg.GowaPassword)
	response, err := (&http.Client{Timeout: 30 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}).Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("GOWA returned HTTP %d", response.StatusCode)
	}
	return nil
}

func reminderMessage(kind, name, appURL string) string {
	if appURL == "" {
		appURL = "https://presensi.example.com"
	}
	label := "Pengingat Presensi"
	if kind == "second" {
		label = "Pengingat Presensi (Kedua)"
	} else if kind == "final" {
		label = "Pengingat Presensi (Terakhir)"
	}
	return fmt.Sprintf("🔔 *%s*\n\nHalo *%s*,\n\nAnda belum melakukan presensi hari ini.\nMohon segera isi presensi melalui:\n👉 %s\n\nTerima kasih.\n_Sistem GeoPresensi_", label, name, appURL)
}

func valueString(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case *string:
		if typed == nil {
			return ""
		}
		return strings.TrimSpace(*typed)
	default:
		return strings.TrimSpace(fmt.Sprint(typed))
	}
}

func normalizeWhatsAppPhone(value string) string {
	digits := normalizePhone(value)
	if digits == "" {
		return ""
	}
	if strings.HasPrefix(digits, "0") {
		digits = "62" + strings.TrimPrefix(digits, "0")
	}
	if !strings.HasPrefix(digits, "62") || len(digits) < 10 || len(digits) > 15 {
		return ""
	}
	return digits
}

func validateWebhookURL(raw string, production, allowPrivate bool) error {
	parsed, err := url.ParseRequestURI(raw)
	if err != nil || parsed.Host == "" || parsed.User != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return fmt.Errorf("URL n8n tidak valid")
	}
	if production && parsed.Scheme != "https" {
		return fmt.Errorf("URL webhook production harus menggunakan HTTPS")
	}
	host := strings.ToLower(parsed.Hostname())
	if !allowPrivate && (host == "localhost" || host == "localhost.localdomain") {
		return fmt.Errorf("target webhook lokal tidak diizinkan")
	}
	if ip := net.ParseIP(host); ip != nil && (ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsUnspecified()) && !allowPrivate {
		return fmt.Errorf("target webhook private tidak diizinkan")
	}
	return nil
}

func normalizePhone(value string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, value)
}
func reminderType(hour int) string {
	switch hour {
	case 8:
		return "first"
	case 9:
		return "second"
	case 10:
		return "final"
	default:
		return "manual"
	}
}
