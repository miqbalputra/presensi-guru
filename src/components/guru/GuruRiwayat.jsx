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
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Riwayat Presensi</h2>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPreset(7)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            7 Hari
          </button>
          <button
            onClick={() => setPreset(30)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            30 Hari
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 dark:bg-rose-600 text-white rounded-xl hover:bg-rose-600 dark:hover:bg-rose-500 font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={downloadExcel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Jam Masuk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Jam Pulang</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? filteredLogs.slice().reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{log.tanggal}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{log.jamMasuk}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{log.jamPulang || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${log.status === 'hadir' ? 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300' : ''}
                      ${log.status === 'hadir_terlambat' ? 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300' : ''}
                      ${log.status === 'hadir_izin_terlambat' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300' : ''}
                      ${log.status === 'izin' ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300' : ''}
                      ${log.status === 'sakit' ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300' : ''}
                    `}>
                      {log.status === 'hadir_izin_terlambat' ? 'HADIR - IZIN TERLAMBAT' : log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{log.keterangan || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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
