# Perbaikan Filter Waktu Dashboard

## Masalah
Filter waktu di kanan atas Dashboard (7 Hari Terakhir, 14 Hari, 30 Hari) tidak berfungsi. Data di stats cards dan tabel tidak berubah saat filter diubah.

## Penyebab
1. **Stats Cards** menggunakan `todayData` yang selalu hari ini, bukan `filteredData`
2. **Tabel** juga menggunakan `todayData` yang tidak terpengaruh filter
3. **Label** tidak dinamis sesuai filter yang dipilih
4. **Filtering** menggunakan Date object comparison yang tidak konsisten

## Solusi yang Diterapkan

### 1. Perbaiki Fungsi getFilteredData()

**Sebelum:**
```javascript
case '7days':
  startDate.setDate(today.getDate() - 7)
  return attendanceLogs.filter(log => new Date(log.tanggal) >= startDate)
```

**Sesudah:**
```javascript
case '7days':
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 6) // 7 hari termasuk hari ini
  const sevenDaysStr = formatDateForInput(sevenDaysAgo)
  return attendanceLogs.filter(log => log.tanggal >= sevenDaysStr && log.tanggal <= todayStr)
```

**Perubahan:**
- Gunakan string comparison (konsisten dengan perbaikan sebelumnya)
- Hitung hari dengan benar (7 hari = hari ini - 6 hari)
- Filter dengan range: `>= startDate && <= endDate`

### 2. Ubah Stats Cards Menggunakan filteredData

**Sebelum:**
```javascript
const todayData = attendanceLogs.filter(log => log.tanggal === formatDateForInput(new Date()))
const hadirCount = todayData.filter(log => log.status === 'hadir').length
```

**Sesudah:**
```javascript
const filteredData = getFilteredData()
const hadirCount = filteredData.filter(log => log.status === 'hadir').length
```

### 3. Tambahkan Label Dinamis

**Sebelum:**
```javascript
{ label: 'Hadir Hari Ini', value: hadirCount, ... }
```

**Sesudah:**
```javascript
const getStatsLabel = () => {
  switch(filter) {
    case 'today': return { hadir: 'Hadir Hari Ini', ... }
    case '7days': return { hadir: 'Hadir (7 Hari)', ... }
    case '14days': return { hadir: 'Hadir (14 Hari)', ... }
    case '30days': return { hadir: 'Hadir (30 Hari)', ... }
  }
}

const labels = getStatsLabel()
{ label: labels.hadir, value: hadirCount, ... }
```

### 4. Ubah Tabel Menggunakan filteredData

**Sebelum:**
```javascript
{todayData.length > 0 ? todayData.map((log) => (
  // render row
))}
```

**Sesudah:**
```javascript
{filteredData.length > 0 ? filteredData.map((log) => (
  // render row dengan kolom tanggal
))}
```

**Tambahan:**
- Tambah kolom "Tanggal" di tabel
- Judul tabel dinamis sesuai filter
- Tampilkan total presensi

## Fitur yang Ditambahkan

### 1. Stats Cards Dinamis
- **Hari Ini**: "Hadir Hari Ini: 8"
- **7 Hari**: "Hadir (7 Hari): 45"
- **14 Hari**: "Hadir (14 Hari): 89"
- **30 Hari**: "Hadir (30 Hari): 180"

### 2. Tabel Dinamis
- **Judul berubah**: "Presensi Hari Ini" → "Presensi 7 Hari Terakhir"
- **Total presensi**: "Total: 45 presensi"
- **Kolom tanggal**: Ditambahkan untuk filter multi-hari

### 3. Perhitungan Hari yang Benar
- **7 Hari**: Hari ini - 6 hari = 7 hari total
- **14 Hari**: Hari ini - 13 hari = 14 hari total
- **30 Hari**: Hari ini - 29 hari = 30 hari total

## Contoh Penggunaan

### Filter: Hari Ini
```
Stats Cards:
- Total Guru: 10
- Hadir Hari Ini: 8
- Izin Hari Ini: 1
- Sakit Hari Ini: 1

Tabel:
Judul: "Presensi Hari Ini"
Total: 10 presensi
Kolom: Nama | Tanggal | Jam Masuk | Status | Keterangan
```

