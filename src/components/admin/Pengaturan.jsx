import { useState, useEffect } from 'react'
import { Save, Clock, MapPin, Timer, Map, School, ExternalLink, TestTube } from 'lucide-react'
import { settingsAPI } from '../../services/api'

function Pengaturan() {
  const [settings, setSettings] = useState({
    jam_masuk_normal: '07:20',
    toleransi_terlambat: '15',
    radius_gps: '500',
    sekolah_latitude: '-5.1477',
    sekolah_longitude: '119.4327',
    sekolah_nama: 'Sekolah',
    mode_testing: '1',
    piket_terlambat_adalah_terlambat: '0',
    button_enabled: '1'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const [showPanduan, setShowPanduan] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await settingsAPI.getAll()
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      showNotification('Gagal memuat pengaturan: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000)
  }

  const handleSave = async (settingKey, overrideValue = null) => {
    try {
      setSaving(true)
      const valueToSave = overrideValue !== null ? overrideValue : settings[settingKey]
      await settingsAPI.update(settingKey, valueToSave)
      showNotification('Pengaturan berhasil disimpan!', 'success')
    } catch (error) {
      showNotification('Gagal menyimpan pengaturan: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h1>
      </div>

      {/* Visibilitas Tombol Hadir Manual */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${settings.button_enabled == '1' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <ExternalLink className={`w-6 h-6 ${settings.button_enabled == '1' ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Tombol Hadir Manual</h3>
            <p className="text-sm text-gray-600 mb-4">
              Atur apakah tombol "HADIR" manual ditampilkan di halaman guru. Jika dinonaktifkan, guru wajib menggunakan QR Code.
            </p>
            
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => {
                  const newValue = settings.button_enabled == '1' ? '0' : '1'
                  handleChange('button_enabled', newValue)
                  handleSave('button_enabled', newValue)
                }}
                disabled={saving}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.button_enabled == '1' ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.button_enabled == '1' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className={`font-bold ${settings.button_enabled == '1' ? 'text-blue-600' : 'text-gray-600'}`}>
                  {settings.button_enabled == '1' ? 'TOMBOL DITAMPILKAN' : 'TOMBOL DISEMBUNYIKAN'}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.button_enabled == '1' 
                    ? 'Guru masih bisa klik tombol Hadir manual' 
                    : 'Guru wajib scan QR Code untuk presensi (Tombol Hadir hilang)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jam Masuk Normal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Jam Masuk Normal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Batas waktu masuk normal. Guru yang presensi setelah jam ini akan dianggap terlambat.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="time"
                value={settings.jam_masuk_normal}
                onChange={(e) => handleChange('jam_masuk_normal', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSave('jam_masuk_normal')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Contoh: 07:20 berarti guru yang presensi jam 07:21 atau lebih akan dianggap terlambat
            </p>
          </div>
        </div>
      </div>

      {/* Mode Testing GPS */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${settings.mode_testing == '1' ? 'bg-orange-100' : 'bg-red-100'}`}>
            <TestTube className={`w-6 h-6 ${settings.mode_testing == '1' ? 'text-orange-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mode Testing GPS</h3>
            <p className="text-sm text-gray-600 mb-4">
              Aktifkan mode testing untuk menonaktifkan validasi GPS saat presensi hadir. Berguna untuk testing sistem.
            </p>
            
            {/* Toggle Switch */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => {
                  const newValue = settings.mode_testing == '1' ? '0' : '1'
                  handleChange('mode_testing', newValue)
                  handleSave('mode_testing', newValue)
                }}
                disabled={saving}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.mode_testing == '1' ? 'bg-orange-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.mode_testing == '1' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className={`font-bold ${settings.mode_testing == '1' ? 'text-orange-600' : 'text-red-600'}`}>
                  {settings.mode_testing == '1' ? 'AKTIF (Testing Mode)' : 'NONAKTIF (Produksi)'}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.mode_testing == '1' 
                    ? 'Validasi GPS dinonaktifkan - Guru bisa presensi dari mana saja' 
                    : 'Validasi GPS aktif - Guru harus di dalam radius sekolah'}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            {settings.mode_testing == '1' ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-semibold mb-1">⚠️ Mode Testing Aktif</p>
                <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                  <li>Guru bisa presensi hadir dari lokasi mana saja</li>
                  <li>Validasi radius GPS dinonaktifkan</li>
                  <li>Cocok untuk testing sistem atau demo</li>
                  <li>Nonaktifkan saat sudah siap produksi</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-semibold mb-1">✅ Mode Produksi Aktif</p>
                <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                  <li>Validasi GPS aktif untuk presensi hadir</li>
                  <li>Guru harus berada dalam radius {settings.radius_gps}m dari sekolah</li>
                  <li>Presensi izin dan sakit tetap tidak perlu GPS</li>
                  <li>Sistem berjalan sesuai aturan sebenarnya</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terlambat Piket Dianggap Terlambat */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${settings.piket_terlambat_adalah_terlambat == '1' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <Clock className={`w-6 h-6 ${settings.piket_terlambat_adalah_terlambat == '1' ? 'text-red-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Terlambat Piket = Hadir Terlambat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Atur apakah guru yang terlambat hadir piket akan dianggap sebagai "Hadir Terlambat" atau hanya mendapat warning saja.
            </p>
            
            {/* Toggle Switch */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => {
                  const newValue = settings.piket_terlambat_adalah_terlambat == '1' ? '0' : '1'
                  handleChange('piket_terlambat_adalah_terlambat', newValue)
                  handleSave('piket_terlambat_adalah_terlambat', newValue)
                }}
                disabled={saving}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.piket_terlambat_adalah_terlambat == '1' ? 'bg-red-500' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.piket_terlambat_adalah_terlambat == '1' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className={`font-bold ${settings.piket_terlambat_adalah_terlambat == '1' ? 'text-red-600' : 'text-gray-600'}`}>
                  {settings.piket_terlambat_adalah_terlambat == '1' ? 'AKTIF - Ubah Status' : 'NONAKTIF - Warning Saja'}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.piket_terlambat_adalah_terlambat == '1' 
                    ? 'Terlambat piket akan mengubah status menjadi "Hadir Terlambat"' 
                    : 'Terlambat piket hanya memberi warning tanpa mengubah status'}
                </p>
              </div>
            </div>

            {/* Info Box */}
            {settings.piket_terlambat_adalah_terlambat == '1' ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-1">🔴 Mode Ketat Aktif</p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Guru yang terlambat hadir piket akan tercatat sebagai "Hadir Terlambat"</li>
                  <li>Status akan muncul di statistik dan laporan</li>
                  <li>Tetap ada warning piket di pesan presensi</li>
                  <li>Cocok untuk sekolah dengan aturan piket yang ketat</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-800 font-semibold mb-1">ℹ️ Mode Warning Saja</p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                  <li>Guru yang terlambat piket tetap tercatat sebagai "Hadir" (jika tidak terlambat masuk normal)</li>
                  <li>Hanya muncul warning piket di pesan presensi</li>
                  <li>Status "Hadir Terlambat" hanya untuk terlambat masuk normal</li>
                  <li>Cocok untuk sekolah yang lebih fleksibel dengan jadwal piket</li>
                </ul>
              </div>
            )}

            {/* Contoh Kasus */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold mb-2">📝 Contoh Kasus:</p>
              <div className="text-xs text-blue-700 space-y-2">
                <div>
                  <p className="font-semibold">Guru A:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Piket jam 07:00, presensi jam 07:30</li>
                    <li>Jam masuk normal: 07:20</li>
                    <li>Terlambat piket: 30 menit</li>
                    <li>Terlambat masuk: 10 menit (masih dalam toleransi)</li>
                  </ul>
                  <p className="mt-1 font-semibold">
                    {settings.piket_terlambat_adalah_terlambat === '1' 
                      ? '→ Status: Hadir Terlambat (karena terlambat piket)' 
                      : '→ Status: Hadir (hanya warning piket)'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Guru B:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Piket jam 07:00, presensi jam 07:40</li>
                    <li>Jam masuk normal: 07:20</li>
                    <li>Terlambat piket: 40 menit</li>
                    <li>Terlambat masuk: 20 menit (melebihi toleransi 15 menit)</li>
                  </ul>
                  <p className="mt-1 font-semibold">
                    → Status: Hadir Terlambat (terlambat masuk normal)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toleransi Terlambat */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Timer className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Toleransi Keterlambatan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Toleransi waktu terlambat dalam menit. Jika terlambat melebihi toleransi, akan ditandai khusus.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={settings.toleransi_terlambat}
                  onChange={(e) => handleChange('toleransi_terlambat', e.target.value)}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">menit</span>
              </div>
              <button
                onClick={() => handleSave('toleransi_terlambat')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Contoh: 15 menit berarti terlambat 1-15 menit = "Terlambat", lebih dari 15 menit = "Terlambat Parah"
            </p>
          </div>
        </div>
      </div>

      {/* Radius GPS */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Radius Validasi GPS</h3>
            <p className="text-sm text-gray-600 mb-4">
              Jarak maksimal dari lokasi sekolah untuk bisa melakukan presensi (dalam meter).
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={settings.radius_gps}
                  onChange={(e) => handleChange('radius_gps', e.target.value)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">meter</span>
              </div>
              <button
                onClick={() => handleSave('radius_gps')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Contoh: 500 meter berarti guru harus berada dalam radius 500m dari sekolah
            </p>
          </div>
        </div>
      </div>

      {/* Lokasi Sekolah */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <School className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-800">Lokasi Sekolah</h3>
              <button
                onClick={() => setShowPanduan(!showPanduan)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                {showPanduan ? 'Sembunyikan' : 'Lihat'} Panduan
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Koordinat GPS lokasi sekolah. Digunakan untuk validasi presensi guru.
            </p>

            {/* Panduan */}
            {showPanduan && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">📍 Cara Mendapatkan Koordinat GPS:</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Buka <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Maps</a></li>
                  <li>Cari lokasi sekolah Anda</li>
                  <li>Klik kanan pada titik lokasi sekolah</li>
                  <li>Klik angka koordinat yang muncul (contoh: -5.1477, 119.4327)</li>
                  <li>Koordinat akan otomatis tercopy</li>
                  <li>Paste di kolom Latitude dan Longitude di bawah</li>
                </ol>
                <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Format Koordinat:</p>
                  <p className="text-xs text-blue-700">
                    <strong>Latitude:</strong> -90 sampai 90 (contoh: -5.1477)<br/>
                    <strong>Longitude:</strong> -180 sampai 180 (contoh: 119.4327)
                  </p>
                </div>
              </div>
            )}

            {/* Nama Sekolah */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Sekolah
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={settings.sekolah_nama}
                  onChange={(e) => handleChange('sekolah_nama', e.target.value)}
                  placeholder="Nama Sekolah"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSave('sekolah_nama')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </div>

            {/* Latitude */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (Garis Lintang)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.000001"
                  value={settings.sekolah_latitude}
                  onChange={(e) => handleChange('sekolah_latitude', e.target.value)}
                  placeholder="-5.1477"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSave('sekolah_latitude')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contoh: -5.1477 (angka negatif untuk belahan bumi selatan)
              </p>
            </div>

            {/* Longitude */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (Garis Bujur)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.000001"
                  value={settings.sekolah_longitude}
                  onChange={(e) => handleChange('sekolah_longitude', e.target.value)}
                  placeholder="119.4327"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSave('sekolah_longitude')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contoh: 119.4327 (angka positif untuk belahan bumi timur)
              </p>
            </div>

            {/* Link Google Maps */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Lokasi saat ini:</strong>
              </p>
              <a
                href={`https://www.google.com/maps?q=${settings.sekolah_latitude},${settings.sekolah_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Map className="w-4 h-4" />
                Lihat di Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-800 mb-2">ℹ️ Informasi Penting</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Perubahan pengaturan akan langsung berlaku untuk presensi berikutnya</li>
          <li>Presensi yang sudah tercatat tidak akan berubah</li>
          <li>Pastikan pengaturan sesuai dengan kebijakan sekolah</li>
          <li>Radius GPS terlalu kecil dapat menyebabkan guru kesulitan presensi</li>
          <li>Koordinat GPS harus akurat agar validasi presensi berjalan dengan baik</li>
          <li>Gunakan Google Maps untuk mendapatkan koordinat yang tepat</li>
        </ul>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default Pengaturan
