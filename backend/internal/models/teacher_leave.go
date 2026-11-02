package models

import (
	"encoding/json"
	"time"
)

// EndDate is exclusive: activating a teacher restores attendance for that day.
type TeacherLeavePeriod struct {
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate,omitempty"`
}

func (u User) LeaveHistory() []TeacherLeavePeriod {
	periods := []TeacherLeavePeriod{}
	if u.LeavePeriods != "" {
		_ = json.Unmarshal([]byte(u.LeavePeriods), &periods)
	}
	return periods
}

func (u User) OnLeaveOn(date time.Time) bool {
	day := date.Format("2006-01-02")
	for _, period := range u.LeaveHistory() {
		if day >= period.StartDate && (period.EndDate == "" || day < period.EndDate) {
			return true
		}
	}
	return false
}

func (u User) LeaveStartDate() string {
	if u.IsOnLeave {
		for _, p := range u.LeaveHistory() {
			if p.EndDate == "" {
				return p.StartDate
			}
		}
	}
	return ""
}
