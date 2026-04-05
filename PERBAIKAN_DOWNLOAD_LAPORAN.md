# Perbaikan Download Laporan

## Masalah
- Tab "Semua Guru" menampilkan "Total Guru: 0"
- Alert "Tidak ada data guru!" muncul saat download
- Padahal ada 5 guru di sistem

## Penyebab
1. **DownloadLaporan.jsx** tidak mengimport `dataGuru` dari `dummyData.js`
2. **DataGuru.jsx** tidak menyimpan data initial ke localStorage saat pertama kali load
3. Jika localStorage kosong, DownloadLaporan mendapat array kosong `[]`

## Solusi

### 1. DownloadLaporan.jsx
**Sebelum:**
```javascript
import { initialAttendanceLogs } from '../../data/dummyData'
// ...
const savedGuru = localStorage.getItem('dataGuru')
setDataGuru(savedGuru ? JSON.parse(savedGuru) : [])
```

**Sesudah:**
```javascript
import { initialAttendanceLogs, dataGuru as initialDataGuru } from '../../data/dummyData'
// ...
const savedGuru = localStorage.getItem('dataGuru')
setDataGuru(savedGuru ? JSON.parse(savedGuru) : initialDataGuru)
```

### 2. DataGuru.jsx
**Sebelum:**
```javascript
useEffect(() => {
  const saved = localStorage.getItem('dataGuru')
  const data = saved ? JSON.parse(saved) : initialDataGuru
  setDataGuru(data)
  setFilteredGuru(data)
}, [])
```

**Sesudah:**
```javascript
useEffect(() => {
  const saved = localStorage.getItem('dataGuru')
  if (saved) {
    const data = JSON.parse(saved)
    setDataGuru(data)
    setFilteredGuru(data)
  } else {
    // Jika belum ada di localStorage, simpan data initial
    setDataGuru(initialDataGuru)
    setFilteredGuru(initialDataGuru)
    localStorage.setItem('dataGuru', JSON.stringify(initialDataGuru))
  }
}, [])
```

## Hasil
✅ Tab "Semua Guru" sekarang menampilkan "Total Guru: 5"
✅ Download PDF dan Excel berfungsi dengan baik
✅ Data guru tersimpan otomatis ke localStorage saat pertama kali load
✅ Konsistensi data antara menu Data Guru dan Download Laporan

## Testing
1. Buka aplikasi di browser baru (atau clear localStorage)
2. Login sebagai Admin
3. Buka menu "Download Laporan"
4. Tab "Semua Guru" harus menampilkan 5 guru
5. Download PDF/Excel harus berhasil
