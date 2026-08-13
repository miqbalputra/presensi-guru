import { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from '../router'
import { CalendarDays, ChevronRight, Menu, Moon, ShieldCheck, Sun } from 'lucide-react'
import Sidebar from '../components/admin/Sidebar'
import NotificationBell from '../components/admin/NotificationBell'

const DashboardHome = lazy(() => import('../components/admin/DashboardHome'))
const DataGuru = lazy(() => import('../components/admin/DataGuru'))
const ArsipGuru = lazy(() => import('../components/admin/ArsipGuru'))
const EditPresensi = lazy(() => import('../components/admin/EditPresensi'))
const DownloadLaporan = lazy(() => import('../components/admin/DownloadLaporan'))
const LogAktivitas = lazy(() => import('../components/admin/LogAktivitas'))
const HariLibur = lazy(() => import('../components/admin/HariLibur'))
const Pengaturan = lazy(() => import('../components/admin/Pengaturan'))
const JadwalPiket = lazy(() => import('../components/admin/JadwalPiket'))
const QRCodeGenerator = lazy(() => import('../components/admin/QRCodeGenerator'))
const ManualEntry = lazy(() => import('../components/admin/ManualEntry'))
const LokasiGeofence = lazy(() => import('../components/admin/LokasiGeofence'))
const LocationTracking = lazy(() => import('../components/admin/LocationTracking'))
const OverrideWeekend = lazy(() => import('../components/admin/OverrideWeekend'))
const OptionalWorkdays = lazy(() => import('../components/admin/OptionalWorkdays'))
const AIAgent = lazy(() => import('../components/admin/AIAgent'))

function SectionLoading() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 motion-reduce:animate-none" />
        Memuat halaman...
      </div>
    </div>
  )
}

function readStorage(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function useTheme() {
  const [theme, setTheme] = useState(() => readStorage('gq-theme', 'light'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('gq-theme', theme)
    } catch {
      // Theme remains active for the current session when storage is unavailable.
    }
  }, [theme])

  return { theme, toggle: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }
}

function AdminDashboard({ user, onLogout }) {
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readStorage('admin-sidebar-collapsed', '0') === '1')
  const [isInitialized, setIsInitialized] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const sectionLabels = {
    '/admin': 'Dashboard',
    '/admin/data-guru': 'Data Guru',
    '/admin/arsip-guru': 'Arsip Guru',
    '/admin/jadwal-piket': 'Jadwal Piket',
    '/admin/edit-presensi': 'Edit Presensi',
    '/admin/download-laporan': 'Download Laporan',
    '/admin/hari-libur': 'Hari Libur',
    '/admin/log-aktivitas': 'Log Aktivitas',
    '/admin/pengaturan': 'Pengaturan',
    '/admin/qr-code': 'QR Code Presensi',
    '/admin/manual-entry': 'Presensi Manual',
    '/admin/lokasi-geofence': 'Lokasi & Geofence',
    '/admin/tracking-lokasi': 'Tracking Lokasi',
    '/admin/override-weekend': 'Override Weekend',
    '/admin/hari-kerja-opsional': 'Hari Kerja Opsional',
    '/admin/ai-agent': 'AI Agent',
  }
  const activeSection = sectionLabels[location.pathname] || 'Manajemen'
  const firstName = (user?.nama || 'Admin').split(' ')[0]
  const todayLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  // Restore path terakhir saat component mount (hanya sekali)
  useEffect(() => {
    if (!isInitialized) {
      const lastPath = localStorage.getItem('lastAdminPath')
      if (lastPath && lastPath !== location.pathname && lastPath.startsWith('/admin')) {
        navigate(lastPath, { replace: true })
      }
      setIsInitialized(true)
    }
  }, [isInitialized, location.pathname, navigate])

  // Simpan path terakhir ke localStorage setiap kali pindah halaman
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('lastAdminPath', location.pathname)
    }
  }, [location.pathname, isInitialized])

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarCollapsed((collapsed) => !collapsed)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  return (
    <div className="academy-dashboard flex h-screen text-slate-800">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <div className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
                <span>Admin</span><ChevronRight className="h-4 w-4" aria-hidden="true" /><span className="font-semibold text-slate-700">{activeSection}</span>
              </div>
              <div className="min-w-0 sm:hidden">
                <p className="truncate text-[11px] font-semibold text-slate-500">{activeSection}</p>
                <h1 className="truncate text-sm font-bold text-slate-900">Geo-Presensi</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 md:flex">
                <CalendarDays className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                <span>{todayLabel}</span>
              </div>
              <NotificationBell />
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Aman</span>
              <button type="button" onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-32 truncate text-xs font-semibold text-slate-800">{user?.nama || firstName}</p>
                <p className="text-[11px] text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Suspense fallback={<SectionLoading />}>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/data-guru" element={<DataGuru />} />
                <Route path="/arsip-guru" element={<ArsipGuru />} />
                <Route path="/jadwal-piket" element={<JadwalPiket />} />
                <Route path="/edit-presensi" element={<EditPresensi user={user} />} />
                <Route path="/download-laporan" element={<DownloadLaporan />} />
                <Route path="/hari-libur" element={<HariLibur user={user} />} />
                <Route path="/log-aktivitas" element={<LogAktivitas />} />
                <Route path="/pengaturan" element={<Pengaturan />} />
                <Route path="/qr-code" element={<QRCodeGenerator />} />
                <Route path="/manual-entry" element={<ManualEntry />} />
                <Route path="/lokasi-geofence" element={<LokasiGeofence user={user} />} />
                <Route path="/tracking-lokasi" element={<LocationTracking />} />
                <Route path="/override-weekend" element={<OverrideWeekend />} />
                <Route path="/hari-kerja-opsional" element={<OptionalWorkdays />} />
                <Route path="/ai-agent" element={<AIAgent />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
