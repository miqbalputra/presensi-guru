import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import GuruDashboard from './pages/GuruDashboard'
import { users as initialUsers } from './data/dummyData'
import { authAPI } from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const inactivityTimerRef = useRef(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 menit dalam milidetik

  useEffect(() => {
    // Initialize users in localStorage if not exists
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(initialUsers))
    }
    
    const syncSession = async () => {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          // Verifikasi sesi dengan backend
          const response = await authAPI.checkSession()
          if (response.success) {
            setUser(response.data)
            localStorage.setItem('user', JSON.stringify(response.data))
          } else {
            handleLogout()
          }
        } catch (err) {
          // Jika gagal konek API, pakai data lokal sementara atau biarkan user login
          console.warn('Session sync failed:', err)
          try {
            setUser(JSON.parse(savedUser))
          } catch (e) {
            handleLogout()
          }
        }
      }
    }

    syncSession()

    // PWA Logic: Catch install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 5 seconds if not installed yet
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW Registered', reg))
          .catch(err => console.log('SW Registration Failed', err));
      });
    }
  }, [])

  // Auto-logout setelah 30 menit tidak ada aktivitas (Hanya untuk Admin/Kepala Sekolah)
  useEffect(() => {
    // JIKA GURU, tidak perlu timer inaktivitas agar awet 30 hari
    if (!user || user.role === 'guru') return

    const resetTimer = () => {
      // Clear timer yang ada
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      // Set timer baru
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout()
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.')
      }, INACTIVITY_TIMEOUT)
    }

    // Event yang menandakan user masih aktif
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    // Reset timer setiap ada aktivitas
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    // Mulai timer pertama kali
    resetTimer()

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [user])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'guru' ? '/guru' : '/admin'} /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/admin/*" element={
          user && (user.role === 'admin' || user.role === 'kepala_sekolah') ? 
          <AdminDashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
        } />
        <Route path="/guru/*" element={
          user && user.role === 'guru' ? 
          <GuruDashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>

      {/* PWA Install Popup */}
      {showInstallPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce">
          <div className="bg-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border-2 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Pasang Geo-Presensi GQ</h4>
                <p className="text-xs text-gray-500">Akses lebih cepat & mudah!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                PASANG
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Router>
  )
}

export default App
