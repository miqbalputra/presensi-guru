import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Clock, AlertCircle, CheckCircle, FileText, UserX } from 'lucide-react'
import { presensiAPI } from '../../services/api'
import { formatDateForInput } from '../../utils/dateUtils'

function GuruStatistik({ user }) {
  const [presensiData, setPresensiData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('bulan_ini')

  useEffect(() => {
    loadPresensiData()
  }, [filter])

  const loadPresensiData = async () => {
    try {
      setLoading(true)
      const response = await presensiAPI.getAll({ user_id: user.id })
      setPresensiData(response.data)
    } catch (error) {
      console.error('Failed to load presensi data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    switch(filter) {
      case 'bulan_ini':
        return presensiData.filter(log => {
          const logDate = new Date(log.tanggal)
          return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
        })
      case 'bulan_lalu':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return presensiData.filter(log => {
          const logDate = new Date(log.tanggal)
          return logDate.getMonth() === lastMonth && logDate.getFullYear() === lastMonthYear
        })
      case '3_bulan':
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        return presensiData.filter(log => new Date(log.tanggal) >= threeMonthsAgo)
      case 'tahun_ini':
        return presensiData.filter(log => {
          const logDate = new Date(log.tanggal)
          return logDate.getFullYear() === currentYear
        })
      default:
        return presensiData.filter(log => {
          const logDate = new Date(log.tanggal)
          return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
        })
    }
  }

  const filteredData = getFilteredData()

  // Hitung statistik
  const totalHadir = filteredData.filter(log => log.status === 'hadir' || log.status === 'hadir_terlambat' || log.status === 'hadir_izin_terlambat').length
  const totalTerlambat = filteredData.filter(log => log.status === 'hadir_terlambat').length
  const totalIzin = filteredData.filter(log => log.status === 'izin').length
  const totalSakit = filteredData.filter(log => log.status === 'sakit').length
  const totalPresensi = filteredData.length

  // Hitung persentase kehadiran
  const persentaseHadir = totalPresensi > 0 ? ((totalHadir / totalPresensi) * 100).toFixed(1) : 0
  const persentaseTerlambat = totalPresensi > 0 ? ((totalTerlambat / totalPresensi) * 100).toFixed(1) : 0

  // Get label periode
  const getPeriodeLabel = () => {
    switch(filter) {
      case 'bulan_ini': return 'Bulan Ini'
      case 'bulan_lalu': return 'Bulan Lalu'
      case '3_bulan': return '3 Bulan Terakhir'
      case 'tahun_ini': return 'Tahun Ini'
      default: return 'Bulan Ini'
    }
  }

  const stats = [
    { 
      label: 'Total Hadir',
      sublabel: '(Termasuk Terlambat)',
      value: totalHadir, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      percentage: totalPresensi > 0 ? ((totalHadir / totalPresensi) * 100).toFixed(1) : 0
    },
    { 
      label: 'Terlambat',
      sublabel: '(Dari Total Hadir)',
      value: totalTerlambat, 
      icon: Clock, 
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      percentage: totalHadir > 0 ? ((totalTerlambat / totalHadir) * 100).toFixed(1) : 0
    },
    { 
      label: 'Izin',
      sublabel: '',
      value: totalIzin, 
      icon: FileText, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      percentage: totalPresensi > 0 ? ((totalIzin / totalPresensi) * 100).toFixed(1) : 0
    },
    { 
      label: 'Sakit',
      sublabel: '',
      value: totalSakit, 
      icon: UserX, 
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      percentage: totalPresensi > 0 ? ((totalSakit / totalPresensi) * 100).toFixed(1) : 0
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Statistik Kehadiran Saya</h2>
          <p className="text-sm text-gray-600 mt-1">Periode: {getPeriodeLabel()}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="bulan_ini">Bulan Ini</option>
          <option value="bulan_lalu">Bulan Lalu</option>
          <option value="3_bulan">3 Bulan Terakhir</option>
          <option value="tahun_ini">Tahun Ini</option>
        </select>
      </div>

      {/* Persentase Kehadiran */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Persentase Kehadiran</p>
            <p className="text-4xl font-bold mt-2">{persentaseHadir}%</p>
            <p className="text-blue-100 text-sm mt-2">
              {totalHadir} dari {totalPresensi} hari
            </p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg shadow p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`${stat.textColor} text-sm font-medium`}>{stat.label}</p>
            {stat.sublabel && (
              <p className="text-xs text-gray-500">{stat.sublabel}</p>
            )}
            <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stat.percentage}% {stat.sublabel ? 'dari hadir' : 'dari total'}
            </p>
          </div>
        ))}
      </div>

      {/* Info Keterlambatan */}
      {totalTerlambat > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">Catatan Keterlambatan</h3>
              <p className="text-sm text-yellow-700">
                Anda terlambat sebanyak <strong>{totalTerlambat} kali</strong> ({persentaseTerlambat}%) dalam periode ini.
                Usahakan untuk datang tepat waktu agar tidak terlambat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Presensi Terbaru */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Riwayat Presensi Terbaru</h3>
          <p className="text-sm text-gray-500 mt-1">10 presensi terakhir</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.tanggal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.jam_masuk || log.jam_hadir || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.jam_pulang || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'hadir_terlambat' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.status === 'izin' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {log.status === 'hadir' ? 'Hadir' :
                       log.status === 'hadir_terlambat' ? 'Terlambat' : 
                       log.status === 'hadir_izin_terlambat' ? 'Izin Terlambat' : 
                       log.status === 'izin' ? 'Izin' :
                       log.status === 'sakit' ? 'Sakit' :
                       log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.keterangan || '-'}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Belum ada data presensi untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-800 mb-2">💡 Tips Meningkatkan Kehadiran</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Datang tepat waktu sebelum jam masuk normal</li>
              <li>Jangan lupa presensi pulang setelah jam 09:00 WIB</li>
              <li>Jika berhalangan, segera isi presensi izin/sakit dengan keterangan</li>
              <li>Cek jadwal piket Anda agar tidak terlambat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuruStatistik
