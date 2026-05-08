import { useState, useEffect, Suspense, lazy } from 'react'
import { CheckCircle, FileText, AlertCircle, Clock, QrCode } from 'lucide-react'
import { formatFullDate, formatDate, formatDateForInput, formatTimeForDB } from '../../utils/dateUtils'
import { getReliableUserLocation, warmUpUserLocation, getLastKnownLocation, getLocationErrorMessage, validateLocation } from '../../utils/geoLocation'
import { SCHOOL_LOCATION } from '../../data/dummyData'
import { authAPI, guruHomeAPI, presensiAPI, activityAPI, holidaysAPI, settingsAPI, jadwalPiketAPI, qrScanAPI } from '../../services/api'

const QRScanner = lazy(() => import('./QRScanner'))

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
    mode_testing: '1',
    button_enabled: '0',
    qr_enabled: '1'
  })
  const [jadwalPiketHariIni, setJadwalPiketHariIni] = useState(null)
  const [isPiketToday, setIsPiketToday] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showPiketModal, setShowPiketModal] = useState(false)
  const [piketCheckoutTime, setPiketCheckoutTime] = useState('')
  const [pendingQRData, setPendingQRData] = useState(null)
  const [keteranganPiket, setKeteranganPiket] = useState('')
  const [piketStep, setPiketStep] = useState(1) // 1: Info, 2: Input Alasan
  const [locationStatus, setLocationStatus] = useState({ state: 'idle', location: null, message: '' })

  useEffect(() => {
    loadInitialData()
    
    // HEARTBEAT: Ping server setiap 10 menit untuk menjaga session tetap aktif
    const heartbeat = setInterval(() => {
      console.log('💓 Heartbeat: Keeping session alive...')
      authAPI.checkSession().catch(err => {
        console.error('Heartbeat failed:', err)
        // Jika benar-benar Unauthorized, mungkin perlu redirect ke login
        if (err.message?.includes('Unauthorized')) {
          window.location.reload() 
        }
      })
    }, 10 * 60 * 1000)

    return () => clearInterval(heartbeat)
  }, [])

  useEffect(() => {
    warmUpLocation()
  }, [settings.mode_testing])

  const warmUpLocation = async () => {
    if (settings.mode_testing == '1') {
      setLocationStatus({ state: 'ready', location: null, message: 'Mode testing aktif' })
      return
    }

    setLocationStatus({ state: 'loading', location: null, message: 'Menyiapkan GPS...' })
    try {
      const location = await warmUpUserLocation()
      setLocationStatus({
        state: 'ready',
        location,
        message: location.accuracy ? `GPS siap (akurasi ${Math.round(location.accuracy)}m)` : 'GPS siap'
      })
    } catch (error) {
      setLocationStatus({
        state: 'error',
        location: null,
        message: getLocationErrorMessage(error)
      })
    }
  }

  const applyInitialPayload = (data) => {
    if (!data) return

    if (data.settings) {
      setSettings(data.settings)
    }

    if (data.holiday) {
      const { isWorkday, isHoliday: holidayFound, isWeekend, holidayName, dayName } = data.holiday
      if (!isWorkday) {
        setIsHoliday(true)
        if (isWeekend) {
          setHolidayInfo({ type: 'weekend', message: `Hari ${dayName} adalah hari libur` })
        } else if (holidayFound) {
          setHolidayInfo({ type: 'holiday', message: `Hari Libur: ${holidayName}` })
        }
      } else {
        setIsHoliday(false)
        setHolidayInfo(null)
      }
    }

    if (data.piket) {
      setJadwalPiketHariIni(data.piket.mine || null)
      setIsPiketToday(!!data.piket.isPiketToday)
    }

    setTodayAttendance(data.attendance || null)
  }

  const loadInitialData = async () => {
    console.log('=== 🚀 Loading Initial Data ===')
    console.log('User:', user)
    setPageLoading(true)

    try {
      const response = await guruHomeAPI.getInitialData()
      applyInitialPayload(response.data)
      return
    } catch (error) {
      console.error('Failed to load compact guru data, falling back:', error)
    }

    try {
      await Promise.allSettled([
        loadSettings(),
        checkIfHoliday(),
        checkJadwalPiket(),
        checkTodayAttendance()
      ])
      console.log('=== ✅ Data Loaded ===')
    } catch (error) {
      console.error('❌ Failed to load initial data:', error)
      setMessage({
        type: 'error',
        text: 'Sebagian data belum berhasil dimuat. Silakan refresh atau login ulang jika tombol presensi belum muncul.'
      })
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
  const checkIfLate = (jamPresensi, jamMasukTarget = null) => {
    const jamMasukRef = jamMasukTarget || settings.jam_masuk_normal
    const [jamMasuk, menitMasuk] = jamMasukRef.split(':').map(Number)
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
      const today = formatDateForInput(new Date())
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
        setTodayAttendance(null) // Always reset to null if no record
      }
    } catch (error) {
      console.error('Failed to check attendance:', error)
    }
  }

  const handleHadir = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing == '1' // Gunakan == agar int(1) tetap true sebagai '1'

    try {
      const location = await getReliableUserLocation()
      setLocationStatus({
        state: 'ready',
        location,
        message: location.accuracy ? `GPS siap (akurasi ${Math.round(location.accuracy)}m)` : 'GPS siap'
      })

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
          text: getLocationErrorMessage(error)
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

        // Tentukan target jam masuk
        let targetJamMasuk = settings.jam_masuk_normal
        const today = new Date()
        const isMonday = today.getDay() === 1 // 1 = Monday
        const isApelEnabled = settings.apel_senin_enabled == '1'

        if (isMonday) {
          if (isApelEnabled) {
            if (isPiketToday && jadwalPiketHariIni) {
              targetJamMasuk = jadwalPiketHariIni.jam_piket.substring(0, 5) // 06:40
            } else {
              targetJamMasuk = '07:00' // Guru non-piket saat apel
            }
          } else {
            // MODE APEL MATI
            if (isPiketToday) {
              targetJamMasuk = '07:00' // Override 06:40 -> 07:00
            } else {
              targetJamMasuk = settings.jam_masuk_normal // 07:20
            }
          }
        } else if (isPiketToday && jadwalPiketHariIni) {
          targetJamMasuk = jadwalPiketHariIni.jam_piket.substring(0, 5)
        }

        const lateCheck = checkIfLate(currentTime, targetJamMasuk)
        console.log('⏰ Late check result:', lateCheck, 'Target:', targetJamMasuk)

        if (lateCheck.isLate) {
          finalStatus = 'hadir_terlambat'
          const labelPiket = isPiketToday ? ' (Piket)' : ''
          
          if (lateCheck.severity === 'late') {
            finalKeterangan = `Terlambat ${lateCheck.minutes} menit${labelPiket}`
          } else if (lateCheck.severity === 'very_late') {
            finalKeterangan = `Terlambat ${lateCheck.minutes} menit (Parah)${labelPiket}`
          }
          console.log('🔴 User is late:', { finalStatus, finalKeterangan })
        } else {
          console.log('✅ User is on time')
        }

        // Jika piket, tambahkan info di pesan sukses
        if (isPiketToday && jadwalPiketHariIni) {
          const jamPiketStr = jadwalPiketHariIni.jam_piket.substring(0, 5)
          if (lateCheck.isLate) {
            piketWarning = `⚠️ Anda terlambat hadir piket. Jam piket: ${jamPiketStr} WIB`
          } else {
            console.log('✅ Tepat waktu hadir piket')
          }
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

  const handlePulang = async (izinPulangAwal = false, keteranganCustom = '') => {
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
    setShowPiketModal(false)

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing == '1' // Gunakan == agar int(1) tetap true sebagai '1'

    try {
      const location = await getReliableUserLocation()
      setLocationStatus({
        state: 'ready',
        location,
        message: location.accuracy ? `GPS siap (akurasi ${Math.round(location.accuracy)}m)` : 'GPS siap'
      })

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
        keterangan: keteranganCustom ? `${todayAttendance.keterangan || ''} | Alasan Pulang Awal: ${keteranganCustom}`.trim() : todayAttendance.keterangan,
        latitude: todayAttendance.latitude,
        longitude: todayAttendance.longitude,
        izin_pulang_awal: izinPulangAwal
      }

      await presensiAPI.update(updatedData)

      // Add activity log
      try {
        await activityAPI.create({
          user: user.nama,
          aktivitas: 'Presensi Pulang',
          status: 'Pulang' + (izinPulangAwal ? ' (Izin Awal)' : '')
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
      if (error.message.startsWith('PIKET_RESTRICTION|')) {
        const jam = error.message.split('|')[1]
        setPiketCheckoutTime(jam)
        setPiketStep(1)
        setShowPiketModal(true)
        setPendingQRData(null) // Reset QR data if any
      } else {
        setMessage({
          type: 'error',
          text: 'Gagal menyimpan presensi pulang: ' + error.message
        })
      }
      setLoading(false)
    }
  }

  const handleQRScanPiketRestriction = (jam, qrData) => {
    setPiketCheckoutTime(jam)
    setPendingQRData(qrData)
    setKeteranganPiket('')
    setPiketStep(1) // Start at step 1
    setShowQRScanner(false)
    setShowPiketModal(true)
  }

  const handleIzinPulangAwal = async () => {
    if (!keteranganPiket.trim()) {
      alert('Mohon isi keterangan/alasan pulang lebih awal')
      return
    }

    if (pendingQRData) {
      // Jika dari QR Scan
      setLoading(true)
      try {
        const location = await getReliableUserLocation()
        setLocationStatus({
          state: 'ready',
          location,
          message: location.accuracy ? `GPS siap (akurasi ${Math.round(location.accuracy)}m)` : 'GPS siap'
        })
        const response = await qrScanAPI.submit(
          pendingQRData,
          location.latitude,
          location.longitude,
          true, // isPulang
          true, // izin_pulang_awal
          keteranganPiket // pass the reason
        )
        setShowPiketModal(false)
        setPendingQRData(null)
        setKeteranganPiket('')
        setMessage({ type: 'success', text: '✅ Presensi pulang (izin awal) berhasil!' })
        checkTodayAttendance()
      } catch (error) {
        setMessage({ type: 'error', text: error.message })
      } finally {
        setLoading(false)
      }
    } else {
      // Jika dari tombol manual
      setLoading(true)
      try {
        await handlePulang(true, keteranganPiket)
        setShowPiketModal(false)
        setKeteranganPiket('')
      } catch (error) {
        console.error('Error early checkout manual:', error)
      } finally {
        setLoading(false)
      }
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
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl" />
        <div className="flex items-center gap-3 pl-2">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-indigo-500">
              {(user?.nama || '').charAt(0)?.toUpperCase() || '\ud83d\udc4b'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Selamat Datang</p>
            <h2 className="text-base font-bold text-slate-800 leading-tight truncate">
              {user?.nama || 'Guru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{formatFullDate(new Date())}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 pl-2">
          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 font-medium">
            ⏰ {(() => {
              const today = new Date()
              const isMonday = today.getDay() === 1
              const isApel = settings.apel_senin_enabled == '1'
              if (isMonday) {
                if (isApel) {
                  return isPiketToday ? `Apel & Piket ${jadwalPiketHariIni?.jam_piket?.substring(0, 5)}` : 'Apel Senin 07:00'
                } else {
                  return isPiketToday ? 'Piket Senin 07:00' : `Masuk ${settings.jam_masuk_normal}`
                }
              }
              return `Masuk ${isPiketToday ? jadwalPiketHariIni?.jam_piket?.substring(0, 5) : settings.jam_masuk_normal}`
            })()} WIB
          </span>
          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 font-medium">
            ⚡ Toleransi {settings.toleransi_terlambat} mnt
          </span>
          {settings.mode_testing == '1' && (
            <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-600 font-medium">
              🧪 Mode Testing
            </span>
          )}
          {settings.mode_testing != '1' && (
            <button
              type="button"
              onClick={warmUpLocation}
              className={`px-2.5 py-1 border rounded-full text-xs font-medium ${
                locationStatus.state === 'ready'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : locationStatus.state === 'loading'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : locationStatus.state === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title={locationStatus.message || 'Ketuk untuk menyiapkan GPS'}
            >
              {locationStatus.state === 'ready'
                ? 'GPS Siap'
                : locationStatus.state === 'loading'
                  ? 'GPS...'
                  : locationStatus.state === 'error'
                    ? 'Cek GPS'
                    : 'Siapkan GPS'}
            </button>
          )}
          {isPiketToday && jadwalPiketHariIni && (
            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-600 font-medium">
              📋 Piket — Maks {jadwalPiketHariIni.jam_piket} WIB
            </span>
          )}
        </div>
      </div>

      {/* Holiday Message */}
      {isHoliday && holidayInfo && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden text-center">
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${holidayInfo.type === 'weekend' ? 'bg-indigo-400' : 'bg-violet-400'}`} />
          <div className="text-3xl mb-2">{holidayInfo.type === 'weekend' ? '😴' : '🎉'}</div>
          <h3 className="text-base font-bold text-slate-800">{holidayInfo.message}</h3>
          <p className="text-xs text-slate-500 mt-1">Tidak perlu melakukan presensi hari ini</p>
        </div>
      )}

      {/* Status Display */}
      {todayAttendance && !isHoliday ? (
        <div className="space-y-3">
          {(() => {
            const status = todayAttendance.status
            const isIzinSakit = status === 'izin' || status === 'sakit'
            const isHadirTerlambat = status === 'hadir_terlambat'
            const isIzinTerlambat = status === 'hadir_izin_terlambat'
            let accentColor, dotColor, badgeBg, badgeText, badgeLabel, headerText
            if (status === 'izin') {
              accentColor = 'bg-amber-400'; dotColor = 'bg-amber-400'
              badgeBg = 'bg-amber-50'; badgeText = 'text-amber-700'
              badgeLabel = 'IZIN'; headerText = 'Anda Izin Hari Ini'
            } else if (status === 'sakit') {
              accentColor = 'bg-rose-400'; dotColor = 'bg-rose-400'
              badgeBg = 'bg-rose-50'; badgeText = 'text-rose-700'
              badgeLabel = 'SAKIT'; headerText = 'Anda Sakit Hari Ini'
            } else if (isHadirTerlambat) {
              accentColor = 'bg-amber-400'; dotColor = 'bg-amber-400'
              badgeBg = 'bg-yellow-50'; badgeText = 'text-yellow-700'
              badgeLabel = 'TERLAMBAT'; headerText = 'Anda Sudah Absen'
            } else if (isIzinTerlambat) {
              accentColor = 'bg-blue-400'; dotColor = 'bg-blue-400'
              badgeBg = 'bg-blue-50'; badgeText = 'text-blue-700'
              badgeLabel = 'IZIN TERLAMBAT'; headerText = 'Anda Sudah Absen'
            } else {
              accentColor = 'bg-emerald-400'; dotColor = 'bg-emerald-400'
              badgeBg = 'bg-emerald-50'; badgeText = 'text-emerald-700'
              badgeLabel = 'HADIR'; headerText = 'Anda Sudah Absen'
            }
            return (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accentColor}`} />
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="text-sm font-bold text-slate-800">{headerText}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeBg} ${badgeText}`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="space-y-0">
                      {todayAttendance.jamHadir && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs text-slate-400 font-medium">Jam Masuk</span>
                          <span className="text-xs font-semibold text-slate-700">{todayAttendance.jamHadir}</span>
                        </div>
                      )}
                      {todayAttendance.jamIzin && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs text-slate-400 font-medium">Jam Izin</span>
                          <span className="text-xs font-semibold text-slate-700">{todayAttendance.jamIzin}</span>
                        </div>
                      )}
                      {todayAttendance.jamSakit && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs text-slate-400 font-medium">Jam Sakit</span>
                          <span className="text-xs font-semibold text-slate-700">{todayAttendance.jamSakit}</span>
                        </div>
                      )}
                      {isHadirTerlambat && todayAttendance.keterangan && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs text-slate-400 font-medium">Terlambat</span>
                          <span className="text-xs font-semibold text-amber-600">{todayAttendance.keterangan}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-400 font-medium">Jam Pulang</span>
                        <span className={`text-xs font-semibold ${(todayAttendance.jamPulang || todayAttendance.jam_pulang) ? "text-slate-700" : "text-slate-300"}`}>
                          {todayAttendance.jamPulang || todayAttendance.jam_pulang || 'Belum tercatat'}
                        </span>
                      </div>
                      {todayAttendance.keterangan && !isHadirTerlambat && (
                        <div className="flex justify-between items-center py-2 border-t border-slate-50">
                          <span className="text-xs text-slate-400 font-medium">Keterangan</span>
                          <span className="text-xs font-medium text-slate-600 text-right max-w-xs">{todayAttendance.keterangan}</span>
                        </div>
                      )}
                    </div>
                    {isIzinSakit && (
                      <div className="mt-3 px-3 py-2 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500">
                          ℹ️ Tidak perlu presensi pulang untuk status {status === 'izin' ? 'izin' : 'sakit'}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!isIzinSakit && settings.button_enabled == '1' && (status === 'hadir' || isHadirTerlambat || isIzinTerlambat) && !todayAttendance.jamPulang && !todayAttendance.jam_pulang && (
                  <>
                    {canShowPulangButton() ? (
                      <button
                        onClick={handlePulang}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-3 shadow-sm transition-all"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {loading ? 'Memproses...' : 'PRESENSI PULANG'}
                      </button>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                        <p className="text-slate-600 font-semibold text-sm">⏰ Presensi pulang tersedia mulai 09:00 WIB</p>
                        <p className="text-xs text-slate-400 mt-1">Silakan tunggu hingga jam 09:00</p>
                      </div>
                    )}
                  </>
                )}

                {!isIzinSakit && (status === 'hadir' || isHadirTerlambat || isIzinTerlambat) && (todayAttendance.jamPulang || todayAttendance.jam_pulang) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                    <p className="text-emerald-700 font-semibold text-sm">✓ Presensi pulang sudah tercatat</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      ) : null}

      {/* Action Buttons */}
      {(() => {
        const sudahPulang = todayAttendance && (todayAttendance.jam_pulang || todayAttendance.jamPulang)
        const isIzinSakit = todayAttendance && (todayAttendance.status === 'izin' || todayAttendance.status === 'sakit')
        if (isHoliday || sudahPulang || isIzinSakit) return null
        return (
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setShowQRScanner(true)}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 ${
              !todayAttendance ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white'
            }`}
          >
            <QrCode className="w-6 h-6" />
            <span>{!todayAttendance ? 'SCAN PRESENSI MASUK' : settings.qr_enabled == '1' ? 'SCAN PRESENSI PULANG' : 'PRESENSI PULANG'}</span>
          </button>

          {settings.button_enabled == '1' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs font-medium">atau presensi manual</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button
                onClick={handleHadir}
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-base hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-3 shadow-sm transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? 'Memproses...' : 'HADIR'}
              </button>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleIzinSakit('izin')}
              disabled={loading}
              className="bg-amber-400 text-white py-4 rounded-2xl font-bold text-base hover:bg-amber-500 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <FileText className="w-5 h-5" />
              IZIN
            </button>
            <button
              onClick={() => handleIzinSakit('sakit')}
              disabled={loading}
              className="bg-rose-400 text-white py-4 rounded-2xl font-bold text-base hover:bg-rose-500 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <AlertCircle className="w-5 h-5" />
              SAKIT
            </button>
          </div>
        </div>
        )
      })()}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="font-semibold text-gray-700">Membuka kamera...</span>
            </div>
          </div>
        }>
          <QRScanner
            user={user}
            settings={settings}
            initialLocation={locationStatus.location || getLastKnownLocation()}
            attendanceStatus={{
              has_checked_in: !!todayAttendance,
              has_checked_out: !!(todayAttendance?.jam_pulang || todayAttendance?.jamPulang)
            }}
            onClose={() => setShowQRScanner(false)}
            onPiketRestriction={handleQRScanPiketRestriction}
            onSuccess={() => {
              setShowQRScanner(false)
              setMessage({ type: 'success', text: '\u2705 Presensi berhasil dicatat!' })
              checkTodayAttendance()
              setTimeout(() => setMessage({ type: "", text: "" }), 4000)
            }}
          />
        </Suspense>
      )}

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-2xl whitespace-pre-line text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Modal Izin/Sakit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Keterangan {modalType === 'izin' ? 'Izin' : 'Sakit'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Masukkan alasan {modalType === 'izin' ? 'izin' : 'sakit'} Anda</p>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-300 mb-4 resize-none"
              rows="3"
              placeholder="Contoh: Keperluan keluarga mendesak..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitIzinSakit}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Piket Restriction */}
      {showPiketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            
            <h3 className="text-lg font-black text-slate-800 text-center mb-2">
              Belum Waktunya Pulang
            </h3>
            
            {piketStep === 1 ? (
              <>
                <p className="text-slate-600 text-center text-xs leading-relaxed mb-8">
                  Jam pulang untuk petugas piket adalah pukul <span className="font-bold text-amber-600">{piketCheckoutTime} WIB</span> (sesuai aturan). 
                  Jika Anda pulang lebih awal maka <span className="font-bold">harus izin kepada atasan</span>.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setPiketStep(2)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                  >
                    SAYA SUDAH IZIN
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowPiketModal(false)
                      setKeteranganPiket('')
                    }}
                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm transition-all"
                  >
                    KEMBALI
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-500 text-center text-[11px] leading-relaxed mb-6">
                  Silakan isi alasan izin yang telah Anda sampaikan kepada atasan.
                </p>

                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan Izin</label>
                  <textarea
                    value={keteranganPiket}
                    onChange={(e) => setKeteranganPiket(e.target.value)}
                    placeholder="Tulis alasan izin yang sudah disampaikan ke atasan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                    rows="3"
                  />
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleIzinPulangAwal}
                    disabled={loading}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>MEMPROSES...</span>
                      </div>
                    ) : 'KIRIM'}
                  </button>
                  
                  <button
                    onClick={() => setPiketStep(1)}
                    className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-all"
                  >
                    KEMBALI KE INFO
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GuruHome
