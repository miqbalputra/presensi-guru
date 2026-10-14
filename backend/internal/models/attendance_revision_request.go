package models

import "time"

// AttendanceRevisionRequest stores a teacher's proposed change separately
// from the attendance record until an administrator approves it.
type AttendanceRevisionRequest struct {
	ID           uint       `gorm:"column:id;primaryKey" json:"id"`
	UserID       uint       `gorm:"column:user_id;not null;index:idx_attendance_revision_user_date,priority:1" json:"userId"`
	AttendanceID *uint      `gorm:"column:attendance_id" json:"attendanceId,omitempty"`
	Tanggal      time.Time  `gorm:"column:tanggal;type:date;not null;index:idx_attendance_revision_user_date,priority:2" json:"tanggal"`
	Alasan       string     `gorm:"column:alasan;size:32;not null" json:"alasan"`
	JamMasuk     *string    `gorm:"column:jam_masuk;type:time" json:"jamMasuk,omitempty"`
	JamPulang    *string    `gorm:"column:jam_pulang;type:time" json:"jamPulang,omitempty"`
	Status       string     `gorm:"column:status;size:16;not null;index:idx_attendance_revision_status_created,priority:1" json:"status"`
	CatatanAdmin *string    `gorm:"column:catatan_admin;type:text" json:"catatanAdmin,omitempty"`
	ReviewedBy   *uint      `gorm:"column:reviewed_by" json:"reviewedBy,omitempty"`
	ReviewedAt   *time.Time `gorm:"column:reviewed_at" json:"reviewedAt,omitempty"`
	PendingKey   *string    `gorm:"column:pending_key;size:64;uniqueIndex:uq_attendance_revision_pending" json:"-"`
	CreatedAt    time.Time  `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}

func (AttendanceRevisionRequest) TableName() string { return "attendance_revision_requests" }
