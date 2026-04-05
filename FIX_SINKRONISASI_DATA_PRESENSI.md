# Perbaikan Sinkronisasi Data Presensi

## Masalah
Data presensi guru di **Dashboard** dan **Preview Laporan Semua Guru** tidak sinkron dan menampilkan jumlah yang berbeda.

## Penyebab
Perbedaan metode filtering tanggal:

### Dashboard (Benar)
```javascript
// Menggunakan string comparison
const todayData = attendanceLogs.filter(log => 
  log.tanggal === formatDateForInput(new Date())
)
```

### Preview Laporan (Salah)
```javascript
// Menggunakan Date object comparison
const start = new Date(startDate)
const end = new Date(endDate)
const guruLogs = attendanceLogs.filter(log => {
  const logDate = new Date(log.tanggal)
  return logDate >= start && logDate <= end
})
```

**Masalah Date Object:**
- Timezone bisa berbeda
- Waktu (jam, menit, detik) ikut dibandingkan
- Bisa menyebabkan data tidak ter-filter dengan benar

## Solusi yang Diterapkan

### 1. Ubah Semua Filtering Menjadi String Comparison

**Sebelum:**
```javascript
const start = new Date(startDate)
const end = new Date(endDate)
const logDate = new Date(log.tanggal)
return logDate >= start && logDate <= end
```

**Sesudah:**
```javascript
// String comparison (yyyy-mm-dd format)
return log.tanggal >= startDate && log.tanggal <= endDate
```

### 2. File yang Diperbaiki

#### A. getFilteredLogs() - Line ~60
```javascript
const getFilteredLogs = () => {
  if (!selectedGuru) return []
  const guru = dataGuru.find(g => g.id === parseInt(selectedGuru))
  if (!guru) return []
  
  // String comparison
  return attendanceLogs.filter(log => {
    if (log.userId !== guru.id) return false
    return log.tanggal >= startDate && log.tanggal <= endDate
  })
}
```

#### B. Preview Table - Line ~500
```javascript
const guruLogs = attendanceLogs.filter(log => {
  if (log.userId !== guru.id) return false
  // String comparison
  return log.tanggal >= startDate && log.tanggal <= endDate
})
```

#### C. downloadSemuaGuruPDF() - Line ~200
```javascript
// Summary statistics
const totalPresensi = attendanceLogs.filter(log => {
  return log.tanggal >= startDate && log.tanggal <= endDate
}).length

// Table data
const guruLogs = attendanceLogs.filter(log => {
  if (log.userId !== guru.id) return false
  return log.tanggal >= startDate && log.tanggal <= endDate
})
```

#### D. downloadSemuaGuruExcel() - Line ~280
```javascript
// Summary sheet
const guruLogs = attendanceLogs.filter(log => {
  if (log.userId !== guru.id) return false
  return log.tanggal >= startDate && log.tanggal <= endDate
})

// Detail sheet
const guruLogs = attendanceLogs.filter(log => {
  if (log.userId !== guru.id) return false
  return log.tanggal >= startDate && log.tanggal <= endDate
})
```

## Keuntungan String Comparison

### 1. Konsistensi
- Semua komponen menggunakan metode yang sama
- Dashboard dan Laporan menampilkan data yang sama

### 2. Akurasi
- Tidak terpengaruh timezone
- Tidak terpengaruh waktu (jam, menit, detik)
- Perbandingan murni berdasarkan tanggal

### 3. Performa
- Lebih cepat (tidak perlu create Date object)
- Lebih efisien untuk filtering

### 4. Reliability
- Format tanggal di database: `yyyy-mm-dd`
- Format tanggal di input: `yyyy-mm-dd`
- Langsung comparable tanpa konversi

## Contoh Perbandingan

### Skenario: Filter tanggal 2025-12-14

**Data di database:**
```
log.tanggal = "2025-12-14"
```

**Metode Lama (Date Object):**
```javascript
const start = new Date("2025-12-14") // 2025-12-14 00:00:00
const logDate = new Date("2025-12-14") // 2025-12-14 00:00:00
logDate >= start // true (tapi bisa false jika ada timezone issue)
```

