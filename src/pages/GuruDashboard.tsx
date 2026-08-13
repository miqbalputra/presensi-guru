import { useEffect, useState, Suspense, lazy } from 'react'
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from 'lucide-react'
import GuruHome from '../components/guru/GuruHome'
import GuruAkun from '../components/guru/GuruAkun'

const GuruRiwayat = lazy(() => import('../components/guru/GuruRiwayat'))
const GuruStatus = lazy(() => import('../components/guru/GuruStatus'))
const GuruStatistik = lazy(() => import('../components/guru/GuruStatistik'))

function readStorage(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function TabLoading() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
        Memuat halaman...
      </div>
    </div>
  )
}

function useTheme() {
  const [theme, setTheme] = useState(() => readStorage('gq-theme', 'light'))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('gq-theme', theme)
    } catch {
      // Ignore storage errors; the theme still applies for the current session.
    }
  }, [theme])

  return {
    theme,
    toggle: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }
}

function GuruDashboard({ user, onLogout }) {
  const { theme, toggle } = useTheme()
  const [activeTab, setActiveTab] = useState(() => readStorage('lastGuruTab', 'home'))
  const [sidebarOpen, setSidebarOpen] = useState(() => readStorage('guru-sidebar-collapsed', '0') !== '1')

  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'status', label: 'Status', icon: Users },
    { id: 'statistik', label: 'Statistik', icon: BarChart3 },
    { id: 'akun', label: 'Akun Guru', icon: UserCog },
  ]

  const firstName = (user?.nama || 'Guru').split(' ')[0]
  const avatarInitial = (user?.nama || 'G').charAt(0).toUpperCase()
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || 'Beranda'
  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  useEffect(() => {
    localStorage.setItem('lastGuruTab', activeTab)
  }, [activeTab])

  useEffect(() => {
    localStorage.setItem('guru-sidebar-collapsed', sidebarOpen ? '0' : '1')
  }, [sidebarOpen])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const renderNavItem = (tab: typeof tabs[number]) => {
    const isActive = activeTab === tab.id
    return (
      <button
        type="button"
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        aria-current={isActive ? 'page' : undefined}
        title={!sidebarOpen ? tab.label : undefined}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-white/10 hover:text-white'
        } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
      >
        <tab.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} aria-hidden="true" />
        <span className={sidebarOpen ? 'truncate' : 'sr-only'}>{tab.label}</span>
      </button>
    )
  }

  return (
    <div className="academy-dashboard guru-dashboard min-h-screen text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#guru-main-content" className="guru-skip-link">Lewati ke konten utama</a>

      <aside className={`academy-sidebar fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-white/10 transition-[width] duration-200 lg:flex ${sidebarOpen ? 'w-64' : 'w-[4.5rem]'}`} aria-label="Navigasi guru">
        <div className={`flex h-16 items-center border-b border-white/10 ${sidebarOpen ? 'justify-between px-4' : 'justify-center'}`}>
          <button type="button" onClick={() => setActiveTab('home')} className={`flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${!sidebarOpen ? 'justify-center' : ''}`} title="Beranda">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">GQ</span>
            <span className={sidebarOpen ? 'min-w-0' : 'sr-only'}>
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Portal Guru</span>
              <span className="block truncate text-sm font-semibold text-white">Geo-Presensi</span>
            </span>
          </button>
          {sidebarOpen && (
            <button type="button" onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Ciutkan sidebar" title="Ciutkan sidebar (Ctrl+B)">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between p-3">
          <div className="space-y-6">
            <div>
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 ${!sidebarOpen ? 'sr-only' : ''}`}>Presensi</p>
              <div className="space-y-1">{tabs.slice(0, 4).map(renderNavItem)}</div>
            </div>
            <div>
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 ${!sidebarOpen ? 'sr-only' : ''}`}>Akun</p>
              <div className="space-y-1">{tabs.slice(4).map(renderNavItem)}</div>
            </div>
          </div>
          {!sidebarOpen && (
            <button type="button" onClick={() => setSidebarOpen(true)} className="flex h-10 w-full items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Lebarkan sidebar" title="Lebarkan sidebar (Ctrl+B)">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className={`border-t border-white/10 p-3 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-blue-100">{avatarInitial}</span>
            <div className={sidebarOpen ? 'min-w-0' : 'sr-only'}>
              <p className="truncate text-xs font-semibold text-white">{user?.nama || 'Guru'}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.username || 'Akun guru'}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={`min-w-0 transition-[padding] duration-200 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-[4.5rem]'}`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{activeTabLabel}</p>
                <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">Assalamu'alaikum, <span className="text-indigo-700 dark:text-indigo-300">{firstName}</span></h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex">
                <CalendarDays className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
                <span>{todayLabel}</span>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline-flex"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Aman</span>
              <button type="button" onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-amber-400" title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button type="button" onClick={onLogout} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400" title="Logout" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main id="guru-main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 pb-24 pt-6 outline-none sm:px-6 lg:px-8 lg:pb-12">
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Ruang kerja guru</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola presensi dan lihat ringkasan kehadiran Anda.</p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500" aria-live="polite">Data tersinkron sesuai akses Anda.</p>
          </div>
          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'home' && <GuruHome user={user} onChangeTab={setActiveTab} />}
            {activeTab === 'akun' && <GuruAkun user={user} />}
            {activeTab !== 'home' && activeTab !== 'akun' && (
              <Suspense fallback={<TabLoading />}>
                {activeTab === 'riwayat' && <GuruRiwayat user={user} />}
                {activeTab === 'status' && <GuruStatus />}
                {activeTab === 'statistik' && <GuruStatistik user={user} />}
              </Suspense>
            )}
          </div>
        </main>

        <nav aria-label="Navigasi dashboard guru" className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="border-t border-slate-200 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto flex max-w-md items-center justify-between">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} aria-current={isActive ? 'page' : undefined} className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' : ''}`}><tab.icon className="h-[17px] w-[17px]" aria-hidden="true" /></span>
                    <span className="max-w-full truncate">{tab.id === 'akun' ? 'Akun' : tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default GuruDashboard
