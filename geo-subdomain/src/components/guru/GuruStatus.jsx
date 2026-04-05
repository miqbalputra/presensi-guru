import { useState, useEffect } from 'react'
import { UserCheck, UserX, FileText, AlertCircle } from 'lucide-react'
import { formatDateForInput } from '../../utils/dateUtils'
import { guruAPI, presensiAPI } from '../../services/api'

function GuruStatus({ user }) {
  const [statusList, setStatusList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
    
    // Auto refresh setiap 30 detik
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [user.id])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const today = formatDateForInput(new Date()) // Format yyyy-mm-dd
      
      console.log('=== Loading Status Guru Lain ===')
      console.log('Current User ID:', user.id)
      console.log('Today:', today)
      
      // Load semua guru dan presensi hari ini dengan cache busting
      const timestamp = new Date().getTime()
      const [guruResponse, presensiResponse] = await Promise.all([
        guruAPI.getAll(),
        presensiAPI.getAll({ tanggal: today, _t: timestamp })
      ])

      console.log('All Guru:', guruResponse.data)
      console.log('Today Logs Raw:', presensiResponse.data)

      const allGuru = guruResponse.data || []
      const todayLogs = presensiResponse.data || []

      console.log('Total Guru:', allGuru.length)
      console.log('Total Logs Today:', todayLogs.length)

      // Map status untuk setiap guru (exclude current user)
      const status = allGuru
        .filter(guru => {
          const isCurrentUser = guru.id === user.id
          console.log('Guru:', guru.nama, '(ID:', guru.id, ') - Is current user?', isCurrentUser)
          return !isCurrentUser
        })
        .map(guru => {
          const attendance = todayLogs.find(log => {
            // Support both snake_case and camelCase
            const logUserId = log.user_id || log.userId
            const match = logUserId === guru.id
            if (match) {
              console.log('✅ MATCH FOUND - Guru:', guru.nama, 'Log userId:', logUserId, 'Status:', log.status)
            }
            return match
          })
          
          if (!attendance) {
            console.log('❌ NO MATCH - Guru:', guru.nama, '(ID:', guru.id, ') - No attendance found')
          }
          
          return {
            ...guru,
            status: attendance ? attendance.status : 'belum',
            jamMasuk: attendance ? (attendance.jam_masuk || attendance.jamMasuk || attendance.jam_hadir || attendance.jamHadir || '-') : '-'
          }
        })

      console.log('Final Status List:', status)
      setStatusList(status)
    } catch (error) {
      console.error('Failed to load status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'hadir':
        return {
          icon: UserCheck,
          text: 'Hadir',
          className: 'bg-green-100 text-green-800'
        }
      case 'hadir_terlambat':
        return {
          icon: UserCheck,
          text: 'Hadir (Terlambat)',
          className: 'bg-yellow-100 text-yellow-800'
        }
      case 'hadir_izin_terlambat':
        return {
          icon: UserCheck,
          text: 'Hadir - Izin Terlambat',
          className: 'bg-blue-100 text-blue-800'
        }
      case 'izin':
        return {
          icon: FileText,
          text: 'Izin',
          className: 'bg-yellow-100 text-yellow-800'
        }
      case 'sakit':
        return {
          icon: AlertCircle,
          text: 'Sakit',
          className: 'bg-red-100 text-red-800'
        }
      default:
        return {
          icon: UserX,
          text: 'Belum Absen',
          className: 'bg-gray-100 text-gray-800'
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat status guru...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Status Guru Lain</h2>
        <button
          onClick={loadStatus}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 Refresh
        </button>
      </div>

      {statusList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Tidak ada guru lain</p>
        </div>
      ) : (
        <div className="space-y-3">
          {statusList.map((guru) => {
            const badge = getStatusBadge(guru.status)
            const Icon = badge.icon

            return (
            <div key={guru.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{guru.nama}</h3>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                  </p>
                  {(guru.status === 'hadir' || guru.status === 'hadir_terlambat' || guru.status === 'hadir_izin_terlambat') && (
                    <p className="text-xs text-gray-500 mt-1">Jam Masuk: {guru.jamMasuk}</p>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${badge.className}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{badge.text}</span>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}

export default GuruStatus
