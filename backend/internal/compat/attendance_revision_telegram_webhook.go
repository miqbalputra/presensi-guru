package compat

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/models"
	"gorm.io/gorm"
)

const telegramRevisionCallbackPrefix = "gqr"

type telegramInlineButton struct {
	Text         string `json:"text"`
	CallbackData string `json:"callback_data"`
}

type telegramInlineKeyboard struct {
	InlineKeyboard [][]telegramInlineButton `json:"inline_keyboard"`
}

type telegramUpdate struct {
	CallbackQuery *telegramCallbackQuery `json:"callback_query"`
	Message       *telegramMessage       `json:"message"`
}

type telegramCallbackQuery struct {
	ID      string           `json:"id"`
	From    telegramUser     `json:"from"`
	Message *telegramMessage `json:"message"`
	Data    string           `json:"data"`
}

type telegramUser struct {
	ID int64 `json:"id"`
}

type telegramChat struct {
	ID int64 `json:"id"`
}

type telegramMessage struct {
	MessageID      int64            `json:"message_id"`
	Chat           telegramChat     `json:"chat"`
	From           telegramUser     `json:"from"`
	Text           string           `json:"text"`
	ReplyToMessage *telegramMessage `json:"reply_to_message"`
}

func (h *Handler) telegramAttendanceRevisionWebhook(c *fiber.Ctx) error {
	secret := strings.TrimSpace(h.cfg.TelegramWebhookSecret)
	if secret == "" || strings.TrimSpace(h.cfg.TelegramBotToken) == "" {
		return fiber.ErrNotFound
	}
	if !hmac.Equal([]byte(c.Get("X-Telegram-Bot-Api-Secret-Token")), []byte(secret)) {
		return fiber.ErrUnauthorized
	}

	var update telegramUpdate
	if err := json.Unmarshal(c.Body(), &update); err != nil {
		return fiber.ErrBadRequest
	}
	if update.CallbackQuery != nil {
		if err := h.handleTelegramRevisionCallback(*update.CallbackQuery); err != nil {
			log.Printf("Telegram attendance revision callback failed: %v", err)
			return fiber.ErrInternalServerError
		}
	}
	if update.Message != nil {
		if err := h.handleTelegramCustomRevisionReason(*update.Message); err != nil {
			log.Printf("Telegram attendance revision reason failed: %v", err)
			return fiber.ErrInternalServerError
		}
	}
	return c.SendStatus(fiber.StatusOK)
}

func telegramRevisionDecisionKeyboard(botToken string, requestID uint) telegramInlineKeyboard {
	return telegramInlineKeyboard{InlineKeyboard: [][]telegramInlineButton{{
		{Text: "✅ Setujui", CallbackData: telegramRevisionCallbackData(botToken, "a", requestID, "")},
		{Text: "❌ Tolak", CallbackData: telegramRevisionCallbackData(botToken, "r", requestID, "")},
	}}}
}

func telegramRevisionRejectionKeyboard(botToken string, requestID uint) telegramInlineKeyboard {
	button := func(text, reason string) telegramInlineButton {
		return telegramInlineButton{Text: text, CallbackData: telegramRevisionCallbackData(botToken, "n", requestID, reason)}
	}
	return telegramInlineKeyboard{InlineKeyboard: [][]telegramInlineButton{
		{button("🕒 Jam belum sesuai", "time")},
		{button("📄 Informasi belum lengkap", "incomplete")},
		{button("☎️ Perlu konfirmasi", "confirm")},
		{{Text: "✍️ Tulis alasan sendiri", CallbackData: telegramRevisionCallbackData(botToken, "o", requestID, "")}},
	}}
}

func telegramRevisionCallbackData(botToken, action string, requestID uint, reason string) string {
	id := strconv.FormatUint(uint64(requestID), 10)
	payload := strings.Join([]string{"attendance-revision", action, id, reason}, ":")
	signature := telegramRevisionSignature(botToken, payload)
	if reason == "" {
		return strings.Join([]string{telegramRevisionCallbackPrefix, action, id, signature}, ":")
	}
	return strings.Join([]string{telegramRevisionCallbackPrefix, action, id, reason, signature}, ":")
}

