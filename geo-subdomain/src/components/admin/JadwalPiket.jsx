import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar, Clock, User } from 'lucide-react'
import { jadwalPiketAPI, guruAPI } from '../../services/api'

function JadwalPiket() {
  const [jadwalPiket, setJadwalPiket] = useState([])
  const [dataGuru, setDataGuru] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingJadwal, setEditingJadwal] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const [filterHari, setFilterHari] = useState('all')

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

  const [formData, setFormData] = useState({
    user_id: '',
    nama_guru: '',
    hari: 'Senin',
    jam_piket: '07:00',
    keterangan: '',
    is_active: 1
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [jadwalResponse, guruResponse] = await Promise.all([
        jadwalPiketAPI.getAll(),
        guruAPI.getAll()
      ])
      setJadwalPiket(jadwalResponse.data)
      setDataGuru(guruResponse.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      showNotification('Gagal memuat data: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000)
  }

  const handleAdd = () => {
    setEditingJadwal(null)
    setFormData({
      user_id: '',
      nama_guru: '',
      hari: 'Senin',
      jam_piket: '07:00',
      keterangan: '',
      is_active: 1
    })
    setShowModal(true)
  }

  const handleEdit = (jadwal) => {
    setEditingJadwal(jadwal)
    setFormData({
      user_id: jadwal.user_id,
      nama_guru: jadwal.nama_guru,
      hari: jadwal.hari,
      jam_piket: jadwal.jam_piket.substring(0, 5), // HH:MM
      keterangan: jadwal.keterangan || '',
      is_active: jadwal.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal piket ini?')) {
      try {
        await jadwalPiketAPI.delete(id)
        showNotification('Jadwal piket berhasil dihapus!')
        loadData()
      } catch (error) {
        showNotification('Gagal menghapus jadwal piket: ' + error.message, 'error')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.user_id || !formData.nama_guru) {
      showNotification('Pilih guru terlebih dahulu', 'error')
      return
    }

    try {
      if (editingJadwal) {
        await jadwalPiketAPI.update({ ...formData, id: editingJadwal.id })
        showNotification('Jadwal piket berhasil diupdate!')
      } else {
        await jadwalPiketAPI.create(formData)
        showNotification('Jadwal piket berhasil ditambahkan!')
      }
      setShowModal(false)
      loadData()
    } catch (error) {
      showNotification('Gagal menyimpan jadwal piket: ' + error.message, 'error')
    }
  }

  const handleGuruChange = (e) => {
    const guruId = parseInt(e.target.value)
    const guru = dataGuru.find(g => g.id === guruId)
    if (guru) {
      setFormData({
        ...formData,
        user_id: guru.id,
        nama_guru: guru.nama
      })
    }
  }

  const getFilteredJadwal = () => {
    if (filterHari === 'all') return jadwalPiket
    return jadwalPiket.filter(j => j.hari === filterHari)
  }

  const filteredJadwal = getFilteredJadwal()

  // Group by hari
  const jadwalByHari = hariList.reduce((acc, hari) => {
    acc[hari] = filteredJadwal.filter(j => j.hari === hari)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Piket Guru</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola jadwal piket guru per hari</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterHari}
            onChange={(e) => setFilterHari(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Hari</option>
            {hariList.map(hari => (
              <option key={hari} value={hari}>{hari}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Jadwal per Hari */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hariList.map(hari => {
          const jadwalHari = jadwalByHari[hari]
          if (filterHari !== 'all' && filterHari !== hari) return null
          
          return (
            <div key={hari} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-800">{hari}</h3>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {jadwalHari.length} Guru
                  </span>
                </div>
              </div>
              <div className="p-4">
                {jadwalHari.length > 0 ? (
                  <div className="space-y-2">
                    {jadwalHari.map(jadwal => (
                      <div 
                        key={jadwal.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <p className="font-semibold text-gray-800">{jadwal.nama_guru}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-600">
                              Maksimal: {jadwal.jam_piket.substring(0, 5)} WIB
                            </p>
                          </div>
                          {jadwal.keterangan && (
                            <p className="text-xs text-gray-500 mt-1">{jadwal.keterangan}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(jadwal)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(jadwal.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Belum ada jadwal piket</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingJadwal ? 'Edit Jadwal Piket' : 'Tambah Jadwal Piket'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Guru
                </label>
                <select
                  value={formData.user_id}
                  onChange={handleGuruChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Guru --</option>
                  {dataGuru.map(guru => (
                    <option key={guru.id} value={guru.id}>{guru.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari
                </label>
                <select
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {hariList.map(hari => (
                    <option key={hari} value={hari}>{hari}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Piket Maksimal
                </label>
                <input
                  type="time"
                  value={formData.jam_piket}
                  onChange={(e) => setFormData({ ...formData, jam_piket: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Guru harus hadir sebelum jam ini
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan (Opsional)
                </label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Piket pagi, Piket siang"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default JadwalPiket
