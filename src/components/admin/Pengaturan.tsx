import { useState, useEffect } from 'react'
import { Save, Clock, MapPin, Timer, Map, School, ExternalLink, TestTube, CalendarCheck, Trash2 } from 'lucide-react'
import { PageHeader, Notice } from '../ui/page'
import { settingsAPI, pengaturanHarianAPI } from '../../services/api'

function Pengaturan() {
  const [section, setSection] = useState('Presensi')
  const [loadError, setLoadError] = useState('')
  const [settings, setSettings] = useState({
    jam_masuk_normal: '07:20',
    toleransi_terlambat: '15',
    radius_gps: '500',
    sekolah_latitude: '-5.1477',
    sekolah_longitude: '119.4327',
    sekolah_nama: 'Sekolah',
    mode_testing: '1',
    piket_terlambat_adalah_terlambat: '0',
    button_enabled: '1',
    jam_min_pulang: '12:30',
    weekend_workday_enabled: '0',
    saturday_male_workday_enabled: '0',
    saturday_female_workday_enabled: '0',
    sunday_male_workday_enabled: '0',
    sunday_female_workday_enabled: '0',
    apel_senin_enabled: '1',
    location_tracking_enabled: '0',
    location_tracking_interval_minutes: '15',
    location_tracking_accuracy_limit: '100'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const [showPanduan, setShowPanduan] = useState(false)

  // Override jam pulang per-tanggal (pengaturan harian khusus)
  const todayStr = new Date().toISOString().slice(0, 10)
  const [harianForm, setHarianForm] = useState({
    tanggal: todayStr,
    jam_pulang_khusus: '',
    jam_pulang_khusus_aktif: false,
    jam_pulang_piket_khusus: '',
    jam_pulang_piket_khusus_aktif: false,
    keterangan: '',
  })
  const [harianList, setHarianList] = useState([])
  const [savingHarian, setSavingHarian] = useState(false)

  useEffect(() => {
    loadSettings()
    loadHarian()
  }, [])

  const loadHarian = async () => {
    try {
      const response = await pengaturanHarianAPI.getAll()
      setHarianList(response.data || [])
    } catch (error) {
      console.error('Failed to load pengaturan harian:', error)
    }
  }

  const handleHarianChange = (key, value) => {
    setHarianForm(prev => ({ ...prev, [key]: value }))
  }

  const handleHarianToggle = (key) => {
    setHarianForm(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleHarianSave = async () => {
    if (!harianForm.tanggal) {
      showNotification('Tanggal wajib diisi', 'error')
      return
    }
    if (harianForm.jam_pulang_khusus_aktif && !harianForm.jam_pulang_khusus) {
      showNotification('Jam pulang semua guru harus diisi saat diaktifkan', 'error')
      return
    }
    if (harianForm.jam_pulang_piket_khusus_aktif && !harianForm.jam_pulang_piket_khusus) {
      showNotification('Jam pulang khusus piket harus diisi saat diaktifkan', 'error')
      return
    }
    try {
      setSavingHarian(true)
      await pengaturanHarianAPI.upsert({
        tanggal: harianForm.tanggal,
        jam_pulang_khusus: harianForm.jam_pulang_khusus || '',
        jam_pulang_khusus_aktif: harianForm.jam_pulang_khusus_aktif ? 1 : 0,
        jam_pulang_piket_khusus: harianForm.jam_pulang_piket_khusus || '',
        jam_pulang_piket_khusus_aktif: harianForm.jam_pulang_piket_khusus_aktif ? 1 : 0,
        keterangan: harianForm.keterangan || '',
      })
      showNotification('Pengaturan harian berhasil disimpan!', 'success')
      await loadHarian()
    } catch (error) {
      showNotification('Gagal menyimpan pengaturan harian: ' + error.message, 'error')
    } finally {
      setSavingHarian(false)
    }
  }

  const handleHarianDelete = async (tanggal) => {
    if (!window.confirm(`Hapus pengaturan harian untuk tanggal ${tanggal}?`)) return
    try {
      await pengaturanHarianAPI.delete(tanggal)
      showNotification('Pengaturan harian dihapus', 'success')
      await loadHarian()
    } catch (error) {
      showNotification('Gagal menghapus: ' + error.message, 'error')
    }
  }

  const handleHarianEdit = (row) => {
    setHarianForm({
      tanggal: row.tanggal,
      jam_pulang_khusus: row.jam_pulang_khusus || '',
      jam_pulang_khusus_aktif: !!row.jam_pulang_khusus_aktif,
      jam_pulang_piket_khusus: row.jam_pulang_piket_khusus || '',
      jam_pulang_piket_khusus_aktif: !!row.jam_pulang_piket_khusus_aktif,
      keterangan: row.keterangan || '',
    })
    setSection('Jadwal')
    window.setTimeout(() => document.getElementById('daily-settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      setLoadError('')
      const response = await settingsAPI.getAll()
      setSettings(response.data)
    } catch (error) {
      setLoadError(error.message || 'Pengaturan belum dapat dimuat.')
      console.error('Failed to load settings:', error)
      showNotification('Gagal memuat pengaturan: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    // Feedback remains available until dismissed.
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

  const toggleSetting = (key) => {
    const newValue = settings[key] == '1' ? '0' : '1'
    handleChange(key, newValue)
    handleSave(key, newValue)
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
<PageHeader title="Pengaturan" description="Kelola aturan presensi dan operasional sekolah." />
      <div className="section-tabs" aria-label="Bagian pengaturan">{['Presensi', 'Jadwal', 'Lokasi', 'Lanjutan'].map((item) => <button type="button" key={item} aria-pressed={section === item} onClick={() => setSection(item)}>{item}</button>)}</div>
      {loadError && <Notice onRetry={loadSettings}>{loadError}</Notice>}
      {notification.show && <Notice tone={notification.type} onDismiss={() => setNotification({ show: false, message: '', type: '' })}>{notification.message}</Notice>}
<section hidden={section !== 'Jadwal' || !!loadError}>
      {/* Presensi Akhir Pekan */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            settings.saturday_male_workday_enabled == '1' ||
            settings.saturday_female_workday_enabled == '1' ||
            settings.sunday_male_workday_enabled == '1' ||
            settings.sunday_female_workday_enabled == '1'
              ? 'bg-emerald-100'
              : 'bg-gray-100'
          }`}>
            <CalendarCheck className={`w-6 h-6 ${
              settings.saturday_male_workday_enabled == '1' ||
              settings.saturday_female_workday_enabled == '1' ||
              settings.sunday_male_workday_enabled == '1' ||
              settings.sunday_female_workday_enabled == '1'
                ? 'text-emerald-600'
                : 'text-gray-600'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Presensi Akhir Pekan</h3>
            <p className="text-sm text-gray-600 mb-4">
              Aktifkan sesuai jadwal kegiatan sekolah. Hari dan kelompok yang aktif akan bisa presensi dan ikut dihitung dalam rekap.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'saturday_male_workday_enabled', day: 'Sabtu', group: 'Ustadz / Guru Laki-laki' },
                { key: 'saturday_female_workday_enabled', day: 'Sabtu', group: 'Ustadzah / Guru Perempuan' },
                { key: 'sunday_male_workday_enabled', day: 'Minggu', group: 'Ustadz / Guru Laki-laki' },
                { key: 'sunday_female_workday_enabled', day: 'Minggu', group: 'Ustadzah / Guru Perempuan' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-bold text-gray-800">{item.day}</p>
                    <p className="text-xs text-gray-500">{item.group}</p>
                    <p className={`text-xs font-semibold mt-1 ${settings[item.key] == '1' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {settings[item.key] == '1' ? 'Dihitung hari masuk' : 'Libur'}
                    </p>
                  </div>
                  <button type="button" role="switch" aria-label={item.day + ' · ' + item.group} aria-checked={settings[item.key] == '1'}
                    onClick={() => toggleSetting(item.key)}
                    disabled={saving}
                    className={`relative inline-flex h-8 w-16 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      settings[item.key] == '1' ? 'bg-emerald-600' : 'bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings[item.key] == '1' ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

</section>
<section hidden={section !== 'Presensi' || !!loadError}>
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
              <button type="button" role="switch" aria-label="Presensi dengan tombol" aria-checked={settings.button_enabled == '1'}
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

</section>
<section hidden={section !== 'Presensi' || !!loadError}>
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

</section>
<section hidden={section !== 'Presensi' || !!loadError}>
      {/* Jam Minimal Presensi Pulang */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Clock className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Jam Minimal Presensi Pulang</h3>
            <p className="text-sm text-gray-600 mb-4">
              Batas jam paling awal guru bisa menekan tombol <strong>PRESENSI PULANG</strong> (tanpa scan QR).
              Sebelum jam ini, tombol pulang tidak bisa digunakan. Berlaku juga untuk presensi pulang via QR Scan.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="time"
                value={settings.jam_min_pulang}
                onChange={(e) => handleChange('jam_min_pulang', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSave('jam_min_pulang')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Contoh: 12:30 berarti tombol PRESENSI PULANG baru aktif pukul 12:30 WIB. Ubah sesuai kebijakan sekolah.
            </p>
          </div>
        </div>
      </div>

</section>
<section hidden={section !== 'Jadwal' || !!loadError} id="daily-settings">
      {/* Pengaturan Pulang Harian Khusus (per-tanggal) */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <CalendarCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Pengaturan Pulang Harian Khusus</h3>
            <p className="text-sm text-gray-600 mb-4">
              Override jam minimal presensi pulang <strong>hanya untuk tanggal tertentu</strong>
              (mis. hari sekolah pulang lebih awal). Kedua field punya toggle on/off masing-masing.
              Saat <strong>OFF</strong> atau jam dikosongkan, kembali ke pengaturan global / jadwal piket.
            </p>

            <div className="space-y-4">
              {/* Tanggal */}
              <div>
                <label htmlFor="pengaturan-field-60" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tanggal</label>
                <input id="pengaturan-field-60" aria-label="Tanggal"
                  type="date"
                  value={harianForm.tanggal}
                  onChange={(e) => handleHarianChange('tanggal', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Semua guru */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Jam Pulang — Semua Guru</span>
                    <p className="text-xs text-gray-500">Menimpa "Jam Minimal Presensi Pulang" di atas untuk tanggal ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHarianToggle('jam_pulang_khusus_aktif')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${harianForm.jam_pulang_khusus_aktif ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${harianForm.jam_pulang_khusus_aktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <input
                  type="time"
                  value={harianForm.jam_pulang_khusus}
                  onChange={(e) => handleHarianChange('jam_pulang_khusus', e.target.value)}
                  disabled={!harianForm.jam_pulang_khusus_aktif}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {/* Khusus piket */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Jam Pulang — Khusus Guru Piket</span>
                    <p className="text-xs text-gray-500">Menimpa jam pulang piket (jadwal piket) untuk tanggal ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHarianToggle('jam_pulang_piket_khusus_aktif')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${harianForm.jam_pulang_piket_khusus_aktif ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${harianForm.jam_pulang_piket_khusus_aktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <input
                  type="time"
                  value={harianForm.jam_pulang_piket_khusus}
                  onChange={(e) => handleHarianChange('jam_pulang_piket_khusus', e.target.value)}
                  disabled={!harianForm.jam_pulang_piket_khusus_aktif}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label htmlFor="pengaturan-field-61" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Keterangan (opsional)</label>
                <input id="pengaturan-field-61" aria-label="Keterangan (opsional)"
                  type="text"
                  value={harianForm.keterangan}
                  onChange={(e) => handleHarianChange('keterangan', e.target.value)}
                  placeholder="Mis. Pulang awal karena acara sekolah"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleHarianSave}
                disabled={savingHarian}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Simpan Pengaturan Harian
              </button>
            </div>

            {/* Daftar override tersimpan */}
            {harianList.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Override Tersimpan</h4>
                <div className="space-y-2">
                  {harianList.map((row) => (
                    <div key={row.tanggal} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">{row.tanggal}</div>
                        <div className="text-xs text-gray-600">
                          Semua guru: <span className={row.jam_pulang_khusus_aktif ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                            {row.jam_pulang_khusus_aktif ? (row.jam_pulang_khusus || '—') : 'OFF'}
                          </span>
                          {' • '}
                          Piket: <span className={row.jam_pulang_piket_khusus_aktif ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                            {row.jam_pulang_piket_khusus_aktif ? (row.jam_pulang_piket_khusus || '—') : 'OFF'}
                          </span>
                        </div>
                        {row.keterangan && <div className="text-xs text-gray-500 italic">{row.keterangan}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHarianEdit(row)}
                          className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleHarianDelete(row.tanggal)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Kasus jarang. Setelah tanggal berlalu, hapus baris agar tidak menumpuk. Field yang OFF / kosong diabaikan.
            </p>
          </div>
        </div>
      </div>

</section>
<section hidden={section !== 'Lokasi' || !!loadError}>
      {/* Tracking Lokasi Guru */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${settings.location_tracking_enabled == '1' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <MapPin className={`w-6 h-6 ${settings.location_tracking_enabled == '1' ? 'text-emerald-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Tracking Lokasi Guru</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tracking berjalan setelah guru presensi hadir dan berhenti otomatis setelah presensi pulang. Browser guru harus tetap membuka aplikasi.
            </p>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <button type="button" role="switch" aria-label="Pemantauan lokasi" aria-checked={settings.location_tracking_enabled == '1'}
                onClick={() => {
                  const newValue = settings.location_tracking_enabled == '1' ? '0' : '1'
                  handleChange('location_tracking_enabled', newValue)
                  handleSave('location_tracking_enabled', newValue)
                }}
                disabled={saving}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  settings.location_tracking_enabled == '1' ? 'bg-emerald-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.location_tracking_enabled == '1' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className={`font-bold ${settings.location_tracking_enabled == '1' ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {settings.location_tracking_enabled == '1' ? 'TRACKING AKTIF' : 'TRACKING NONAKTIF'}
                </p>
                <p className="text-xs text-gray-500">
                  Interval {settings.location_tracking_interval_minutes || 15} menit, batas akurasi {settings.location_tracking_accuracy_limit || 100}m
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pengaturan-field-62" className="block text-sm font-medium text-gray-700 mb-2">Interval Tracking (menit)</label>
                <div className="flex gap-2">
                  <input id="pengaturan-field-62" aria-label="Interval Tracking (menit)"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.location_tracking_interval_minutes || '15'}
                    onChange={(e) => handleChange('location_tracking_interval_minutes', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSave('location_tracking_interval_minutes')}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Disarankan 10-15 menit. Batas aplikasi: 5 sampai 60 menit.</p>
              </div>

              <div>
                <label htmlFor="pengaturan-field-63" className="block text-sm font-medium text-gray-700 mb-2">Batas Akurasi GPS Maksimum (meter)</label>
                <div className="flex gap-2">
                  <input id="pengaturan-field-63" aria-label="Batas Akurasi GPS Maksimum (meter)"
                    type="number"
                    min="20"
                    max="1000"
                    value={settings.location_tracking_accuracy_limit || '100'}
                    onChange={(e) => handleChange('location_tracking_accuracy_limit', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSave('location_tracking_accuracy_limit')}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tracking ditolak jika akurasi GPS lebih buruk dari angka ini.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

</section>
<section hidden={section !== 'Jadwal' || !!loadError}>
      {/* Toggle Apel Senin */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${settings.apel_senin_enabled == '1' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
            <Save className={`w-6 h-6 ${settings.apel_senin_enabled == '1' ? 'text-indigo-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Status Apel Senin</h3>
            <p className="text-sm text-gray-600 mb-4">
              Aktifkan ini jika hari Senin besok ada Apel Pagi. Jika dinonaktifkan (misal saat UAS), batas masuk semua guru akan kembali ke jam normal.
            </p>

            <div className="flex items-center gap-4 mb-2">
              <button type="button" role="switch" aria-label="Presensi apel Senin" aria-checked={settings.apel_senin_enabled == '1'}
                onClick={() => {
                  const newValue = settings.apel_senin_enabled == '1' ? '0' : '1'
                  handleChange('apel_senin_enabled', newValue)
                  handleSave('apel_senin_enabled', newValue)
                }}
                disabled={saving}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  settings.apel_senin_enabled == '1' ? 'bg-indigo-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.apel_senin_enabled == '1' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <p className={`font-bold ${settings.apel_senin_enabled == '1' ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {settings.apel_senin_enabled == '1' ? 'APEL SENIN AKTIF' : 'APEL SENIN DITIADAKAN'}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.apel_senin_enabled == '1'
                    ? 'Batas masuk: Piket 06:40, Non-Piket 07:00'
                    : 'Batas masuk: Piket 07:00, Non-Piket 07:20'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

</section>
<section hidden={section !== 'Lanjutan' || !!loadError}>
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
              <button type="button" role="switch" aria-label="Mode testing" aria-checked={settings.mode_testing == '1'}
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

</section>
<section hidden={section !== 'Presensi' || !!loadError}>
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

</section>
<section hidden={section !== 'Presensi' || !!loadError}>
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

</section>
<section hidden={section !== 'Lokasi' || !!loadError}>
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

</section>
<section hidden={section !== 'Lokasi' || !!loadError}>
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
              <label htmlFor="pengaturan-field-64" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Sekolah
              </label>
              <div className="flex items-center gap-4">
                <input id="pengaturan-field-64" aria-label="Nama Sekolah"
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
              <label htmlFor="pengaturan-field-65" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude (Garis Lintang)
              </label>
              <div className="flex items-center gap-4">
                <input id="pengaturan-field-65" aria-label="Latitude (Garis Lintang)"
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
              <label htmlFor="pengaturan-field-66" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude (Garis Bujur)
              </label>
              <div className="flex items-center gap-4">
                <input id="pengaturan-field-66" aria-label="Longitude (Garis Bujur)"
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

</section>
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


    </div>
  )
}

export default Pengaturan