func telegramRevisionSignature(botToken, payload string) string {
	mac := hmac.New(sha256.New, []byte(botToken))
	_, _ = mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil)[:9])
}

func parseTelegramRevisionCallback(botToken, data string) (action string, requestID uint, reason string, valid bool) {
	parts := strings.Split(data, ":")
	if len(parts) != 4 && len(parts) != 5 || parts[0] != telegramRevisionCallbackPrefix {
		return "", 0, "", false
	}
	requestID, err := parseUint(parts[2])
	if err != nil {
		return "", 0, "", false
	}
	signature := parts[len(parts)-1]
	if len(parts) == 5 {
		reason = parts[3]
	}
	payload := strings.Join([]string{"attendance-revision", parts[1], parts[2], reason}, ":")
	expected := telegramRevisionSignature(botToken, payload)
	if !hmac.Equal([]byte(signature), []byte(expected)) {
		return "", 0, "", false
	}
	return parts[1], requestID, reason, true
}

func (h *Handler) handleTelegramRevisionCallback(callback telegramCallbackQuery) error {
	if callback.ID == "" {
		return nil
	}
	if callback.From.ID <= 0 {
		return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Akun Telegram tidak dapat diverifikasi.", true)
	}
	action, requestID, reason, valid := parseTelegramRevisionCallback(h.cfg.TelegramBotToken, callback.Data)
	if !valid {
		return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Tombol tidak valid atau sudah kedaluwarsa.", true)
	}
	if (action == "r" || action == "o") && callback.Message == nil {
		return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Pesan pengajuan tidak tersedia.", true)
	}
	if action == "n" {
		var ok bool
		reason, ok = telegramRevisionRejectionNote(reason)
		if !ok {
			return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Alasan penolakan tidak dikenali.", true)
		}
	}
	if !contains([]string{"a", "n", "o", "r"}, action) {
		return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Tindakan tidak dikenal.", true)
	}

	// Acknowledge a valid callback before touching the database. Telegram keeps
	// the button spinner open until answerCallbackQuery succeeds, and the admin
	// lookup can be slow when the database is under load.
	if err := answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Sedang memproses pengajuan…", false); err != nil {
		log.Printf("Telegram callback acknowledgement failed: %v", err)
	}
	admin, authorized, err := h.telegramAdmin(callback.From.ID)
	if err != nil {
		log.Printf("Telegram admin lookup failed for revision callback: %v", err)
		return h.reportTelegramRevisionCallbackFailure(callback, "⚠️ Sistem belum dapat memeriksa akses admin. Silakan coba lagi.")
	}
	if !authorized {
		return sendTelegramMessage(h.cfg.TelegramBotToken, fmt.Sprint(callback.From.ID), "Akun Telegram ini tidak memiliki akses untuk memproses pengajuan.", nil)
	}
	switch action {
	case "r":
		return editTelegramMessageReplyMarkup(h.cfg.TelegramBotToken, *callback.Message, telegramRevisionRejectionKeyboard(h.cfg.TelegramBotToken, requestID))
	case "o":
		return h.sendTelegramCustomReasonPrompt(callback.Message.Chat.ID, requestID, callback.From.ID)
	case "a", "n":
		decision := attendanceRevisionApproved
		if action == "n" {
			decision = attendanceRevisionRejected
		}
		request, err := h.applyAttendanceRevisionDecision(requestID, decision, reason, admin.ID)
		if err != nil {
			var apiErr *attendanceRevisionAPIError
			if errors.As(err, &apiErr) {
				return h.reportTelegramRevisionCallbackFailure(callback, fmt.Sprintf("⚠️ Pengajuan tidak dapat diproses.\n%s", apiErr.message))
			}
			log.Printf("Telegram attendance revision decision failed for request %d: %v", requestID, err)
			return h.reportTelegramRevisionCallbackFailure(callback, "⚠️ Sistem gagal memproses pengajuan. Silakan coba kembali melalui dashboard admin.")
		}
		return h.finishTelegramRevisionDecision(callback.Message, admin, request, decision, reason)
	default:
		return answerTelegramCallback(h.cfg.TelegramBotToken, callback.ID, "Tindakan tidak dikenal.", true)
	}
}

func (h *Handler) reportTelegramRevisionCallbackFailure(callback telegramCallbackQuery, text string) error {
	if callback.Message != nil {
		return h.finishTelegramRevisionMessage(callback.Message, strings.TrimSpace(callback.Message.Text)+"\n\n"+text)
	}
	return sendTelegramMessage(h.cfg.TelegramBotToken, fmt.Sprint(callback.From.ID), text, nil)
}

func telegramRevisionRejectionNote(reason string) (string, bool) {
	switch reason {
	case "time":
		return "Jam yang diajukan belum dapat disetujui karena belum sesuai dengan informasi yang dapat diverifikasi. Silakan periksa kembali waktu yang diajukan.", true
	case "incomplete":
		return "Informasi pendukung pengajuan belum lengkap. Silakan lengkapi informasi lalu ajukan kembali.", true
	case "confirm":
		return "Pengajuan belum dapat disetujui saat ini. Mohon konfirmasi terlebih dahulu kepada admin.", true
	default:
		return "", false
	}
}

func (h *Handler) telegramAdmin(telegramUserID int64) (models.User, bool, error) {
	adminID, authorized := telegramAdminUserMap(h.cfg.TelegramAdminUserMap)[telegramUserID]
	if !authorized {
		return models.User{}, false, nil
	}
	var admin models.User
	err := h.db.Where("id = ? AND role = ? AND archived_at IS NULL", adminID, "admin").First(&admin).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return models.User{}, false, nil
	}
	if err != nil {
		return models.User{}, false, err
	}
	return admin, true, nil
}

func telegramAdminUserMap(value string) map[int64]uint {
	admins := make(map[int64]uint)
	for _, entry := range strings.Split(value, ",") {
		parts := strings.Split(strings.TrimSpace(entry), ":")
		if len(parts) != 2 {
			continue
		}
		telegramID, telegramErr := strconv.ParseInt(strings.TrimSpace(parts[0]), 10, 64)
		adminID, adminErr := strconv.ParseUint(strings.TrimSpace(parts[1]), 10, strconv.IntSize)
		if telegramErr == nil && telegramID > 0 && adminErr == nil && adminID > 0 {
			admins[telegramID] = uint(adminID)
		}
	}
	return admins
}

func (h *Handler) sendTelegramCustomReasonPrompt(chatID int64, requestID uint, telegramUserID int64) error {
	markerPayload := fmt.Sprintf("custom-rejection:%d:%d", requestID, telegramUserID)
	marker := fmt.Sprintf("GQREV:%d:%d:%s", requestID, telegramUserID, telegramRevisionSignature(h.cfg.TelegramBotToken, markerPayload))
	text := fmt.Sprintf("✍️ Balas pesan ini dengan alasan penolakan untuk pengajuan revisi #%d.\nRef: %s", requestID, marker)
	return callTelegramAPI(h.cfg.TelegramBotToken, "sendMessage", map[string]any{
		"chat_id": chatID,
		"text":    text,
		"reply_markup": map[string]any{
			"force_reply":             true,
			"input_field_placeholder": "Tulis alasan penolakan",
		},
	})
}

func (h *Handler) handleTelegramCustomRevisionReason(message telegramMessage) error {
	if message.From.ID <= 0 || message.ReplyToMessage == nil || message.ReplyToMessage.From.ID <= 0 {
		return nil
	}
	requestID, telegramUserID, signature, ok := parseTelegramCustomReasonMarker(message.ReplyToMessage.Text)
	if !ok || telegramUserID != message.From.ID {
		return nil
	}
	payload := fmt.Sprintf("custom-rejection:%d:%d", requestID, telegramUserID)
	if !hmac.Equal([]byte(signature), []byte(telegramRevisionSignature(h.cfg.TelegramBotToken, payload))) {
		return nil
	}
	admin, authorized, err := h.telegramAdmin(message.From.ID)
	if err != nil || !authorized {
		return err
	}
	note := strings.TrimSpace(message.Text)
	if note == "" || len(note) > 1000 {
		return sendTelegramMessage(h.cfg.TelegramBotToken, strconv.FormatInt(message.Chat.ID, 10), "Alasan penolakan wajib diisi dan maksimal 1000 karakter. Silakan balas kembali pesan permintaan alasan.", nil)
	}
	request, err := h.applyAttendanceRevisionDecision(requestID, attendanceRevisionRejected, note, admin.ID)
	if err != nil {
		var apiErr *attendanceRevisionAPIError
		if errors.As(err, &apiErr) {
			return sendTelegramMessage(h.cfg.TelegramBotToken, strconv.FormatInt(message.Chat.ID, 10), fmt.Sprintf("⚠️ Pengajuan #%d tidak dapat diproses.\n%s", requestID, apiErr.message), nil)
		}
		return err
	}
	return h.sendTelegramDecisionSummary(strconv.FormatInt(message.Chat.ID, 10), admin, request, attendanceRevisionRejected, note)
}

