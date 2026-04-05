import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { formatDate, formatDateForInput } from '../../utils/dateUtils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { presensiAPI } from '../../services/api'

function GuruRiwayat({ user }) {
  const [logs, setLogs] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set default date range (30 hari terakhir)
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    setStartDate(formatDateForInput(thirtyDaysAgo))
    setEndDate(formatDateForInput(today))
    
    loadRiwayat()
  }, [user.id])

  const loadRiwayat = async () => {
    try {
      setLoading(true)
      const response = await presensiAPI.getAll({ user_id: user.id })
      setLogs(response.data)
      setFilteredLogs(response.data)
    } catch (error) {
      console.error('Failed to load riwayat:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      const filtered = logs.filter(log => {
        const logDate = new Date(log.tanggal) // Tanggal sudah format yyyy-mm-dd dari database
        return logDate >= start && logDate <= end
      })
      setFilteredLogs(filtered)
    }
  }, [startDate, endDate, logs])

  const setPreset = (days) => {
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - days)
    setStartDate(formatDateForInput(pastDate))
    setEndDate(formatDateForInput(today))
  }

  const downloadPDF = () => {
    try {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('Laporan Riwayat Presensi', 14, 15)
      doc.setFontSize(10)
      doc.text(`Nama: ${user?.nama || 'Guru'}`, 14, 25)
      doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 30)

      const tableData = filteredLogs.map(log => [
        log.tanggal,
        log.jamMasuk || '-',
        log.jamPulang || '-',
        log.status === 'hadir_izin_terlambat' ? 'IZIN TERLAMBAT' : (log.status || '-').toUpperCase(),
        log.keterangan || '-'
      ])

      doc.autoTable({
        startY: 35,
        head: [['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
      })

      const safeNama = (user?.nama || 'Guru').replace(/\s+/g, '_')
      const fileName = `Riwayat_Presensi_${safeNama}_${formatDate(new Date())}.pdf`

      // Gunakan Blob + anchor untuk kompatibilitas mobile
      const pdfBlob = doc.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error('Download PDF error:', err)
      alert('Gagal download PDF: ' + err.message)
    }
  }

  const downloadExcel = () => {
    try {
      const exportData = filteredLogs.map(log => ({
        'Tanggal': log.tanggal,
        'Jam Masuk': log.jamMasuk || '-',
        'Jam Pulang': log.jamPulang || '-',
        'Status': log.status === 'hadir_izin_terlambat' ? 'IZIN TERLAMBAT' : (log.status || '-').toUpperCase(),
        'Keterangan': log.keterangan || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Presensi')

      const safeNama = (user?.nama || 'Guru').replace(/\s+/g, '_')
      const fileName = `Riwayat_Presensi_${safeNama}_${formatDate(new Date())}.xlsx`

      // Gunakan Blob + anchor untuk kompatibilitas mobile
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error('Download Excel error:', err)
      alert('Gagal download Excel: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Riwayat Presensi</h2>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPreset(7)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            7 Hari
          </button>
          <button
            onClick={() => setPreset(30)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            30 Hari
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={downloadExcel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Pulang</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length > 0 ? filteredLogs.slice().reverse().map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{log.tanggal}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.jamMasuk}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.jamPulang || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 text-green-800' : ''}
                      ${log.status === 'hadir_terlambat' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.status === 'izin' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {log.status === 'hadir_izin_terlambat' ? 'HADIR - IZIN TERLAMBAT' : log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.keterangan || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data pada periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GuruRiwayat
