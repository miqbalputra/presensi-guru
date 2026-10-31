export const attendanceRevisionReasons = [
  { value: 'lupa', label: 'Lupa', detail: 'Saya lupa melakukan presensi.' },
  { value: 'kendala_teknis', label: 'Kendala Teknis', detail: 'Saya mengalami kendala saat menggunakan aplikasi.' },
  { value: 'izin', label: 'Izin', detail: 'Saya tidak hadir karena izin pada tanggal ini.' },
  { value: 'sakit', label: 'Sakit', detail: 'Saya tidak hadir karena sakit pada tanggal ini.' },
] as const

export const isAbsenceRevision = (reason: string) => reason === 'izin' || reason === 'sakit'

export const attendanceRevisionReasonLabel = (reason: string) =>
  attendanceRevisionReasons.find((item) => item.value === reason)?.label || reason
