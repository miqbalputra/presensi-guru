# Perbaikan Halaman Guru Kosong

## Masalah
Halaman guru (home) tampil kosong, tidak ada tombol presensi padahal bukan hari libur.

## Penyebab Kemungkinan
1. **User data tidak ter-load** dari session
2. **API error** saat load data
3. **Loading state** tidak ditampilkan
4. **Browser cache** masih versi lama

## Perbaikan yang Dilakukan

### 1. Tambah Loading State
```javascript
const [pageLoading, setPageLoading] = useState(true)

// Loading indicator
if (pageLoading) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Memuat data...</p>
    </div>
  )
}
```

### 2. Tambah Error Handling untuk User
```javascript
if (!user) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-red-800 mb-2">Error: User tidak ditemukan</h3>
      <p className="text-red-600">Silakan logout dan login kembali</p>
    </div>
  )
}
```

### 3. Tambah Welcome Message
```javascript
<div className="bg-white rounded-lg shadow p-6 text-center">
  <h2 className="text-2xl font-bold text-gray-800">{formatFullDate(new Date())}</h2>
  <p className="text-sm text-gray-500 mt-1">Selamat datang, {user.nama}</p>
</div>
```

### 4. Parallel Data Loading
```javascript
const loadInitialData = async () => {
  setPageLoading(true)
  try {
    await Promise.all([
      checkTodayAttendance(),
      checkIfHoliday()
    ])
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    setPageLoading(false)
  }
}
```

## File yang Diubah
```
src/components/guru/GuruHome.jsx
```

## Cara Upload ke cPanel

### 1. Upload File Build
```
dist/
├── index.html
└── assets/
    ├── index-CCRcJ446.js  (file baru)
    ├── index-Kkteg1Cr.css (file baru)
    └── ... (file lainnya)
```

### 2. Langkah Upload
1. Login cPanel → File Manager
2. Masuk ke `public_html`
3. Upload file dari folder `dist/`:
   - `index.html` (overwrite)
   - Folder `assets/` (overwrite)
4. **PENTING:** Clear cache browser

### 3. Clear Cache Browser
**Chrome/Edge:**
- Ctrl + Shift + Delete
- Pilih "Cached images and files"
- Time range: "All time"
- Clear data

**Atau gunakan mode Incognito:**
- Ctrl + Shift + N (Chrome)
- Ctrl + Shift + P (Firefox)

## Troubleshooting

### Halaman masih kosong setelah upload

**1. Hard Refresh Browser**
```
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

**2. Clear Browser Cache**
- Chrome: Settings → Privacy → Clear browsing data
- Firefox: Options → Privacy → Clear Data

**3. Cek Console Browser**
- Tekan F12
- Tab "Console"
- Lihat error merah jika ada
- Screenshot dan kirim ke developer

**4. Cek Network Tab**
- F12 → Tab "Network"
- Refresh halaman
- Cek apakah ada request yang failed (merah)
- Cek response dari API

### Error "User tidak ditemukan"

**Penyebab:** Session expired atau tidak valid

**Solusi:**
1. Logout dari aplikasi
2. Clear browser cache
3. Login kembali dengan kredensial yang benar

### Loading terus-menerus

**Penyebab:** API tidak merespon atau error

**Cek:**
1. Buka Console (F12)
2. Lihat error API
3. Cek apakah API endpoint benar:
   - `https://kelolasekolah.web.id/api/presensi.php`
   - `https://kelolasekolah.web.id/api/holidays.php`

**Solusi:**
1. Pastikan file API ter-upload dengan benar
2. Cek database connection di `api/config.php`
3. Cek error_log di cPanel

### Tombol tidak muncul

**Kemungkinan:**
1. **Hari libur** - Cek apakah hari ini weekend atau hari libur nasional
2. **Sudah presensi** - Cek apakah sudah presensi hari ini
3. **CSS tidak load** - Clear cache browser

**Cek di Console:**
```javascript
// Buka Console (F12), ketik:
localStorage.getItem('user')
// Harusnya muncul data user
```

## Testing Checklist

### Test Login
- [ ] Login dengan akun guru
- [ ] Redirect ke halaman guru
- [ ] Nama guru muncul di header

### Test Halaman Home
- [ ] Tanggal hari ini muncul
- [ ] Welcome message muncul
- [ ] Loading indicator muncul sebentar
- [ ] Tombol presensi muncul (jika belum presensi)

### Test Presensi
- [ ] Klik tombol "HADIR"
- [ ] Muncul notifikasi sukses
- [ ] Status berubah jadi "Sudah Absen"
- [ ] Tombol presensi hilang

### Test Hari Libur
- [ ] Jika weekend, muncul pesan "Hari Sabtu/Minggu adalah hari libur"
- [ ] Jika hari libur nasional, muncul nama hari libur
- [ ] Tombol presensi tidak muncul

## Debug Mode

Untuk debugging, tambahkan console.log:

```javascript
// Di GuruHome.jsx
useEffect(() => {
  console.log('User data:', user)
  console.log('Today attendance:', todayAttendance)
  console.log('Is holiday:', isHoliday)
  loadInitialData()
}, [])
```

Buka Console (F12) dan lihat output.

## Kontak Support

Jika masih bermasalah setelah semua langkah di atas:
1. Screenshot halaman (termasuk Console F12)
2. Screenshot Network tab (F12 → Network)
3. Kirim ke developer

## Build Status
✅ Build berhasil tanpa error
✅ File size: 1.51 MB (gzip: 460 KB)
✅ Siap untuk production

## Catatan
- Pastikan login dengan akun **guru**, bukan admin
- Pastikan hari ini **bukan weekend** atau **hari libur**
- Pastikan **belum presensi** hari ini
- Gunakan **HTTPS** bukan HTTP
