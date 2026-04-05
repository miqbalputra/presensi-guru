import { useState, useEffect } from 'react'
import { Home, History, Users, LogOut, Menu, BarChart3 } from 'lucide-react'
import GuruHome from '../components/guru/GuruHome'
import GuruRiwayat from '../components/guru/GuruRiwayat'
import GuruStatus from '../components/guru/GuruStatus'
import GuruStatistik from '../components/guru/GuruStatistik'

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
    { id: 'riwayat', label: 'Riwayat Saya', icon: History },
    { id: 'status', label: 'Status Rekan', icon: Users },
    { id: 'statistik', label: 'Statistik Saya', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Geo-Presensi GQ</h1>
            <p className="text-sm text-blue-100">{user.nama}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-800"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'home' && <GuruHome user={user} />}
        {activeTab === 'riwayat' && <GuruRiwayat user={user} />}
        {activeTab === 'status' && <GuruStatus user={user} />}
        {activeTab === 'statistik' && <GuruStatistik user={user} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default GuruDashboard
