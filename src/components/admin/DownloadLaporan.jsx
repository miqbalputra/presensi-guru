import { useState, useEffect } from 'react'
import { Download, FileText, Users, User } from 'lucide-react'
import { formatDate, formatDateForInput } from '../../utils/dateUtils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { guruAPI, presensiAPI } from '../../services/api'

function DownloadLaporan() {
  const [activeTab, setActiveTab] = useState('semua') // 'semua' or 'individu'
  const [dataGuru, setDataGuru] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [selectedGuru, setSelectedGuru] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notification, setNotification] = useState({ show: false, message: '' })
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
      showNotification('Gagal memuat data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dataGuru.length > 0) {
      // Set default date range (30 hari terakhir)
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      setStartDate(formatDateForInput(thirtyDaysAgo))
      setEndDate(formatDateForInput(today))
    }
  }, [dataGuru])

  const showNotification = (message) => {
    setNotification({ show: true, message })
    setTimeout(() => setNotification({ show: false, message: '' }), 3000)
  }

  const getFilteredLogs = () => {
    if (!selectedGuru) return []

    const guru = dataGuru.find(g => g.id === parseInt(selectedGuru))
    if (!guru) return []

    // Gunakan string comparison untuk konsistensi dengan Dashboard
    return attendanceLogs.filter(log => {
      if (log.userId !== guru.id) return false
      return log.tanggal >= startDate && log.tanggal <= endDate
    })
  }

  const downloadPDF = () => {
    if (!selectedGuru) {
      alert('Pilih guru terlebih dahulu!')
      return
    }

    const guru = dataGuru.find(g => g.id === parseInt(selectedGuru))
    const logs = getFilteredLogs()

    if (logs.length === 0) {
      alert('Tidak ada data presensi untuk periode ini!')
      return
    }

    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Laporan Presensi Guru', 14, 15)
    doc.setFontSize(10)
    doc.text(`Nama: ${guru.nama}`, 14, 25)
    doc.text(`Jabatan: ${Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}`, 14, 30)
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 35)
    
    const tableData = logs.map(log => [
      log.tanggal,
      log.jamMasuk,
      log.jamPulang || '-',
      log.status.toUpperCase(),
      log.keterangan || '-'
    ])

    // Hitung statistik
    const hadir = logs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length
    const izin = logs.filter(l => l.status === 'izin').length
    const sakit = logs.filter(l => l.status === 'sakit').length

    doc.autoTable({
      startY: 40,
      head: [['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan']],
      body: tableData,
    })

    // Tambahkan statistik
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total Hari: ${logs.length}`, 14, finalY)
    doc.text(`Hadir: ${hadir} hari`, 14, finalY + 5)
    doc.text(`Izin: ${izin} hari`, 14, finalY + 10)
    doc.text(`Sakit: ${sakit} hari`, 14, finalY + 15)

    const safeNama = guru.nama.replace(/\s+/g, '_')
    const fileName = `Laporan_${safeNama}_${formatDate(new Date())}.pdf`
    doc.save(fileName)
    showNotification('Laporan PDF berhasil didownload!')
  }

  const downloadExcel = () => {
    if (!selectedGuru) {
      alert('Pilih guru terlebih dahulu!')
      return
    }

    const guru = dataGuru.find(g => g.id === parseInt(selectedGuru))
    const logs = getFilteredLogs()

    if (logs.length === 0) {
      alert('Tidak ada data presensi untuk periode ini!')
      return
    }

    const exportData = logs.map(log => ({
      'Tanggal': log.tanggal,
      'Jam Masuk': log.jamMasuk,
      'Jam Pulang': log.jamPulang || '-',
      'Status': log.status.toUpperCase(),
      'Keterangan': log.keterangan || '-'
    }))

    // Tambahkan statistik di bawah
    const hadir = logs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length
    const izin = logs.filter(l => l.status === 'izin').length
    const sakit = logs.filter(l => l.status === 'sakit').length

    exportData.push({})
    exportData.push({ 'Tanggal': 'STATISTIK' })
    exportData.push({ 'Tanggal': 'Total Hari', 'Jam Masuk': logs.length })
    exportData.push({ 'Tanggal': 'Hadir', 'Jam Masuk': hadir })
    exportData.push({ 'Tanggal': 'Izin', 'Jam Masuk': izin })
    exportData.push({ 'Tanggal': 'Sakit', 'Jam Masuk': sakit })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Presensi')
    const safeNama = guru.nama.replace(/\s+/g, '_')
    const fileName = `Laporan_${safeNama}_${formatDate(new Date())}.xlsx`
    XLSX.writeFile(wb, fileName)
    showNotification('Laporan Excel berhasil didownload!')
  }

  const setPreset = (days) => {
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - days)
    setStartDate(formatDateForInput(pastDate))
    setEndDate(formatDateForInput(today))
  }

  const selectedGuruData = dataGuru.find(g => g.id === parseInt(selectedGuru))
  const filteredLogs = getFilteredLogs()

  const downloadSemuaGuruPDF = () => {
    if (dataGuru.length === 0) {
      alert('Tidak ada data guru!')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('LAPORAN RINGKASAN PRESENSI', 105, 15, { align: 'center' })
    doc.text('SEMUA GURU', 105, 23, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 105, 30, { align: 'center' })
    
    // Summary statistics (gunakan string comparison)
    const totalPresensi = attendanceLogs.filter(log => {
      return log.tanggal >= startDate && log.tanggal <= endDate
    }).length

    doc.setFontSize(9)
    doc.text(`Total Guru: ${dataGuru.length}`, 14, 40)
    doc.text(`Total Presensi: ${totalPresensi}`, 14, 45)
    
    // Prepare table data (gunakan string comparison)
    const tableData = dataGuru.map((guru, index) => {
      const guruLogs = attendanceLogs.filter(log => {
        if (log.userId !== guru.id) return false
        return log.tanggal >= startDate && log.tanggal <= endDate
      })

      const hadir = guruLogs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length
      const izin = guruLogs.filter(l => l.status === 'izin').length
      const sakit = guruLogs.filter(l => l.status === 'sakit').length
      const persentase = guruLogs.length > 0 ? ((hadir / guruLogs.length) * 100).toFixed(1) : 0

      return [
        index + 1,
        guru.nama,
        Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan,
        guruLogs.length,
        hadir,
        izin,
        sakit,
        `${persentase}%`
      ]
    })

    // Create table
    doc.autoTable({
      startY: 52,
      head: [['No', 'Nama Guru', 'Jabatan', 'Total', 'Hadir', 'Izin', 'Sakit', '% Hadir']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 8 
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 50 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'center', cellWidth: 15 },
        7: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: 14, right: 14 }
    })

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, finalY)

    const fileName = `Laporan_Ringkasan_Semua_Guru_${formatDate(new Date())}.pdf`
    doc.save(fileName)
    showNotification('Laporan ringkasan semua guru berhasil didownload!')
  }

  const downloadSemuaGuruExcel = () => {
    if (dataGuru.length === 0) {
      alert('Tidak ada data guru!')
      return
    }

    const wb = XLSX.utils.book_new()

    // Summary sheet (gunakan string comparison)
    const summaryData = dataGuru.map(guru => {
      const guruLogs = attendanceLogs.filter(log => {
        if (log.userId !== guru.id) return false
        return log.tanggal >= startDate && log.tanggal <= endDate
      })

      const hadir = guruLogs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length
      const izin = guruLogs.filter(l => l.status === 'izin').length
      const sakit = guruLogs.filter(l => l.status === 'sakit').length

      return {
        'Nama': guru.nama,
        'Jabatan': Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan,
        'Total Hari': guruLogs.length,
        'Hadir': hadir,
        'Izin': izin,
        'Sakit': sakit,
        'Persentase Hadir': guruLogs.length > 0 ? `${((hadir / guruLogs.length) * 100).toFixed(1)}%` : '0%'
      }
    })

    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

    // Detail sheet for each guru (gunakan string comparison)
    dataGuru.forEach(guru => {
      const guruLogs = attendanceLogs.filter(log => {
        if (log.userId !== guru.id) return false
        return log.tanggal >= startDate && log.tanggal <= endDate
      })

      if (guruLogs.length === 0) return

      const detailData = guruLogs.map(log => ({
        'Tanggal': log.tanggal,
        'Jam Masuk': log.jamMasuk,
        'Jam Pulang': log.jamPulang || '-',
        'Status': log.status.toUpperCase(),
        'Keterangan': log.keterangan || '-'
      }))

      const wsDetail = XLSX.utils.json_to_sheet(detailData)
      // Limit sheet name to 31 characters
      const sheetName = guru.nama.substring(0, 31)
      XLSX.utils.book_append_sheet(wb, wsDetail, sheetName)
    })

    const fileName = `Laporan_Semua_Guru_${formatDate(new Date())}.xlsx`
    XLSX.writeFile(wb, fileName)
    showNotification('Laporan semua guru berhasil didownload!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Download Laporan Guru</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('semua')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'semua'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              Semua Guru
            </button>
            <button
              onClick={() => setActiveTab('individu')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'individu'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-5 h-5" />
              Guru Tertentu
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content: Semua Guru */}
      {activeTab === 'semua' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Download Laporan Semua Guru</h2>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Laporan akan berisi data presensi semua guru dalam periode yang dipilih.
              File Excel akan memiliki sheet ringkasan dan sheet detail per guru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tanggal Mulai */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tanggal Akhir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preset Buttons */}
            <div className="flex items-end gap-2">
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
              <button
                onClick={() => setPreset(90)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                90 Hari
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{dataGuru.length}</p>
              <p className="text-sm text-gray-600">Total Guru</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{startDate && endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0}</p>
              <p className="text-sm text-gray-600">Hari</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {attendanceLogs.filter(log => {
                  const logDate = new Date(log.tanggal)
                  return logDate >= new Date(startDate) && logDate <= new Date(endDate)
                }).length}
              </p>
              <p className="text-sm text-gray-600">Total Presensi</p>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={downloadSemuaGuruPDF}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={downloadSemuaGuruExcel}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </div>

          {/* Preview Data Semua Guru */}
          {dataGuru.length > 0 && startDate && endDate && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Preview Data Semua Guru</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Guru</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Hari</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Izin</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sakit</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dataGuru.map((guru, index) => {
                      // Filter logs untuk guru ini dalam range tanggal (string comparison)
                      const guruLogs = attendanceLogs.filter(log => {
                        if (log.userId !== guru.id) return false
                        // Gunakan string comparison untuk konsistensi dengan Dashboard
                        return log.tanggal >= startDate && log.tanggal <= endDate
                      })

                      const hadir = guruLogs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length
                      const izin = guruLogs.filter(l => l.status === 'izin').length
                      const sakit = guruLogs.filter(l => l.status === 'sakit').length
                      const persentase = guruLogs.length > 0 ? ((hadir / guruLogs.length) * 100).toFixed(1) : 0

                      return (
                        <tr key={guru.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{guru.nama}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{guruLogs.length}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-8 bg-green-100 text-green-800 rounded text-sm font-semibold">
                              {hadir}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-8 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">
                              {izin}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-8 bg-red-100 text-red-800 rounded text-sm font-semibold">
                              {sakit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                              persentase >= 80 ? 'bg-green-100 text-green-800' :
                              persentase >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {persentase}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {dataGuru.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data guru
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Guru Tertentu */}
      {activeTab === 'individu' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Download Laporan Guru Tertentu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pilih Guru */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Guru
              </label>
              <select
                value={selectedGuru}
                onChange={(e) => setSelectedGuru(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Guru --</option>
                {dataGuru.map(guru => (
                  <option key={guru.id} value={guru.id}>
                    {guru.nama} - {Array.isArray(guru.jabatan) ? guru.jabatan.join(', ') : guru.jabatan}
                  </option>
                ))}
              </select>
            </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-end gap-2">
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
            <button
              onClick={() => setPreset(90)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              90 Hari
            </button>
          </div>
        </div>

          {/* Download Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={downloadPDF}
              disabled={!selectedGuru}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={downloadExcel}
              disabled={!selectedGuru}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </div>

          {/* Preview Section */}
          {selectedGuruData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Preview Data</h2>
          </div>

          {/* Info Guru */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nama:</span>
                <span className="ml-2 text-gray-900">{selectedGuruData.nama}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Jabatan:</span>
                <span className="ml-2 text-gray-900">
                  {Array.isArray(selectedGuruData.jabatan) 
                    ? selectedGuruData.jabatan.join(', ') 
                    : selectedGuruData.jabatan}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Periode:</span>
                <span className="ml-2 text-gray-900">{startDate} s/d {endDate}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Data:</span>
                <span className="ml-2 text-gray-900">{filteredLogs.length} hari</span>
              </div>
            </div>
          </div>

          {/* Statistik */}
          {filteredLogs.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{filteredLogs.length}</p>
                <p className="text-sm text-gray-600">Total Hari</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(l => l.status === 'hadir' || l.status === 'hadir_terlambat' || l.status === 'hadir_izin_terlambat').length}
                </p>
                <p className="text-sm text-gray-600">Hadir</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredLogs.filter(l => l.status === 'izin').length}
                </p>
                <p className="text-sm text-gray-600">Izin</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {filteredLogs.filter(l => l.status === 'sakit').length}
                </p>
                <p className="text-sm text-gray-600">Sakit</p>
              </div>
            </div>
          )}

          {/* Tabel Preview */}
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
                      Tidak ada data presensi untuk periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default DownloadLaporan

