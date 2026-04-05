import { useState, useEffect } from 'react'
import { Trophy, Award, Star, TrendingUp, Clock, Target } from 'lucide-react'
import { formatDateForInput } from '../../utils/dateUtils'
import { guruAPI, presensiAPI } from '../../services/api'

function LeaderboardGuru() {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month') // week, month, all

  useEffect(() => {
    loadLeaderboard()
  }, [period])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const [guruResponse, presensiResponse] = await Promise.all([
        guruAPI.getAll(),
        presensiAPI.getAll()
      ])

      const dataGuru = guruResponse.data
      const allPresensi = presensiResponse.data

      // Filter presensi berdasarkan periode
      const filteredPresensi = filterByPeriod(allPresensi)

      // Hitung total hari aktif (hari dimana ada presensi dari semua guru)
      const uniqueDates = [...new Set(filteredPresensi.map(p => p.tanggal))].sort()
      const totalHariAktif = uniqueDates.length

      // Hitung statistik per guru
      const stats = dataGuru.map(guru => {
        const guruPresensi = filteredPresensi.filter(p => p.user_id === guru.id)
        
        // Total hari guru hadir (semua status hadir)
        const totalHadir = guruPresensi.filter(p => 
          p.status === 'hadir' || 
          p.status === 'hadir_terlambat' || 
          p.status === 'hadir_izin_terlambat'
        ).length
        
        // Hanya yang tepat waktu (status 'hadir' saja)
        const tepatWaktu = guruPresensi.filter(p => p.status === 'hadir').length
        
        // Yang terlambat
        const terlambat = guruPresensi.filter(p => 
          p.status === 'hadir_terlambat' || 
          p.status === 'hadir_izin_terlambat'
        ).length
        
        // Izin + Sakit
        const izin = guruPresensi.filter(p => p.status === 'izin').length
        const sakit = guruPresensi.filter(p => p.status === 'sakit').length
        
        // Tidak presensi sama sekali
        const tidakPresensi = totalHariAktif - guruPresensi.length
        
        // Persentase kehadiran dari total hari aktif
        const persentaseKehadiran = totalHariAktif > 0 ? (totalHadir / totalHariAktif) * 100 : 0
        
        // Persentase tepat waktu dari total hari hadir
        const persentaseTepatWaktu = totalHadir > 0 ? (tepatWaktu / totalHadir) * 100 : 0
        
        // SKOR BARU: Prioritas untuk yang selalu hadir DAN tepat waktu
        // - Kehadiran 70% (harus hadir setiap hari)
        // - Tepat waktu 30% (dari hari hadir, harus tepat waktu)
        const skor = (persentaseKehadiran * 0.7) + (persentaseTepatWaktu * 0.3)

        return {
          id: guru.id,
          nama: guru.nama,
          jabatan: guru.jabatan,
          totalHadir,
          tepatWaktu,
          terlambat,
          izin,
          sakit,
          tidakPresensi,
          totalHariAktif,
          persentaseKehadiran: Math.round(persentaseKehadiran * 10) / 10, // 1 desimal
          persentaseTepatWaktu: Math.round(persentaseTepatWaktu * 10) / 10, // 1 desimal
          skor: Math.round(skor * 10) / 10 // 1 desimal
        }
      })

      // Sort by skor (descending), jika sama sort by tepatWaktu
      const sorted = stats.sort((a, b) => {
        if (b.skor === a.skor) {
          return b.tepatWaktu - a.tepatWaktu
        }
        return b.skor - a.skor
      })
      
      setLeaderboardData(sorted)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterByPeriod = (presensi) => {
    const today = new Date()
    const todayStr = formatDateForInput(today)

    switch(period) {
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 6)
        const weekStr = formatDateForInput(weekAgo)
        return presensi.filter(p => p.tanggal >= weekStr && p.tanggal <= todayStr)
      
      case 'month':
        const monthAgo = new Date()
        monthAgo.setDate(today.getDate() - 29)
        const monthStr = formatDateForInput(monthAgo)
        return presensi.filter(p => p.tanggal >= monthStr && p.tanggal <= todayStr)
      
      case 'all':
        return presensi
      
      default:
        return presensi
    }
  }

  // Tidak perlu lagi karena kita hitung dari data aktual
  // const getWorkingDays = (period) => { ... }

  const getBadge = (rank, skor) => {
    if (rank === 1) {
      return {
        icon: Trophy,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        label: '🥇 Juara 1',
        emoji: '🏆'
      }
    } else if (rank === 2) {
      return {
        icon: Award,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        label: '🥈 Juara 2',
        emoji: '🥈'
      }
    } else if (rank === 3) {
      return {
        icon: Award,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        label: '🥉 Juara 3',
        emoji: '🥉'
      }
    } else if (skor >= 90) {
      return {
        icon: Star,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: '⭐ Excellent',
        emoji: '⭐'
      }
    } else if (skor >= 75) {
      return {
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: '✓ Good',
        emoji: '✓'
      }
    } else {
      return {
        icon: Target,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: '○ Keep Going',
        emoji: '○'
      }
    }
  }

  const getPeriodLabel = () => {
    switch(period) {
      case 'week': return '7 Hari Terakhir'
      case 'month': return '30 Hari Terakhir'
      case 'all': return 'Semua Waktu'
      default: return '30 Hari Terakhir'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">🏆 Leaderboard Guru</h2>
              <p className="text-sm text-gray-600">Guru Paling Rajin & Disiplin</p>
            </div>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>

        {/* Top 3 Podium */}
        {leaderboardData.length >= 3 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* Rank 2 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 shadow-md border-2 border-gray-300 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700">2</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm truncate">{leaderboardData[1].nama}</p>
                  <p className="text-xs text-gray-600 mb-2">{leaderboardData[1].skor}% Skor</p>
                  <div className="flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {leaderboardData[1].persentaseKehadiran}% Hadir
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank 1 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 shadow-xl border-4 border-yellow-400 transform hover:scale-105 transition-transform">
                  <div className="text-5xl mb-2">🏆</div>
                  <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-yellow-900">1</span>
                  </div>
                  <p className="font-bold text-gray-800 truncate">{leaderboardData[0].nama}</p>
                  <p className="text-sm text-gray-700 mb-2 font-semibold">{leaderboardData[0].skor}% Skor</p>
                  <div className="flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                      {leaderboardData[0].persentaseKehadiran}% Hadir
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-4 shadow-md border-2 border-orange-300 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="w-16 h-16 bg-orange-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-800">3</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm truncate">{leaderboardData[2].nama}</p>
                  <p className="text-xs text-gray-600 mb-2">{leaderboardData[2].skor}% Skor</p>
                  <div className="flex justify-center gap-1 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {leaderboardData[2].persentaseKehadiran}% Hadir
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Nama Guru</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Skor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Kehadiran</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Tepat Waktu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboardData.map((guru, index) => {
                  const rank = index + 1
                  const badge = getBadge(rank, guru.skor)
                  const BadgeIcon = badge.icon

                  return (
                    <tr 
                      key={guru.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        rank <= 3 ? badge.bgColor : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            rank === 2 ? 'bg-gray-300 text-gray-700' :
                            rank === 3 ? 'bg-orange-300 text-orange-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                          </div>
                        </div>
                      </td>

                      {/* Nama */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">{guru.nama}</p>
                          <p className="text-xs text-gray-500">
                            {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                          </p>
                        </div>
                      </td>

                      {/* Skor */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-2xl font-bold ${
                            guru.skor >= 90 ? 'text-green-600' :
                            guru.skor >= 75 ? 'text-blue-600' :
                            guru.skor >= 60 ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {guru.skor}
                          </span>
                          <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                      </td>

                      {/* Kehadiran */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-gray-800">
                            {guru.totalHadir}/{guru.totalHariAktif}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            guru.persentaseKehadiran === 100 ? 'bg-green-100 text-green-700' :
                            guru.persentaseKehadiran >= 90 ? 'bg-blue-100 text-blue-700' :
                            guru.persentaseKehadiran >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {guru.persentaseKehadiran}%
                          </span>
                          {guru.terlambat > 0 && (
                            <span className="text-xs text-orange-600">
                              {guru.terlambat}× terlambat
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tepat Waktu */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-gray-800">
                            {guru.tepatWaktu}/{guru.totalHadir}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            guru.persentaseTepatWaktu === 100 ? 'bg-green-100 text-green-700' :
                            guru.persentaseTepatWaktu >= 90 ? 'bg-blue-100 text-blue-700' :
                            guru.persentaseTepatWaktu >= 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {guru.persentaseTepatWaktu}%
                          </span>
                          {guru.tidakPresensi > 0 && (
                            <span className="text-xs text-red-600">
                              {guru.tidakPresensi}× tidak presensi
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Badge */}
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${badge.bgColor} border-2 ${badge.borderColor}`}>
                            <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                            <span className={`text-xs font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">📊 Cara Perhitungan Skor:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>• <strong>Skor = (Kehadiran × 70%) + (Tepat Waktu × 30%)</strong></div>
            <div>• Periode: {getPeriodLabel()}</div>
            <div>• <strong>Kehadiran</strong>: Total hadir / Total hari aktif</div>
            <div>• <strong>Tepat Waktu</strong>: Hadir tepat / Total hadir</div>
            <div>• 🏆 Top 3 = Ranking tertinggi</div>
            <div>• ⭐ Skor ≥90% = Excellent</div>
            <div>• ✓ Skor ≥75% = Good</div>
            <div>• <strong>Juara</strong>: Selalu hadir + Selalu tepat waktu</div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            <strong>💡 Tips Jadi Juara:</strong> Hadir setiap hari + Tidak pernah terlambat = Skor 100%
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardGuru
