import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Info, X, ChevronRight, Globe, MessageCircle, Mail } from 'lucide-react'
import { authAPI, activityAPI } from '../services/api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const navigate = useNavigate()

  const changelog = [
    {
      version: 'v1.3.0',
      date: '24 Mei 2026',
      features: [
        'Tracking lokasi guru setelah presensi hadir dengan interval yang bisa diatur admin',
        'Dashboard Tracking Lokasi untuk melihat titik terakhir, akurasi GPS, peta, dan riwayat harian',
        'Presensi hadir dan pulang mendukung lokasi gender masing-masing dengan fallback ke lokasi sekolah utama',
        'Status izin dan sakit tidak lagi membutuhkan validasi GPS',
        'Session guru lebih tahan lama dengan pemulihan otomatis saat PWA dibuka kembali'
      ]
    },
    {
      version: 'v1.2.0',
      date: '21 April 2026',
      features: [
        'Sistem Pembatasan Pulang Piket (Wajib Izin jika pulang awal)',
        'Logika Otomatis Apel Senin (Dinamis sesuai status Apel)',
        'Default Jam Pulang Jumat (10:15 WIB)',
        'Sistem Heartbeat untuk menjaga sesi login tetap aktif',
        'Toggle Pengaturan Apel Senin di Dashboard Admin'
      ]
    },
    {
      version: 'v1.1.0',
      date: 'Maret 2026',
      features: [
        'Integrasi PWA (Aplikasi bisa di-install di HP)',
        'Validasi Geolocation (GPS) & Radius Sekolah',
        'Scan QR Code Presensi'
      ]
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(username, password)
      const user = response.data
      
      onLogin(user)
      
      // Add activity log
      try {
        await activityAPI.create({
          user: user.nama,
          aktivitas: 'Login',
          status: 'Sukses'
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }
      
      navigate(user.role === 'guru' ? '/guru' : '/admin')
    } catch (err) {
      setError(err.message || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Geo-Presensi GQ</h1>
          <p className="text-gray-600 mt-2">Sistem Presensi Geolocation & QR Code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={() => setShowInfo(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors group"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Tentang Aplikasi & Update
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p className="mb-1">Supported by SistemFlow</p>
          <p>
            Hak Cipta © 2025{' '}
            <a
              href="https://sistemflow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              SistemFlow.com
            </a>
          </p>
        </div>
      </div>

      {/* MODAL INFO APLIKASI */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <div>
                <h2 className="text-xl font-bold">Informasi Aplikasi</h2>
                <p className="text-blue-100 text-xs mt-0.5">Geo-Presensi GQ Version Control</p>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Developer Info */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Pengembang
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                  <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
                    MI
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">M. Iqbal Putra</h4>
                    <p className="text-[10px] text-gray-500 mb-3">Fullstack Developer & Systems Analyst</p>
                    <div className="flex flex-wrap gap-2">
                      <a 
                        href="https://wa.me/6281390292177" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                      <a 
                        href="mailto:iqbalmarketist@gmail.com" 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-[10px] font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                      <a 
                        href="https://sistemflow.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Changelog */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  Changelog Update
                </h3>
                <div className="space-y-4">
                  {changelog.map((item, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-blue-100 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-100 rounded-full border-4 border-white"></div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                          {item.version}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {item.features.map((feature, fIdx) => (
                          <li key={fIdx} className="text-xs text-gray-600 flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                Aplikasi ini dirancang khusus untuk meningkatkan kedisiplinan dan efisiensi manajemen kehadiran guru.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
