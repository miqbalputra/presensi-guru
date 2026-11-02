package compat

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/griyaquran/geopresensi/backend/internal/models"
)

func teacherLeaveUpdates(user models.User, body map[string]any, now time.Time) (map[string]any, error) {
	raw, supplied := body["isOnLeave"]
	if !supplied {
		return nil, nil
	}
	onLeave, ok := raw.(bool)
	if !ok {
		return nil, fmt.Errorf("Status cuti harus berupa boolean")
	}
	if onLeave == user.IsOnLeave {
		return nil, nil
	}
	periods := user.LeaveHistory()
	today := now.Format("2006-01-02")
	if onLeave {
		start := stringValue(body, "leaveStartDate")
		if start == "" {
			start = today
		}
		if _, err := time.Parse("2006-01-02", start); err != nil || start > today {
			return nil, fmt.Errorf("Tanggal mulai cuti harus valid dan tidak melebihi hari ini")
		}
		for _, p := range periods {
			if p.EndDate == "" || start < p.EndDate {
				return nil, fmt.Errorf("Periode cuti bertumpang tindih dengan riwayat sebelumnya")
			}
		}
		periods = append(periods, models.TeacherLeavePeriod{StartDate: start})
	} else {
		for i := range periods {
			if periods[i].EndDate == "" {
				periods[i].EndDate = today
			}
		}
	}
	encoded, err := json.Marshal(periods)
	if err != nil {
		return nil, err
	}
	return map[string]any{"is_on_leave": onLeave, "leave_periods": string(encoded)}, nil
}

func teacherLeaveError() error {
	return fiber.NewError(fiber.StatusConflict, "Guru sedang cuti pada tanggal ini dan tidak perlu melakukan presensi. Hubungi admin untuk mengaktifkan kembali.")
}

func teacherLeaveAttendance(user models.User, date string) map[string]any {
	return map[string]any{"id": fmt.Sprintf("cuti-%d-%s", user.ID, date), "userId": user.ID, "nama": user.Nama, "tanggal": date, "status": "cuti", "jamMasuk": nil, "jamPulang": nil, "keterangan": "Cuti — tidak perlu presensi sampai diaktifkan kembali oleh admin", "metode": "cuti"}
}
