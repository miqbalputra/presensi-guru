import { useState, useEffect, useRef } from 'react'
import { Camera, X, CheckCircle, AlertCircle, MapPin, Clock, QrCode, RefreshCw } from 'lucide-react'
import { qrScanAPI } from '../../services/api'
import { getUserLocation } from '../../utils/geoLocation'
import { formatFullDate, formatTimeForDB } from '../../utils/dateUtils'

function QRScanner({ user, onClose, onSuccess }) {
    const [scanning, setScanning] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [location, setLocation] = useState(null)
    const [locationError, setLocationError] = useState('')
    const [attendanceStatus, setAttendanceStatus] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        // Check attendance status and get location on mount
        checkAttendanceStatus()
        getLocationOnMount()

        return () => {
            stopCamera()
        }
    }, [])

    const checkAttendanceStatus = async () => {
        try {
            const response = await qrScanAPI.checkStatus()
            if (response.success) {
                setAttendanceStatus(response.data)
            }
        } catch (err) {
            console.error('Failed to check attendance status:', err)
        }
    }

    const getLocationOnMount = async () => {
        try {
            setLocationError('')
            const loc = await getUserLocation()
            setLocation(loc)
        } catch (err) {
            setLocationError('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.')
        }
    }

    const startCamera = async () => {
        try {
            setError('')
            setScanning(true)

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()

                // Start scanning loop
                requestAnimationFrame(scanQRCode)
            }
        } catch (err) {
            setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
            setScanning(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setScanning(false)
    }

    const toggleCamera = () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment'
        setFacingMode(newMode)
        if (scanning) {
            stopCamera()
            setTimeout(() => {
                startCameraWithMode(newMode)
            }, 100)
        }
    }

    const startCameraWithMode = async (mode) => {
        try {
            setError('')
            setScanning(true)

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: mode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
                requestAnimationFrame(scanQRCode)
            }
        } catch (err) {
            setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
            setScanning(false)
        }
    }

    const scanQRCode = async () => {
        if (!scanning || !videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanQRCode)
            return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
            // Use BarcodeDetector API if available
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })
                const barcodes = await barcodeDetector.detect(canvas)

                if (barcodes.length > 0) {
                    const qrData = barcodes[0].rawValue
                    handleQRDetected(qrData)
                    return
                }
            }
        } catch (err) {
            // BarcodeDetector not supported or error
        }

        // Continue scanning
        if (scanning) {
            requestAnimationFrame(scanQRCode)
        }
    }

    const handleQRDetected = async (qrData) => {
        if (processing) return

        stopCamera()
        setProcessing(true)
        setError('')

        try {
            // Validate QR data format
            let parsedData
            try {
                parsedData = JSON.parse(qrData)
            } catch {
                throw new Error('QR Code tidak valid. Bukan QR Code presensi.')
            }

            if (parsedData.type !== 'attendance') {
                throw new Error('QR Code ini bukan untuk presensi.')
            }

            // Get fresh location
            let currentLocation = location
            if (!currentLocation) {
                try {
                    currentLocation = await getUserLocation()
                    setLocation(currentLocation)
                } catch {
                    throw new Error('Tidak dapat mendapatkan lokasi GPS. Pastikan GPS aktif.')
                }
            }

            // Determine if this is check-in or check-out
            const isPulang = attendanceStatus?.has_checked_in && !attendanceStatus?.has_checked_out

            // Submit to API
            const response = await qrScanAPI.submit(
                qrData,
                currentLocation.latitude,
                currentLocation.longitude,
                isPulang
            )

            if (response.success) {
                setSuccess(response.message)

                // Notify parent
                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess(response.data)
                    }, 2000)
                }
            }
        } catch (err) {
            setError(err.message || 'Gagal memproses QR Code')
            setProcessing(false)
        }
    }

    // Manual QR input fallback
    const [manualInput, setManualInput] = useState(false)
    const [manualQRData, setManualQRData] = useState('')

    const handleManualSubmit = () => {
        if (manualQRData.trim()) {
            handleQRDetected(manualQRData.trim())
        }
    }

    // If already checked in and out
    if (attendanceStatus?.has_checked_in && attendanceStatus?.has_checked_out) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Presensi Lengkap!</h3>
                    <p className="text-gray-600 mb-4">
                        Anda sudah melakukan presensi masuk dan pulang hari ini.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Jam Masuk:</span>
                            <span className="font-semibold">{attendanceStatus.attendance?.jam_masuk || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Jam Pulang:</span>
                            <span className="font-semibold">{attendanceStatus.attendance?.jam_pulang || '-'}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
                <div>
                    <h2 className="text-lg font-bold">
                        {attendanceStatus?.has_checked_in ? 'Scan Presensi Pulang' : 'Scan Presensi Masuk'}
                    </h2>
                    <p className="text-sm text-gray-300">{formatFullDate(new Date())}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleCamera}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors title='Ganti Kamera'"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Location Status */}
            <div className="px-4 mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${location ? 'bg-green-500/20 text-green-300' :
                        locationError ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                    }`}>
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                        {location ? 'Lokasi GPS terdeteksi' :
                            locationError ? 'GPS tidak tersedia' :
                                'Mencari lokasi...'}
                    </span>
                    {!location && !locationError && (
                        <RefreshCw className="w-4 h-4 animate-spin ml-auto" />
                    )}
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h3>
                        <p className="text-gray-600">{success}</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && !success && (
                <div className="px-4 mb-4">
                    <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera View */}
            {!success && (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    {scanning ? (
                        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Scanning overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-white rounded-2xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                                    {/* Scanning line animation */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-scan-line" />
                                </div>
                            </div>

                            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                                Arahkan kamera ke QR Code
                            </p>
                        </div>
                    ) : processing ? (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white">Memproses presensi...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <QrCode className="w-12 h-12 text-white" />
                            </div>
                            <p className="text-white mb-6">
                                Scan QR Code yang tersedia di sekolah untuk melakukan presensi
                            </p>

                            <button
                                onClick={startCamera}
                                disabled={!location}
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-3 mx-auto transition-colors"
                            >
                                <Camera className="w-6 h-6" />
                                Buka Kamera
                            </button>

                            {!location && (
                                <p className="text-yellow-300 text-sm mt-4">
                                    Menunggu lokasi GPS...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Manual Input Fallback */}
            {!success && !scanning && !processing && (
                <div className="p-4">
                    <button
                        onClick={() => setManualInput(!manualInput)}
                        className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {manualInput ? 'Sembunyikan input manual' : 'QR Scanner tidak berfungsi? Klik di sini'}
                    </button>

                    {manualInput && (
                        <div className="mt-4 bg-white/10 rounded-xl p-4">
                            <p className="text-gray-300 text-sm mb-3">
                                Minta admin untuk memberikan kode QR jika scanner tidak berfungsi:
                            </p>
                            <textarea
                                value={manualQRData}
                                onChange={(e) => setManualQRData(e.target.value)}
                                placeholder='Paste data QR di sini...'
                                className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-blue-400 focus:outline-none"
                                rows={3}
                            />
                            <button
                                onClick={handleManualSubmit}
                                disabled={!manualQRData.trim() || !location}
                                className="w-full mt-3 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Close button at bottom */}
            {success && (
                <div className="p-4">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            )}

            {/* CSS for scanning animation */}
            <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
        </div>
    )
}

export default QRScanner
