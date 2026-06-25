import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Info, X, ChevronRight, Globe, MessageCircle, Mail, Sun, Moon } from 'lucide-react'
import { authAPI, activityAPI, configAPI } from '../services/api'

// Fallback build-time client id (opsional). Sumber utama adalah API /google_config.php
const FALLBACK_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Muat script Google Identity Services & render tombolnya
function useGoogleSignIn(clientId, onCredential) {
  const containerRef = useRef(null)
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!clientId || !containerRef.current) return undefined

    let cancelled = false

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => callbackRef.current?.(resp),
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 360,
        locale: 'id',
      })
    }

    if (window.google?.accounts?.id) {
      renderButton()
    } else {
      const existing = document.querySelector('script[data-gis="1"]')
      if (!existing) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.setAttribute('data-gis', '1')
        script.onload = renderButton
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', renderButton)
      }
    }

    return () => { cancelled = true }
  }, [clientId])

  return containerRef
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('gq-theme') || 'light' }
    catch { return 'light' }
  })
  const navigate = useNavigate()

  const [googleClientId, setGoogleClientId] = useState(FALLBACK_GOOGLE_CLIENT_ID)

  // Ambil Google Client ID dari backend (runtime, tidak perlu build arg)
  useEffect(() => {
    let cancelled = false
    configAPI.getGoogleConfig()
      .then((res) => {
        if (cancelled) return
        const id = res?.data?.googleClientId || ''
        if (id) setGoogleClientId(id)
      })
      .catch(() => {
        // API gagal — fallback ke build-time value (kalau ada)
      })
    return () => { cancelled = true }
  }, [])

  const handleGoogleCredential = async (resp) => {
    const credential = resp?.credential
    if (!credential) return
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.googleLogin(credential)
      const user = response.data
      onLogin(user)
      try {
        await activityAPI.create({ user: user.nama, aktivitas: 'Login (Google)', status: 'Sukses' })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }
      navigate(user.role === 'guru' ? '/guru' : '/admin')
    } catch (err) {
      setError(err.message || 'Login Google gagal.')
    } finally {
      setLoading(false)
    }
  }

  const googleEnabled = !!googleClientId
  const googleContainerRef = useGoogleSignIn(googleClientId, handleGoogleCredential)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('gq-theme', next) } catch {}
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const changelog = [
    {
      version: 'v1.4.0',
      date: '23 Juni 2026',
      stable: true,
      features: [
        'Dark Mode & Light Mode — toggle tema di seluruh halaman (login, guru, admin)',
        'Redesain total UI halaman Guru: welcome card, info pills, holiday card, floating bottom nav',
        'Redesain halaman Login dengan gaya konsisten TimeZen-style (rounded card, indigo accent)',
        'Service Worker v6 — update agresif, auto recovery dari error chunk, cache bersih tiap deploy',
        'Bulk holiday range creation — admin bisa tambah banyak hari libur sekaligus',
        'Perbaikan Statistik Guru — data hadir/alfa kini akurat dengan perhitungan hari kerja + optional',
        'Perbaikan libur sekolah — diperlakukan sebagai libur total, hanya is_workday=1 yang hari kerja',
        'Hermes API presensi overview — selaras dengan laporan download admin (per-user weekend override)',
        'Session guru 30 hari — tidak perlu login ulang selama 30 hari, heartbeat otomatis'
      ]
    },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 p-2.5 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-900 rounded-full transition-colors"
        title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 w-full max-w-md transition-colors">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Geo-Presensi GQ</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">Sistem Presensi Geolocation & QR Code</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-colors"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-colors"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-2xl font-bold text-base hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 transition-all shadow-sm"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          {/* Login Google */}
          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 my-1" aria-hidden="true">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">atau masuk dengan</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="flex justify-center" ref={googleContainerRef} />
            </>
          )}
        </form>

        {/* Info Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowInfo(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors group"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Tentang Aplikasi & Update
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p className="mb-1">Supported by SistemFlow</p>
          <p>
            Hak Cipta &copy; 2025{' '}
            <a
              href="https://sistemflow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              SistemFlow.com
            </a>
          </p>
        </div>
      </div>

      {/* MODAL INFO APLIKASI */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-up border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 dark:bg-indigo-500 text-white">
              <div>
                <h2 className="text-xl font-bold">Informasi Aplikasi</h2>
                <p className="text-indigo-100 dark:text-indigo-200 text-xs mt-0.5">Geo-Presensi GQ Version Control</p>
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
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  Pengembang
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                    MI
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">M. Iqbal Putra</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Fullstack Developer & Systems Analyst</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://wa.me/6281390292177"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                      <a
                        href="mailto:iqbalmarketist@gmail.com"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                      <a
                        href="https://sistemflow.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
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
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                  Changelog Update
                </h3>
                <div className="space-y-4">
                  {changelog.map((item, idx) => (
                    <div key={idx} className={`relative pl-6 border-l-2 pb-2 ${item.stable ? 'border-emerald-200 dark:border-emerald-500/30' : 'border-indigo-100 dark:border-indigo-500/20'}`}>
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${item.stable ? 'bg-emerald-200 dark:bg-emerald-500/30' : 'bg-indigo-100 dark:bg-indigo-500/20'}`}></div>
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${item.stable ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`}>
                            {item.version}
                          </span>
                          {item.stable && (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20">
                              STABLE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.date}</span>
                      </div>
                      <ul className="space-y-2">
                        {item.features.map((feature, fIdx) => (
                          <li key={fIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <ChevronRight className={`w-3 h-3 mt-0.5 shrink-0 ${item.stable ? 'text-emerald-400 dark:text-emerald-500' : 'text-indigo-400 dark:text-indigo-500'}`} />
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
