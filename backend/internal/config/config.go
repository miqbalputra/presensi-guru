package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv                     string
	AppPort                    string
	AppVersion                 string
	AppTimezone                string
	AppURL                     string
	StaticDir                  string
	FrontendOrigins            string
	DBDriver                   string
	DBHost                     string
	DBPort                     string
	DBName                     string
	DBPath                     string
	DBUser                     string
	DBPass                     string
	DBMaxOpenConns             int
	DBMaxIdleConns             int
	DBConnMaxLifetime          time.Duration
	DBConnMaxIdleTime          time.Duration
	DBConnectTimeout           time.Duration
	DBReadTimeout              time.Duration
	DBWriteTimeout             time.Duration
	JWTIssuer                  string
	JWTAudience                string
	JWTSecret                  string
	JWTAccessTTL               time.Duration
	JWTRefreshTTL              time.Duration
	CookieDomain               string
	CookieSecure               bool
	GoogleClientID             string
	TurnstileSiteKey           string
	TurnstileSecretKey         string
	TurnstileRequired          bool
	N8NAPIKey                  string
	HermesAPIKey               string
	JournalAPIKey              string
	GowaWebhookURL             string
	GowaUsername               string
	GowaPassword               string
	TelegramBotToken           string
	TelegramChatID             string
	TelegramWebhookSecret      string
	TelegramAdminUserMap       string
	TelegramN8NWebhookURL      string
	TelegramN8NWebhookSecret   string
	N8NReportWebhookURL        string
	N8NReportWebhookSecret     string
	AllowPrivateWebhookTargets bool
	BackupDir                  string
	BackupJobTimeout           time.Duration
	BackupArtifactTTL          time.Duration
	BackupMaxSizeBytes         int64
	BackupN8NAPIKey            string
	BackupRestoreEnabled       bool
	BackupRetentionDays        int
	BackupDumpBinary           string
	BackupRestoreBinary        string
}