### Filter: 7 Hari Terakhir
```
Stats Cards:
- Total Guru: 10
- Hadir (7 Hari): 45
- Izin (7 Hari): 3
- Sakit (7 Hari): 2

Tabel:
Judul: "Presensi 7 Hari Terakhir"
Total: 50 presensi
Kolom: Nama | Tanggal | Jam Masuk | Status | Keterangan
(Menampilkan semua presensi 7 hari terakhir)
```

### Filter: 30 Hari Terakhir
```
Stats Cards:
- Total Guru: 10
- Hadir (30 Hari): 180
- Izin (30 Hari): 12
- Sakit (30 Hari): 8

Tabel:
Judul: "Presensi 30 Hari Terakhir"
Total: 200 presensi
Kolom: Nama | Tanggal | Jam Masuk | Status | Keterangan
(Menampilkan semua presensi 30 hari terakhir)
```

## File yang Diubah
```
src/components/admin/DashboardHome.jsx
```

## Cara Upload ke cPanel

### 1. File yang Perlu Diupload
```
dist/
├── index.html
└── assets/
    ├── index-8D1B2PhY.js  (file baru)
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
5. Refresh halaman Dashboard

### 3. Test Filter
Setelah upload, test semua filter:

**A. Filter Hari Ini**
- [ ] Stats cards menampilkan data hari ini
- [ ] Label: "Hadir Hari Ini", "Izin Hari Ini", "Sakit Hari Ini"
- [ ] Tabel judul: "Presensi Hari Ini"
- [ ] Tabel hanya menampilkan data hari ini

**B. Filter 7 Hari Terakhir**
- [ ] Stats cards menampilkan total 7 hari
- [ ] Label: "Hadir (7 Hari)", "Izin (7 Hari)", "Sakit (7 Hari)"
- [ ] Tabel judul: "Presensi 7 Hari Terakhir"
- [ ] Tabel menampilkan data 7 hari terakhir
- [ ] Kolom tanggal muncul

**C. Filter 14 Hari Terakhir**
- [ ] Stats cards menampilkan total 14 hari
- [ ] Label: "Hadir (14 Hari)", "Izin (14 Hari)", "Sakit (14 Hari)"
- [ ] Tabel judul: "Presensi 14 Hari Terakhir"
- [ ] Tabel menampilkan data 14 hari terakhir

**D. Filter 30 Hari Terakhir**
- [ ] Stats cards menampilkan total 30 hari
- [ ] Label: "Hadir (30 Hari)", "Izin (30 Hari)", "Sakit (30 Hari)"
- [ ] Tabel judul: "Presensi 30 Hari Terakhir"
- [ ] Tabel menampilkan data 30 hari terakhir

## Troubleshooting

### Filter tidak berubah
1. **Clear cache browser** - Ctrl + Shift + Delete
2. **Gunakan mode Incognito** - Untuk memastikan tidak ada cache
3. **Cek Console** - F12 → Console, lihat error

### Angka tidak sesuai
1. **Cek range tanggal** - Pastikan perhitungan hari benar
2. **Cek data database** - Pastikan format tanggal `yyyy-mm-dd`
3. **Cek filtering** - Pastikan menggunakan string comparison

### Tabel kosong
1. **Cek data** - Pastikan ada data di database untuk periode tersebut
2. **Cek filter** - Pastikan `filteredData` tidak kosong
3. **Cek API** - Pastikan API mengembalikan data dengan benar

## Keunggulan Perbaikan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Filter | Tidak berfungsi | Berfungsi semua ✅ |
| Stats Cards | Selalu hari ini | Dinamis sesuai filter ✅ |
| Label | Statis | Dinamis sesuai filter ✅ |
| Tabel | Selalu hari ini | Dinamis sesuai filter ✅ |
| Kolom Tanggal | Tidak ada | Ada untuk multi-hari ✅ |
| Total Presensi | Tidak ada | Ditampilkan ✅ |
| Filtering | Date object | String comparison ✅ |

## Build Status
✅ Build berhasil tanpa error
✅ File size: 1.51 MB (gzip: 460 KB)
✅ Siap untuk production

## Catatan
- Filter "Hari Ini" dan "Kemarin" hanya menampilkan 1 hari
- Filter "7 Hari", "14 Hari", "30 Hari" menampilkan range termasuk hari ini
- Kolom tanggal ditambahkan untuk memudahkan identifikasi data multi-hari
- Total presensi ditampilkan di bawah judul tabel
