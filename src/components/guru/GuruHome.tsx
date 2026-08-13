import { useState, useEffect, useRef } from 'react'
import { CheckCircle, FileText, AlertCircle, Clock, History, Users, LogOut, MapPin, ArrowRight, Home, HelpCircle, BarChart3, ClipboardList, ArrowUpRight, ShieldCheck, X } from 'lucide-react'
import { formatFullDate, formatDate, formatDateForInput } from '../../utils/dateUtils'
import { calculateDistance, getReliableUserLocation, warmUpUserLocation, getLastKnownLocation, getLocationErrorMessage } from '../../utils/geoLocation'
import { authAPI, guruHomeAPI, presensiAPI, holidaysAPI, settingsAPI, jadwalPiketAPI, qrScanAPI, locationTrackingAPI } from '../../services/api'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'

const getRecentStatusLabel = (status = '') => {
  const labels = {
    hadir: 'Hadir',
    hadir_terlambat: 'Hadir terlambat',
    hadir_izin_terlambat: 'Izin terlambat',
    izin: 'Izin',
    sakit: 'Sakit',
    alfa: 'Alfa',
  }
  return labels[status] || 'Presensi tercatat'
}

function GuruHome({ user, onChangeTab }) {
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [isHoliday, setIsHoliday] = useState(false)
  const [holidayInfo, setHolidayInfo] = useState(null)
  const [settings, setSettings] = useState<Record<string, any>>({
    jam_masuk_normal: '07:20',
    toleransi_terlambat: '15',
    radius_gps: '500',
    sekolah_latitude: '-5.1477',
    sekolah_longitude: '119.4327',
    lokasi_laki_latitude: '',
    lokasi_laki_longitude: '',
    lokasi_perempuan_latitude: '',
    lokasi_perempuan_longitude: '',
    lokasi_apel_latitude: '',
    lokasi_apel_longitude: '',
    mode_testing: '1',
    button_enabled: '0',
    jam_min_pulang: '12:30',
    weekend_workday_enabled: '0',
    saturday_male_workday_enabled: '0',
    saturday_female_workday_enabled: '0',
    sunday_male_workday_enabled: '0',
    sunday_female_workday_enabled: '0',
    qr_enabled: '1',
    location_tracking_enabled: '0',
    location_tracking_interval_minutes: '15',
    location_tracking_accuracy_limit: '100'
  })
  const [jadwalPiketHariIni, setJadwalPiketHariIni] = useState(null)
  const [isPiketToday, setIsPiketToday] = useState(false)
  const [showPiketModal, setShowPiketModal] = useState(false)
  const [piketCheckoutTime, setPiketCheckoutTime] = useState('')
  const [pendingQRData, setPendingQRData] = useState(null)
  // Jam minimal pulang efektif hari ini (dari guru_home, mengikuti override
  // per-tanggal pengaturan_harian). Null = pakai settings.jam_min_pulang.
  const [pulangThreshold, setPulangThreshold] = useState('')
  const [keteranganPiket, setKeteranganPiket] = useState('')
  const [piketStep, setPiketStep] = useState(1) // 1: Info, 2: Input Alasan
  const [locationStatus, setLocationStatus] = useState({ state: 'idle', location: null, message: '' })
  const [trackingStatus, setTrackingStatus] = useState({ state: 'idle', message: '' })
  const [monthlyStats, setMonthlyStats] = useState({ hadir: 0, izin: 0, sakit: 0, alfa: 0, percentage: 0, total: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const attendanceActionRef = useRef(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Presensi pulang di luar sekolah (lupa): popup konfirmasi lokasi
  const [pulangLuarModal, setPulangLuarModal] = useState(false)
  const [pendingPulang, setPendingPulang] = useState(null) // { izinPulangAwal, keteranganCustom, location }

  useEffect(() => {
    const isDialogOpen = showModal || showPiketModal || pulangLuarModal
    if (!isDialogOpen) return undefined

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const closeActiveDialog = () => {
      if (loading) return
      if (showModal) {
        setShowModal(false)
        setKeterangan('')
        return
      }
      if (showPiketModal) {
        setShowPiketModal(false)
        setKeteranganPiket('')
        return
      }
      setPulangLuarModal(false)
      setPendingPulang(null)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeActiveDialog()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
      previouslyFocused?.focus()
    }
  }, [showModal, showPiketModal, pulangLuarModal, loading])

  useEffect(() => {
    loadInitialData()

    // HEARTBEAT: Ping server setiap 10 menit untuk menjaga session tetap aktif
    const heartbeat = setInterval(() => {
      console.log('💓 Heartbeat: Keeping session alive...')
      authAPI.checkSession().catch(err => {
        console.error('Heartbeat failed:', err)
        if (user?.rememberToken) {
          authAPI.restoreSession().catch(restoreErr => {
            console.error('Failed to restore guru session:', restoreErr)
          })
        }
      })
    }, 10 * 60 * 1000)

    return () => clearInterval(heartbeat)
  }, [])

  useEffect(() => {
    warmUpLocation()
  }, [settings.mode_testing])

  useEffect(() => {
    const activeStatuses = ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat']
    const hasCheckedOut = !!(todayAttendance?.jam_pulang || todayAttendance?.jamPulang)
    const isActiveAttendance = todayAttendance && activeStatuses.includes(todayAttendance.status) && !hasCheckedOut

    if (settings.location_tracking_enabled != '1' || !isActiveAttendance) {
      setTrackingStatus({
        state: 'idle',
        message: settings.location_tracking_enabled == '1' ? 'Tracking menunggu presensi hadir' : 'Tracking lokasi nonaktif'
      })
      return undefined
    }

    let cancelled = false
    let intervalId = null
    const intervalMinutes = Math.min(Math.max(parseInt(settings.location_tracking_interval_minutes || '15', 10) || 15, 5), 60)
    const accuracyLimit = Math.min(Math.max(parseInt(settings.location_tracking_accuracy_limit || '100', 10) || 100, 20), 1000)
    let lastTrackingAttemptAt = 0

    const sendTrackingPoint = async () => {
      const now = Date.now()
      if (now - lastTrackingAttemptAt < 15000) return
      lastTrackingAttemptAt = now

      try {
        setTrackingStatus({ state: 'loading', message: 'Mengirim lokasi tracking...' })
        const location = await getReliableUserLocation({
          minAccuracy: accuracyLimit,
          cacheMaxAgeMs: 60000,
          firstTimeout: 12000,
          retryTimeout: 8000
        })

        await locationTrackingAPI.submit({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        })

        if (!cancelled) {
          setTrackingStatus({
            state: 'ready',
            message: `Tracking aktif tiap ${intervalMinutes} menit${location.accuracy ? ` (akurasi ${Math.round(location.accuracy)}m)` : ''}`
          })
        }
      } catch (error) {
        if (!cancelled) {
          setTrackingStatus({
            state: 'error',
            message: error.message || getLocationErrorMessage(error)
          })
        }
      }
    }

    sendTrackingPoint()
    intervalId = setInterval(sendTrackingPoint, intervalMinutes * 60 * 1000)
    const sendTrackingOnResume = () => {
      if (!document.hidden) {
        sendTrackingPoint()
      }
    }

    document.addEventListener('visibilitychange', sendTrackingOnResume)
    window.addEventListener('focus', sendTrackingOnResume)
    window.addEventListener('pageshow', sendTrackingOnResume)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', sendTrackingOnResume)
      window.removeEventListener('focus', sendTrackingOnResume)
      window.removeEventListener('pageshow', sendTrackingOnResume)
    }
  }, [
    todayAttendance?.id,
    todayAttendance?.status,
    todayAttendance?.jam_pulang,
    todayAttendance?.jamPulang,
    settings.location_tracking_enabled,
    settings.location_tracking_interval_minutes,
    settings.location_tracking_accuracy_limit
  ])

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

  const updateLocationReady = (location) => {
    setLocationStatus({
      state: 'ready',
      location,
      message: location?.accuracy ? `GPS siap (akurasi ${Math.round(location.accuracy)}m)` : 'GPS siap'
    })
  }

  const getFastLocation = async () => {
    if (settings.mode_testing == '1') {
      return {
        latitude: parseFloat(settings.sekolah_latitude),
        longitude: parseFloat(settings.sekolah_longitude),
        accuracy: 0,
        timestamp: Date.now()
      }
    }

    const accuracyLimit = Math.min(Math.max(parseInt(settings.location_tracking_accuracy_limit || '100', 10) || 100, 20), 1000)
    const cached = getLastKnownLocation(30000)
    if (cached && cached.accuracy && cached.accuracy <= accuracyLimit) {
      updateLocationReady(cached)
      return cached
    }

    const location = await getReliableUserLocation({
      minAccuracy: accuracyLimit,
      cacheMaxAgeMs: 30000,
      firstTimeout: 10000,
      retryTimeout: 5000
    })
    if (location?.accuracy && location.accuracy > accuracyLimit) {
      const error: any = new Error(`Akurasi GPS terlalu rendah (${Math.round(location.accuracy)}m). Maksimal ${accuracyLimit}m. Coba aktifkan mode akurasi tinggi atau pindah ke area terbuka.`)
      error.code = 'GPS_ACCURACY_LOW'
      throw error
    }
    updateLocationReady(location)
    return location
  }

  const getAttendanceFromResponse = (response) => response?.data?.attendance || null

  const getAttendanceLocationTargets = (isCheckout = false) => {
    const targets = []
    const addTarget = (label, lat, lon) => {
      const parsedLat = parseFloat(lat)
      const parsedLon = parseFloat(lon)
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) return
      if (targets.some(target => target.lat === parsedLat && target.lon === parsedLon)) return
      targets.push({ label, lat: parsedLat, lon: parsedLon })
    }

    const isMonday = new Date().getDay() === 1
    const isApelEnabled = settings.apel_senin_enabled == '1'

    if (isMonday && isApelEnabled) {
      addTarget('apel senin', settings.lokasi_apel_latitude, settings.lokasi_apel_longitude)
    }

    addTarget('sekolah', settings.sekolah_latitude, settings.sekolah_longitude)
    addTarget('pos guru laki-laki', settings.lokasi_laki_latitude, settings.lokasi_laki_longitude)
    addTarget('area guru perempuan', settings.lokasi_perempuan_latitude, settings.lokasi_perempuan_longitude)

    return targets
  }

  const validateAttendanceLocation = (location, isCheckout = false) => {
    const radius = parseInt(settings.radius_gps, 10)
    const targets = getAttendanceLocationTargets(isCheckout)

    if (!targets.length || !Number.isFinite(radius)) {
      return { isValid: false, message: 'Lokasi presensi belum dikonfigurasi. Hubungi admin.' }
    }

    let nearest = null
    for (const target of targets) {
      const distance = Math.round(calculateDistance(location.latitude, location.longitude, target.lat, target.lon))
      if (distance <= radius) {
        return { isValid: true }
      }

      if (!nearest || distance < nearest.distance) {
        nearest = { ...target, distance }
      }
    }

    const areaLabel = targets.map(target => target.label).join(' / ')
    return {
      isValid: false,
      message: `Anda berada di luar jangkauan ${areaLabel} (${nearest.distance}m dari ${nearest.label}). Maksimal jarak: ${settings.radius_gps}m`
    }
  }

  const applyInitialPayload = (data) => {
    if (!data) return

    if (data.settings) {
      setSettings(prev => ({ ...prev, ...data.settings }))
    }

    if (data.pulangThreshold) {
      setPulangThreshold(data.pulangThreshold)
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
      let loadedCompactData = false

      try {
        const response = await guruHomeAPI.getInitialData()
        applyInitialPayload(response.data)
        loadedCompactData = true
      } catch (error) {
        console.error('Failed to load compact guru data, falling back:', error)
      }

      if (!loadedCompactData) {
        await Promise.allSettled([
          loadSettings(),
          checkIfHoliday(),
          checkJadwalPiket(),
          checkTodayAttendance()
        ])
      }

      // Statistik bukan dependency tombol presensi. Muat di belakang agar
      // tombol presensi siap segera setelah status hari ini tersedia.
      void loadMonthlyStats()

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

  const loadMonthlyStats = async () => {
    try {
      const today = new Date()
      const start = formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1))
      const end = formatDateForInput(today)
      const response = await presensiAPI.getAll({ user_id: user.id, start_date: start, end_date: end })
      const logs = response.data || []
      const monthLogs = logs

      const hadir = monthLogs.filter(log => ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'].includes(log.status)).length
      const izin = monthLogs.filter(log => log.status === 'izin').length
      const sakit = monthLogs.filter(log => log.status === 'sakit').length
      const alfa = monthLogs.filter(log => log.status === 'alfa').length
      const total = hadir + izin + sakit + alfa
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0

      setMonthlyStats({ hadir, izin, sakit, alfa, total, percentage })
      setRecentLogs(monthLogs.slice().sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1)).slice(0, 5))
    } catch (error) {
      console.error('Failed to load monthly stats:', error)
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
      setSettings(prev => ({ ...prev, ...response.data }))
      console.log('⚙️ Settings loaded:', response.data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Use default settings if API fails
    }
  }

  const checkIfHoliday = async () => {
    try {
      const today = formatDateForInput(new Date())
      console.log('🔍 Checking holiday for:', today)

      const response = await holidaysAPI.checkDate(today, { jenis_kelamin: user?.jenisKelamin || user?.jenis_kelamin || '' })
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

  const startAttendanceAction = () => {
    if (attendanceActionRef.current) return false
    attendanceActionRef.current = true
    setLoading(true)
    return true
  }

  const finishAttendanceAction = () => {
    attendanceActionRef.current = false
    setLoading(false)
  }

  const handleHadir = async () => {
    if (!startAttendanceAction()) return
    setMessage({ type: '', text: '' })

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing == '1' // Gunakan == agar int(1) tetap true sebagai '1'

    try {
      const location = await getFastLocation()

      if (!TESTING_MODE) {
        const validation = validateAttendanceLocation(location, false)

        if (!validation.isValid) {
          setMessage({
            type: 'error',
            text: validation.message
          })
          return
        }
      }

      await saveAttendance('hadir', '', location)
    } catch (error) {
      // Jika gagal mendapatkan lokasi
      if (TESTING_MODE) {
        // Testing mode: gunakan koordinat sekolah
        await saveAttendance('hadir', '', {
          latitude: parseFloat(settings.sekolah_latitude),
          longitude: parseFloat(settings.sekolah_longitude),
          accuracy: 0
        })
      } else {
        // Produksi: tampilkan error
        setMessage({
          type: 'error',
          text: getLocationErrorMessage(error)
        })
      }
    } finally {
      finishAttendanceAction()
    }
  }

  const handleIzinSakit = (type) => {
    setModalType(type)
    setKeterangan('')
    setShowModal(true)
  }

  const submitIzinSakit = async () => {
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan')
      return
    }
    if (!startAttendanceAction()) return
    setShowModal(false)
    try {
      await saveAttendance(modalType, keterangan)
    } finally {
      finishAttendanceAction()
    }
  }

  const saveAttendance = async (status, ket, location = null) => {
    try {
      const attendanceData: any = {
        userId: user.id,
        status,
        keterangan: ket
      }

      if (Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude)) {
        attendanceData.latitude = location.latitude
        attendanceData.longitude = location.longitude
        if (Number.isFinite(location?.accuracy)) {
          attendanceData.accuracy = location.accuracy
        }
      }

      const response = await presensiAPI.create(attendanceData)

      const attendance = getAttendanceFromResponse(response)
      if (attendance) {
        setTodayAttendance(attendance)
      } else {
        await checkTodayAttendance()
      }

      const saved = attendance || {}
      let successMessage = response.message || `Presensi ${status} berhasil disimpan!`
      if (saved.status === 'hadir_terlambat' && saved.keterangan) {
        successMessage += ` (${saved.keterangan})`
      }

      setMessage({ type: saved.status === 'hadir_terlambat' ? 'warning' : 'success', text: successMessage })
      void loadMonthlyStats()
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Gagal menyimpan presensi: ' + error.message
      })
    }
  }

  // Batas minimal jam presensi pulang efektif hari ini. Mengikuti override
  // per-tanggal (pengaturan_harian) bila aktif (pulangThreshold dari guru_home);
  // jika tidak ada, pakai settings.jam_min_pulang (default 12:30).
  const effectivePulangThreshold = () => (pulangThreshold || settings.jam_min_pulang || '12:30').substring(0, 5)

  // Batas minimal jam presensi pulang (menit sejak 00:00).
  const getPulangThresholdMinutes = () => {
    const val = effectivePulangThreshold().trim()
    const [h, m] = val.split(':')
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
  }

  const formatPulangThreshold = () => effectivePulangThreshold()

  // Fungsi untuk cek apakah tombol pulang bisa ditampilkan (sesuai setting jam_min_pulang)
  const canShowPulangButton = () => {
    const now = new Date()
    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes()
    return currentTimeInMinutes >= getPulangThresholdMinutes()
  }

  const handlePulang = async (izinPulangAwal = false, keteranganCustom = '') => {
    if (!todayAttendance || (todayAttendance.status !== 'hadir' && todayAttendance.status !== 'hadir_terlambat' && todayAttendance.status !== 'hadir_izin_terlambat')) return

    // Cek apakah sudah presensi pulang (cek kedua field untuk compatibility)
    if (todayAttendance.jam_pulang || todayAttendance.jamPulang) {
      setMessage({ type: 'error', text: 'Anda sudah melakukan presensi pulang!' })
      return
    }

    // Cek waktu minimal (sesuai setting jam_min_pulang)
    const now = new Date()
    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes()

    if (currentTimeInMinutes < getPulangThresholdMinutes()) {
      setMessage({
        type: 'error',
        text: `Presensi pulang hanya bisa dilakukan mulai pukul ${formatPulangThreshold()} WIB`
      })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    setShowPiketModal(false)

    // MODE TESTING dari settings (bukan hardcoded)
    const TESTING_MODE = settings.mode_testing == '1' // Gunakan == agar int(1) tetap true sebagai '1'

    try {
      const location = await getFastLocation()
      // Cek apakah di dalam radius sekolah. Jika di luar (dan bukan testing),
      // munculkan popup konfirmasi: apakah presensi pulang di sekolah atau di luar (lupa)?
      if (!TESTING_MODE) {
        const validation = validateAttendanceLocation(location, true)

        if (!validation.isValid) {
          // Jangan blokir — simpan draf & tanyakan lokasi pulang.
          setPendingPulang({ izinPulangAwal, keteranganCustom, location })
          setPulangLuarModal(true)
          setLoading(false)
          return
        }
      }

      // Di dalam radius (atau mode testing) → langsung submit sebagai 'sekolah'
      await submitPulang(izinPulangAwal, keteranganCustom, location, 'sekolah')
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

  // Submit presensi pulang ke server dengan penanda lokasi (sekolah/luar).
  const submitPulang = async (izinPulangAwal, keteranganCustom, location, lokasiPulang) => {
    if (!startAttendanceAction()) return
    try {
      const updatedData = {
        id: todayAttendance.id,
        keterangan: keteranganCustom,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        izin_pulang_awal: izinPulangAwal,
        lokasi_pulang: lokasiPulang
      }

      const response = await presensiAPI.update(updatedData)

      setMessage({
        type: 'success',
        text: lokasiPulang === 'luar'
          ? 'Presensi pulang dicatat (di luar sekolah — lupa pulang).'
          : 'Presensi pulang berhasil disimpan!'
      })

      const attendance = getAttendanceFromResponse(response)
      if (attendance) {
        setTodayAttendance(attendance)
      } else {
        await checkTodayAttendance()
      }

      setPulangLuarModal(false)
      setPendingPulang(null)
      void loadMonthlyStats()
    } catch (error) {
      if (error.message.startsWith('PIKET_RESTRICTION|')) {
        const jam = error.message.split('|')[1]
        setPiketCheckoutTime(jam)
        setPiketStep(1)
        setShowPiketModal(true)
        setPendingQRData(null)
      } else {
        setMessage({
          type: 'error',
          text: 'Gagal menyimpan presensi pulang: ' + error.message
        })
      }
    } finally {
      finishAttendanceAction()
    }
  }

  // Konfirmasi pilihan lokasi pulang dari popup (dipanggil tombol modal).
  const confirmPulangLocation = (lokasiPulang) => {
    if (!pendingPulang) return
    const { izinPulangAwal, keteranganCustom, location } = pendingPulang
    submitPulang(izinPulangAwal, keteranganCustom, location, lokasiPulang)
  }

  const handleQRScanPiketRestriction = (jam, qrData) => {
    setPiketCheckoutTime(jam)
    setPendingQRData(qrData)
    setKeteranganPiket('')
    setPiketStep(1) // Start at step 1
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
        const location = await getFastLocation()
        const response = await qrScanAPI.submit(
          pendingQRData,
          location.latitude,
          location.longitude,
          true, // isPulang
          true, // izin_pulang_awal
          keteranganPiket, // pass the reason
          location.accuracy
        )
        setShowPiketModal(false)
        setPendingQRData(null)
        setKeteranganPiket('')
        setMessage({ type: 'success', text: '✅ Presensi pulang (izin awal) berhasil!' })
        const attendance = getAttendanceFromResponse(response)
        if (attendance) {
          setTodayAttendance(attendance)
        } else {
          checkTodayAttendance()
        }
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
      <div className="space-y-4">
        <div className="guru-surface p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">{formatFullDate(new Date())}</h2>
        </div>
        <div className="guru-surface flex flex-col items-center justify-center p-12">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Memuat data presensi...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="guru-surface p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">{formatFullDate(new Date())}</h2>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-rose-800 dark:text-rose-200">User tidak ditemukan</h3>
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">Silakan logout dan login kembali</p>
        </div>
      </div>
    )
  }

  const scheduleInfo = (() => {
    const today = new Date()
    const isMonday = today.getDay() === 1
    const isApel = settings.apel_senin_enabled == '1'
    const piketTime = jadwalPiketHariIni?.jam_piket?.substring(0, 5)

    if (isMonday && isApel) {
      return { label: isPiketToday ? 'Apel & Piket' : 'Apel Senin', time: isPiketToday ? piketTime : '07:00' }
    }

    if (isPiketToday) {
      return { label: 'Jadwal piket', time: piketTime }
    }

    return { label: 'Jam masuk normal', time: settings.jam_masuk_normal }
  })()

  const isTestingMode = settings.mode_testing == '1'
  const isGpsReady = isTestingMode || locationStatus.state === 'ready'
  const gpsLabel = isTestingMode
    ? 'Mode testing aktif'
    : locationStatus.state === 'ready'
      ? 'Lokasi siap digunakan'
      : locationStatus.state === 'loading'
        ? 'Sedang mencari lokasi...'
        : locationStatus.state === 'error'
          ? 'Lokasi perlu diperbarui'
          : 'Siapkan lokasi sebelum hadir'
  const trackingLabel = trackingStatus.state === 'ready'
    ? 'Aktif'
    : trackingStatus.state === 'loading'
      ? 'Mengirim lokasi'
      : trackingStatus.state === 'error'
        ? 'Perlu perhatian'
        : todayAttendance
          ? 'Menunggu data'
          : 'Aktif setelah hadir'

  return (
    <div className="space-y-5 pb-2">
      {/* Welcome / Hero Card */}
      <Card className="gap-0 p-5 sm:p-6" aria-labelledby="guru-overview-title">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white dark:bg-slate-800">
              {(user?.nama || '').charAt(0)?.toUpperCase() || '\ud83d\udc4b'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Ringkasan hari ini</p>
              <h2 id="guru-overview-title" className="mt-1 truncate text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                {user?.nama || 'Guru'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatFullDate(new Date())}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 lg:min-w-[16rem] ${
            todayAttendance
              ? 'border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10'
              : 'border-indigo-200/60 bg-indigo-50/60 dark:border-indigo-500/20 dark:bg-indigo-500/10'
          }`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              todayAttendance
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
            }`}>
              {todayAttendance ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {todayAttendance ? 'Presensi tercatat' : 'Belum presensi'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {todayAttendance ? 'Detail kehadiran tersedia di bawah.' : 'Siap dicatat lewat tombol hadir.'}
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
          <span className="flex min-h-[62px] flex-col items-start justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-bold text-slate-800 dark:text-slate-100">{scheduleInfo.label}</span>
            <span>{scheduleInfo.time || '--:--'} WIB</span>
          </span>
          <span className="flex min-h-[62px] flex-col items-start justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-bold text-slate-800 dark:text-slate-100">Toleransi</span>
            <span>{settings.toleransi_terlambat} menit</span>
          </span>
          {settings.mode_testing == '1' && (
            <span className="col-span-2 flex min-h-[62px] flex-col items-start justify-between gap-2 rounded-2xl border border-orange-200 bg-orange-50/80 px-3 py-2.5 text-xs font-medium text-orange-600 shadow-sm dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300 sm:col-span-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Mode Testing
            </span>
          )}
          {settings.mode_testing != '1' && (
            <Button
              type="button"
              onClick={warmUpLocation}
              variant={isGpsReady ? 'secondary' : 'outline'}
              className={`col-span-2 flex min-h-[62px] items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-medium transition-all hover:scale-[1.01] active:scale-[0.99] sm:col-span-1 ${
                locationStatus.state === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15'
                  : locationStatus.state === 'loading'
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
                    : locationStatus.state === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              title={locationStatus.message || 'Ketuk untuk menyiapkan GPS'}
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">GPS sekolah</span>
                  <span className="mt-0.5 block truncate font-bold">{gpsLabel}</span>
                </span>
              </span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${
                locationStatus.state === 'ready'
                  ? 'bg-emerald-500'
                  : locationStatus.state === 'loading'
                    ? 'animate-pulse bg-blue-500'
                    : locationStatus.state === 'error'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
              }`} aria-hidden="true" />
            </Button>
          )}
          {settings.location_tracking_enabled == '1' && (
            <span
              className={`col-span-2 flex min-h-[62px] items-center justify-between rounded-2xl border px-3 py-2.5 text-xs font-medium sm:col-span-1 ${
                trackingStatus.state === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : trackingStatus.state === 'loading'
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
                    : trackingStatus.state === 'error'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
              }`}
              title={trackingStatus.message}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                trackingStatus.state === 'ready'
                  ? 'bg-emerald-500'
                  : trackingStatus.state === 'loading'
                    ? 'animate-pulse bg-blue-500'
                    : trackingStatus.state === 'error'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
              }`} />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">Tracking lokasi</span>
                <span className="mt-0.5 block font-bold">{trackingLabel}</span>
              </span>
            </span>
          )}
          {isPiketToday && jadwalPiketHariIni && (
            <span className="col-span-2 inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/80 px-3 py-2 text-xs font-semibold text-purple-700 sm:col-span-4 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Piket - Maks {jadwalPiketHariIni.jam_piket} WIB
            </span>
          )}
        </div>
      </Card>

      {/* Holiday Message */}
      {isHoliday && holidayInfo && (
        <div className="guru-surface p-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-3xl dark:bg-slate-800">
            {holidayInfo.type === 'weekend' ? '😴' : '🎉'}
          </span>
          <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">{holidayInfo.message}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tidak perlu melakukan presensi hari ini</p>
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
            let accentColor, dotColor, badgeBg, badgeText, badgeLabel, headerText, statusIcon
            if (status === 'izin') {
              accentColor = 'bg-amber-500'; dotColor = 'bg-amber-500'
              badgeBg = 'bg-amber-50 dark:bg-amber-500/15'; badgeText = 'text-amber-700 dark:text-amber-300'
              badgeLabel = 'IZIN'; headerText = 'Anda Izin Hari Ini'; statusIcon = <FileText className="h-4 w-4" />
            } else if (status === 'sakit') {
              accentColor = 'bg-rose-500'; dotColor = 'bg-rose-500'
              badgeBg = 'bg-rose-50 dark:bg-rose-500/15'; badgeText = 'text-rose-700 dark:text-rose-300'
              badgeLabel = 'SAKIT'; headerText = 'Anda Sakit Hari Ini'; statusIcon = <AlertCircle className="h-4 w-4" />
            } else if (isHadirTerlambat) {
              accentColor = 'bg-amber-500'; dotColor = 'bg-amber-500'
              badgeBg = 'bg-yellow-50 dark:bg-yellow-500/15'; badgeText = 'text-yellow-700 dark:text-yellow-300'
              badgeLabel = 'TERLAMBAT'; headerText = 'Anda Sudah Absen'; statusIcon = <Clock className="h-4 w-4" />
            } else if (isIzinTerlambat) {
              accentColor = 'bg-blue-500'; dotColor = 'bg-blue-500'
              badgeBg = 'bg-blue-50 dark:bg-blue-500/15'; badgeText = 'text-blue-700 dark:text-blue-300'
              badgeLabel = 'IZIN TERLAMBAT'; headerText = 'Anda Sudah Absen'; statusIcon = <Clock className="h-4 w-4" />
            } else {
              accentColor = 'bg-emerald-500'; dotColor = 'bg-emerald-500'
              badgeBg = 'bg-emerald-50 dark:bg-emerald-500/15'; badgeText = 'text-emerald-700 dark:text-emerald-300'
              badgeLabel = 'HADIR'; headerText = 'Anda Sudah Absen'; statusIcon = <CheckCircle className="h-4 w-4" />
            }
            return (
              <>
                <Card className="p-0">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${badgeBg} ${badgeText}`}>
                          {statusIcon}
                        </span>
                        <div>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{headerText}</span>
                          </span>
                        </div>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 text-[10px] font-black tracking-wider ${badgeBg} ${badgeText}`}>
                        {badgeLabel}
                      </Badge>
                    </div>
                    <div className="space-y-0">
                      {todayAttendance.jamHadir && (
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                            <ArrowRight className="h-3 w-3 text-emerald-500" /> Jam Masuk
                          </span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{todayAttendance.jamHadir}</span>
                        </div>
                      )}
                      {todayAttendance.jamIzin && (
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Jam Izin</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{todayAttendance.jamIzin}</span>
                        </div>
                      )}
                      {todayAttendance.jamSakit && (
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Jam Sakit</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{todayAttendance.jamSakit}</span>
                        </div>
                      )}
                      {isHadirTerlambat && todayAttendance.keterangan && (
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Terlambat</span>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{todayAttendance.keterangan}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          <ArrowRight className="h-3 w-3 rotate-180 text-indigo-500" /> Jam Pulang
                        </span>
                        <span className={`text-sm font-bold ${(todayAttendance.jamPulang || todayAttendance.jam_pulang) ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600"}`}>
                          {todayAttendance.jamPulang || todayAttendance.jam_pulang || 'Belum tercatat'}
                        </span>
                      </div>
                      {todayAttendance.keterangan && !isHadirTerlambat && (
                        <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Keterangan</span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 text-right max-w-[60%]">{todayAttendance.keterangan}</span>
                        </div>
                      )}
                    </div>
                    {isIzinSakit && (
                      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          Tidak perlu presensi pulang untuk status {status === 'izin' ? 'izin' : 'sakit'}.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {!isIzinSakit && (status === 'hadir' || isHadirTerlambat || isIzinTerlambat) && !todayAttendance.jamPulang && !todayAttendance.jam_pulang && (
                  <>
                    {canShowPulangButton() ? (
                      <button
                        onClick={() => handlePulang()}
                        disabled={loading}
                        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                      >
                        <CheckCircle className="h-5 w-5" />
                        {loading ? 'Memproses...' : 'PRESENSI PULANG'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                          <Clock className="h-5 w-5" />
                        </span>
                        <div className="text-center flex-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Presensi pulang tersedia mulai {formatPulangThreshold()} WIB</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Silakan tunggu hingga jam yang ditentukan</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isIzinSakit && (status === 'hadir' || isHadirTerlambat || isIzinTerlambat) && (todayAttendance.jamPulang || todayAttendance.jam_pulang) && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">Presensi pulang sudah tercatat</p>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      ) : null}

      {/* Tap-first attendance actions */}
      {(() => {
        const sudahPulang = todayAttendance && (todayAttendance.jam_pulang || todayAttendance.jamPulang)
        const isIzinSakit = todayAttendance && (todayAttendance.status === 'izin' || todayAttendance.status === 'sakit')
        if (isHoliday || sudahPulang || isIzinSakit) return null
        const manualEnabled = settings.button_enabled == '1'
        const isCheckout = Boolean(todayAttendance)
        const checkoutReady = !isCheckout || canShowPulangButton()
        return (
        <Card className="mb-2 gap-0 space-y-5 p-5 sm:p-6" aria-labelledby="attendance-action-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Aksi presensi</p>
              <h3 id="attendance-action-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {!todayAttendance ? 'Tap untuk presensi masuk' : 'Tap untuk presensi pulang'}
              </h3>
            </div>
            <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              {!todayAttendance ? 'Belum tercatat' : checkoutReady ? 'Siap pulang' : `Mulai ${formatPulangThreshold()} WIB`}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {!todayAttendance
              ? 'Tekan tombol hadir saat berada di area sekolah. Sistem akan memverifikasi lokasi sebelum presensi disimpan.'
              : checkoutReady
                ? 'Tekan tombol pulang untuk menyelesaikan presensi hari ini. Lokasi tetap diverifikasi sesuai aturan sekolah.'
                : `Presensi pulang tersedia mulai pukul ${formatPulangThreshold()} WIB.`}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> GPS mengikuti aturan sekolah</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" /> Validasi otomatis</span>
          </div>
          {manualEnabled ? (
            <button
              type="button"
              onClick={() => isCheckout ? handlePulang() : handleHadir()}
              disabled={loading || !checkoutReady}
              aria-label={!todayAttendance ? 'Tap untuk presensi hadir' : 'Tap untuk presensi pulang'}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              <CheckCircle className="h-5 w-5" aria-hidden="true" />
              {loading ? 'Memproses...' : !todayAttendance ? 'HADIR' : checkoutReady ? 'PRESENSI PULANG' : `Tersedia ${formatPulangThreshold()} WIB`}
            </button>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Presensi tombol sedang dinonaktifkan</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300">Silakan gunakan metode presensi yang ditetapkan sekolah atau hubungi administrator.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleIzinSakit('izin')}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 active:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              <FileText className="h-5 w-5" />
              IZIN
            </button>
            <button
              onClick={() => handleIzinSakit('sakit')}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 active:bg-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-500 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              <AlertCircle className="h-5 w-5" />
              SAKIT
            </button>
          </div>
        </Card>
        )
      })()}

      <Card className="gap-0 p-5 sm:p-6" aria-labelledby="monthly-pulse-title">
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Kinerja kehadiran</p>
            <h3 id="monthly-pulse-title" className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
              Ringkasan {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pantau kehadiran Anda tanpa meninggalkan beranda.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Hadir', value: monthlyStats.hadir, className: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' },
            { label: 'Izin', value: monthlyStats.izin, className: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20' },
            { label: 'Sakit', value: monthlyStats.sakit, className: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20' },
            { label: 'Alfa', value: monthlyStats.alfa, className: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:ring-slate-700' },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-3 ring-1 ring-inset ${item.className}`}>
              <p className="text-2xl font-black tracking-tight">{item.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/45">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Kehadiran bulan ini</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {monthlyStats.total > 0 ? `${monthlyStats.hadir} dari ${monthlyStats.total} catatan` : 'Belum ada catatan yang dapat diringkas.'}
              </p>
            </div>
            <p className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-300">{monthlyStats.percentage}%</p>
          </div>
          <Progress className="mt-3" value={monthlyStats.percentage} aria-label="Persentase kehadiran bulan ini" />
        </div>

        <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onChangeTab?.('statistik')} className="group flex min-h-11 items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5 text-left text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15 dark:focus-visible:ring-offset-slate-900">
            <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" aria-hidden="true" /> Statistik lengkap</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onChangeTab?.('riwayat')} className="group flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900">
            <span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" aria-hidden="true" /> Riwayat presensi</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
          </button>
        </div>

        {recentLogs.length > 0 && (
          <div className="relative mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Aktivitas terbaru</p>
              <button type="button" onClick={() => onChangeTab?.('riwayat')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-indigo-300 dark:hover:text-indigo-200 dark:focus-visible:ring-offset-slate-900">
                Lihat semua
              </button>
            </div>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/45">
              {recentLogs.slice(0, 3).map((log) => (
                <div key={log.id || `${log.tanggal}-${log.status}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{log.tanggal}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{log.jam_masuk || log.jamMasuk || log.jam_hadir || log.jamHadir || 'Waktu belum tercatat'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
                    {getRecentStatusLabel(log.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Message */}
      {message.text && (
        <div role={message.type === 'error' ? 'alert' : 'status'} aria-live={message.type === 'error' ? 'assertive' : 'polite'} aria-atomic="true" className={`fixed inset-x-4 top-[4.5rem] z-[80] mx-auto flex max-w-md items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-md sm:top-5 lg:left-auto lg:right-6 lg:mx-0 ${
          message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' :
          message.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300' :
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
        }`}>
          <span className="mt-0.5 shrink-0">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : message.type === 'warning' ? <AlertCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </span>
          <span className="whitespace-pre-line">{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: '', text: '' })} className="-mr-1 -mt-1 ml-auto rounded-lg p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current dark:hover:bg-white/10" aria-label="Tutup notifikasi">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Modal Izin/Sakit */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:pb-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) { setShowModal(false); setKeterangan('') } }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="izin-sakit-dialog-title" aria-describedby="izin-sakit-dialog-description" className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${modalType === 'izin' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'}`}>
                  {modalType === 'izin' ? <FileText className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </span>
                <div>
                  <h3 id="izin-sakit-dialog-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Keterangan {modalType === 'izin' ? 'Izin' : 'Sakit'}
                  </h3>
                  <p id="izin-sakit-dialog-description" className="text-xs text-slate-400 dark:text-slate-500">Masukkan alasan {modalType === 'izin' ? 'izin' : 'sakit'} Anda</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <textarea
                data-dialog-autofocus
                aria-label={`Keterangan ${modalType === 'izin' ? 'izin' : 'sakit'}`}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-600"
                rows={3}
                placeholder={modalType === 'izin' ? 'Contoh: Keperluan keluarga mendesak...' : 'Contoh: Sakit kepala, demam, flu...'}
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setKeterangan('') }}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitIzinSakit}
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Piket Restriction */}
      {showPiketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) { setShowPiketModal(false); setKeteranganPiket('') } }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="piket-dialog-title" aria-describedby="piket-dialog-description" className="bg-white rounded-xl w-full max-w-sm p-8 shadow-xl transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>

            <h3 id="piket-dialog-title" className="text-lg font-black text-slate-800 text-center mb-2">
              Belum Waktunya Pulang
            </h3>

            {piketStep === 1 ? (
              <>
                <p id="piket-dialog-description" className="text-slate-600 text-center text-xs leading-relaxed mb-8">
                  Jam pulang untuk petugas piket adalah pukul <span className="font-bold text-amber-600">{piketCheckoutTime} WIB</span> (sesuai aturan).
                  Jika Anda pulang lebih awal maka <span className="font-bold">harus izin kepada atasan</span>.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    data-dialog-autofocus
                    onClick={() => setPiketStep(2)}
                    className="w-full rounded-lg bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                  >
                    SAYA SUDAH IZIN
                  </button>

                  <button
                    type="button"
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
                <p id="piket-dialog-description" className="text-slate-500 text-center text-[11px] leading-relaxed mb-6">
                  Silakan isi alasan izin yang telah Anda sampaikan kepada atasan.
                </p>

                <div className="mb-6">
                  <label htmlFor="piket-reason" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan Izin</label>
                  <textarea
                    id="piket-reason"
                    data-dialog-autofocus
                    aria-label="Alasan izin pulang lebih awal"
                    value={keteranganPiket}
                    onChange={(e) => setKeteranganPiket(e.target.value)}
                    placeholder="Tulis alasan izin yang sudah disampaikan ke atasan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleIzinPulangAwal}
                    disabled={loading}
                    className="w-full rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>MEMPROSES...</span>
                      </div>
                    ) : 'KIRIM'}
                  </button>

                  <button
                    type="button"
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

      {/* Modal Konfirmasi Lokasi Presensi Pulang (di luar radius sekolah) */}
      {pulangLuarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) { setPulangLuarModal(false); setPendingPulang(null); setLoading(false) } }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pulang-location-dialog-title" aria-describedby="pulang-location-dialog-description" className="bg-white rounded-xl w-full max-w-sm p-8 shadow-xl transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-amber-500" />
            </div>

            <h3 id="pulang-location-dialog-title" className="text-lg font-black text-slate-800 text-center mb-2">
              Di Mana Anda Presensi Pulang?
            </h3>

            <p className="text-slate-600 text-center text-xs leading-relaxed mb-8">
              GPS mendeteksi Anda berada di <span className="font-bold text-amber-600">luar radius sekolah</span>.
              Konfirmasi lokasi presensi pulang Anda hari ini.
            </p>

            <div className="space-y-3">
              <button
                data-dialog-autofocus
                type="button"
                onClick={() => confirmPulangLocation('sekolah')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Home className="w-5 h-5" />
                SAYA DI SEKOLAH
              </button>

              <button
                type="button"
                onClick={() => confirmPulangLocation('luar')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-5 h-5" />
                DI LUAR (LUPA PULANG)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPulangLuarModal(false)
                  setPendingPulang(null)
                  setLoading(false)
                }}
                disabled={loading}
                className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-all"
              >
                BATAL
              </button>
            </div>

            <p id="pulang-location-dialog-description" className="text-slate-400 text-center text-[10px] leading-relaxed mt-5">
              Pilih <strong>"Di Luar (Lupa Pulang)"</strong> jika Anda lupa presensi pulang di sekolah dan baru ingat di rumah. Data akan ditandai sebagai lupa pulang.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuruHome
