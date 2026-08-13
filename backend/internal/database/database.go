package database

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	sqldriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/griyaquran/geopresensi/backend/internal/config"
)

func Open(cfg config.Config) (*gorm.DB, error) {
	location, err := time.LoadLocation(cfg.AppTimezone)
	if err != nil {
		location = time.FixedZone("WIB", 7*60*60)
	}
	driver := strings.ToLower(strings.TrimSpace(cfg.DBDriver))
	if driver == "" {
		driver = "mysql"
	}

	var db *gorm.DB
	if driver == "sqlite" {
		if cfg.DBPath == "" {
			return nil, fmt.Errorf("DB_PATH wajib diisi saat DB_DRIVER=sqlite")
		}
		if !strings.HasPrefix(cfg.DBPath, ":memory:") && !strings.HasPrefix(cfg.DBPath, "file:") {
			if err := os.MkdirAll(filepath.Dir(cfg.DBPath), 0o755); err != nil {
				return nil, fmt.Errorf("create sqlite directory: %w", err)
			}
		}
		db, err = gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
	} else {
		dsnConfig := sqldriver.Config{User: cfg.DBUser, Passwd: cfg.DBPass, Net: "tcp", Addr: cfg.DBHost + ":" + cfg.DBPort, DBName: cfg.DBName, Params: map[string]string{"charset": "utf8mb4"}, ParseTime: true, Loc: location, Timeout: cfg.DBConnectTimeout, ReadTimeout: cfg.DBReadTimeout, WriteTimeout: cfg.DBWriteTimeout}
		dsn := dsnConfig.FormatDSN()
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	}
	if err != nil {
		return nil, err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	if driver == "sqlite" {
		// SQLite is intentionally single-writer for local development. WAL keeps
		// reads responsive while avoiding lock storms from concurrent requests.
		if err := db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
			return nil, fmt.Errorf("enable sqlite foreign keys: %w", err)
		}
		if err := db.Exec("PRAGMA busy_timeout = 5000").Error; err != nil {
			return nil, fmt.Errorf("configure sqlite busy timeout: %w", err)
		}
		if err := db.Exec("PRAGMA journal_mode = WAL").Error; err != nil {
			return nil, fmt.Errorf("configure sqlite WAL: %w", err)
		}
		sqlDB.SetMaxOpenConns(1)
		sqlDB.SetMaxIdleConns(1)
	} else {
		sqlDB.SetMaxOpenConns(cfg.DBMaxOpenConns)
		sqlDB.SetMaxIdleConns(cfg.DBMaxIdleConns)
	}
	sqlDB.SetConnMaxLifetime(cfg.DBConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.DBConnMaxIdleTime)
	return db, nil
}
