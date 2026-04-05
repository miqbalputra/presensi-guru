import { useState, useEffect, useCallback } from 'react'
import { UserCheck, UserX, FileText, AlertCircle, LogOut, RefreshCw, Clock } from 'lucide-react'
import { formatDateForInput } from '../../utils/dateUtils'
import { guruAPI, presensiAPI } from '../../services/api'

function GuruStatus({ user }) {
  const [statusList, setStatusList] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadStatus = useCallback(async () => {
    try {
      const today = formatDateForInput(new Date())
      const timestamp = new Date().getTime()

      const [guruResponse, presensiResponse] = await Promise.all([
        guruAPI.getAll(),
        presensiAPI.getAll({ tanggal: today, status_rekan: 1, _t: timestamp })
      ])

      const allGuru = guruResponse.data || []
      const todayLogs = presensiResponse.data || []

      const status = allGuru
        .filter(guru => guru.id !== user.id)
        .map(guru => {
          const attendance = todayLogs.find(log => {
            const logUserId = log.user_id || log.userId
            return logUserId === guru.id
          })

          // Tentukan status lengkap termasuk "sudah_pulang"
          let statusFinal = 'belum'
          let jamMasuk = '-'
          let jamPulang = null

          if (attendance) {
            statusFinal = attendance.status
            jamMasuk = attendance.jam_masuk || attendance.jamMasuk || attendance.jam_hadir || attendance.jamHadir || '-'
            jamPulang = attendance.jam_pulang || attendance.jamPulang || null

            // Jika hadir dan sudah ada jam pulang → tampilkan "sudah_pulang"
            if (
              (statusFinal === 'hadir' || statusFinal === 'hadir_terlambat' || statusFinal === 'hadir_izin_terlambat') &&
              jamPulang
            ) {
              statusFinal = 'sudah_pulang'
            }
          }

          return {
            ...guru,
            statusFinal,
            statusAsli: attendance?.status || 'belum',
            jamMasuk,
            jamPulang
          }
        })

      // Urutkan: hadir dulu, lalu belum absen, lalu izin/sakit
      const order = { hadir: 0, hadir_terlambat: 1, hadir_izin_terlambat: 2, sudah_pulang: 3, izin: 4, sakit: 5, belum: 6 }
      status.sort((a, b) => (order[a.statusFinal] ?? 9) - (order[b.statusFinal] ?? 9))

      setStatusList(status)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load status:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadStatus()
    // Auto refresh setiap 30 detik
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [loadStatus])

  const getStatusConfig = (statusFinal) => {
    switch (statusFinal) {
      case 'hadir':
        return {
          icon: UserCheck,
          text: 'Hadir',
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800',
          dot: 'bg-green-500',
          iconColor: 'text-green-600'
        }
      case 'hadir_terlambat':
        return {
          icon: Clock,
          text: 'Hadir (Terlambat)',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800',
          dot: 'bg-yellow-500',
          iconColor: 'text-yellow-600'
        }
      case 'hadir_izin_terlambat':
        return {
          icon: UserCheck,
          text: 'Izin Terlambat',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
          dot: 'bg-blue-500',
          iconColor: 'text-blue-600'
        }
      case 'sudah_pulang':
        return {
          icon: LogOut,
          text: 'Sudah Pulang',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800',
          dot: 'bg-purple-500',
          iconColor: 'text-purple-600'
        }
      case 'izin':
        return {
          icon: FileText,
          text: 'Izin',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'bg-orange-100 text-orange-800',
          dot: 'bg-orange-500',
          iconColor: 'text-orange-600'
        }
      case 'sakit':
        return {
          icon: AlertCircle,
          text: 'Sakit',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-800',
          dot: 'bg-red-500',
          iconColor: 'text-red-600'
        }
      default:
        return {
          icon: UserX,
          text: 'Belum Absen',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-600',
          dot: 'bg-gray-400',
          iconColor: 'text-gray-400'
        }
    }
  }

  // Ringkasan jumlah per status
  const summary = {
    hadir: statusList.filter(g => g.statusFinal === 'hadir').length,
    terlambat: statusList.filter(g => g.statusFinal === 'hadir_terlambat').length,
    pulang: statusList.filter(g => g.statusFinal === 'sudah_pulang').length,
    izin: statusList.filter(g => g.statusFinal === 'izin').length,
    sakit: statusList.filter(g => g.statusFinal === 'sakit').length,
    belum: statusList.filter(g => g.statusFinal === 'belum').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Memuat status rekan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Status Rekan Guru</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={() => { setLoading(true); loadStatus() }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          { label: 'Hadir', count: summary.hadir, color: 'bg-green-100 text-green-800' },
          { label: 'Terlambat', count: summary.terlambat, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Pulang', count: summary.pulang, color: 'bg-purple-100 text-purple-800' },
          { label: 'Izin', count: summary.izin, color: 'bg-orange-100 text-orange-800' },
          { label: 'Sakit', count: summary.sakit, color: 'bg-red-100 text-red-800' },
          { label: 'Belum', count: summary.belum, color: 'bg-gray-100 text-gray-600' },
        ].map(item => (
          <div key={item.label} className={`${item.color} rounded-xl p-2 text-center`}>
            <p className="text-xl font-black">{item.count}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Daftar Guru */}
      {statusList.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Tidak ada data rekan guru
        </div>
      ) : (
        <div className="space-y-2">
          {statusList.map((guru) => {
            const cfg = getStatusConfig(guru.statusFinal)
            const Icon = cfg.icon
            return (
              <div
                key={guru.id}
                className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-center gap-3`}
              >
                {/* Avatar inisial */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                  guru.statusFinal === 'belum' ? 'bg-gray-400' :
                  guru.statusFinal === 'hadir' ? 'bg-green-500' :
                  guru.statusFinal === 'hadir_terlambat' ? 'bg-yellow-500' :
                  guru.statusFinal === 'sudah_pulang' ? 'bg-purple-500' :
                  guru.statusFinal === 'izin' ? 'bg-orange-500' :
                  guru.statusFinal === 'sakit' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {guru.nama?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Info guru */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{guru.nama}</p>
                  {guru.jabatan && (
                    <p className="text-xs text-gray-500 truncate">
                      {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                    </p>
                  )}
                  {/* Tampilkan jam masuk / pulang */}
                  {guru.statusFinal !== 'belum' && guru.statusFinal !== 'izin' && guru.statusFinal !== 'sakit' && (
                    <div className="flex items-center gap-3 mt-0.5">
                      {guru.jamMasuk && guru.jamMasuk !== '-' && (
                        <p className="text-[11px] text-gray-500">
                          ▶ Masuk: <span className="font-semibold">{guru.jamMasuk}</span>
                        </p>
                      )}
                      {guru.jamPulang && (
                        <p className="text-[11px] text-gray-500">
                          ◀ Pulang: <span className="font-semibold">{guru.jamPulang}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Badge status */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.badge} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                  <span className="text-xs font-bold whitespace-nowrap">{cfg.text}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Auto refresh info */}
      <p className="text-center text-xs text-gray-400 pb-2">
        🔄 Otomatis refresh setiap 30 detik
      </p>
    </div>
  )
}

export default GuruStatus