**Metode Baru (String):**
```javascript
"2025-12-14" >= "2025-12-14" // true (selalu konsisten)
```

## File yang Diubah
```
src/components/admin/DownloadLaporan.jsx
```

## Cara Upload ke cPanel

### 1. File yang Perlu Diupload
```
dist/
├── index.html
└── assets/
    ├── index-BiMWTLXd.js  (file baru)
    ├── index-Cl01WIhv.css
    └── ... (file lainnya)
```

### 2. Langkah Upload
1. Login cPanel: https://kelolasekolah.web.id/cpanel
2. Buka File Manager → public_html
3. Upload file dari folder `dist/`:
   - `index.html` (overwrite)
   - Folder `assets/` (overwrite)
4. Clear cache browser (Ctrl + Shift + Delete)
5. Refresh halaman

### 3. Verifikasi Sinkronisasi
Setelah upload, lakukan test:

**A. Cek Dashboard**
1. Login sebagai admin
2. Buka Dashboard
3. Lihat "Presensi Hari Ini"
4. Catat jumlah: Hadir, Izin, Sakit

**B. Cek Preview Laporan**
1. Buka menu "Download Laporan"
2. Tab "Semua Guru"
3. Set tanggal: Hari ini s/d Hari ini
4. Lihat "Preview Data Semua Guru"
5. Jumlahkan kolom Hadir, Izin, Sakit

**C. Bandingkan**
- ✅ Jumlah Hadir harus sama
- ✅ Jumlah Izin harus sama
- ✅ Jumlah Sakit harus sama
- ✅ Total presensi harus sama

## Troubleshooting

### Data masih tidak sinkron
1. **Clear cache browser** - Ctrl + Shift + Delete
2. **Gunakan mode Incognito** - Untuk memastikan tidak ada cache
3. **Cek format tanggal di database** - Harus `yyyy-mm-dd`
4. **Cek Console** - F12 → Console, lihat error

### Jumlah masih berbeda
1. **Cek filter tanggal** - Pastikan range tanggal sama
2. **Cek data duplicate** - Mungkin ada data duplicate di database
3. **Cek userId** - Pastikan userId di presensi match dengan id di guru

### Preview tidak muncul
1. **Pilih tanggal** - Pastikan startDate dan endDate sudah diisi
2. **Cek data guru** - Pastikan ada data guru di database
3. **Cek API** - Pastikan API mengembalikan data dengan benar

## Testing Checklist

### Test 1: Hari Ini
- [ ] Dashboard menampilkan X guru hadir
- [ ] Preview Laporan (hari ini - hari ini) menampilkan X guru hadir
- [ ] Jumlah sama ✅

### Test 2: Range 7 Hari
- [ ] Dashboard filter "7 Hari Terakhir" menampilkan Y total presensi
- [ ] Preview Laporan (7 hari lalu - hari ini) menampilkan Y total presensi
- [ ] Jumlah sama ✅

### Test 3: Download PDF
- [ ] Download PDF Semua Guru
- [ ] Buka PDF, cek jumlah per guru
- [ ] Bandingkan dengan Preview
- [ ] Jumlah sama ✅

### Test 4: Download Excel
- [ ] Download Excel Semua Guru
- [ ] Buka Excel, cek sheet Ringkasan
- [ ] Bandingkan dengan Preview
- [ ] Jumlah sama ✅

## Keunggulan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Metode | Date object comparison | String comparison ✅ |
| Konsistensi | Berbeda antar komponen | Sama semua komponen ✅ |
| Akurasi | Bisa berbeda karena timezone | Selalu akurat ✅ |
| Performa | Lebih lambat (create Date) | Lebih cepat ✅ |
| Reliability | Bisa error timezone | Selalu reliable ✅ |

## Build Status
✅ Build berhasil tanpa error
✅ File size: 1.51 MB (gzip: 460 KB)
✅ Siap untuk production

## Catatan Penting
- Format tanggal di database harus `yyyy-mm-dd`
- Format tanggal di input HTML type="date" adalah `yyyy-mm-dd`
- String comparison bekerja karena format yang konsisten
- Jangan gunakan Date object untuk filtering tanggal
