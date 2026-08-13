import { useState, useEffect, useMemo } from 'react'
import { Users, UserCheck, UserX, FileText, AlertCircle, Clock, Search, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react'
import { adminSummaryAPI } from '../../services/api'
import TrenKehadiran from './TrenKehadiran'
import PersentaseKehadiran from './PersentaseKehadiran'
import LeaderboardGuru from './LeaderboardGuru'
import TrenKeterlambatan from './TrenKeterlambatan'
import TrenJamPulang from './TrenJamPulang'
import StatistikLengkap from './StatistikLengkap'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Skeleton } from '../ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

// Format jam "HH:MM:SS" / "HH:MM" → "HH:MM". Nilai kosong/00:00:00/'-' → "-".
function formatTime(t) {
  if (!t || t === '-' || t === '00:00:00') return '-'
  return String(t).substring(0, 5)
}

// Konfigurasi badge status (label + warna) — mencakup semua kemungkinan status.
const STATUS_BADGE = {
  hadir: { label: 'Hadir', cls: 'bg-green-100 text-green-700' },
  hadir_terlambat: { label: 'Terlambat', cls: 'bg-yellow-100 text-yellow-700' },
  hadir_izin_terlambat: { label: 'Izin Terlambat', cls: 'bg-blue-100 text-blue-700' },
  izin: { label: 'Izin', cls: 'bg-sky-100 text-sky-700' },
  sakit: { label: 'Sakit', cls: 'bg-red-100 text-red-700' },
  alfa: { label: 'Alfa', cls: 'bg-slate-200 text-slate-700' },
  libur: { label: 'Libur', cls: 'bg-indigo-100 text-indigo-700' },
  libur_override: { label: 'Libur Khusus', cls: 'bg-purple-100 text-purple-700' },
  opsional: { label: 'Opsional', cls: 'bg-slate-100 text-slate-600' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : '-',
    cls: 'bg-gray-100 text-gray-600',
  }
  return (
    <Badge className={cfg.cls}>
      {cfg.label}
    </Badge>
  )
}

function getJamMasuk(log) {
  const s = log.status || ''
  if (s === 'izin') return formatTime(log.jamIzin)
  if (s === 'sakit') return formatTime(log.jamSakit)
  return formatTime(log.jamMasuk)
}

function getJamPulang(log) {
  const s = log.status || ''
  // Hanya status hadir* yang punya jam pulang bermakna.
  if (s.indexOf('hadir') === 0) return formatTime(log.jamPulang)
  return '-'
}

