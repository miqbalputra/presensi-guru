import { useState, useEffect } from 'react'
import { Save, MapPin, Map, ExternalLink, Users, Calendar, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import { settingsAPI } from '../../services/api'

function LokasiGeofence() {
  const [settings, setSettings] = useState({
    sekolah_latitude: '',
    sekolah_longitude: '',
    lokasi_laki_latitude: '',
    lokasi_laki_longitude: '',
    lokasi_perempuan_latitude: '',
    lokasi_perempuan_longitude: '',
    lokasi_apel_latitude: '',
    lokasi_apel_longitude: '',
    apel_senin_enabled: '1',
    radius_gps: '100'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })

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

  const handleSave = async (settingKey) => {
    try {
      setSaving(true)
      await settingsAPI.update(settingKey, settings[settingKey])
      showNotification('Lokasi berhasil disimpan!', 'success')
    } catch (error) {
      showNotification('Gagal menyimpan: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleApel = async () => {
    const newValue = settings.apel_senin_enabled === '1' ? '0' : '1'
    handleChange('apel_senin_enabled', newValue)
    try {
      setSaving(true)
      await settingsAPI.update('apel_senin_enabled', newValue)
      showNotification('Validasi Senin diperbarui!', 'success')
    } catch (error) {
      showNotification('Gagal memperbarui', 'error')
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Lokasi & Geofence</h1>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">Radius Aktif: <strong>{settings.radius_gps}m</strong></span>
        </div>
      </div>

      {/* Grid Lokasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LOKASI APEL SENIN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold text-lg">Lokasi Apel Pagi (Senin)</h3>
            </div>
            <button onClick={toggleApel} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {settings.apel_senin_enabled === '1' ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
              <span className="text-xs font-bold">{settings.apel_senin_enabled === '1' ? 'AKTIF' : 'OFF'}</span>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Titik kumpul seluruh guru di hari Senin pagi untuk apel bersama.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_apel_latitude} onChange={(e) => handleChange('lokasi_apel_latitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_apel_longitude} onChange={(e) => handleChange('lokasi_apel_longitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { handleSave('lokasi_apel_latitude'); handleSave('lokasi_apel_longitude'); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Simpan Titik Apel
                </button>
                <a href={`https://www.google.com/maps?q=${settings.lokasi_apel_latitude},${settings.lokasi_apel_longitude}`} target="_blank" className="p-2 border rounded-lg hover:bg-gray-50"><Map className="w-5 h-5 text-gray-600" /></a>
            </div>
          </div>
        </div>

        {/* LOKASI GURU LAKI-LAKI */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-blue-900 text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-lg">Pos Guru Laki-laki</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Titik lokasi presensi khusus guru laki-laki di hari kerja normal.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_laki_latitude} onChange={(e) => handleChange('lokasi_laki_latitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_laki_longitude} onChange={(e) => handleChange('lokasi_laki_longitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { handleSave('lokasi_laki_latitude'); handleSave('lokasi_laki_longitude'); }} className="flex-1 bg-blue-900 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Simpan Pos Putra
                </button>
                <a href={`https://www.google.com/maps?q=${settings.lokasi_laki_latitude},${settings.lokasi_laki_longitude}`} target="_blank" className="p-2 border rounded-lg hover:bg-gray-50"><Map className="w-5 h-5 text-gray-600" /></a>
            </div>
          </div>
        </div>

        {/* LOKASI GURU PEREMPUAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-pink-600 text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-lg">Pos Guru Perempuan</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Titik lokasi presensi khusus guru perempuan di hari kerja normal.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_perempuan_latitude} onChange={(e) => handleChange('lokasi_perempuan_latitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input type="number" step="0.000001" value={settings.lokasi_perempuan_longitude} onChange={(e) => handleChange('lokasi_perempuan_longitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { handleSave('lokasi_perempuan_latitude'); handleSave('lokasi_perempuan_longitude'); }} className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-pink-700">
                    <Save className="w-4 h-4" /> Simpan Pos Putri
                </button>
                <a href={`https://www.google.com/maps?q=${settings.lokasi_perempuan_latitude},${settings.lokasi_perempuan_longitude}`} target="_blank" className="p-2 border rounded-lg hover:bg-gray-50"><Map className="w-5 h-5 text-gray-600" /></a>
            </div>
          </div>
        </div>

        {/* LOKASI SEKOLAH (DEFAULT) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-800 text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">Lokasi Sekolah (Pusat)</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Titik koordinat utama sekolah yang digunakan sebagai fallback.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input type="number" step="0.000001" value={settings.sekolah_latitude} onChange={(e) => handleChange('sekolah_latitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input type="number" step="0.000001" value={settings.sekolah_longitude} onChange={(e) => handleChange('sekolah_longitude', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { handleSave('sekolah_latitude'); handleSave('sekolah_longitude'); }} className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-900">
                    <Save className="w-4 h-4" /> Simpan Pusat
                </button>
                <a href={`https://www.google.com/maps?q=${settings.sekolah_latitude},${settings.sekolah_longitude}`} target="_blank" className="p-2 border rounded-lg hover:bg-gray-50"><Map className="w-5 h-5 text-gray-600" /></a>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h4 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
            <Info className="w-5 h-5" /> Panduan Penggunaan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="space-y-2">
                <p><strong>1. Koordinat:</strong> Ambil koordinat dari Google Maps. Klik kanan di lokasi Maps dan pilih angka koordinatnya.</p>
                <p><strong>2. Validasi Hari Senin:</strong> Jika tombol AKTIF, maka di hari Senin sistem HANYA mengizinkan presensi di Lokasi Apel Pagi (untuk Laki-laki & Perempuan).</p>
            </div>
            <div className="space-y-2">
                <p><strong>3. Validasi Gender:</strong> Di hari selain Senin, sistem otomatis memverifikasi lokasi sesuai gender guru di database.</p>
                <p><strong>4. Radius:</strong> Pastikan guru berada dalam jarak radius yang ditentukan (saat ini {settings.radius_gps}m) agar presensi berhasil.</p>
            </div>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-50 animate-fade-in ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-bold`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default LokasiGeofence
