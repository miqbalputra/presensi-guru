import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Clock, AlertCircle, CheckCircle, FileText, UserX } from 'lucide-react'
import { optionalWorkdaysAPI, presensiAPI, settingsAPI, teacherWorkdaysAPI } from '../../services/api'
import { formatDateForInput, getWorkdayDates } from '../../utils/dateUtils'

function GuruStatistik({ user }) {
  const [presensiData, setPresensiData] = useState([])
  const [workdaysData, setWorkdaysData] = useState(null)
  const [optionalWorkdays, setOptionalWorkdays] = useState([])
  const [settings, setSettings] = useState({
    weekend_workday_enabled: '0',
    saturday_male_workday_enabled: '0',
    saturday_female_workday_enabled: '0',
    sunday_male_workday_enabled: '0',
    sunday_female_workday_enabled: '0'
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('bulan_ini')

  useEffect(() => {
    if (user?.id) {
      loadPresensiData()
    }
  }, [filter, user?.id])

  const getPeriodRange = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    switch(filter) {
      case 'bulan_ini':
        // Dari tanggal 1 sampai akhir bulan di bulan berjalan
        return {
          startDate: formatDateForInput(new Date(currentYear, currentMonth, 1)),
          endDate: formatDateForInput(new Date(currentYear, currentMonth + 1, 0))
        }
      case 'bulan_lalu':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return {
          startDate: formatDateForInput(new Date(lastMonthYear, lastMonth, 1)),
          endDate: formatDateForInput(new Date(lastMonthYear, lastMonth + 1, 0))
        }
      case '3_bulan':
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(today.getMonth() - 3)
        return {
          startDate: formatDateForInput(threeMonthsAgo),
          endDate: formatDateForInput(today)
        }
      case 'tahun_ini':
        return {
          startDate: formatDateForInput(new Date(currentYear, 0, 1)),
          endDate: formatDateForInput(today)
        }
      default:
        return {
          startDate: formatDateForInput(new Date(currentYear, currentMonth, 1)),
          endDate: formatDateForInput(new Date(currentYear, currentMonth + 1, 0))
        }
    }
  }

  const loadPresensiData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getPeriodRange()

      // Pastikan user.id valid numerik sebelum memanggil API
      const numericUserId = user?.id != null ? Number(user.id) : null
      if (!numericUserId || Number.isNaN(numericUserId)) {
        console.error('GuruStatistik: user.id tidak valid', user)
        setLoading(false)
        return
      }

      const [presensiResponse, settingsResponse, workdaysResponse, optionalResponse] = await Promise.allSettled([
        presensiAPI.getAll({ user_id: numericUserId }),
        settingsAPI.getAll(),
        teacherWorkdaysAPI.getWorkdays(numericUserId, startDate, endDate),
        optionalWorkdaysAPI.getAll({ start_date: startDate, end_date: endDate })
      ])

      if (presensiResponse.status === 'fulfilled') {
        setPresensiData(presensiResponse.value.data)
      } else {
        console.error('GuruStatistik presensiAPI failed:', presensiResponse.reason)
      }

      if (settingsResponse.status === 'fulfilled') {
        setSettings(prev => ({ ...prev, ...settingsResponse.value.data }))
      } else {
        console.error('GuruStatistik settingsAPI failed:', settingsResponse.reason)
      }

      if (workdaysResponse.status === 'fulfilled') {
        setWorkdaysData(workdaysResponse.value.data)
      } else {
        console.error('GuruStatistik teacherWorkdaysAPI failed:', workdaysResponse.reason)
      }

      if (optionalResponse.status === 'fulfilled') {
        const optionalDates = (optionalResponse.value.data || []).map(o => o.tanggal || o)
        setOptionalWorkdays(optionalDates.length > 0 ? optionalDates : (workdaysResponse.status === 'fulfilled' ? (workdaysResponse.value.data?.optional_dates || []) : []))
      } else {
        console.error('GuruStatistik optionalWorkdaysAPI failed:', optionalResponse.reason)
      }
    } catch (error) {
      console.error('Failed to load presensi data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    const { startDate, endDate } = getPeriodRange()
    return presensiData.filter(log => log.tanggal >= startDate && log.tanggal <= endDate)
  }

  const filteredData = getFilteredData()
  const { startDate, endDate } = getPeriodRange()

  // Normalisasi gender dari berbagai kemungkinan field user
  const userGender = user?.jenisKelamin || user?.jenis_kelamin || user?.gender || ''

  // Gunakan backend-calculated workday dates yang sudah mempertimbangkan override per guru
  const workdayDates = workdaysData?.workday_dates || []
  const workdaySet = new Set(workdayDates)
  const optionalSet = new Set(optionalWorkdays)

  // Presensi aktual milik guru dalam periode
  const allUserLogs = filteredData

  // Override map untuk status tampilan (is_workday/off)
  const overrideByDate = new Map(
    (workdaysData?.breakdown || [])
      .filter(d => d.override)
      .map(d => [d.tanggal, d.override.is_workday == 1])
  )

  // Hari kerja sudah dihitung backend (dengan override). Presensi di hari non-workday
  // tidak dimasukkan ke total hari kerja; hanya hari kerja yang dianggap relevan.
  const relevantDates = workdayDates
    .filter(date => date >= startDate && date <= endDate)
    .sort()
    .reverse()

  // Data presensi yang relevan: hari kerja wajib + hari opsional (bonus)
  const workdayData = allUserLogs.filter(log => workdaySet.has(log.tanggal))
  const optionalData = allUserLogs.filter(log => optionalSet.has(log.tanggal))
  const optionalHadir = optionalData.filter(log => log.status === 'hadir' || log.status === 'hadir_terlambat' || log.status === 'hadir_izin_terlambat').length

  const logsByDate = new Map(allUserLogs.map(log => [log.tanggal, log]))
  const optionalDatesWithPresence = optionalWorkdays.filter(d => logsByDate.has(d) && d >= startDate && d <= endDate)
  const displayData = [
    ...relevantDates,
    ...optionalDatesWithPresence.filter(d => !workdaySet.has(d))
  ].sort().reverse().map(date => {
    const log = logsByDate.get(date)
    return log || {
      id: `alfa-${date}`,
      tanggal: date,
      status: 'alfa',
      jam_masuk: '-',
      jam_hadir: '-',
      jam_pulang: '-',
      keterangan: 'Tidak presensi'
    }
  })

  // Hari opsional yang dihadiri menambah total hari kerja; yang tidak hadir tidak menambah dan tidak alfa
  const totalPresensi = relevantDates.length + optionalHadir
  const totalHadir = workdayData.filter(log => log.status === 'hadir' || log.status === 'hadir_terlambat' || log.status === 'hadir_izin_terlambat').length + optionalHadir
  const totalTerlambat = workdayData.filter(log => log.status === 'hadir_terlambat').length
    + optionalData.filter(log => log.status === 'hadir_terlambat').length
  const totalIzin = workdayData.filter(log => log.status === 'izin').length
  const totalSakit = workdayData.filter(log => log.status === 'sakit').length
  const totalAlfa = Math.max(relevantDates.length - workdayData.length, 0)

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
      darkColor: 'dark:bg-green-500/20',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-500/10',
      textColor: 'text-green-600',
      darkTextColor: 'dark:text-green-400',
      percentage: totalPresensi > 0 ? ((totalHadir / totalPresensi) * 100).toFixed(1) : 0
    },
    { 
      label: 'Terlambat',
      sublabel: '(Dari Total Hadir)',
      value: totalTerlambat, 
      icon: Clock, 
      color: 'bg-yellow-500',
      darkColor: 'dark:bg-yellow-500/20',
      bgColor: 'bg-yellow-50',
      darkBgColor: 'dark:bg-yellow-500/10',
      textColor: 'text-yellow-600',
      darkTextColor: 'dark:text-yellow-400',
      percentage: totalHadir > 0 ? ((totalTerlambat / totalHadir) * 100).toFixed(1) : 0
    },
    { 
      label: 'Izin',
      sublabel: '',
      value: totalIzin, 
      icon: FileText, 
      color: 'bg-blue-500',
      darkColor: 'dark:bg-blue-500/20',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-500/10',
      textColor: 'text-blue-600',
      darkTextColor: 'dark:text-blue-400',
      percentage: totalPresensi > 0 ? ((totalIzin / totalPresensi) * 100).toFixed(1) : 0
    },
    { 
      label: 'Sakit',
      sublabel: '',
      value: totalSakit, 
      icon: UserX, 
      color: 'bg-red-500',
      darkColor: 'dark:bg-red-500/20',
      bgColor: 'bg-red-50',
      darkBgColor: 'dark:bg-red-500/10',
      textColor: 'text-red-600',
      darkTextColor: 'dark:text-red-400',
      percentage: totalPresensi > 0 ? ((totalSakit / totalPresensi) * 100).toFixed(1) : 0
    },
    {
      label: 'Alfa',
      sublabel: '(Tidak Presensi)',
      value: totalAlfa,
      icon: AlertCircle,
      color: 'bg-gray-600',
      darkColor: 'dark:bg-slate-400/20',
      bgColor: 'bg-gray-50',
      darkBgColor: 'dark:bg-slate-400/10',
      textColor: 'text-gray-700',
      darkTextColor: 'dark:text-slate-300',
      percentage: totalPresensi > 0 ? ((totalAlfa / totalPresensi) * 100).toFixed(1) : 0
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Statistik Kehadiran Saya</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Periode: {getPeriodeLabel()}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
        >
          <option value="bulan_ini">Bulan Ini</option>
          <option value="bulan_lalu">Bulan Lalu</option>
          <option value="3_bulan">3 Bulan Terakhir</option>
          <option value="tahun_ini">Tahun Ini</option>
        </select>
      </div>

      {/* Persentase Kehadiran */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl shadow-[0_8px_24px_rgba(99,102,241,0.35)] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Persentase Kehadiran</p>
            <p className="text-4xl font-bold mt-2">{persentaseHadir}%</p>
            <p className="text-indigo-100 text-sm mt-2">
              {totalHadir} dari {totalPresensi} hari kerja
            </p>
          </div>
          <div className="p-4 bg-white/15 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} ${stat.darkBgColor} rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 transition-colors`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} ${stat.darkColor} p-2 rounded-xl`}>
                <stat.icon className="w-5 h-5 text-white dark:text-current" />
              </div>
            </div>
            <p className={`${stat.textColor} ${stat.darkTextColor} text-sm font-semibold`}>{stat.label}</p>
            {stat.sublabel && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.sublabel}</p>
            )}
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stat.percentage}% {stat.sublabel ? 'dari hadir' : 'dari total'}
            </p>
          </div>
        ))}
      </div>

      {/* Info Keterlambatan */}
      {totalTerlambat > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">Catatan Keterlambatan</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300/80">
                Anda terlambat sebanyak <strong>{totalTerlambat} kali</strong> ({persentaseTerlambat}%) dalam periode ini.
                Usahakan untuk datang tepat waktu agar tidak terlambat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Presensi Terbaru */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Riwayat Presensi Bulan Ini</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Semua hari kerja bulan ini, termasuk alfa</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tanggal</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Jam Masuk</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Jam Pulang</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayData.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 font-medium">{log.tanggal}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {log.jam_masuk || log.jam_hadir || '-'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {log.jam_pulang || '-'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' : ''}
                      ${log.status === 'hadir_terlambat' ? 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
                      ${log.status === 'izin' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' : ''}
                      ${log.status === 'alfa' ? 'bg-slate-200 dark:bg-slate-600/30 text-slate-800 dark:text-slate-300' : ''}
                      ${log.status === 'libur_override' ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300' : ''}
                    `}>
                      {log.status === 'hadir' ? 'Hadir' :
                       log.status === 'hadir_terlambat' ? 'Terlambat' : 
                       log.status === 'hadir_izin_terlambat' ? 'Izin Terlambat' : 
                       log.status === 'izin' ? 'Izin' :
                       log.status === 'sakit' ? 'Sakit' :
                       log.status === 'alfa' ? 'Alfa' :
                       log.status === 'libur_override' ? 'Libur Khusus' :
                       log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{log.keterangan || '-'}</td>
                </tr>
              ))}
              {displayData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada data presensi untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">💡 Tips Meningkatkan Kehadiran</h3>
            <ul className="text-sm text-indigo-700 dark:text-indigo-300/80 space-y-1 list-disc list-inside">
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