// Kartu statistik dengan skeleton loading bawaan.
function StatCard({ stat, loading }) {
  if (loading) {
    return (
      <Card className="animate-pulse p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </Card>
    )
  }
  return (
    <Card className="p-5 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
        </div>
        <div className={`${stat.color} rounded-lg p-3`}>
          <stat.icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function DashboardHome() {
  const [filter, setFilter] = useState('today')
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [totalGuru, setTotalGuru] = useState(0)
  const [statsSummary, setStatsSummary] = useState({ hadir: 0, izin: 0, sakit: 0, alfa: 0 })
  const [guruBelumPresensi, setGuruBelumPresensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData(filter)
  }, [filter])

  const loadData = async (period, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      const response = await adminSummaryAPI.getDashboard(period)
      const data = response.data || {}

      setTotalGuru(data.totalGuru || 0)
      setStatsSummary(data.stats || { hadir: 0, izin: 0, sakit: 0, alfa: 0 })
      setGuruBelumPresensi(data.belumPresensiHariIni || [])
      setAttendanceLogs(data.logs || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Filter realtime table berdasarkan kata kunci (nama guru).
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return attendanceLogs
    return attendanceLogs.filter((log) => String(log.nama || '').toLowerCase().includes(q))
  }, [attendanceLogs, search])

  const totalGuruCount = Number(totalGuru) || 0
  const hadirCount = Number(statsSummary.hadir) || 0
  const izinCount = Number(statsSummary.izin) || 0
  const sakitCount = Number(statsSummary.sakit) || 0
  const alfaCount = Number(statsSummary.alfa) || 0
  const belumPresensiCount = guruBelumPresensi.length

  // Label dinamis berdasarkan filter
  const getStatsLabel = () => {
    switch (filter) {
      case 'today': return { hadir: 'Hadir Hari Ini', izin: 'Izin Hari Ini', sakit: 'Sakit Hari Ini', alfa: 'Alfa Hari Ini' }
      case 'yesterday': return { hadir: 'Hadir Kemarin', izin: 'Izin Kemarin', sakit: 'Sakit Kemarin', alfa: 'Alfa Kemarin' }
      case '7days': return { hadir: 'Hadir (7 Hari)', izin: 'Izin (7 Hari)', sakit: 'Sakit (7 Hari)', alfa: 'Alfa (7 Hari)' }
      case '14days': return { hadir: 'Hadir (14 Hari)', izin: 'Izin (14 Hari)', sakit: 'Sakit (14 Hari)', alfa: 'Alfa (14 Hari)' }
      case '30days': return { hadir: 'Hadir (30 Hari)', izin: 'Izin (30 Hari)', sakit: 'Sakit (30 Hari)', alfa: 'Alfa (30 Hari)' }
      default: return { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Alfa' }
    }
  }

  const labels = getStatsLabel()

  const stats = [
    { label: 'Total Guru', value: totalGuru, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: labels.hadir, value: hadirCount, icon: UserCheck, color: 'bg-emerald-50 text-emerald-700' },
    { label: labels.izin, value: izinCount, icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { label: labels.sakit, value: sakitCount, icon: UserX, color: 'bg-rose-50 text-rose-700' },
    { label: labels.alfa, value: alfaCount, icon: AlertCircle, color: 'bg-slate-100 text-slate-700' },
  ]

  const tableTitle = {
    today: 'Presensi Hari Ini',
    yesterday: 'Presensi Kemarin',
    '7days': 'Presensi 7 Hari Terakhir',
    '14days': 'Presensi 14 Hari Terakhir',
    '30days': 'Presensi 30 Hari Terakhir',
  }[filter] || 'Presensi'

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden gap-0 p-0">
        <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Ringkasan operasional
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Dashboard presensi</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">Pantau kehadiran guru, tindak lanjuti presensi yang belum tercatat, dan lihat tren operasional sekolah.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 sm:mr-2">
              <span className="font-semibold text-emerald-700">Live view</span>
              <span className="text-slate-300">•</span>
              <span>{lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Memuat data terbaru'}</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 shadow-xs">
              <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Periode dashboard"
                className="cursor-pointer bg-transparent text-sm font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="14days">14 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => loadData(filter, true)}
              disabled={loading || refreshing}
              aria-label="Muat ulang dashboard"
              title="Muat ulang dashboard"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2.5 text-muted-foreground shadow-xs transition hover:border-primary/30 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} loading={loading} />
        ))}
      </div>

      {/* Widget Belum Presensi Hari Ini */}
      {belumPresensiCount > 0 && (
        <Card className="overflow-hidden border-red-200 bg-red-50/70 py-0 shadow-sm">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500 rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  Belum Presensi Hari Ini
                </h3>
                <p className="text-sm text-red-600">
                  {belumPresensiCount} dari {totalGuru} guru belum melakukan presensi dan akan dihitung alfa
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">{belumPresensiCount}</div>
                <div className="text-xs text-red-500">Guru</div>
              </div>
            </div>

            {/* Daftar Guru Belum Presensi */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-red-100 bg-background p-3">
              <div className="space-y-2">
                {guruBelumPresensi.map((guru, index) => (
                  <div
                    key={guru.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-700 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{guru.nama}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : (guru.jabatan || '-')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-semibold">Belum Presensi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Waktu */}
            <div className="mt-3 p-3 bg-red-100 rounded-xl">
              <p className="text-xs text-red-700 text-center">
                ⏰ Data diperbarui saat halaman dimuat. Refresh untuk update terbaru.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pesan Jika Semua Sudah Presensi */}
      {belumPresensiCount === 0 && totalGuruCount > 0 && filter === 'today' && !loading && (
        <Card className="border-green-200 bg-green-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">
                ✅ Semua Guru Sudah Presensi!
              </h3>
              <p className="text-sm text-green-600">
                {totalGuru} dari {totalGuru} guru sudah melakukan presensi hari ini
              </p>
            </div>
          </div>
        </Card>
      )}

      {totalGuruCount === 0 && !loading && (
        <Card className="flex-row items-start gap-3 border-blue-200 bg-blue-50/70 p-5 shadow-sm">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-sm">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Belum ada data guru</h3>
            <p className="mt-1 text-sm text-blue-700">Tambahkan akun guru terlebih dahulu agar ringkasan presensi dan grafik dapat menampilkan data yang akurat.</p>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tren Kehadiran - Modern Area Chart */}
        <TrenKehadiran />

        {/* Persentase Kehadiran - Radial Progress */}
        <PersentaseKehadiran />

        {/* Tren Keterlambatan - Full width dengan perbandingan periode */}
        <TrenKeterlambatan />

        {/* Tren Jam Pulang - Analisis Checkout, Lupa Pulang & Alasan */}
        <TrenJamPulang />

        {/* Statistik Lengkap - Analisis Mendalam */}
        <div className="col-span-full">
          <StatistikLengkap />
        </div>
      </div>

      {/* Leaderboard Guru - Gamifikasi */}
      <LeaderboardGuru />

      {/* Realtime Table */}
      <Card className="overflow-hidden gap-0 p-0">
        <CardHeader className="border-b border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{tableTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Total: {filteredData.length} presensi
                {search && ` (dari ${attendanceLogs.length})`}
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama guru..."
                className="h-9 w-full pl-9 sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <div className="max-h-[560px] overflow-y-auto">
            <Table className="min-w-[880px]">
              <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Nama</TableHead>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Tanggal</TableHead>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Jam Masuk</TableHead>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Jam Pulang</TableHead>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="px-6 py-3 text-xs uppercase tracking-wide">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((log) => (
                    <TableRow key={log.id} className="hover:bg-accent/50">
                      <TableCell className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                            {String(log.nama || 'G').charAt(0).toUpperCase()}
                          </span>
                          <span>{log.nama || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">{log.tanggal}</TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">{getJamMasuk(log)}</TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">{getJamPulang(log)}</TableCell>
                      <TableCell className="px-6 py-4"><StatusBadge status={log.status} /></TableCell>
                      <TableCell className="max-w-xs truncate px-6 py-4 text-muted-foreground" title={log.keterangan || ''}>{log.keterangan || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <UserX className="w-8 h-8 text-slate-300" />
                        <p>{search ? 'Tidak ada presensi yang cocok dengan pencarian' : 'Tidak ada data presensi untuk periode ini'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DashboardHome