func parseTelegramCustomReasonMarker(text string) (requestID uint, telegramUserID int64, signature string, ok bool) {
	for _, line := range strings.Split(text, "\n") {
		if !strings.HasPrefix(line, "Ref: GQREV:") {
			continue
		}
		parts := strings.Split(strings.TrimPrefix(line, "Ref: GQREV:"), ":")
		if len(parts) != 3 {
			return 0, 0, "", false
		}
		id, idErr := parseUint(parts[0])
		userID, userErr := strconv.ParseInt(parts[1], 10, 64)
		if idErr != nil || userErr != nil || userID <= 0 || parts[2] == "" {
			return 0, 0, "", false
		}
		return id, userID, parts[2], true
	}
	return 0, 0, "", false
}

func (h *Handler) finishTelegramRevisionDecision(message *telegramMessage, admin models.User, request models.AttendanceRevisionRequest, decision, note string) error {
	if message != nil {
		status := "✅ DISETUJUI"
		if decision == attendanceRevisionRejected {
			status = "❌ DITOLAK"
		}
		text := strings.TrimSpace(message.Text) + fmt.Sprintf("\n\n%s oleh %s.", status, admin.Nama)
		if decision == attendanceRevisionRejected {
			text += "\nAlasan: " + note
		}
		return h.finishTelegramRevisionMessage(message, text)
	}
	chatIDs := splitTelegramChatIDs(h.cfg.TelegramChatID)
	if len(chatIDs) == 0 {
		return nil
	}
	return h.sendTelegramDecisionSummary(chatIDs[0], admin, request, decision, note)
}

func (h *Handler) sendTelegramDecisionSummary(chatID string, admin models.User, request models.AttendanceRevisionRequest, decision, note string) error {
	status := "✅ DISETUJUI"
	if decision == attendanceRevisionRejected {
		status = "❌ DITOLAK"
	}
	text := fmt.Sprintf("%s pengajuan revisi presensi #%d untuk %s (%s) oleh %s.", status, request.ID, request.Tanggal.In(appLocation(h)).Format("2006-01-02"), request.Alasan, admin.Nama)
	if decision == attendanceRevisionRejected {
		text += "\nAlasan: " + note
	}
	return sendTelegramMessage(h.cfg.TelegramBotToken, chatID, text, nil)
}

func (h *Handler) finishTelegramRevisionMessage(message *telegramMessage, text string) error {
	if message == nil || message.MessageID == 0 {
		return nil
	}
	return callTelegramAPI(h.cfg.TelegramBotToken, "editMessageText", map[string]any{
		"chat_id":    message.Chat.ID,
		"message_id": message.MessageID,
		"text":       text,
		"reply_markup": telegramInlineKeyboard{
			InlineKeyboard: [][]telegramInlineButton{},
		},
	})
}

func editTelegramMessageReplyMarkup(botToken string, message telegramMessage, markup telegramInlineKeyboard) error {
	return callTelegramAPI(botToken, "editMessageReplyMarkup", map[string]any{
		"chat_id":      message.Chat.ID,
		"message_id":   message.MessageID,
		"reply_markup": markup,
	})
}

func answerTelegramCallback(botToken, callbackID, text string, showAlert bool) error {
	return callTelegramAPI(botToken, "answerCallbackQuery", map[string]any{
		"callback_query_id": callbackID,
		"text":              text,
		"show_alert":        showAlert,
	})
}
