import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/admin/Sidebar'
import DashboardHome from '../components/admin/DashboardHome'
import DataGuru from '../components/admin/DataGuru'
import EditPresensi from '../components/admin/EditPresensi'
import DownloadLaporan from '../components/admin/DownloadLaporan'
import LogAktivitas from '../components/admin/LogAktivitas'
import HariLibur from '../components/admin/HariLibur'
import Pengaturan from '../components/admin/Pengaturan'
import JadwalPiket from '../components/admin/JadwalPiket'
import QRCodeGenerator from '../components/admin/QRCodeGenerator'
import ManualEntry from '../components/admin/ManualEntry'
import LokasiGeofence from '../components/admin/LokasiGeofence'

function AdminDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm lg:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Geo-Presensi GQ</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/data-guru" element={<DataGuru />} />
            <Route path="/jadwal-piket" element={<JadwalPiket />} />
            <Route path="/edit-presensi" element={<EditPresensi user={user} />} />
            <Route path="/download-laporan" element={<DownloadLaporan />} />
            <Route path="/hari-libur" element={<HariLibur user={user} />} />
            <Route path="/log-aktivitas" element={<LogAktivitas />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="/qr-code" element={<QRCodeGenerator />} />
            <Route path="/manual-entry" element={<ManualEntry />} />
            <Route path="/lokasi-geofence" element={<LokasiGeofence user={user} />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
