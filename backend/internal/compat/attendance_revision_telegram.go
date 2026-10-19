package compat

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/griyaquran/geopresensi/backend/internal/models"
)

const telegramNotificationTimeout = 5 * time.Second

func (h *Handler) sendAttendanceRevisionTelegramNotification(user models.User, request models.AttendanceRevisionRequest) error {
	botToken := strings.TrimSpace(h.cfg.TelegramBotToken)
	chatIDs := splitTelegramChatIDs(h.cfg.TelegramChatID)
	if botToken == "" && len(chatIDs) == 0 {
		return nil
	}
	if botToken == "" || len(chatIDs) == 0 {
		return errors.New("Telegram notification requires both bot token and chat ID")
	}

	reason := "Kendala teknis"
	if request.Alasan == "lupa" {
		reason = "Lupa"
	}
	instructions := "Silakan tinjau dan proses pengajuan melalui dashboard admin."
	var replyMarkup any
	if h.telegramCallbacksEnabled() {
		instructions = "Silakan pilih tindakan di bawah. Persetujuan akan langsung memperbarui catatan presensi. Jika ditolak, pilih atau tulis alasan agar dapat disampaikan kepada guru."
		replyMarkup = telegramRevisionDecisionKeyboard(h.cfg.TelegramBotToken, request.ID)
	}
	message := fmt.Sprintf(
		"🔔 PENGAJUAN REVISI PRESENSI\n\n👤 Guru: %s\n📅 Tanggal: %s\n📝 Alasan pengajuan: %s\n🕒 Jam masuk yang diajukan: %s\n🕒 Jam pulang yang diajukan: %s\n\n%s\n\nDetail pengajuan: %s/admin/edit-presensi",
		strings.TrimSpace(user.Nama),
		request.Tanggal.In(appLocation(h)).Format("2006-01-02"),
		reason,
		telegramRevisionTime(request.JamMasuk),
		telegramRevisionTime(request.JamPulang),
		instructions,
		strings.TrimRight(strings.TrimSpace(h.cfg.AppURL), "/"),
	)
	if webhookURL := strings.TrimSpace(h.cfg.TelegramN8NWebhookURL); webhookURL != "" {
		return h.sendTelegramNotificationToN8N(webhookURL, h.cfg.TelegramN8NWebhookSecret, chatIDs, message, replyMarkup)
	}

	var sendErrors []error
	for _, chatID := range chatIDs {
		if err := sendTelegramMessage(botToken, chatID, message, replyMarkup); err != nil {
			sendErrors = append(sendErrors, err)
		}
	}
	return errors.Join(sendErrors...)
}

func (h *Handler) sendTelegramNotificationToN8N(webhookURL, webhookSecret string, chatIDs []string, message string, replyMarkup any) error {
	payload := map[string]any{
		"chat_ids": chatIDs,
		"message":  message,
	}
	if replyMarkup != nil {
		payload["reply_markup"] = replyMarkup
	}
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(payload); err != nil {
		return errors.New("could not encode n8n Telegram notification")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, &body)
	if err != nil {
		return errors.New("could not create n8n Telegram notification request")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-GeoPresensi-Secret", webhookSecret)
	client := &http.Client{
		Timeout: 15 * time.Second,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	response, err := client.Do(req)
	if err != nil {
		return errors.New("n8n Telegram webhook request failed")
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("n8n Telegram webhook returned HTTP %d", response.StatusCode)
	}
	return nil
}

func splitTelegramChatIDs(value string) []string {
	parts := strings.Split(value, ",")
	chatIDs := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		chatID := strings.TrimSpace(part)
		if chatID == "" {
			continue
		}
		if _, exists := seen[chatID]; exists {
			continue
		}
		seen[chatID] = struct{}{}
		chatIDs = append(chatIDs, chatID)
	}
	return chatIDs
}

func sendTelegramMessage(botToken, chatID, message string, replyMarkup any) error {
	payload := map[string]any{"chat_id": chatID, "text": message}
	if replyMarkup != nil {
		payload["reply_markup"] = replyMarkup
	}
	return callTelegramAPI(botToken, "sendMessage", payload)
}

func callTelegramAPI(botToken, method string, payload any) error {
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(payload); err != nil {
		return errors.New("could not encode Telegram request")
	}

	ctx, cancel := context.WithTimeout(context.Background(), telegramNotificationTimeout)
	defer cancel()
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/%s", botToken, method)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &body)
	if err != nil {
		return errors.New("could not create Telegram request")
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{
		Timeout: telegramNotificationTimeout,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	response, err := client.Do(req)
	if err != nil {
		// Do not log the raw transport error: it can include the bot token in the URL.
		return errors.New("Telegram request failed")
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("Telegram Bot API returned HTTP %d", response.StatusCode)
	}

	var result struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 64*1024)).Decode(&result); err != nil {
		return errors.New("Telegram response could not be read")
	}
	if !result.OK {
		if strings.TrimSpace(result.Description) == "" {
			return errors.New("Telegram rejected the request")
		}
		return fmt.Errorf("Telegram Bot API rejected the notification: %s", result.Description)
	}
	return nil
}

func (h *Handler) telegramCallbacksEnabled() bool {
	return strings.TrimSpace(h.cfg.TelegramWebhookSecret) != "" && strings.TrimSpace(h.cfg.TelegramAdminUserMap) != ""
}

func telegramRevisionTime(value *string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return "Tidak diubah"
	}
	return strings.TrimSpace(*value)
}