func Load() (Config, error) {
	c := Config{
		AppEnv:                     env("APP_ENV", "development"),
		AppPort:                    env("APP_PORT", "8080"),
		AppVersion:                 env("APP_VERSION", "migration-dev"),
		AppTimezone:                env("APP_TIMEZONE", "Asia/Jakarta"),
		AppURL:                     env("APP_URL", "http://localhost:8080"),
		StaticDir:                  env("STATIC_DIR", "./dist"),
		FrontendOrigins:            env("FRONTEND_ORIGINS", "http://localhost:5173"),
		DBDriver:                   strings.ToLower(env("DB_DRIVER", "mysql")),
		DBHost:                     env("DB_HOST", "127.0.0.1"),
		DBPort:                     env("DB_PORT", "3306"),
		DBName:                     env("DB_NAME", "geopresensi"),
		DBPath:                     env("DB_PATH", "./data/geopresensi.db"),
		DBUser:                     env("DB_USER", "geopresensi"),
		DBPass:                     os.Getenv("DB_PASS"),
		DBMaxOpenConns:             envInt("DB_MAX_OPEN_CONNS", 20),
		DBMaxIdleConns:             envInt("DB_MAX_IDLE_CONNS", 10),
		DBConnMaxLifetime:          time.Duration(envInt("DB_CONN_MAX_LIFETIME_MINUTES", 30)) * time.Minute,
		DBConnMaxIdleTime:          time.Duration(envInt("DB_CONN_MAX_IDLE_TIME_MINUTES", 5)) * time.Minute,
		DBConnectTimeout:           envDuration("DB_CONNECT_TIMEOUT", 5*time.Second),
		DBReadTimeout:              envDuration("DB_READ_TIMEOUT", 10*time.Second),
		DBWriteTimeout:             envDuration("DB_WRITE_TIMEOUT", 10*time.Second),
		JWTIssuer:                  env("JWT_ISSUER", "geopresensi"),
		JWTAudience:                env("JWT_AUDIENCE", "geopresensi-web"),
		JWTSecret:                  os.Getenv("JWT_SECRET"),
		JWTAccessTTL:               time.Duration(envInt("JWT_ACCESS_TTL_MINUTES", 15)) * time.Minute,
		JWTRefreshTTL:              time.Duration(envInt("JWT_REFRESH_TTL_DAYS", 30)) * 24 * time.Hour,
		CookieDomain:               os.Getenv("COOKIE_DOMAIN"),
		CookieSecure:               envBool("COOKIE_SECURE", false),
		GoogleClientID:             os.Getenv("GOOGLE_CLIENT_ID"),
		TurnstileSiteKey:           os.Getenv("TURNSTILE_SITE_KEY"),
		TurnstileSecretKey:         os.Getenv("TURNSTILE_SECRET_KEY"),
		TurnstileRequired:          envBool("TURNSTILE_REQUIRED", false),
		N8NAPIKey:                  os.Getenv("N8N_API_KEY"),
		HermesAPIKey:               os.Getenv("HERMES_API_KEY"),
		JournalAPIKey:              os.Getenv("JOURNAL_API_KEY"),
		GowaWebhookURL:             os.Getenv("GOWA_WEBHOOK_URL"),
		GowaUsername:               os.Getenv("GOWA_USERNAME"),
		GowaPassword:               os.Getenv("GOWA_PASSWORD"),
		TelegramBotToken:           strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN")),
		TelegramChatID:             strings.TrimSpace(os.Getenv("TELEGRAM_CHAT_ID")),
		TelegramWebhookSecret:      strings.TrimSpace(os.Getenv("TELEGRAM_WEBHOOK_SECRET")),
		TelegramAdminUserMap:       strings.TrimSpace(os.Getenv("TELEGRAM_ADMIN_USER_MAP")),
		TelegramN8NWebhookURL:      strings.TrimSpace(os.Getenv("TELEGRAM_N8N_WEBHOOK_URL")),
		TelegramN8NWebhookSecret:   strings.TrimSpace(os.Getenv("TELEGRAM_N8N_WEBHOOK_SECRET")),
		N8NReportWebhookURL:        strings.TrimSpace(os.Getenv("N8N_MONTHLY_PERFORMANCE_WEBHOOK_URL")),
		N8NReportWebhookSecret:     strings.TrimSpace(os.Getenv("N8N_MONTHLY_PERFORMANCE_WEBHOOK_SECRET")),
		AllowPrivateWebhookTargets: envBool("ALLOW_PRIVATE_WEBHOOK_TARGETS", false),
		BackupDir:                  env("BACKUP_DIR", "./data/backups"),
		BackupJobTimeout:           envDuration("BACKUP_JOB_TIMEOUT", 30*time.Minute),
		BackupArtifactTTL:          envDuration("BACKUP_ARTIFACT_TTL", 24*time.Hour),
		BackupMaxSizeBytes:         int64(envInt("BACKUP_MAX_SIZE_MB", 2048)) * 1024 * 1024,
		BackupN8NAPIKey:            os.Getenv("BACKUP_N8N_API_KEY"),
		BackupRestoreEnabled:       envBool("BACKUP_RESTORE_ENABLED", false),
		BackupRetentionDays:        envInt("BACKUP_RETENTION_DAYS", 30),
		BackupDumpBinary:           env("BACKUP_DUMP_BINARY", "mysqldump"),
		BackupRestoreBinary:        env("BACKUP_RESTORE_BINARY", "mysql"),
	}

	if c.IsSecureEnvironment() && len(c.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET minimal 32 karakter di staging/production")
	}
	if c.IsSecureEnvironment() && !c.CookieSecure {
		return Config{}, fmt.Errorf("COOKIE_SECURE harus true di staging/production")
	}
	if c.IsSecureEnvironment() && strings.TrimSpace(c.DBPass) == "" {
		return Config{}, fmt.Errorf("DB_PASS wajib diisi di staging/production")
	}
	if c.DBDriver != "mysql" && c.DBDriver != "sqlite" {
		return Config{}, fmt.Errorf("DB_DRIVER harus mysql atau sqlite")
	}
	if c.IsSecureEnvironment() && c.DBDriver != "mysql" {
		return Config{}, fmt.Errorf("DB_DRIVER harus mysql di staging/production")
	}
	if c.DBDriver == "sqlite" && strings.TrimSpace(c.DBPath) == "" {
		return Config{}, fmt.Errorf("DB_PATH wajib diisi saat DB_DRIVER=sqlite")
	}
	if c.IsSecureEnvironment() {
		if !isHTTPSOrigin(c.AppURL) {
			return Config{}, fmt.Errorf("APP_URL harus menggunakan HTTPS di staging/production")
		}
		for _, origin := range strings.Split(c.FrontendOrigins, ",") {
			if !isHTTPSOrigin(origin) {
				return Config{}, fmt.Errorf("FRONTEND_ORIGINS harus berisi origin HTTPS di staging/production")
			}
		}
	}
	if c.TurnstileRequired && strings.TrimSpace(c.TurnstileSecretKey) == "" {
		return Config{}, fmt.Errorf("TURNSTILE_SECRET_KEY wajib diisi saat TURNSTILE_REQUIRED=true")
	}
	if c.TurnstileRequired && strings.TrimSpace(c.TurnstileSiteKey) == "" {
		return Config{}, fmt.Errorf("TURNSTILE_SITE_KEY wajib diisi saat TURNSTILE_REQUIRED=true")
	}
	if c.IsSecureEnvironment() && c.JournalAPIKey != "" && len(c.JournalAPIKey) < 32 {
		return Config{}, fmt.Errorf("JOURNAL_API_KEY minimal 32 karakter")
	}
	gowaConfigured := c.GowaWebhookURL != "" || c.GowaUsername != "" || c.GowaPassword != ""
	if gowaConfigured && (c.GowaWebhookURL == "" || c.GowaUsername == "" || c.GowaPassword == "") {
		return Config{}, fmt.Errorf("GOWA_WEBHOOK_URL, GOWA_USERNAME, dan GOWA_PASSWORD harus diisi bersama")
	}
	telegramChatIDs := 0
	for _, chatID := range strings.Split(c.TelegramChatID, ",") {
		if strings.TrimSpace(chatID) != "" {
			telegramChatIDs++
		}
	}
	n8nTelegramConfigured := c.TelegramN8NWebhookURL != "" || c.TelegramN8NWebhookSecret != ""
	if n8nTelegramConfigured {
		if c.TelegramN8NWebhookURL == "" || c.TelegramN8NWebhookSecret == "" {
			return Config{}, fmt.Errorf("TELEGRAM_N8N_WEBHOOK_URL dan TELEGRAM_N8N_WEBHOOK_SECRET harus diisi bersama")
		}
		webhookURL, err := url.ParseRequestURI(c.TelegramN8NWebhookURL)
		if err != nil || webhookURL.Host == "" || webhookURL.Scheme != "https" && webhookURL.Scheme != "http" {
			return Config{}, fmt.Errorf("TELEGRAM_N8N_WEBHOOK_URL harus berupa URL HTTP atau HTTPS yang valid")
		}
		if len(c.TelegramN8NWebhookSecret) < 32 || len(c.TelegramN8NWebhookSecret) > 256 {
			return Config{}, fmt.Errorf("TELEGRAM_N8N_WEBHOOK_SECRET harus berisi 32 sampai 256 karakter")
		}
		for _, char := range c.TelegramN8NWebhookSecret {
			if !(char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || char >= '0' && char <= '9' || char == '_' || char == '-') {
				return Config{}, fmt.Errorf("TELEGRAM_N8N_WEBHOOK_SECRET hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung")
			}
		}
	}
	monthlyPerformanceWebhookConfigured := c.N8NReportWebhookURL != "" || c.N8NReportWebhookSecret != ""
	if monthlyPerformanceWebhookConfigured {
		if c.N8NReportWebhookURL == "" || c.N8NReportWebhookSecret == "" {
			return Config{}, fmt.Errorf("N8N_MONTHLY_PERFORMANCE_WEBHOOK_URL dan N8N_MONTHLY_PERFORMANCE_WEBHOOK_SECRET harus diisi bersama")
		}
		webhookURL, err := url.ParseRequestURI(c.N8NReportWebhookURL)
		if err != nil || webhookURL.Host == "" || webhookURL.Scheme != "https" && webhookURL.Scheme != "http" {
			return Config{}, fmt.Errorf("N8N_MONTHLY_PERFORMANCE_WEBHOOK_URL harus berupa URL HTTP atau HTTPS yang valid")
		}
		if c.IsSecureEnvironment() && webhookURL.Scheme != "https" {
			return Config{}, fmt.Errorf("N8N_MONTHLY_PERFORMANCE_WEBHOOK_URL harus menggunakan HTTPS di staging/production")
		}
		if len(c.N8NReportWebhookSecret) < 32 || len(c.N8NReportWebhookSecret) > 256 {
			return Config{}, fmt.Errorf("N8N_MONTHLY_PERFORMANCE_WEBHOOK_SECRET harus berisi 32 sampai 256 karakter")
		}
		for _, char := range c.N8NReportWebhookSecret {
			if !(char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || char >= '0' && char <= '9' || char == '_' || char == '-') {
				return Config{}, fmt.Errorf("N8N_MONTHLY_PERFORMANCE_WEBHOOK_SECRET hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung")
			}
		}
	}
	telegramConfigured := c.TelegramBotToken != "" || telegramChatIDs > 0 || n8nTelegramConfigured
	if telegramConfigured && (c.TelegramBotToken == "" || telegramChatIDs == 0) {
		return Config{}, fmt.Errorf("TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID harus diisi bersama")
	}
	telegramWebhookConfigured := c.TelegramWebhookSecret != "" || c.TelegramAdminUserMap != ""
	if telegramWebhookConfigured {
		if c.TelegramWebhookSecret == "" || c.TelegramAdminUserMap == "" || !telegramConfigured {
			return Config{}, fmt.Errorf("TELEGRAM_WEBHOOK_SECRET dan TELEGRAM_ADMIN_USER_MAP harus diisi bersama TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID")
		}
		if len(c.TelegramWebhookSecret) < 32 || len(c.TelegramWebhookSecret) > 256 {
			return Config{}, fmt.Errorf("TELEGRAM_WEBHOOK_SECRET harus berisi 32 sampai 256 karakter")
		}
		for _, char := range c.TelegramWebhookSecret {
			if !(char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || char >= '0' && char <= '9' || char == '_' || char == '-') {
				return Config{}, fmt.Errorf("TELEGRAM_WEBHOOK_SECRET hanya boleh berisi huruf, angka, garis bawah, atau tanda hubung")
			}
		}
		if err := validateTelegramAdminUserMap(c.TelegramAdminUserMap); err != nil {
			return Config{}, err
		}
	}
	if c.JWTSecret == "" {
		c.JWTSecret = "development-only-change-this-secret-before-production"
	}
	if c.DBMaxOpenConns < 1 || c.DBMaxIdleConns < 0 || c.DBMaxIdleConns > c.DBMaxOpenConns {
		return Config{}, fmt.Errorf("konfigurasi connection pool tidak valid")
	}
	if c.DBConnMaxLifetime < 0 || c.DBConnMaxIdleTime < 0 || c.DBConnectTimeout <= 0 || c.DBReadTimeout <= 0 || c.DBWriteTimeout <= 0 {
		return Config{}, fmt.Errorf("konfigurasi timeout database tidak valid")
	}
	if c.AppTimezone == "" {
		return Config{}, fmt.Errorf("APP_TIMEZONE tidak boleh kosong")
	}
	if _, err := time.LoadLocation(c.AppTimezone); err != nil {
		return Config{}, fmt.Errorf("timezone tidak valid: %w", err)
	}
	if strings.TrimSpace(c.BackupDir) == "" || c.BackupJobTimeout <= 0 || c.BackupArtifactTTL <= 0 || c.BackupMaxSizeBytes <= 0 || c.BackupRetentionDays <= 0 {
		return Config{}, fmt.Errorf("konfigurasi backup tidak valid")
	}
	if c.IsSecureEnvironment() && c.BackupN8NAPIKey != "" && len(c.BackupN8NAPIKey) < 32 {
		return Config{}, fmt.Errorf("BACKUP_N8N_API_KEY minimal 32 karakter")
	}
	return c, nil
}

