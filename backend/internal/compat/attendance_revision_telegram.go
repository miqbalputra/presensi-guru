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
	message := fmt.Sprintf(
		"📥 Pengajuan revisi presensi baru\nGuru: %s\nTanggal: %s\nAlasan: %s\nJam masuk: %s\nJam pulang: %s\n\nSilakan tinjau pada tab Pengajuan Guru:\n%s/admin/edit-presensi",
		strings.TrimSpace(user.Nama),
		request.Tanggal.In(appLocation(h)).Format("2006-01-02"),
		reason,
		telegramRevisionTime(request.JamMasuk),
		telegramRevisionTime(request.JamPulang),
		strings.TrimRight(strings.TrimSpace(h.cfg.AppURL), "/"),
	)

	var sendErrors []error
	for _, chatID := range chatIDs {
		if err := sendTelegramMessage(botToken, chatID, message); err != nil {
			sendErrors = append(sendErrors, err)
		}
	}
	return errors.Join(sendErrors...)
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

func sendTelegramMessage(botToken, chatID, message string) error {
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(map[string]string{"chat_id": chatID, "text": message}); err != nil {
		return errors.New("could not encode Telegram notification")
	}

	ctx, cancel := context.WithTimeout(context.Background(), telegramNotificationTimeout)
	defer cancel()
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &body)
	if err != nil {
		return errors.New("could not create Telegram API request")
	}
	req.Header.Set("Content-Type", "application/json")
	response, err := (&http.Client{Timeout: telegramNotificationTimeout}).Do(req)
	if err != nil {
		// Do not log the raw transport error: it can include the bot token in the URL.
		return errors.New("Telegram Bot API request failed")
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
		return errors.New("Telegram Bot API response could not be read")
	}
	if !result.OK {
		if strings.TrimSpace(result.Description) == "" {
			return errors.New("Telegram Bot API rejected the notification")
		}
		return fmt.Errorf("Telegram Bot API rejected the notification: %s", result.Description)
	}
	return nil
}

func telegramRevisionTime(value *string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return "Tidak diubah"
	}
	return strings.TrimSpace(*value)
}
