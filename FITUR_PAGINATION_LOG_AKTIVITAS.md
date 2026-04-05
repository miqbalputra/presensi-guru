# Fitur: Pagination & Filter Log Aktivitas

## Masalah
Log aktivitas terlalu banyak, membuat halaman lambat dan sulit dinavigasi.

## Solusi - FASE 1
Implementasi **Pagination** dan **Filter Tanggal** untuk mengelola log yang banyak.

## Fitur Baru

### 1. **Filter Periode**
Dropdown untuk memilih periode log yang ditampilkan:
- **Hari Ini** - Hanya log hari ini
- **7 Hari Terakhir** - Log 1 minggu terakhir (Default)
- **30 Hari Terakhir** - Log 1 bulan terakhir
- **Semua Log** - Tampilkan semua log tanpa filter

**Default:** 7 Hari Terakhir (paling sering dibutuhkan)

### 2. **Pagination**
- Tampilkan **50 log per halaman**
- Tombol **Previous** dan **Next** untuk navigasi
- Info halaman: "Halaman 1 dari 5"
- Info jumlah: "Menampilkan 1 - 50 dari 250 log"

### 3. **Counter Total Log**
Menampilkan jumlah total log sesuai filter yang dipilih:
- "Total: 45 log" (untuk Hari Ini)
- "Total: 250 log" (untuk 7 Hari)
- "Total: 1,234 log" (untuk Semua)

### 4. **Auto Refresh**
- Tetap berjalan setiap 30 detik
- Filter dan halaman tetap dipertahankan saat refresh

## Cara Kerja

### Filter Tanggal:
1. Admin pilih periode dari dropdown
2. Sistem filter log berdasarkan tanggal
3. Pagination reset ke halaman 1
4. Tampilkan hasil filter

### Pagination:
1. Sistem ambil semua log yang sudah difilter
2. Bagi menjadi halaman (50 log per halaman)
3. Tampilkan halaman yang aktif
4. User bisa navigasi dengan tombol Previous/Next

### Contoh Skenario:
- **Total log di database:** 1,500 log
- **Filter "7 Hari":** 250 log
- **Pagination:** 250 ÷ 50 = 5 halaman
- **Halaman 1:** Log 1-50
- **Halaman 2:** Log 51-100
- **Halaman 3:** Log 101-150
- dst.

## UI/UX

### Filter Section (Atas):
```
┌─────────────────────────────────────────────────┐
│ Tampilkan: [7 Hari Terakhir ▼]  Total: 250 log │
└─────────────────────────────────────────────────┘
```

### Table Section (Tengah):
```
┌──────────────────────────────────────────────────┐
│ Waktu          │ User    │ Aktivitas │ Status   │
├──────────────────────────────────────────────────┤
│ 15-12-25 07:15 │ Budi    │ Presensi  │ Hadir    │
│ 15-12-25 07:20 │ Siti    │ Presensi  │ Hadir    │
│ ...            │ ...     │ ...       │ ...      │
│ (50 rows)                                        │
└──────────────────────────────────────────────────┘
```

### Pagination Section (Bawah):
```
┌─────────────────────────────────────────────────┐
│ Menampilkan 1 - 50 dari 250 log                │
│                                                 │
│ [◄ Previous]  Halaman 1 dari 5  [Next ►]      │
└─────────────────────────────────────────────────┘
```

## Performa

### Sebelum (Tanpa Pagination):
- Load 1,500 log sekaligus
- Browser render 1,500 rows
- Halaman lambat, scroll panjang
- Memory usage tinggi

### Sesudah (Dengan Pagination):
- Load semua log dari API (1x request)
- Filter di frontend (cepat)
- Render hanya 50 rows per halaman
- Halaman cepat, smooth scrolling
- Memory usage rendah

## Testing

### Test 1: Filter Hari Ini
1. Login sebagai admin → Log Aktivitas
2. Pilih filter **"Hari Ini"**
3. ✅ Hanya muncul log hari ini (15 Desember 2025)
4. ✅ Counter: "Total: X log"

### Test 2: Filter 7 Hari
1. Pilih filter **"7 Hari Terakhir"** (default)
2. ✅ Muncul log dari 9-15 Desember 2025
3. ✅ Counter: "Total: Y log"

### Test 3: Filter 30 Hari
1. Pilih filter **"30 Hari Terakhir"**
2. ✅ Muncul log dari 16 November - 15 Desember 2025
3. ✅ Counter: "Total: Z log"

### Test 4: Filter Semua
1. Pilih filter **"Semua Log"**
2. ✅ Muncul semua log tanpa batasan tanggal
3. ✅ Counter: "Total: 1,500 log" (contoh)

### Test 5: Pagination
1. Pilih filter "Semua Log" (misal ada 250 log)
2. ✅ Halaman 1 menampilkan log 1-50
3. Klik **Next**
4. ✅ Halaman 2 menampilkan log 51-100
5. Klik **Next** lagi
6. ✅ Halaman 3 menampilkan log 101-150
7. Klik **Previous**
8. ✅ Kembali ke halaman 2

### Test 6: Tombol Disabled
1. Di halaman 1
2. ✅ Tombol "Previous" disabled (abu-abu, tidak bisa diklik)
3. Klik Next sampai halaman terakhir
4. ✅ Tombol "Next" disabled

### Test 7: Auto Refresh
1. Buka Log Aktivitas, pilih filter "Hari Ini"
2. Di tab lain, login sebagai guru dan isi presensi
3. ✅ Dalam 30 detik, log baru muncul
4. ✅ Filter tetap "Hari Ini"
5. ✅ Halaman tetap di halaman yang aktif

### Test 8: Ganti Filter Reset Halaman
1. Buka halaman 3 dari filter "Semua Log"
2. Ganti filter ke "Hari Ini"
3. ✅ Otomatis reset ke halaman 1
4. ✅ Pagination menyesuaikan jumlah log baru

## Kode Perubahan

### State Management:
```javascript
const [allLogs, setAllLogs] = useState([])        // Semua log dari API
const [filteredLogs, setFilteredLogs] = useState([]) // Log setelah filter
const [currentPage, setCurrentPage] = useState(1)    // Halaman aktif
const [filterPeriod, setFilterPeriod] = useState('7') // Default 7 hari
const logsPerPage = 50                               // 50 log per halaman
```

### Filter Logic:
```javascript
const filterLogsByPeriod = () => {
  if (filterPeriod === 'all') {
    setFilteredLogs(allLogs)
    return
  }

  const days = parseInt(filterPeriod)
  const cutoffDate = new Date(now - (days * 24 * 60 * 60 * 1000))
  
  const filtered = allLogs.filter(log => logDate >= cutoffDate)
  setFilteredLogs(filtered)
}
```

### Pagination Logic:
```javascript
const indexOfLastLog = currentPage * logsPerPage
const indexOfFirstLog = indexOfLastLog - logsPerPage
const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
```

## File yang Diubah
- `src/components/admin/LogAktivitas.jsx` - Tambah pagination & filter

## Benefit
✅ Performa lebih cepat (render 50 rows vs 1,500 rows)
✅ User experience lebih baik (mudah navigasi)
✅ Fokus ke data yang relevan (filter tanggal)
✅ Scalable (bisa handle ribuan log)
✅ Memory efficient (tidak overload browser)

## Next Steps (FASE 2 - Opsional)
- Auto-delete log > 90 hari (cron job)
- Export log ke Excel
- Search berdasarkan nama guru
- Filter berdasarkan status (Hadir/Izin/Sakit)

## Status
✅ **SELESAI** - Siap di-upload ke cPanel
