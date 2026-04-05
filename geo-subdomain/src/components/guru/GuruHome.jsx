import { useState, useEffect } from 'react'
import { CheckCircle, FileText, AlertCircle, Clock, QrCode } from 'lucide-react'
import { formatFullDate, formatDate, formatDateForInput, formatTimeForDB } from '../../utils/dateUtils'
import { getUserLocation, validateLocation } from '../../utils/geoLocation'
import { SCHOOL_LOCATION } from '../../data/dummyData'
import { presensiAPI, activityAPI, holidaysAPI, settingsAPI, jadwalPiketAPI } from '../../services/api'
import QRScanner from './QRScanner'

function GuruHome({ user }) {
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [isHoliday, setIsHoliday] = useState(false)
  const [holidayInfo, setHolidayInfo] = useState(null)
  const [settings, setSettings] = useState({
    jam_masuk_normal: '07:20',
    toleransi_terlambat: '15',
    radius_gps: '500',
    sekolah_latitude: '-5.1477',
    sekolah_longitude: '119.4327',
    mode_testing: '1'
  })
  const [jadwalPiketHariIni, setJadwalPiketHariIni] = useState(null)
  const [isPiketToday, setIsPiketToday] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    console.log('=== 🚀 Loading Initial Data ===')
    console.log('User:', user)
    setPageLoading(true)

    try {
      // Load settings, check holiday, check piket, then attendance
      console.log('1️⃣ Loading settings...')
      await loadSettings()
      console.log('✅ Settings loaded')

      console.log('2️⃣ Checking holiday...')
      await checkIfHoliday()
      console.log('✅ Holiday checked')

      console.log('3️⃣ Checking jadwal piket...')
      await checkJadwalPiket()
      console.log('✅ Jadwal piket checked')

      console.log('4️⃣ Checking attendance...')
      await checkTodayAttendance()
      console.log('✅ Attendance checked')

      console.log('=== ✅ Data Loaded ===')
    } catch (error) {
      console.error('❌ Failed to load initial data:', error)
    } finally {
      setPageLoading(false)
      console.log('=== 🏁 Page Loading Complete ===')
    }
  }

  const checkJadwalPiket = async () => {
    console.log('🔵🔵🔵 CHECKING JADWAL PIKET START 🔵🔵🔵')
    console.log('🔵 User object:', user)

    try {
      console.log('🔵 Calling API jadwalPiketAPI.getToday()...')
      const response = await jadwalPiketAPI.getToday()
      console.log('🔵 API call completed')
      console.log('🔵 API Response:', JSON.stringify(response, null, 2))
      console.log('🔵 Response keys:', response ? Object.keys(response) : 'null')
      console.log('🔵 Response.data:', response?.data)
      console.log('🔵 Response.data type:', typeof response?.data)
      console.log('🔵 Response.data keys:', response?.data ? Object.keys(response.data) : 'null')

      if (response && response.success && response.data && response.data.jadwal) {
        const { jadwal } = response.data
        console.log('🔵 Jadwal list:', jadwal)
        console.log('🔵 Current user ID:', user.id)

        // Cek apakah user ada di jadwal piket hari ini
        const myPiket = jadwal.find(j => {
          console.log('🔵 Comparing:', j.user_id, 'with', user.id)
          return j.user_id === user.id
        })

        if (myPiket) {
          setJadwalPiketHariIni(myPiket)
          setIsPiketToday(true)
          console.log('🔵✅ Piket hari ini:', myPiket)
        } else {
          console.log('🔵ℹ️ Tidak ada piket hari ini untuk user:', user.id)
          setJadwalPiketHariIni(null)
          setIsPiketToday(false)
        }
      } else {
        console.log('🔵❌ No piket data or empty response')
        console.log('🔵❌ Condition check:', {
          hasResponse: !!response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
          hasJadwal: !!response?.data?.jadwal
        })
        setJadwalPiketHariIni(null)
        setIsPiketToday(false)
      }
      console.log('🔵🔵🔵 CHECKING JADWAL PIKET END 🔵🔵🔵')
    } catch (error) {
      console.error('🔵❌ Failed to check jadwal piket:', error)
      // Set default values on error
      setJadwalPiketHariIni(null)
      setIsPiketToday(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll()
      setSettings(response.data)
      console.log('⚙️ Settings loaded:', response.data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Use default settings if API fails
    }
  }

  // Fungsi untuk cek apakah terlambat
  const checkIfLate = (jamPresensi) => {
    const [jamMasuk, menitMasuk] = settings.jam_masuk_normal.split(':').map(Number)
    const [jamPresensiH, menitPresensiH] = jamPresensi.split(':').map(Number)

    const waktuMasuk = jamMasuk * 60 + menitMasuk
    const waktuPresensi = jamPresensiH * 60 + menitPresensiH

    const selisihMenit = waktuPresensi - waktuMasuk

    if (selisihMenit <= 0) {
      return { isLate: false, minutes: 0, severity: 'ontime' }
    } else if (selisihMenit <= parseInt(settings.toleransi_terlambat)) {
      return { isLate: true, minutes: selisihMenit, severity: 'late' }
    } else {
      return { isLate: true, minutes: selisihMenit, severity: 'very_late' }
    }
  }

  const checkIfHoliday = async () => {
    try {
      const today = formatDateForInput(new Date())
      console.log('🔍 Checking holiday for:', today)

      const response = await holidaysAPI.checkDate(today)
      console.log('📅 Holiday API response:', response)

      if (response && response.success && response.data) {
        const { isWorkday, isHoliday, isWeekend, holidayName, dayName } = response.data
        console.log('📊 Holiday data:', { isWorkday, isHoliday, isWeekend, holidayName, dayName })

        // Jika bukan hari kerja (libur atau weekend)
        if (!isWorkday) {
          console.log('🚫 NOT A WORKDAY - Setting isHoliday to TRUE')
          setIsHoliday(true)

          if (isWeekend) {
            console.log('📆 Weekend detected')
            setHolidayInfo({ type: 'weekend', message: `Hari ${dayName} adalah hari libur` })
          } else if (isHoliday) {
            console.log('🎉 Holiday detected:', holidayName)
            setHolidayInfo({ type: 'holiday', message: `Hari Libur: ${holidayName}` })
          }
        } else {
          console.log('✅ Workday - Setting isHoliday to FALSE')
          setIsHoliday(false)
          setHolidayInfo(null)
        }
      } else {
        console.log('⚠️ No valid response from holiday API')
        setIsHoliday(false)
        setHolidayInfo(null)
      }
    } catch (error) {
      console.error('❌ Failed to check holiday:', error)
      // Jika API error, anggap bukan hari libur (fail-safe)
      setIsHoliday(false)
      setHolidayInfo(null)
    }
  }

  const checkTodayAttendance = async () => {
    try {
      const today = formatDateForInput(new Date()) // Format yyyy-mm-dd untuk query database
      console.log('Checking attendance for:', { user_id: user.id, tanggal: today })

      const response = await presensiAPI.getAll({
        user_id: user.id,
        tanggal: today
      })

      console.log('Attendance response:', response)

      if (response.data && response.data.length > 0) {
        console.log('Today attendance found:', response.data[0])
        setTodayAttendance(response.data[0])
      } else {
        console.log('No attendance found for today')
      }
    } catch (error) {
      console.error('Failed to check attendance:', error)
    }
  }

  const handleHadir = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing === '1'

    try {
      const location = await getUserLocation()

      if (!TESTING_MODE) {
        // Gunakan koordinat dari settings (bukan hardcoded)
        const validation = validateLocation(
          location.latitude,
          location.longitude,
          parseFloat(settings.sekolah_latitude),
          parseFloat(settings.sekolah_longitude),
          parseInt(settings.radius_gps)
        )

        if (!validation.isValid) {
          setMessage({
            type: 'error',
            text: `Anda berada di luar jangkauan sekolah (${validation.distance}m dari sekolah). Maksimal jarak: ${settings.radius_gps}m`
          })
          setLoading(false)
          return
        }
      }

      saveAttendance('hadir', '', location.latitude, location.longitude)
    } catch (error) {
      // Jika gagal mendapatkan lokasi
      if (TESTING_MODE) {
        // Testing mode: gunakan koordinat sekolah
        saveAttendance('hadir', '', parseFloat(settings.sekolah_latitude), parseFloat(settings.sekolah_longitude))
      } else {
        // Produksi: tampilkan error
        setMessage({
          type: 'error',
          text: 'Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.'
        })
        setLoading(false)
      }
    }
  }

  const handleIzinSakit = (type) => {
    setModalType(type)
    setKeterangan('')
    setShowModal(true)
  }

  const submitIzinSakit = () => {
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan')
      return
    }
    setLoading(true)
    setShowModal(false)
    // Untuk izin/sakit, gunakan koordinat 0 (tidak perlu GPS)
    saveAttendance(modalType, keterangan, 0, 0)
  }

  const saveAttendance = async (status, ket, lat, lon) => {
    try {
      const currentTime = formatTimeForDB() // Format HH:MM:SS untuk database
      const today = formatDateForInput(new Date()) // Format yyyy-mm-dd untuk database

      console.log('💾 saveAttendance called:', { status, currentTime, today })

      // Cek apakah terlambat (hanya untuk status hadir)
      let finalStatus = status
      let finalKeterangan = ket
      let piketWarning = ''

      if (status === 'hadir') {
        console.log('✅ Status is hadir, checking late and piket...')

        const lateCheck = checkIfLate(currentTime)
        console.log('⏰ Late check result:', lateCheck)

        if (lateCheck.isLate) {
          if (lateCheck.severity === 'late') {
            finalStatus = 'hadir_terlambat'
            finalKeterangan = `Terlambat ${lateCheck.minutes} menit`
          } else if (lateCheck.severity === 'very_late') {
            finalStatus = 'hadir_terlambat'
            finalKeterangan = `Terlambat ${lateCheck.minutes} menit (Parah)`
          }
          console.log('🔴 User is late:', { finalStatus, finalKeterangan })
        } else {
          console.log('✅ User is on time')
        }

        // Cek apakah terlambat piket
        console.log('📋 Piket check - isPiketToday:', isPiketToday, 'jadwalPiketHariIni:', jadwalPiketHariIni)

        if (isPiketToday && jadwalPiketHariIni) {
          console.log('🔍 Checking piket late:', {
            isPiketToday,
            jadwalPiketHariIni,
            currentTime
          })

          // Format jam_piket bisa HH:MM:SS atau HH:MM, ambil HH:MM saja
          const jamPiketStr = jadwalPiketHariIni.jam_piket.substring(0, 5)
          const [jamPiket, menitPiket] = jamPiketStr.split(':').map(Number)
          const [jamPresensi, menitPresensi] = currentTime.split(':').map(Number)

          const waktuPiket = jamPiket * 60 + menitPiket
          const waktuPresensi = jamPresensi * 60 + menitPresensi

          console.log('⏰ Piket time comparison:', {
            jamPiketStr,
            waktuPiket,
            waktuPresensi,
            isLate: waktuPresensi > waktuPiket
          })

          if (waktuPresensi > waktuPiket) {
            const selisihMenitPiket = waktuPresensi - waktuPiket
            piketWarning = `⚠️ Anda terlambat hadir piket ${selisihMenitPiket} menit. Jam piket: ${jamPiketStr} WIB`
            console.log('⚠️ Piket warning:', piketWarning)

            // Cek setting: apakah terlambat piket dianggap hadir terlambat?
            if (settings.piket_terlambat_adalah_terlambat === '1') {
              finalStatus = 'hadir_terlambat'
              if (finalKeterangan) {
                finalKeterangan += ` | Terlambat piket ${selisihMenitPiket} menit`
              } else {
                finalKeterangan = `Terlambat piket ${selisihMenitPiket} menit`
              }
              console.log('🔴 Status changed to hadir_terlambat due to piket late')
            }
          } else {
            console.log('✅ Tidak terlambat piket')
          }
        } else {
          console.log('ℹ️ No piket check:', { isPiketToday, jadwalPiketHariIni })
        }
      }

      const presensiData = {
        userId: user.id,
        nama: user.nama,
        tanggal: today,
        status: finalStatus,
        jamMasuk: status === 'hadir' ? currentTime : null,
        jamPulang: null,
        jamHadir: status === 'hadir' ? currentTime : null,
        jamIzin: status === 'izin' ? currentTime : null,
        jamSakit: status === 'sakit' ? currentTime : null,
        keterangan: finalKeterangan,
        latitude: lat,
        longitude: lon
      }

      const response = await presensiAPI.create(presensiData)

      // Add activity log
      try {
        await activityAPI.create({
          user: user.nama,
          aktivitas: 'Input Presensi',
          status: finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1).replace('_', ' ')
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }

      // Pesan sukses dengan info terlambat dan piket
      let successMessage = `Presensi ${status} berhasil disimpan!`
      if (finalStatus === 'hadir_terlambat') {
        successMessage += ` (${finalKeterangan})`
      }
      if (piketWarning) {
        successMessage += `\n\n${piketWarning}`
      }

      setMessage({
        type: piketWarning ? 'warning' : 'success',
        text: successMessage
      })
      setLoading(false)

      // Reload data dari database dengan retry mechanism
      let retryCount = 0
      const maxRetries = 3

      const loadData = async () => {
        try {
          const response = await presensiAPI.getAll({
            user_id: user.id,
            tanggal: today
          })

          if (response.data && response.data.length > 0) {
            console.log('✅ Data loaded successfully:', response.data[0])
            setTodayAttendance(response.data[0])
          } else if (retryCount < maxRetries) {
            // Retry jika data belum ada
            retryCount++
            console.log(`⏳ Retry ${retryCount}/${maxRetries}...`)
            setTimeout(loadData, 300)
          } else {
            console.log('⚠️ Max retries reached, setting data manually')
            // Fallback: set manual jika retry gagal
            setTodayAttendance({
              id: response.data?.id || Date.now(),
              user_id: user.id,
              nama: user.nama,
              tanggal: today,
              status: finalStatus,
              jam_masuk: status === 'hadir' ? currentTime : null,
              jam_pulang: null,
              jam_hadir: status === 'hadir' ? currentTime : null,
              jamHadir: status === 'hadir' ? currentTime : null,
              jam_izin: status === 'izin' ? currentTime : null,
              jamIzin: status === 'izin' ? currentTime : null,
              jam_sakit: status === 'sakit' ? currentTime : null,
              jamSakit: status === 'sakit' ? currentTime : null,
              keterangan: finalKeterangan,
              latitude: lat,
              longitude: lon
            })
          }
        } catch (error) {
          console.error('❌ Failed to load data:', error)
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(loadData, 300)
          }
        }
      }

      // Start loading dengan delay kecil
      setTimeout(loadData, 200)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Gagal menyimpan presensi: ' + error.message
      })
      setLoading(false)
    }
  }

  // Fungsi untuk cek apakah tombol pulang bisa ditampilkan (minimal jam 09:00)
  const canShowPulangButton = () => {
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const currentTimeInMinutes = (currentHour * 60) + currentMinute
    const minTimeInMinutes = (9 * 60) + 0 // 09:00 = 540 menit

    return currentTimeInMinutes >= minTimeInMinutes
  }

  const handlePulang = async () => {
    if (!todayAttendance || (todayAttendance.status !== 'hadir' && todayAttendance.status !== 'hadir_terlambat' && todayAttendance.status !== 'hadir_izin_terlambat')) return

    // Cek apakah sudah presensi pulang (cek kedua field untuk compatibility)
    if (todayAttendance.jam_pulang || todayAttendance.jamPulang) {
      setMessage({ type: 'error', text: 'Anda sudah melakukan presensi pulang!' })
      return
    }

    // Cek waktu minimal (09:00 WIB)
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const currentTimeInMinutes = (currentHour * 60) + currentMinute
    const minTimeInMinutes = (9 * 60) + 0 // 09:00 = 540 menit

    if (currentTimeInMinutes < minTimeInMinutes) {
      setMessage({
        type: 'error',
        text: 'Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB'
      })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing === '1'

    try {
      const location = await getUserLocation()

      if (!TESTING_MODE) {
        // Gunakan koordinat dari settings (bukan hardcoded)
        const validation = validateLocation(
          location.latitude,
          location.longitude,
          parseFloat(settings.sekolah_latitude),
          parseFloat(settings.sekolah_longitude),
          parseInt(settings.radius_gps)
        )

        if (!validation.isValid) {
          setMessage({
            type: 'error',
            text: `Anda berada di luar jangkauan sekolah (${validation.distance}m dari sekolah). Maksimal jarak: ${settings.radius_gps}m`
          })
          setLoading(false)
          return
        }
      }

      // Update presensi dengan jam pulang
      const currentTime = formatTimeForDB() // Format HH:MM:SS untuk database

      const updatedData = {
        id: todayAttendance.id,
        status: todayAttendance.status,
        jamMasuk: todayAttendance.jam_masuk,
        jamPulang: currentTime,
        jamHadir: todayAttendance.jam_hadir,
        jamIzin: todayAttendance.jam_izin,
        jamSakit: todayAttendance.jam_sakit,
        keterangan: todayAttendance.keterangan,
        latitude: todayAttendance.latitude,
        longitude: todayAttendance.longitude
      }

      await presensiAPI.update(updatedData)

      // Add activity log
      try {
        await activityAPI.create({
          user: user.nama,
          aktivitas: 'Presensi Pulang',
          status: 'Pulang'
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }

      setMessage({
        type: 'success',
        text: 'Presensi pulang berhasil disimpan!'
      })

      // Update todayAttendance langsung dengan jam pulang
      setTodayAttendance({
        ...todayAttendance,
        jam_pulang: currentTime,
        jamPulang: currentTime // Alias untuk compatibility
      })

      setLoading(false)

      // Tetap panggil checkTodayAttendance untuk sync dengan database
      setTimeout(() => {
        checkTodayAttendance()
      }, 500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Gagal menyimpan presensi pulang: ' + error.message
      })
      setLoading(false)
    }
  }

  // Loading state
  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">{formatFullDate(new Date())}</h2>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // Debug: tampilkan info user
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">{formatFullDate(new Date())}</h2>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error: User tidak ditemukan</h3>
          <p className="text-red-600">Silakan logout dan login kembali</p>
        </div>
      </div>
    )
  }

  // Debug log sebelum render
  console.log('🎨 RENDERING - isHoliday:', isHoliday, 'holidayInfo:', holidayInfo, 'todayAttendance:', todayAttendance)

  return (
    <div className="space-y-6">
      {/* Date Display */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{formatFullDate(new Date())}</h2>
        <p className="text-sm text-gray-500 mt-1">Selamat datang, {user.nama}</p>
        <p className="text-xs text-gray-400 mt-2">
          Jam masuk normal: {settings.jam_masuk_normal} WIB | Toleransi: {settings.toleransi_terlambat} menit
        </p>
        {settings.mode_testing === '1' && (
          <div className="mt-2 inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
            🧪 Mode Testing Aktif - GPS Validation Nonaktif
          </div>
        )}
        {isPiketToday && jadwalPiketHariIni && (
          <div className="mt-3 inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-lg">
            📋 Anda memiliki jadwal piket hari ini - Hadir maksimal: {jadwalPiketHariIni.jam_piket} WIB
          </div>
        )}
      </div>

      {/* Holiday Message */}
      {isHoliday && holidayInfo && (
        <div className={`rounded-lg shadow p-6 text-center ${holidayInfo.type === 'weekend' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <AlertCircle className={`w-8 h-8 ${holidayInfo.type === 'weekend' ? 'text-blue-600' : 'text-yellow-600'}`} />
            <h3 className={`text-xl font-bold ${holidayInfo.type === 'weekend' ? 'text-blue-800' : 'text-yellow-800'}`}>
              {holidayInfo.message}
            </h3>
          </div>
          <p className={`text-sm ${holidayInfo.type === 'weekend' ? 'text-blue-600' : 'text-yellow-600'}`}>
            Tidak perlu melakukan presensi hari ini
          </p>
        </div>
      )}

      {/* Status Display - Jika sudah presensi hari ini */}
      {todayAttendance && !isHoliday ? (
        <div className="space-y-4">
          <div className={`border-2 rounded-lg p-6 ${todayAttendance.status === 'hadir_terlambat'
              ? 'bg-yellow-50 border-yellow-200'
              : todayAttendance.status === 'hadir_izin_terlambat'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
            }`}>
            <div className="flex items-center gap-3 mb-4">
              {todayAttendance.status === 'hadir_terlambat' ? (
                <Clock className="w-8 h-8 text-yellow-600" />
              ) : todayAttendance.status === 'hadir_izin_terlambat' ? (
                <CheckCircle className="w-8 h-8 text-blue-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${todayAttendance.status === 'hadir_terlambat' ? 'text-yellow-800' :
                    todayAttendance.status === 'hadir_izin_terlambat' ? 'text-blue-800' :
                      'text-green-800'
                  }`}>
                  Anda Sudah Absen
                </h3>
                <div className="flex items-center gap-2">
                  <p className={
                    todayAttendance.status === 'hadir_terlambat' ? 'text-yellow-600' :
                      todayAttendance.status === 'hadir_izin_terlambat' ? 'text-blue-600' :
                        'text-green-600'
                  }>
                    Status: {
                      todayAttendance.status === 'hadir_terlambat' ? 'HADIR (TERLAMBAT)' :
                        todayAttendance.status === 'hadir_izin_terlambat' ? 'HADIR - IZIN TERLAMBAT' :
                          todayAttendance.status.toUpperCase()
                    }
                  </p>
                  {todayAttendance.status === 'hadir_terlambat' && (
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                      TERLAMBAT
                    </span>
                  )}
                  {todayAttendance.status === 'hadir_izin_terlambat' && (
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded">
                      IZIN TERLAMBAT
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`space-y-2 text-sm ${todayAttendance.status === 'hadir_terlambat' ? 'text-yellow-700' :
                todayAttendance.status === 'hadir_izin_terlambat' ? 'text-blue-700' :
                  'text-green-700'
              }`}>
              {todayAttendance.jamHadir && <p>Jam Hadir: {todayAttendance.jamHadir}</p>}
              {todayAttendance.jamIzin && <p>Jam Izin: {todayAttendance.jamIzin}</p>}
              {todayAttendance.jamSakit && <p>Jam Sakit: {todayAttendance.jamSakit}</p>}
              {(todayAttendance.jamPulang || todayAttendance.jam_pulang) && (
                <p className="font-semibold">Jam Pulang: {todayAttendance.jamPulang || todayAttendance.jam_pulang}</p>
              )}
              {todayAttendance.keterangan && (
                <p>Keterangan: {todayAttendance.keterangan}</p>
              )}
            </div>
          </div>

          {/* Tombol Presensi Pulang - untuk status hadir, hadir_terlambat, atau hadir_izin_terlambat, setelah jam 09:00 */}
          {(todayAttendance.status === 'hadir' || todayAttendance.status === 'hadir_terlambat' || todayAttendance.status === 'hadir_izin_terlambat') && !todayAttendance.jamPulang && !todayAttendance.jam_pulang && (
            <>
              {canShowPulangButton() ? (
                <button
                  onClick={handlePulang}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-3"
                >
                  <CheckCircle className="w-6 h-6" />
                  {loading ? 'Memproses...' : 'PRESENSI PULANG'}
                </button>
              ) : (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-gray-600 font-semibold">⏰ Presensi pulang tersedia mulai pukul 09:00 WIB</p>
                  <p className="text-sm text-gray-500 mt-1">Silakan tunggu hingga jam 09:00 untuk melakukan presensi pulang</p>
                </div>
              )}
            </>
          )}

          {(todayAttendance.status === 'hadir' || todayAttendance.status === 'hadir_terlambat' || todayAttendance.status === 'hadir_izin_terlambat') && (todayAttendance.jamPulang || todayAttendance.jam_pulang) && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 font-semibold">✓ Presensi pulang sudah tercatat</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Action Buttons - Hanya tampil jika BUKAN hari libur DAN belum presensi */}
      {!isHoliday && !todayAttendance && (
        <div className="space-y-4">
          {/* QR Scan Button - Primary Action */}
          <button
            onClick={() => setShowQRScanner(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            <QrCode className="w-7 h-7" />
            <span>SCAN QR CODE</span>
          </button>

          {/* Separator */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm font-medium">atau presensi manual</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <button
            onClick={handleHadir}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-3"
          >
            <CheckCircle className="w-6 h-6" />
            {loading ? 'Memproses...' : 'HADIR'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleIzinSakit('izin')}
              disabled={loading}
              className="bg-yellow-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-yellow-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              IZIN
            </button>

            <button
              onClick={() => handleIzinSakit('sakit')}
              disabled={loading}
              className="bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              SAKIT
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          user={user}
          onClose={() => setShowQRScanner(false)}
          onSuccess={(data) => {
            setShowQRScanner(false)
            setMessage({ type: 'success', text: 'Presensi berhasil!' })
            checkTodayAttendance()
          }}
        />
      )}

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg whitespace-pre-line ${message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'warning' ? 'bg-orange-50 text-orange-800' :
              'bg-red-50 text-red-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Keterangan {modalType === 'izin' ? 'Izin' : 'Sakit'}
            </h3>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              rows="4"
              placeholder="Masukkan keterangan..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={submitIzinSakit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuruHome
