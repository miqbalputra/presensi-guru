import { useEffect, useState } from 'react'
import { getAttendanceRevisionPeriod } from '../utils/attendanceRevisionPeriod'

export function useAttendanceRevisionPeriod() {
  const [now, setNow] = useState(() => new Date())
  const period = getAttendanceRevisionPeriod(now)

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const nextMidnight = new Date(`${period.today}T00:00:00+07:00`).getTime() + 86400000
    const timer = window.setTimeout(refresh, Math.max(0, nextMidnight - Date.now()) + 50)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [period.today])

  return period
}
