package models

import "time"

type Setting struct {
	ID          uint      `gorm:"column:id;primaryKey" json:"id"`
	Key         string    `gorm:"column:setting_key;uniqueIndex" json:"setting_key"`
	Value       string    `gorm:"column:setting_value" json:"setting_value"`
	Description *string   `gorm:"column:description" json:"description,omitempty"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updated_at"`
	UpdatedBy   *string   `gorm:"column:updated_by" json:"updated_by,omitempty"`
}

func (Setting) TableName() string { return "settings" }

type Holiday struct {
	ID             uint      `gorm:"column:id;primaryKey" json:"id"`
	Tanggal        time.Time `gorm:"column:tanggal;type:date;uniqueIndex" json:"tanggal"`
	Nama           string    `gorm:"column:nama" json:"nama"`
	Jenis          string    `gorm:"column:jenis" json:"jenis"`
	Keterangan     *string   `gorm:"column:keterangan" json:"keterangan,omitempty"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	IsWorkday      bool      `gorm:"column:is_workday" json:"is_workday"`
	JamMasukKhusus *string   `gorm:"column:jam_masuk_khusus" json:"jam_masuk_khusus,omitempty"`
}

func (Holiday) TableName() string { return "holidays" }

type JadwalPiket struct {
	ID             uint      `gorm:"column:id;primaryKey" json:"id"`
	UserID         uint      `gorm:"column:user_id;index" json:"user_id"`
	NamaGuru       string    `gorm:"column:nama_guru" json:"nama_guru"`
	Hari           string    `gorm:"column:hari" json:"hari"`
	JamPiket       *string   `gorm:"column:jam_piket" json:"jam_piket,omitempty"`
	JamPulangPiket *string   `gorm:"column:jam_pulang_piket" json:"jam_pulang_piket,omitempty"`
	Keterangan     *string   `gorm:"column:keterangan" json:"keterangan,omitempty"`
	IsActive       bool      `gorm:"column:is_active" json:"is_active"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (JadwalPiket) TableName() string { return "jadwal_piket" }

type OptionalWorkday struct {
	ID         uint      `gorm:"column:id;primaryKey" json:"id"`
	Tanggal    time.Time `gorm:"column:tanggal;type:date;uniqueIndex" json:"tanggal"`
	Nama       string    `gorm:"column:nama" json:"nama"`
	Keterangan *string   `gorm:"column:keterangan" json:"keterangan,omitempty"`
	CreatedBy  *string   `gorm:"column:created_by" json:"created_by,omitempty"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (OptionalWorkday) TableName() string { return "optional_workdays" }

type WeekendOverride struct {
	ID         uint      `gorm:"column:id;primaryKey" json:"id"`
	UserID     uint      `gorm:"column:user_id;index" json:"user_id"`
	Tanggal    time.Time `gorm:"column:tanggal;type:date;index" json:"tanggal"`
	IsWorkday  bool      `gorm:"column:is_workday" json:"is_workday"`
	Keterangan *string   `gorm:"column:keterangan" json:"keterangan,omitempty"`
	CreatedBy  *string   `gorm:"column:created_by" json:"created_by,omitempty"`
	CreatedAt  time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (WeekendOverride) TableName() string { return "user_weekend_overrides" }

type PengaturanHarian struct {
	Tanggal              time.Time `gorm:"column:tanggal;primaryKey;type:date" json:"tanggal"`
	JamPulangKhusus      *string   `gorm:"column:jam_pulang_khusus" json:"jam_pulang_khusus,omitempty"`
	JamPulangKhususAktif bool      `gorm:"column:jam_pulang_khusus_aktif" json:"jam_pulang_khusus_aktif"`
	JamPulangPiketKhusus *string   `gorm:"column:jam_pulang_piket_khusus" json:"jam_pulang_piket_khusus,omitempty"`
	JamPulangPiketAktif  bool      `gorm:"column:jam_pulang_piket_khusus_aktif" json:"jam_pulang_piket_khusus_aktif"`
	Keterangan           *string   `gorm:"column:keterangan" json:"keterangan,omitempty"`
	UpdatedAt            time.Time `gorm:"column:updated_at" json:"updated_at"`
	UpdatedBy            *string   `gorm:"column:updated_by" json:"updated_by,omitempty"`
}

func (PengaturanHarian) TableName() string { return "pengaturan_harian" }
