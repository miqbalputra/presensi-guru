# 📦 CHECKLIST UPLOAD KE CPANEL

## 🎯 RINGKASAN FITUR YANG DITAMBAHKAN

1. ✅ **Validasi Terlambat** - Deteksi guru yang datang terlambat
2. ✅ **Pengaturan Koordinat GPS** - Admin bisa ubah lokasi sekolah
3. ✅ **Mode Testing GPS** - Toggle validasi GPS on/off
4. ✅ **Auto-logout 30 menit** - Keamanan session
5. ✅ **Fix Hari Libur** - Blokir presensi di hari libur

---

## 📋 STEP 1: UPDATE DATABASE (WAJIB!)

Buka **phpMyAdmin** di cPanel, pilih database `sobataja2_geopresence`, jalankan SQL ini:

```sql
-- 1. CREATE TABLE SETTINGS (jika belum ada)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- 2. INSERT DEFAULT SETTINGS
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('jam_masuk_normal', '07:20', 'Batas waktu masuk normal (format HH:MM)', 'system'),
    ('toleransi_terlambat', '15', 'Toleransi keterlambatan dalam menit', 'system'),
    ('radius_gps', '500', 'Radius validasi GPS dalam meter', 'system'),
    ('sekolah_latitude', '-5.1477', 'Koordinat Latitude sekolah', 'system'),
    ('sekolah_longitude', '119.4327', 'Koordinat Longitude sekolah', 'system'),
    ('sekolah_nama', 'Sekolah', 'Nama sekolah', 'system'),
    ('mode_testing', '1', 'Mode testing GPS (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- 3. CEK DATA
SELECT * FROM settings;
```

**Expected Result:** 7 baris data settings

---

## 📋 STEP 2: UPLOAD FILE API (WAJIB!)

Upload file-file ini ke folder `api/` di cPanel:

### File yang WAJIB diupload:
1. **`api/settings.php`** (FILE BARU)
   - API untuk pengaturan sistem
   - Lokasi: `public_html/api/settings.php`

2. **`api/holidays.php`** (OVERWRITE)
   - Fix kolom `is_active`
   - Lokasi: `public_html/api/holidays.php`

3. **`api/presensi.php`** (OVERWRITE)
   - Validasi hari libur
   - Lokasi: `public_html/api/presensi.php`

### Cara Upload:
1. Buka **File Manager** di cPanel
2. Masuk ke folder `public_html/api/`
3. Klik **Upload**
4. Pilih file dari komputer:
   - `api/settings.php`
   - `api/holidays.php`
   - `api/presensi.php`
5. Klik **Upload** (overwrite jika ada)

---

## 📋 STEP 3: UPLOAD FRONTEND (WAJIB!)

Upload semua file dari folder `dist/` ke root website:

### File yang WAJIB diupload:
1. **`dist/index.html`** → `public_html/index.html` (OVERWRITE)
2. **`dist/assets/`** → `public_html/assets/` (OVERWRITE SEMUA)

### File Assets Terbaru:
- `assets/index-DCkTqVXJ.css` (CSS baru)
- `assets/index-Dtk_qONv.js` (JS baru)
- `assets/index.es-2VomozaT.js` (JS baru)
- `assets/purify.es-C_uT9hQ1.js` (sama)
- `assets/html2canvas.esm-CBrSDip1.js` (sama)

### Cara Upload (Metode 1 - Manual):
1. Buka **File Manager** di cPanel
2. Masuk ke folder `public_html/`
3. Upload `index.html` (overwrite)
4. Masuk ke folder `public_html/assets/`
5. **HAPUS semua file lama** di folder assets
6. Upload semua file baru dari `dist/assets/`

### Cara Upload (Metode 2 - ZIP):
1. Zip folder `dist/` di komputer → `dist.zip`
2. Upload `dist.zip` ke `public_html/`
3. Extract `dist.zip`
4. Pindahkan semua file dari `dist/` ke `public_html/`
5. Hapus folder `dist/` dan `dist.zip`

---

## 📋 STEP 4: VERIFIKASI (PENTING!)

### 1. Cek Database:
```sql
-- Harus ada 7 baris
SELECT COUNT(*) FROM settings;

-- Cek detail
SELECT * FROM settings;
```

### 2. Cek API Settings:
Buka browser, akses:
```
https://kelolasekolah.web.id/api/settings.php
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Settings berhasil diambil",
  "data": {
    "jam_masuk_normal": "07:20",
    "toleransi_terlambat": "15",
    "radius_gps": "500",
    "sekolah_latitude": "-5.1477",
    "sekolah_longitude": "119.4327",
    "sekolah_nama": "Sekolah",
    "mode_testing": "1"
  }
}
```

### 3. Cek API Holidays:
```
https://kelolasekolah.web.id/api/holidays.php?check=2025-12-25
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-25",
    "isHoliday": true,
    "isWeekend": false,
    "isWorkday": false,
    "holidayName": "Hari Natal",
    "dayName": "Kamis"
  }
}
```

