import { NavLink } from '../../router'
import { LayoutDashboard, Users, Edit, Activity, Download, Calendar, Settings, CalendarCheck, LogOut, X, QrCode, UserPlus, Map, MapPin, CalendarX, CalendarPlus, Archive, Bot } from 'lucide-react'

function Sidebar({ user, onLogout, isOpen, setIsOpen }) {
  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/data-guru', icon: Users, label: 'Data Guru' },
    { path: '/admin/arsip-guru', icon: Archive, label: 'Arsip Guru' },
    { path: '/admin/jadwal-piket', icon: CalendarCheck, label: 'Jadwal Piket' },
    { path: '/admin/edit-presensi', icon: Edit, label: 'Edit Presensi' },
    { path: '/admin/download-laporan', icon: Download, label: 'Download Laporan' },
    { path: '/admin/hari-libur', icon: Calendar, label: 'Hari Libur' },
    { path: '/admin/override-weekend', icon: CalendarX, label: 'Override Weekend' },
    { path: '/admin/hari-kerja-opsional', icon: CalendarPlus, label: 'Hari Kerja Opsional' },
    { path: '/admin/log-aktivitas', icon: Activity, label: 'Log Aktivitas' },
    { path: '/admin/lokasi-geofence', icon: Map, label: 'Lokasi & Geofence' },
    { path: '/admin/tracking-lokasi', icon: MapPin, label: 'Tracking Lokasi' },
    { path: '/admin/qr-code', icon: QrCode, label: 'QR Code Presensi' },
    { path: '/admin/manual-entry', icon: UserPlus, label: 'Presensi Manual' },
    { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
    { path: '/admin/ai-agent', icon: Bot, label: 'AI Agent' }
  ]

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[280px] bg-[#101828] text-white transform transition-transform duration-300 ease-in-out border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
      `}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-5 border-b border-white/10 bg-[#101828]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/30">
                <span className="text-lg font-black">GQ</span>
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">Geo-Presensi</h2>
                <p className="text-[11px] text-slate-400">Admin Console</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-white hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">{(user.nama || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.nama}</p>
              <p className="truncate text-xs capitalize text-slate-400">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Menu - Scrollable dengan background biru */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-[#101828]">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Menu Utama</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm
                ${isActive
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout - Fixed at Bottom */}
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#101828]">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-400 hover:bg-rose-500/15 hover:text-rose-200 transition-colors text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
