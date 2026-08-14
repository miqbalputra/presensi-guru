import { NavLink } from '../../router'
import {
  Activity,
  Archive,
  ArchiveRestore,
  Bot,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Download,
  Edit,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  QrCode,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

const groups = [
  {
    label: 'Workspace',
    items: [{ path: '/admin', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Presensi',
    items: [
      { path: '/admin/data-guru', icon: Users, label: 'Data Guru' },
      { path: '/admin/arsip-guru', icon: Archive, label: 'Arsip Guru' },
      { path: '/admin/jadwal-piket', icon: CalendarCheck, label: 'Jadwal Piket' },
      { path: '/admin/edit-presensi', icon: Edit, label: 'Edit Presensi' },
      { path: '/admin/download-laporan', icon: Download, label: 'Download Laporan' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { path: '/admin/hari-libur', icon: Calendar, label: 'Hari Libur' },
      { path: '/admin/override-weekend', icon: CalendarX, label: 'Override Weekend' },
      { path: '/admin/hari-kerja-opsional', icon: CalendarPlus, label: 'Hari Kerja Opsional' },
      { path: '/admin/log-aktivitas', icon: Activity, label: 'Log Aktivitas' },
    ],
  },
  {
    label: 'Lokasi & Integrasi',
    items: [
      { path: '/admin/lokasi-geofence', icon: Map, label: 'Lokasi & Geofence' },
      { path: '/admin/tracking-lokasi', icon: MapPin, label: 'Tracking Lokasi' },
      { path: '/admin/qr-code', icon: QrCode, label: 'QR Code Presensi' },
      { path: '/admin/manual-entry', icon: UserPlus, label: 'Presensi Manual' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
      { path: '/admin/backup', icon: ArchiveRestore, label: 'Backup & Pemulihan' },
      { path: '/admin/ai-agent', icon: Bot, label: 'AI Agent' },
    ],
  },
]

function Sidebar({ user, onLogout, isOpen, setIsOpen, collapsed, onToggleCollapse }) {
  const avatarInitial = (user?.nama || 'A').slice(0, 1).toUpperCase()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`academy-sidebar fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 transition-[width,transform] duration-200 ease-out lg:static lg:translate-x-0 ${
          collapsed ? 'w-72 lg:w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navigasi admin"
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <NavLink
            to="/admin"
            end
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${collapsed ? 'justify-center' : ''}`}
            title="Dashboard"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40"><School className="h-5 w-5" aria-hidden="true" /></span>
            <span className={collapsed ? 'sr-only' : 'min-w-0'}>
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Ruang kerja admin</span>
              <span className="block truncate text-sm font-semibold text-white">Geo-Presensi</span>
            </span>
          </NavLink>
          {!collapsed && (
            <button
              type="button"
              onClick={() => onToggleCollapse()}
              className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:flex"
              aria-label="Ciutkan sidebar"
              title="Ciutkan sidebar (Ctrl+B)"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between p-3">
          <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" aria-label="Menu utama">
            {groups.map((group) => (
              <div key={group.label} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 ${collapsed ? 'sr-only' : ''}`}>{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={() => setIsOpen(false)}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isActive ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                      <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {collapsed && (
            <button
              type="button"
              onClick={() => onToggleCollapse()}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Lebarkan sidebar"
              title="Lebarkan sidebar (Ctrl+B)"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className={`shrink-0 border-t border-white/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-blue-100">{avatarInitial}</span>
            <div className={collapsed ? 'sr-only' : 'min-w-0'}>
              <p className="truncate text-xs font-semibold text-white">{user?.nama || 'Admin'}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.username || 'Akun administrator'}</p>
            </div>
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          )}
          {collapsed && (
            <button type="button" onClick={onLogout} className="mt-3 flex h-10 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" aria-label="Keluar" title="Keluar">
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
