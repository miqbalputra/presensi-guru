import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, FileText, AlertCircle, Clock } from 'lucide-react'
import { formatDate, formatDateForInput } from '../../utils/dateUtils'
import { guruAPI, presensiAPI } from '../../services/api'
import TrenKehadiran from './TrenKehadiran'
import PersentaseKehadiran from './PersentaseKehadiran'
import LeaderboardGuru from './LeaderboardGuru'
import TrenKeterlambatan from './TrenKeterlambatan'

function DashboardHome() {
  const [filter, setFilter] = useState('today')
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [dataGuru, setDataGuru] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [guruResponse, presensiResponse] = await Promise.all([
        guruAPI.getAll(),
        presensiAPI.getAll()
      ])
      
      setDataGuru(guruResponse.data)
      setAttendanceLogs(presensiResponse.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    const today = new Date()
    const todayStr = formatDateForInput(today)
    
    switch(filter) {
      case 'today':
        return attendanceLogs.filter(log => log.tanggal === todayStr)
      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(today.getDate() - 1)
        const yesterdayStr = formatDateForInput(yesterday)
        return attendanceLogs.filter(log => log.tanggal === yesterdayStr)
      case '7days':
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(today.getDate() - 6) // 7 hari termasuk hari ini
        const sevenDaysStr = formatDateForInput(sevenDaysAgo)
        return attendanceLogs.filter(log => log.tanggal >= sevenDaysStr && log.tanggal <= todayStr)
      case '14days':
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(today.getDate() - 13) // 14 hari termasuk hari ini
        const fourteenDaysStr = formatDateForInput(fourteenDaysAgo)
        return attendanceLogs.filter(log => log.tanggal >= fourteenDaysStr && log.tanggal <= todayStr)
      case '30days':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 29) // 30 hari termasuk hari ini
        const thirtyDaysStr = formatDateForInput(thirtyDaysAgo)
        return attendanceLogs.filter(log => log.tanggal >= thirtyDaysStr && log.tanggal <= todayStr)
      default:
        return attendanceLogs.filter(log => log.tanggal === todayStr)
    }
  }

  const filteredData = getFilteredData()
  
  // Hitung stats berdasarkan data yang sudah difilter
  const hadirCount = filteredData.filter(log => log.status === 'hadir' || log.status === 'hadir_terlambat' || log.status === 'hadir_izin_terlambat').length
  const izinCount = filteredData.filter(log => log.status === 'izin').length
  const sakitCount = filteredData.filter(log => log.status === 'sakit').length
  const totalGuru = dataGuru.length

  // Hitung guru yang belum presensi hari ini
  const getGuruBelumPresensi = () => {
    const today = formatDateForInput(new Date())
    const presensiHariIni = attendanceLogs.filter(log => log.tanggal === today)
    const guruSudahPresensi = presensiHariIni.map(log => log.user_id)
    const guruBelumPresensi = dataGuru.filter(guru => !guruSudahPresensi.includes(guru.id))
    return guruBelumPresensi
  }

  const guruBelumPresensi = getGuruBelumPresensi()
  const belumPresensiCount = guruBelumPresensi.length

  // Label dinamis berdasarkan filter
  const getStatsLabel = () => {
    switch(filter) {
      case 'today': return { hadir: 'Hadir Hari Ini', izin: 'Izin Hari Ini', sakit: 'Sakit Hari Ini' }
      case 'yesterday': return { hadir: 'Hadir Kemarin', izin: 'Izin Kemarin', sakit: 'Sakit Kemarin' }
      case '7days': return { hadir: 'Hadir (7 Hari)', izin: 'Izin (7 Hari)', sakit: 'Sakit (7 Hari)' }
      case '14days': return { hadir: 'Hadir (14 Hari)', izin: 'Izin (14 Hari)', sakit: 'Sakit (14 Hari)' }
      case '30days': return { hadir: 'Hadir (30 Hari)', izin: 'Izin (30 Hari)', sakit: 'Sakit (30 Hari)' }
      default: return { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit' }
    }
  }

  const labels = getStatsLabel()

  const stats = [
    { label: 'Total Guru', value: totalGuru, icon: Users, color: 'bg-blue-500' },
    { label: labels.hadir, value: hadirCount, icon: UserCheck, color: 'bg-green-500' },
    { label: labels.izin, value: izinCount, icon: FileText, color: 'bg-yellow-500' },
    { label: labels.sakit, value: sakitCount, icon: UserX, color: 'bg-red-500' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="7days">7 Hari Terakhir</option>
          <option value="14days">14 Hari Terakhir</option>
          <option value="30days">30 Hari Terakhir</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Widget Belum Presensi Hari Ini */}
      {belumPresensiCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  Belum Presensi Hari Ini
                </h3>
                <p className="text-sm text-red-600">
                  {belumPresensiCount} dari {totalGuru} guru belum melakukan presensi
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">{belumPresensiCount}</div>
                <div className="text-xs text-red-500">Guru</div>
              </div>
            </div>

            {/* Daftar Guru Belum Presensi */}
            <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {guruBelumPresensi.map((guru, index) => (
                  <div 
                    key={guru.id} 
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                        <span className="text-red-700 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{guru.nama}</p>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-semibold">Belum Presensi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Waktu */}
            <div className="mt-4 p-3 bg-red-100 rounded-lg">
              <p className="text-xs text-red-700 text-center">
                ⏰ Data diperbarui secara real-time. Refresh halaman untuk update terbaru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pesan Jika Semua Sudah Presensi */}
      {belumPresensiCount === 0 && filter === 'today' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">
                ✅ Semua Guru Sudah Presensi!
              </h3>
              <p className="text-sm text-green-600">
                {totalGuru} dari {totalGuru} guru sudah melakukan presensi hari ini
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tren Kehadiran - Modern Area Chart */}
        <TrenKehadiran />

        {/* Persentase Kehadiran - Radial Progress */}
        <PersentaseKehadiran />

        {/* Tren Keterlambatan - Full width dengan perbandingan periode */}
        <TrenKeterlambatan />
      </div>

      {/* Leaderboard Guru - Gamifikasi */}
      <LeaderboardGuru />

      {/* Realtime Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {filter === 'today' && 'Presensi Hari Ini'}
            {filter === 'yesterday' && 'Presensi Kemarin'}
            {filter === '7days' && 'Presensi 7 Hari Terakhir'}
            {filter === '14days' && 'Presensi 14 Hari Terakhir'}
            {filter === '30days' && 'Presensi 30 Hari Terakhir'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Total: {filteredData.length} presensi
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input Jam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? filteredData.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.tanggal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.status === 'izin' && log.jamIzin ? log.jamIzin : 
                     log.status === 'sakit' && log.jamSakit ? log.jamSakit : 
                     log.jamMasuk}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'hadir_terlambat' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.status === 'izin' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {log.status === 'hadir_terlambat' ? 'Hadir (Terlambat)' : 
                       log.status === 'hadir_izin_terlambat' ? 'Hadir - Izin Terlambat' : 
                       log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.keterangan || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data presensi untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
