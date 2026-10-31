import { Notice } from '../ui/page'
import { useEffect, useState } from 'react'
import { Calendar, TrendingUp, Clock, AlertCircle, CheckCircle, FileText, UserX, Inbox, PencilLine, Send, Timer, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDateForInput, formatDisplayDate } from '../../utils/dateUtils'
import { useGuruReport } from '../../hooks/useGuruReport'
import { teacherAttendanceRevisionAPI } from '../../services/api'
import { AppDialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { attendanceRevisionReasons, attendanceRevisionReasonLabel, isAbsenceRevision } from '../../utils/attendanceRevision'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

function GuruStatistik({ user }) {
  const [filter, setFilter] = useState('bulan_ini')
  const [revisionRequests, setRevisionRequests] = useState<any[]>([])
  const [eligibleRevisionDates, setEligibleRevisionDates] = useState<string[]>([])
  const [revisionRefresh, setRevisionRefresh] = useState(0)
  const [revisionDialog, setRevisionDialog] = useState<any>(null)
  const [revisionDraft, setRevisionDraft] = useState({ alasan: 'lupa', jamMasuk: '', jamPulang: '' })
  const [revisionSaving, setRevisionSaving] = useState(false)
  const [revisionMessage, setRevisionMessage] = useState({ type: '', text: '' })

  const getPeriodRange = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    switch (filter) {
      case 'bulan_ini':
        return {
          startDate: formatDateForInput(new Date(currentYear, currentMonth, 1)),
          endDate: formatDateForInput(new Date(currentYear, currentMonth + 1, 0)),
        }
      case 'bulan_lalu': {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return {
          startDate: formatDateForInput(new Date(lastMonthYear, lastMonth, 1)),
          endDate: formatDateForInput(new Date(lastMonthYear, lastMonth + 1, 0)),
        }
      }
      case '3_bulan': {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        return {
          startDate: formatDateForInput(threeMonthsAgo),
          endDate: formatDateForInput(today),
        }
      }
      case 'tahun_ini':
        return {
          startDate: formatDateForInput(new Date(currentYear, 0, 1)),
          endDate: formatDateForInput(today),
        }
      default:
        return {
          startDate: formatDateForInput(new Date(currentYear, currentMonth, 1)),
          endDate: formatDateForInput(new Date(currentYear, currentMonth + 1, 0)),
        }
    }
  }

  const { startDate, endDate } = getPeriodRange()

  useEffect(() => {
    let active = true
    teacherAttendanceRevisionAPI.getMine(startDate, endDate)
      .then((response) => {
        if (!active) return
        setRevisionRequests(response.data?.requests || [])
        setEligibleRevisionDates(response.data?.eligibleDates || [])
      })
      .catch((error) => {
        if (active) setRevisionMessage({ type: 'error', text: error.message || 'Status pengajuan belum dapat dimuat.' })
      })
    return () => { active = false }
  }, [user?.id, startDate, endDate, revisionRefresh])

  // Sumber data tunggal: sama dengan Admin "Download Laporan" dan Guru "Riwayat".
  const { loading, error, retry, getGuruReportRows, getGuruSummary } = useGuruReport(user, startDate, endDate, {
    allGuru: false,
  })

  const summary = user?.id
    ? getGuruSummary(user.id)
    : { totalHari: 0, hadir: 0, izin: 0, sakit: 0, alfa: 0, persentase: 0 }

  const displayData = user?.id
    ? getGuruReportRows(user.id).slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
    : []

  const totalPresensi = summary.totalHari || 0
  const totalHadir = summary.hadir || 0
  const totalIzin = summary.izin || 0
  const totalSakit = summary.sakit || 0
  const totalAlfa = summary.alfa || 0
  const totalTerlambat = displayData.filter((log) => log.status === 'hadir_terlambat').length

  const persentaseHadir = totalPresensi > 0 ? ((totalHadir / totalPresensi) * 100).toFixed(1) : 0
  const persentaseTerlambat = totalPresensi > 0 ? ((totalTerlambat / totalPresensi) * 100).toFixed(1) : 0

  const getPeriodeLabel = () => {
    switch (filter) {
      case 'bulan_ini':
        return 'Bulan Ini'
      case 'bulan_lalu':
        return 'Bulan Lalu'
      case '3_bulan':
        return '3 Bulan Terakhir'
      case 'tahun_ini':
        return 'Tahun Ini'
      default:
        return 'Bulan Ini'
    }
  }

  const getJamMasuk = (log) => log.jamMasuk || log.jam_masuk || log.jamHadir || log.jam_hadir || '-'
  const getJamPulang = (log) => log.jamPulang || log.jam_pulang || '-'
  const requestByDate = new Map<string, any>()
  revisionRequests.forEach((request) => {
    if (!requestByDate.has(request.tanggal)) requestByDate.set(request.tanggal, request)
  })

  const openRevisionDialog = (log, existing = null) => {
    setRevisionDialog({ tanggal: log.tanggal, existing })
    setRevisionDraft({
      alasan: existing?.alasan || 'lupa',
      jamMasuk: existing?.jamMasuk ? String(existing.jamMasuk).slice(0, 5) : '',
      jamPulang: existing?.jamPulang ? String(existing.jamPulang).slice(0, 5) : '',
    })
    setRevisionMessage({ type: '', text: '' })
  }

  const saveRevision = async (event) => {
    event.preventDefault()
    if (!revisionDialog || revisionSaving) return
    const jamMasuk = revisionDraft.jamMasuk.trim()
    const jamPulang = revisionDraft.jamPulang.trim()
    const absenceRevision = isAbsenceRevision(revisionDraft.alasan)
    const row = displayData.find((item) => item.tanggal === revisionDialog.tanggal)
    const hasCurrentCheckIn = row ? getJamMasuk(row) !== '-' : Boolean(revisionDialog.existing?.currentJamMasuk)
    if (!absenceRevision && !jamMasuk && !jamPulang) {
      setRevisionMessage({ type: 'error', text: 'Mohon isi jam masuk, jam pulang, atau keduanya.' })
      return
    }
    if (!absenceRevision && !jamMasuk && !hasCurrentCheckIn) {
      setRevisionMessage({ type: 'error', text: 'Jam masuk sebenarnya wajib diisi karena tanggal ini belum memiliki catatan jam masuk.' })
      return
    }
    if (!absenceRevision && jamMasuk && jamPulang && jamPulang < jamMasuk) {
      setRevisionMessage({ type: 'error', text: 'Jam pulang tidak boleh lebih awal daripada jam masuk.' })
      return
    }
    setRevisionSaving(true)
    setRevisionMessage({ type: '', text: '' })
    try {
      const payload = { alasan: revisionDraft.alasan, jamMasuk: absenceRevision ? '' : jamMasuk, jamPulang: absenceRevision ? '' : jamPulang }
      if (revisionDialog.existing) {
        await teacherAttendanceRevisionAPI.update(revisionDialog.existing.id, payload)
      } else {
        await teacherAttendanceRevisionAPI.create({ ...payload, tanggal: revisionDialog.tanggal })
      }
      setRevisionDialog(null)
      setRevisionMessage({ type: 'success', text: 'Pengajuan revisi berhasil dikirim. Presensi akan diperbarui setelah disetujui admin.' })
      setRevisionRefresh((value) => value + 1)
    } catch (error) {
      setRevisionMessage({ type: 'error', text: error.message || 'Pengajuan belum berhasil disimpan. Silakan coba kembali.' })
    } finally {
      setRevisionSaving(false)
    }
  }

  const statusRequest = (status) => {
    if (status === 'pending') return { label: 'Menunggu admin', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' }
    if (status === 'approved') return { label: 'Disetujui', className: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' }
    return { label: 'Ditolak', className: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' }
  }
  const revisionRow = revisionDialog && displayData.find((row) => row.tanggal === revisionDialog.tanggal)
  const revisionHasCurrentCheckIn = Boolean(revisionDialog?.existing?.currentJamMasuk) || Boolean(revisionRow && getJamMasuk(revisionRow) !== '-')

  const getStatusLabel = (status = '') => {
    if (status === 'hadir') return 'Hadir'
    if (status === 'hadir_terlambat') return 'Terlambat'
    if (status === 'hadir_izin_terlambat') return 'Izin Terlambat'
    if (status === 'izin') return 'Izin'
    if (status === 'sakit') return 'Sakit'
    if (status === 'alfa') return 'Alfa'
    if (status === 'libur') return 'Libur'
    if (status === 'libur_override') return 'Libur Khusus'
    if (status === 'opsional') return 'Opsional'
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-'
  }

  const getStatusClass = (status) => `px-3 py-1 rounded-full text-xs font-semibold
    ${status === 'hadir' ? 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' : ''}
    ${status === 'hadir_terlambat' ? 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300' : ''}
    ${status === 'hadir_izin_terlambat' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
    ${status === 'izin' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
    ${status === 'sakit' ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' : ''}
    ${status === 'alfa' ? 'bg-slate-200 dark:bg-slate-600/30 text-slate-800 dark:text-slate-300' : ''}
    ${status === 'libur' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
    ${status === 'libur_override' ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300' : ''}
    ${status === 'opsional' ? 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300' : ''}`

  const stats = [
    {
      label: 'Total Hadir',
      sublabel: '(Termasuk Terlambat & Opsional)',
      value: totalHadir,
      icon: CheckCircle,
      color: 'bg-green-500',
      darkColor: 'dark:bg-green-500/20',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-500/10',
      textColor: 'text-green-600',
      darkTextColor: 'dark:text-green-400',
      percentage: totalPresensi > 0 ? ((totalHadir / totalPresensi) * 100).toFixed(1) : 0,
    },
    {
      label: 'Terlambat',
      sublabel: '(Dari Total Hadir)',
      value: totalTerlambat,
      icon: Clock,
      color: 'bg-yellow-500',
      darkColor: 'dark:bg-yellow-500/20',
      bgColor: 'bg-yellow-50',
      darkBgColor: 'dark:bg-yellow-500/10',
      textColor: 'text-yellow-600',
      darkTextColor: 'dark:text-yellow-400',
      percentage: totalHadir > 0 ? ((totalTerlambat / totalHadir) * 100).toFixed(1) : 0,
    },
    {
      label: 'Izin',
      sublabel: '',
      value: totalIzin,
      icon: FileText,
      color: 'bg-blue-500',
      darkColor: 'dark:bg-blue-500/20',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-500/10',
      textColor: 'text-blue-600',
      darkTextColor: 'dark:text-blue-400',
      percentage: totalPresensi > 0 ? ((totalIzin / totalPresensi) * 100).toFixed(1) : 0,
    },
    {
      label: 'Sakit',
      sublabel: '',
      value: totalSakit,
      icon: UserX,
      color: 'bg-red-500',
      darkColor: 'dark:bg-red-500/20',
      bgColor: 'bg-red-50',
      darkBgColor: 'dark:bg-red-500/10',
      textColor: 'text-red-600',
      darkTextColor: 'dark:text-red-400',
      percentage: totalPresensi > 0 ? ((totalSakit / totalPresensi) * 100).toFixed(1) : 0,
    },
    {
      label: 'Alfa',
      sublabel: '(Tidak Presensi)',
      value: totalAlfa,
      icon: AlertCircle,
      color: 'bg-gray-600',
      darkColor: 'dark:bg-slate-400/20',
      bgColor: 'bg-gray-50',
      darkBgColor: 'dark:bg-slate-400/10',
      textColor: 'text-gray-700',
      darkTextColor: 'dark:text-slate-300',
      percentage: totalPresensi > 0 ? ((totalAlfa / totalPresensi) * 100).toFixed(1) : 0,
    },
  ]

  if (error) return <Notice onRetry={retry}>{error}</Notice>

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400" />
        </div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Memuat statistik...</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <motion.section
        variants={itemVariants}
        className="guru-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        aria-labelledby="statistik-title"
      >
        <div>
          <h2 id="statistik-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">Statistik Kehadiran Saya</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Periode: <span className="font-semibold text-slate-700 dark:text-slate-300">{getPeriodeLabel()}</span></p>
        </div>
        <div className="relative">
          <select
            aria-label="Pilih periode statistik"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="bulan_ini">Bulan Ini</option>
            <option value="bulan_lalu">Bulan Lalu</option>
            <option value="3_bulan">3 Bulan Terakhir</option>
            <option value="tahun_ini">Tahun Ini</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
        </div>
      </motion.section>

      {/* Hero persentase */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white dark:bg-slate-800"
        aria-labelledby="persentase-kehadiran-title"
      >
        <div className="relative flex items-center justify-between">
          <div>
            <p id="persentase-kehadiran-title" className="text-xs font-semibold uppercase tracking-wider text-blue-100">Persentase Kehadiran</p>
            <p className="mt-2 text-5xl font-black tracking-tight">{persentaseHadir}%</p>
            <p className="mt-2 text-sm text-blue-100">
              {totalHadir} dari {totalPresensi} hari kerja
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Persentase kehadiran" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(persentaseHadir)}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${persentaseHadir}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-white"
          />
        </div>
      </motion.section>

      {/* Stat cards */}
      <motion.section variants={containerVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Rincian statistik kehadiran">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className={`relative overflow-hidden rounded-2xl border border-slate-100 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors dark:border-slate-800 dark:shadow-none ${stat.bgColor} ${stat.darkBgColor}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color} ${stat.darkColor}`}>
                <stat.icon className="h-4 w-4 text-white dark:text-current" />
              </div>
            </div>
            <p className={`text-sm font-semibold ${stat.textColor} ${stat.darkTextColor}`}>{stat.label}</p>
            {stat.sublabel && <p className="text-xs text-slate-400 dark:text-slate-500">{stat.sublabel}</p>}
            <p className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${stat.color} ${stat.darkColor}`}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
              {stat.percentage}% {stat.sublabel ? 'dari hadir' : 'dari total'}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {totalTerlambat > 0 && (
        <motion.div variants={itemVariants} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Catatan Keterlambatan</h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300/80">
              Anda terlambat sebanyak <strong>{totalTerlambat} kali</strong> ({persentaseTerlambat}%) dalam periode ini. Usahakan datang tepat waktu agar tidak terlambat.
            </p>
          </div>
        </motion.div>
      )}

      <motion.section variants={itemVariants} className="guru-surface overflow-hidden" aria-labelledby="statistik-riwayat-title">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 id="statistik-riwayat-title" className="text-base font-bold text-slate-800 dark:text-slate-100">Riwayat Presensi {getPeriodeLabel()}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Termasuk presensi opsional, alfa, dan libur</p>
        </div>
        <div className="overflow-x-auto">
          <table className="guru-records-table w-full" aria-label="Riwayat presensi pada periode statistik">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan', 'Revisi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayData.map((log) => (
                (() => {
                  const request = requestByDate.get(log.tanggal)
                  const eligible = filter === 'bulan_ini' && eligibleRevisionDates.includes(log.tanggal)
                  const requestStatus = request ? statusRequest(request.status) : null
                  return (
                <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td data-label="Tanggal" className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{log.tanggal}</td>
                  <td data-label="Jam masuk" className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{getJamMasuk(log)}</td>
                  <td data-label="Jam pulang" className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{getJamPulang(log)}</td>
                  <td data-label="Status" className="whitespace-nowrap px-5 py-3.5">
                    <span className={getStatusClass(log.status)}>{getStatusLabel(log.status)}</span>
                  </td>
                  <td data-label="Keterangan" className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{log.keterangan || '-'}</td>
                  <td data-label="Revisi" className="min-w-44 px-5 py-3.5 text-sm">
                    {request?.status === 'pending' ? (
                      <div className="space-y-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatus.className}`}>{requestStatus.label}</span>
                        <button type="button" onClick={() => openRevisionDialog(log, request)} className="flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">
                          <PencilLine className="h-4 w-4" /> Edit Pengajuan
                        </button>
                      </div>
                    ) : request ? (
                      <div className="space-y-1.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatus.className}`}>{requestStatus.label}</span>
                        {request.status === 'rejected' && request.catatanAdmin && <p className="max-w-56 text-xs text-red-700 dark:text-red-300">Catatan: {request.catatanAdmin}</p>}
                        {eligible && <button type="button" onClick={() => openRevisionDialog(log)} className="block font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">Ajukan lagi</button>}
                      </div>
                    ) : eligible ? (
                      <button type="button" onClick={() => openRevisionDialog(log)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <PencilLine className="h-4 w-4" /> Ajukan Revisi
                      </button>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                </tr>
                  )
                })()
              ))}
              {displayData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Inbox className="h-7 w-7" />
                      </span>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Belum ada data presensi untuk periode ini</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

      {revisionMessage.text && !revisionDialog && (
        <div role="status" className={`rounded-xl border p-4 text-sm ${revisionMessage.type === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200' : 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200'}`}>
          {revisionMessage.text}
        </div>
      )}

      <motion.section variants={itemVariants} className="guru-surface overflow-hidden" aria-labelledby="pengajuan-saya-title">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Timer className="h-5 w-5" /></span>
            <div><h3 id="pengajuan-saya-title" className="text-base font-bold text-slate-800 dark:text-slate-100">Pengajuan Saya</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Riwayat keputusan dan catatan admin tersedia di sini. Pengajuan menunggu tetap dapat diedit setelah bulan berganti.</p></div>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {revisionRequests.map((request) => {
            const requestStatus = statusRequest(request.status)
            return (
            <div key={request.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-800 dark:text-slate-100">{formatDisplayDate(request.tanggal)}</p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatus.className}`}>{requestStatus.label}</span></div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{attendanceRevisionReasonLabel(request.alasan)}{isAbsenceRevision(request.alasan) ? ' · Pengajuan perubahan status, tanpa jam masuk/pulang.' : ` · Jam masuk: ${request.jamMasuk || request.currentJamMasuk || '-'} · Jam pulang: ${request.jamPulang || request.currentJamPulang || '-'}`}</p>
                {request.status === 'rejected' && request.catatanAdmin && <p className="mt-1 text-sm text-red-700 dark:text-red-300">Catatan admin: {request.catatanAdmin}</p>}
              </div>
              {request.status === 'pending' && <Button type="button" variant="outline" onClick={() => openRevisionDialog({ tanggal: request.tanggal, jamMasuk: request.currentJamMasuk || '-', jamPulang: request.currentJamPulang || '-' }, request)}><PencilLine /> Edit Pengajuan</Button>}
            </div>
          )})}
          {revisionRequests.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">Belum ada pengajuan revisi yang menunggu.</p>
          )}
        </div>
      </motion.section>

      <AppDialog
        open={Boolean(revisionDialog)}
        onOpenChange={(open) => { if (!open) setRevisionDialog(null) }}
        title={revisionDialog?.existing ? 'Edit Pengajuan Revisi' : 'Ajukan Revisi Presensi'}
        description={revisionDialog ? `Tanggal ${formatDisplayDate(revisionDialog.tanggal)}. Pengajuan akan ditinjau admin dan tidak mengubah presensi sebelum disetujui.` : undefined}
        busy={revisionSaving}
        className="max-w-lg"
      >
        {revisionDialog && <form onSubmit={saveRevision} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">Alasan pengajuan</legend>
            {attendanceRevisionReasons.map((reason) => <label key={reason.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${revisionDraft.alasan === reason.value ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
              <input type="radio" name="alasan-revisi" value={reason.value} checked={revisionDraft.alasan === reason.value} onChange={(event) => setRevisionDraft({ ...revisionDraft, alasan: event.target.value, ...(isAbsenceRevision(event.target.value) ? { jamMasuk: '', jamPulang: '' } : {}) })} className="mt-1 accent-blue-600" />
              <span><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{reason.label}</span><span className="text-xs text-slate-500 dark:text-slate-400">{reason.detail}</span></span>
            </label>)}
          </fieldset>
          {isAbsenceRevision(revisionDraft.alasan) ? <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">Mengajukan status <strong>{attendanceRevisionReasonLabel(revisionDraft.alasan)}</strong> untuk tanggal ini. Jam masuk dan pulang tidak diperlukan. Status baru berlaku setelah disetujui admin.</p> : <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Jam sebenarnya <span className="font-normal text-slate-500">(isi satu atau keduanya)</span></p>
            <label className="block space-y-1.5"><span className="text-sm text-slate-600 dark:text-slate-300">Jam masuk {revisionHasCurrentCheckIn ? '(opsional)' : '(wajib karena belum ada catatan masuk)'}</span><input type="time" value={revisionDraft.jamMasuk} onChange={(event) => setRevisionDraft({ ...revisionDraft, jamMasuk: event.target.value })} required={!revisionHasCurrentCheckIn} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
            <label className="block space-y-1.5"><span className="text-sm text-slate-600 dark:text-slate-300">Jam pulang <span className="text-slate-400">(opsional)</span></span><input type="time" value={revisionDraft.jamPulang} onChange={(event) => setRevisionDraft({ ...revisionDraft, jamPulang: event.target.value })} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
          </div>}
          {revisionMessage.text && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{revisionMessage.text}</p>}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={() => setRevisionDialog(null)} disabled={revisionSaving}><X /> Batal</Button><Button type="submit" disabled={revisionSaving}><Send /> {revisionSaving ? 'Mengirim...' : revisionDialog.existing ? 'Simpan Perubahan' : 'Kirim Pengajuan'}</Button></div>
        </form>}
      </AppDialog>

      <motion.div variants={itemVariants} className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <Calendar className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Tips Meningkatkan Kehadiran</h3>
          <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-300/80">
            <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" /> Datang tepat waktu sebelum jam masuk normal</li>
            <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" /> Jangan lupa presensi pulang saat jam pulang sudah dibuka</li>
            <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" /> Jika berhalangan, segera isi presensi izin/sakit dengan keterangan</li>
            <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" /> Cek jadwal piket Anda agar tidak terlambat</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GuruStatistik
