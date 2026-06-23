import { useState, useEffect, Suspense, lazy } from 'react'
import { Home, History, Users, LogOut, BarChart3, User } from 'lucide-react'
import GuruHome from '../components/guru/GuruHome'

const GuruRiwayat = lazy(() => import('../components/guru/GuruRiwayat'))
const GuruStatus = lazy(() => import('../components/guru/GuruStatus'))
const GuruStatistik = lazy(() => import('../components/guru/GuruStatistik'))

function TabLoading() {
  return (
    <div className="min-h-[220px] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

function GuruDashboard({ user, onLogout }) {
  // Restore tab terakhir dari localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('lastGuruTab') || 'home'
  })

  // Simpan tab terakhir ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('lastGuruTab', activeTab)
  }, [activeTab])

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'status', label: 'Status', icon: Users },
    { id: 'statistik', label: 'Statistik', icon: BarChart3 }
  ]

  const firstName = (user?.nama || 'Guru').split(' ')[0]
  const avatarInitial = (user?.nama || 'G').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Personalized Header */}
      <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-sm px-5 pt-5 pb-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-slate-400">Geo-Presensi GQ</p>
            <h1 className="text-lg font-bold text-slate-800">
              Assalamu'alaikum <span className="text-blue-700">{firstName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {avatarInitial}
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-5">
        {activeTab === 'home' && <GuruHome user={user} onChangeTab={setActiveTab} />}
        {activeTab !== 'home' && (
          <Suspense fallback={<TabLoading />}>
            {activeTab === 'riwayat' && <GuruRiwayat user={user} />}
            {activeTab === 'status' && <GuruStatus user={user} />}
            {activeTab === 'statistik' && <GuruStatistik user={user} />}
          </Suspense>
        )}
      </main>

      {/* Floating Pill Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-full px-3 py-2.5 flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default GuruDashboard