### 4. Cek Frontend:
1. Buka: `https://kelolasekolah.web.id`
2. **Hard Refresh**: Ctrl + Shift + R (Windows) atau Cmd + Shift + R (Mac)
3. Login sebagai admin
4. Cek menu **Pengaturan** ada di sidebar
5. Buka halaman Pengaturan
6. Cek semua section muncul:
   - ✅ Jam Masuk Normal
   - ✅ Mode Testing GPS
   - ✅ Toleransi Keterlambatan
   - ✅ Radius Validasi GPS
   - ✅ Lokasi Sekolah

### 5. Test Fitur Admin:
- [ ] Ubah jam masuk normal → Simpan → Berhasil
- [ ] Toggle mode testing → Berhasil
- [ ] Ubah koordinat GPS → Simpan → Berhasil
- [ ] Klik "Lihat di Google Maps" → Buka lokasi yang benar

### 6. Test Fitur Guru:
- [ ] Login sebagai guru
- [ ] Lihat info jam masuk di dashboard
- [ ] Lihat badge mode testing (jika aktif)
- [ ] Presensi hadir → Berhasil
- [ ] Cek status terlambat (jika presensi > jam masuk)

---

## 🚨 TROUBLESHOOTING

### Masalah 1: API Settings Error 404
**Solusi:**
- Pastikan file `api/settings.php` sudah diupload
- Cek permission file: 644 atau 755
- Cek path: `public_html/api/settings.php`

### Masalah 2: Menu Pengaturan Tidak Muncul
**Solusi:**
- Clear cache browser (Ctrl + Shift + R)
- Pastikan file `dist/` sudah diupload semua
- Cek file `index.html` sudah ter-overwrite

### Masalah 3: Settings Tidak Tersimpan
**Solusi:**
- Cek database: tabel `settings` sudah dibuat?
- Cek API: `https://kelolasekolah.web.id/api/settings.php` bisa diakses?
- Cek console browser (F12) untuk error

### Masalah 4: Koordinat GPS Tidak Berubah
**Solusi:**
- Cek database: setting `sekolah_latitude` dan `sekolah_longitude` sudah ada?
- Cek API response: koordinat sudah update?
- Clear cache browser dan reload

### Masalah 5: Mode Testing Tidak Berfungsi
**Solusi:**
- Cek database: setting `mode_testing` ada?
- Cek value: harus `0` atau `1` (bukan string)
- Reload halaman guru setelah ubah mode testing

---

## 📊 CHECKLIST LENGKAP

### Database:
- [ ] Tabel `settings` sudah dibuat
- [ ] 7 setting sudah diinsert
- [ ] Query `SELECT * FROM settings` menampilkan 7 baris

### API:
- [ ] File `api/settings.php` sudah diupload
- [ ] File `api/holidays.php` sudah diupload (overwrite)
- [ ] File `api/presensi.php` sudah diupload (overwrite)
- [ ] Test API settings: berhasil
- [ ] Test API holidays: berhasil

### Frontend:
- [ ] File `index.html` sudah diupload (overwrite)
- [ ] Folder `assets/` sudah diupload (overwrite semua)
- [ ] File lama di `assets/` sudah dihapus
- [ ] Hard refresh browser (Ctrl + Shift + R)

### Testing Admin:
- [ ] Menu Pengaturan muncul di sidebar
- [ ] Halaman Pengaturan bisa dibuka
- [ ] Semua section muncul (5 section)
- [ ] Bisa ubah jam masuk normal
- [ ] Bisa toggle mode testing
- [ ] Bisa ubah koordinat GPS
- [ ] Notifikasi "berhasil disimpan" muncul

### Testing Guru:
- [ ] Info jam masuk muncul di dashboard
- [ ] Badge mode testing muncul (jika aktif)
- [ ] Presensi hadir berhasil
- [ ] Status terlambat muncul (jika terlambat)
- [ ] Presensi pulang berhasil (setelah jam 09:00)

---

## 🎯 RINGKASAN FILE YANG DIUPLOAD

### Database (1 file SQL):
```
database_settings.sql (jalankan di phpMyAdmin)
```

### API (3 files):
```
api/settings.php (BARU)
api/holidays.php (OVERWRITE)
api/presensi.php (OVERWRITE)
```

### Frontend (6 files):
```
dist/index.html (OVERWRITE)
dist/assets/index-DCkTqVXJ.css (BARU)
dist/assets/index-Dtk_qONv.js (BARU)
dist/assets/index.es-2VomozaT.js (BARU)
dist/assets/purify.es-C_uT9hQ1.js (SAMA)
dist/assets/html2canvas.esm-CBrSDip1.js (SAMA)
```

**Total: 1 SQL + 3 API + 6 Frontend = 10 files**

---

## ⏱️ ESTIMASI WAKTU

- Database setup: 2 menit
- Upload API: 3 menit
- Upload Frontend: 5 menit
- Testing: 5 menit
- **Total: ~15 menit**

---

## ✅ SELESAI!

Setelah semua file diupload dan testing berhasil, sistem siap digunakan dengan fitur baru:

1. ✅ Validasi terlambat otomatis
2. ✅ Pengaturan koordinat GPS dinamis
3. ✅ Mode testing GPS on/off
4. ✅ Auto-logout 30 menit
5. ✅ Fix hari libur

**Selamat! Sistem sudah ter-update!** 🎉
