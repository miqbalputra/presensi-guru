import { useState, useEffect } from 'react'
import { Save, Edit2, Trash2, Plus } from 'lucide-react'
import { formatDate, formatDateForInput, formatTimeForDB } from '../../utils/dateUtils'
import { guruAPI, presensiAPI } from '../../services/api'

function EditPresensi() {
  const [dataGuru, setDataGuru] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [formData, setFormData] = useState({
    guruId: '',
    tanggal: formatDateForInput(new Date()),
    status: 'hadir',
    jamMasuk: '',
    jamPulang: '',
    keterangan: ''
  })
  const [notification, setNotification] = useState({ show: false, message: '' })
  const [editingLog, setEditingLog] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [filterDate, setFilterDate] = useState(formatDateForInput(new Date()))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [guruResponse, presensiResponse] = await Promise.all([
        guruAPI.getAll(),
        presensiAPI.getAll()
      ])
      
      setDataGuru(guruResponse.data)
      setAttendanceLogs(presensiResponse.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLogs = () => {
    // filterDate sudah format yyyy-mm-dd dari input
    return attendanceLogs.filter(log => log.tanggal === filterDate)
  }

  const showNotification = (message) => {
    setNotification({ show: true, message })
    setTimeout(() => setNotification({ show: false, message: '' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const guru = dataGuru.find(g => g.id === parseInt(formData.guruId))
    if (!guru) return

    const targetDate = formData.tanggal // Sudah format yyyy-mm-dd dari input
    const currentTime = formatTimeForDB() // Format HH:MM:SS untuk database
    
    try {
      if (editingLog) {
        // Update existing log via API
        const isHadirType = formData.status === 'hadir' || formData.status === 'hadir_izin_terlambat'
        const jamMasukValue = isHadirType ? (formData.jamMasuk || editingLog.jamMasuk) : '-'
        
        const updateData = {
          id: editingLog.id,
          status: formData.status,
          jamMasuk: jamMasukValue,
          jamPulang: isHadirType ? (formData.jamPulang || editingLog.jamPulang) : null,
          jamHadir: isHadirType ? jamMasukValue : null,
          jamIzin: formData.status === 'izin' ? currentTime : null,
          jamSakit: formData.status === 'sakit' ? currentTime : null,
          keterangan: formData.keterangan
        }
        
        // Only include coordinates if status is hadir or hadir_izin_terlambat
        if (isHadirType) {
          updateData.latitude = editingLog.latitude || 0
          updateData.longitude = editingLog.longitude || 0
        } else {
          updateData.latitude = 0
          updateData.longitude = 0
        }
        
        await presensiAPI.update(updateData)
        
        setMessage({ type: 'success', text: 'Presensi berhasil diupdate!' })
        showNotification('Data berhasil diupdate!')
      } else {
        // Check if already exists
        const existingLog = attendanceLogs.find(log => log.userId === guru.id && log.tanggal === targetDate)
        if (existingLog) {
          setMessage({ type: 'error', text: 'Guru ini sudah memiliki presensi pada tanggal tersebut. Gunakan tombol Edit untuk mengubah.' })
          return
        }

        // Add new log via API
        const isHadirType = formData.status === 'hadir' || formData.status === 'hadir_izin_terlambat'
        const jamMasukValue = isHadirType ? (formData.jamMasuk || currentTime) : '-'
        
        const createData = {
          userId: guru.id,
          nama: guru.nama,
          tanggal: targetDate,
          status: formData.status,
          jamMasuk: jamMasukValue,
          jamPulang: isHadirType && formData.jamPulang ? formData.jamPulang : null,
          jamHadir: isHadirType ? jamMasukValue : null,
          jamIzin: formData.status === 'izin' ? currentTime : null,
          jamSakit: formData.status === 'sakit' ? currentTime : null,
          keterangan: formData.keterangan
        }
        
        // Only include coordinates if status is hadir or hadir_izin_terlambat
        if (isHadirType) {
          createData.latitude = -6.2088
          createData.longitude = 106.8456
        } else {
          createData.latitude = 0
          createData.longitude = 0
        }
        
        await presensiAPI.create(createData)
        
        setMessage({ type: 'success', text: 'Presensi berhasil ditambahkan!' })
        showNotification('Data berhasil disimpan!')
      }

      // Reload data from API
      await loadData()
      
      resetForm()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to save presensi:', error)
      setMessage({ type: 'error', text: 'Gagal menyimpan data: ' + error.message })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const resetForm = () => {
    setFormData({
      guruId: '',
      tanggal: formatDateForInput(new Date()),
      status: 'hadir',
      jamMasuk: '',
      jamPulang: '',
      keterangan: ''
    })
    setEditingLog(null)
  }

  const handleEdit = (log) => {
    setEditingLog(log)
    setFormData({
      guruId: log.userId.toString(),
      tanggal: log.tanggal, // Already in yyyy-mm-dd format from database
      status: log.status,
      jamMasuk: log.jamMasuk !== '-' ? log.jamMasuk.substring(0, 5) : '', // Extract HH:MM from HH:MM:SS
      jamPulang: log.jamPulang ? log.jamPulang.substring(0, 5) : '', // Extract HH:MM from HH:MM:SS
      keterangan: log.keterangan || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (log) => {
    if (!confirm(`Hapus presensi ${log.nama} pada ${log.tanggal}?`)) return

    try {
      await presensiAPI.delete(log.id)
      
      // Reload data from API
      await loadData()
      
      setMessage({ type: 'success', text: 'Presensi berhasil dihapus!' })
      showNotification('Data berhasil dihapus!')
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to delete presensi:', error)
      setMessage({ type: 'error', text: 'Gagal menghapus data: ' + error.message })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Edit Presensi</h1>

      {/* Form Input/Edit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingLog ? 'Edit Presensi' : 'Tambah Presensi Baru'}
          </h2>
          {editingLog && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Guru
              </label>
              <select
                value={formData.guruId}
                onChange={(e) => setFormData({ ...formData, guruId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={editingLog}
              >
                <option value="">-- Pilih Guru --</option>
                {dataGuru.map(guru => (
                  <option key={guru.id} value={guru.id}>{guru.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={editingLog}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="hadir">Hadir</option>
                <option value="hadir_izin_terlambat">Hadir - Izin Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>

            {(formData.status === 'hadir' || formData.status === 'hadir_izin_terlambat') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Masuk (Opsional)
                  </label>
                  <input
                    type="time"
                    value={formData.jamMasuk}
                    onChange={(e) => setFormData({ ...formData, jamMasuk: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Otomatis jika kosong"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Pulang (Opsional)
                  </label>
                  <input
                    type="time"
                    value={formData.jamPulang}
                    onChange={(e) => setFormData({ ...formData, jamPulang: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Kosongkan jika belum pulang"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Opsional"
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            {editingLog ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingLog ? 'Update Presensi' : 'Tambah Presensi'}
          </button>
        </form>
      </div>

      {/* Daftar Presensi */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Daftar Presensi</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter Tanggal:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredLogs().length > 0 ? getFilteredLogs().map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.tanggal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.jamMasuk}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.jamPulang || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.status === 'izin' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {log.status === 'hadir_izin_terlambat' ? 'Hadir - Izin Terlambat' : log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.keterangan || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(log)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log)}
                        className="text-red-600 hover:text-red-800"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data presensi pada tanggal ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default EditPresensi
