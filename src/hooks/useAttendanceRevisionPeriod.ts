import { useEffect, useState, useSyncExternalStore } from 'react'
import { getAttendanceRevisionPeriod } from '../utils/attendanceRevisionPeriod'
import { teacherAttendanceRevisionAPI, type AttendanceRevisionAccess } from '../services/api'

const initialAccess = { access: null as AttendanceRevisionAccess | null, ready: false, error: '' }
let accessSnapshot = initialAccess
const accessListeners = new Set<() => void>()
let accessRequest: Promise<void> | null = null
let accessGeneration = 0
let accessPoll: number | undefined

function publishAccess(access: AttendanceRevisionAccess | null, error = '') {
  if (accessSnapshot.ready && accessSnapshot.error === error && JSON.stringify(accessSnapshot.access) === JSON.stringify(access)) return
  accessSnapshot = { access, ready: true, error }
  accessListeners.forEach((listener) => listener())
}

export function refreshAttendanceRevisionAccess() {
  if (accessRequest) return accessRequest
  const generation = accessGeneration
  accessRequest = teacherAttendanceRevisionAPI.getAccess()
    .then((response) => {
      if (generation === accessGeneration) publishAccess(response.data || null)
    })
    .catch((error) => {
      if (generation === accessGeneration) publishAccess(null, error.message || 'Status akses revisi belum dapat dimuat.')
    })
    .finally(() => { if (generation === accessGeneration) accessRequest = null })
  return accessRequest
}

function refreshVisibleAccess() {
  if (document.visibilityState === 'visible') void refreshAttendanceRevisionAccess()
}

function subscribeAccess(listener: () => void) {
  accessListeners.add(listener)
  if (accessListeners.size === 1) {
    void refreshAttendanceRevisionAccess()
    accessPoll = window.setInterval(refreshVisibleAccess, 5000)
    window.addEventListener('focus', refreshVisibleAccess)
    window.addEventListener('online', refreshVisibleAccess)
    document.addEventListener('visibilitychange', refreshVisibleAccess)
  }
  return () => {
    accessListeners.delete(listener)
    if (accessListeners.size === 0) {
      window.clearInterval(accessPoll)
      window.removeEventListener('focus', refreshVisibleAccess)
      window.removeEventListener('online', refreshVisibleAccess)
      document.removeEventListener('visibilitychange', refreshVisibleAccess)
      accessGeneration++
      accessRequest = null
      accessSnapshot = initialAccess
    }
  }
}

const getAccessSnapshot = () => accessSnapshot

export function useAttendanceRevisionPeriod() {
  const [now, setNow] = useState(() => new Date())
  const access = useSyncExternalStore(subscribeAccess, getAccessSnapshot)
  const period = getAttendanceRevisionPeriod(now, access.access)

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

  return {
    ...period,
    accessReady: access.ready,
    accessError: access.error,
    closedByAdmin: access.access?.periodStart === period.previousMonthStart && access.access.closedByAdmin,
    refreshAccess: refreshAttendanceRevisionAccess,
  }
}