func (c Config) ListenAddress() string { return ":" + c.AppPort }

func (c Config) IsProduction() bool { return strings.EqualFold(c.AppEnv, "production") }

func (c Config) IsSecureEnvironment() bool {
	return c.IsProduction() || strings.EqualFold(c.AppEnv, "staging")
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value == 0 {
		return fallback
	}
	return value
}

func envDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func validateTelegramAdminUserMap(value string) error {
	seen := make(map[uint64]struct{})
	for _, entry := range strings.Split(value, ",") {
		parts := strings.Split(strings.TrimSpace(entry), ":")
		if len(parts) != 2 {
			return fmt.Errorf("TELEGRAM_ADMIN_USER_MAP harus berupa telegram_user_id:admin_user_id dipisahkan koma")
		}
		telegramID, telegramErr := strconv.ParseUint(strings.TrimSpace(parts[0]), 10, 64)
		adminID, adminErr := strconv.ParseUint(strings.TrimSpace(parts[1]), 10, strconv.IntSize)
		if telegramErr != nil || telegramID == 0 || adminErr != nil || adminID == 0 {
			return fmt.Errorf("TELEGRAM_ADMIN_USER_MAP harus berisi ID numerik positif")
		}
		if _, exists := seen[telegramID]; exists {
			return fmt.Errorf("TELEGRAM_ADMIN_USER_MAP tidak boleh memiliki telegram_user_id duplikat")
		}
		seen[telegramID] = struct{}{}
	}
	return nil
}

func envBool(key string, fallback bool) bool {
	value, err := strconv.ParseBool(os.Getenv(key))
	if err != nil {
		return fallback
	}
	return value
}

func isHTTPSOrigin(value string) bool {
	parsed, err := url.Parse(strings.TrimSpace(value))
	return err == nil && parsed.Scheme == "https" && parsed.Host != "" && parsed.User == nil
}
