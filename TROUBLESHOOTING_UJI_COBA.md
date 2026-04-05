# 🔧 Troubleshooting Uji Coba Guru

## 🚨 MASALAH UMUM & SOLUSI CEPAT

---

### ❌ MASALAH 1: Tab "Statistik Saya" Tidak Muncul

**Gejala:**
- Bottom navigation hanya ada 3 tab (Home, Riwayat, Status)
- Tab "Statistik Saya" tidak ada

**Penyebab:**
- Browser cache belum di-clear
- File build lama masih ter-cache

**Solusi:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Reload halaman dengan Ctrl+F5 (hard reload)
3. Coba di browser lain atau incognito mode
4. Cek file `index.html` di server sudah terupdate

**Verifikasi:**
```
Buka: https://kelolasekolah.web.id
Login sebagai guru
Lihat bottom navigation → harus ada 4 tab
```

---

### ❌ MASALAH 2: Menu "Jadwal Piket" Tidak Muncul (Admin)

**Gejala:**
- Sidebar admin tidak ada menu "Jadwal Piket"

**Penyebab:**
- Browser cache belum di-clear
- Login sebagai guru (bukan admin)

**Solusi:**
1. Pastikan login sebagai admin (miputra/manduraga)
2. Clear browser cache
3. Logout → Login lagi
4. Cek sidebar → harus ada menu "Jadwal Piket"

**Verifikasi:**
```
Login: miputra / manduraga
Lihat sidebar → harus ada menu "Jadwal Piket"
```

---

### ❌ MASALAH 3: Error "Tabel jadwal_piket tidak ada"

**Gejala:**
- Error saat buka menu Jadwal Piket
- Console: "Table 'sobataja2_geopresence.jadwal_piket' doesn't exist"

**Penyebab:**
- SQL belum dijalankan di phpMyAdmin

**Solusi:**
1. Login ke cPanel → phpMyAdmin
2. Pilih database: `sobataja2_geopresence`
3. Tab "SQL"
4. Copy-paste isi file `database_jadwal_piket.sql`
5. Klik "Go"
6. Refresh halaman aplikasi

**Verifikasi:**
```sql
-- Di phpMyAdmin, jalankan:
SHOW TABLES LIKE 'jadwal_piket';
-- Harus return 1 row
```

---

### ❌ MASALAH 4: Badge Piket Tidak Muncul

**Gejala:**
- Guru sudah ada jadwal piket hari ini
- Badge "📋 Anda memiliki jadwal piket..." tidak muncul

**Penyebab:**
1. Hari tidak sesuai (jadwal Senin, tapi hari ini Selasa)
2. is_active = 0 (jadwal tidak aktif)
3. API error

**Solusi:**
1. Cek jadwal di admin → pastikan hari sesuai
2. Cek is_active = 1 (default)
3. Buka console browser (F12) → cek error
4. Test API langsung:
   ```
   https://kelolasekolah.web.id/api/jadwal_piket.php?today=1
   ```

**Verifikasi:**
```sql
-- Di phpMyAdmin, cek jadwal hari ini:
SELECT * FROM jadwal_piket 
WHERE hari = 'Senin' -- sesuaikan dengan hari ini
AND is_active = 1;
```

---

### ❌ MASALAH 5: Warning Terlambat Piket Tidak Muncul

**Gejala:**
- Guru piket, presensi terlambat
- Warning "⚠️ Anda terlambat hadir piket..." tidak muncul

**Penyebab:**
1. Presensi sebelum jam piket (tidak terlambat)
2. Badge piket tidak muncul (lihat Masalah 4)
3. Logic error

**Solusi:**
1. Cek jam piket vs jam presensi
   - Jam piket: 07:00
   - Jam presensi: 07:15
   - Seharusnya: Terlambat 15 menit
2. Cek console browser → ada error?
3. Cek badge piket muncul atau tidak

**Verifikasi:**
```
Skenario:
- Jam piket: 07:00
- Presensi: 07:15
- Expected: Warning muncul "Terlambat 15 menit"
```

---

### ❌ MASALAH 6: Statistik Tidak Muncul / Kosong

**Gejala:**
- Tab "Statistik Saya" ada
- Tapi data kosong / persentase 0%

**Penyebab:**
- Guru belum pernah presensi (normal)
- Filter periode salah

**Solusi:**
1. Jika guru baru / belum presensi → Normal, data kosong
2. Coba filter "Tahun Ini" → lihat ada data?
3. Cek di tab "Riwayat Saya" → ada data presensi?

**Verifikasi:**
```sql
-- Di phpMyAdmin, cek presensi guru:
SELECT * FROM presensi 
WHERE user_id = X -- ganti X dengan ID guru
ORDER BY tanggal DESC 
LIMIT 10;
```

---

### ❌ MASALAH 7: Error "Guru sudah memiliki jadwal piket di hari ini"

**Gejala:**
- Admin tambah jadwal piket
- Error: "Guru sudah memiliki jadwal piket di hari ini"

**Penyebab:**
- Guru sudah ada jadwal di hari yang sama
- UNIQUE constraint: (user_id, hari)

**Solusi:**
1. Cek jadwal yang sudah ada
2. Edit jadwal yang ada (jangan tambah baru)
3. Atau hapus jadwal lama, baru tambah baru

**Verifikasi:**
```sql
-- Di phpMyAdmin, cek jadwal guru:
SELECT * FROM jadwal_piket 
WHERE user_id = X -- ganti X dengan ID guru
AND hari = 'Senin'; -- sesuaikan hari
```

---

### ❌ MASALAH 8: API Error 404 (jadwal_piket.php)

**Gejala:**
- Console error: "404 Not Found"
- URL: https://kelolasekolah.web.id/api/jadwal_piket.php

**Penyebab:**
- File `jadwal_piket.php` belum diupload
- File di folder salah

**Solusi:**
1. Login ke cPanel → File Manager
2. Cek folder `/public_html/api/`
3. Pastikan file `jadwal_piket.php` ada
4. Cek permission: 644
5. Test URL langsung di browser

**Verifikasi:**
```
Buka: https://kelolasekolah.web.id/api/jadwal_piket.php
Harus return JSON (bukan 404)
```

---

### ❌ MASALAH 9: API Error 500 (Internal Server Error)

**Gejala:**
- Console error: "500 Internal Server Error"
- API tidak bisa diakses

**Penyebab:**
1. Syntax error di PHP
2. Database connection error
3. Missing config.php

**Solusi:**
1. Cek error log di cPanel
2. Cek file `api/config.php` ada
3. Cek database credentials benar
4. Cek syntax PHP (buka file di editor)

**Verifikasi:**
```
cPanel → Error Logs → Lihat error terbaru
Biasanya ada info detail error
```

---

### ❌ MASALAH 10: Timezone Salah (Hari Tidak Sesuai)

**Gejala:**
- Hari ini Senin, tapi API return Minggu
- Jadwal piket tidak sesuai

**Penyebab:**
- Server timezone ≠ Asia/Jakarta
- PHP timezone default (UTC)

**Solusi:**
1. Edit file `api/config.php`
2. Tambahkan di awal file (setelah `<?php`):
   ```php
   date_default_timezone_set('Asia/Jakarta');
   ```
3. Save file
4. Test lagi

**Verifikasi:**
```php
// Test timezone di PHP:
<?php
date_default_timezone_set('Asia/Jakarta');
echo date('l'); // Harus return hari ini dalam English
echo date('Y-m-d H:i:s'); // Harus return waktu sekarang
?>
```

---

## 🔍 CARA CEK ERROR

### 1. Browser Console (F12)

**Cara:**
1. Buka aplikasi
2. Tekan F12 (atau Ctrl+Shift+I)
3. Tab "Console"
4. Lihat error merah

**Info yang dicari:**
- Error message
- File name
- Line number
- Stack trace

### 2. Network Tab (F12)

**Cara:**
1. Buka aplikasi
2. Tekan F12
3. Tab "Network"
4. Reload halaman (Ctrl+R)
5. Lihat request yang error (merah)

**Info yang dicari:**
- Request URL
- Status code (404, 500, etc)
- Response body
- Request payload

### 3. cPanel Error Logs

**Cara:**
1. Login cPanel
2. "Errors" atau "Error Logs"
3. Lihat log terbaru

**Info yang dicari:**
- PHP errors
- Database errors
- Permission errors

---

## 📞 KONTAK DARURAT

Jika masalah tidak bisa diselesaikan:

1. **Screenshot error**:
   - Console browser (F12)
   - Network tab (F12)
   - Error message di aplikasi

2. **Info yang perlu diberikan**:
   - Apa yang dilakukan sebelum error
   - Error message lengkap
   - Browser & OS yang digunakan
   - Akun yang digunakan (admin/guru)

3. **Coba di browser lain**:
   - Chrome
   - Firefox
   - Edge
   - Incognito mode

4. **Coba di device lain**:
   - Desktop
   - Mobile
   - Tablet

---

## ✅ CHECKLIST TROUBLESHOOTING

Sebelum lapor masalah, cek dulu:

- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Hard reload (Ctrl+F5)
- [ ] Coba di incognito mode
- [ ] Coba di browser lain
- [ ] Cek console browser (F12)
- [ ] Cek network tab (F12)
- [ ] Cek error log cPanel
- [ ] Cek database (phpMyAdmin)
- [ ] Cek file API ada di server
- [ ] Cek permission file (644)

---

## 🎯 QUICK FIX COMMANDS

### Clear Cache (Browser)
```
Chrome: Ctrl+Shift+Del → Clear browsing data
Firefox: Ctrl+Shift+Del → Clear recent history
Edge: Ctrl+Shift+Del → Clear browsing data
```

### Hard Reload (Browser)
```
Windows: Ctrl+F5
Mac: Cmd+Shift+R
```

### Check Database (phpMyAdmin)
```sql
-- Cek tabel ada
SHOW TABLES LIKE 'jadwal_piket';

-- Cek struktur tabel
DESC jadwal_piket;

-- Cek data
SELECT * FROM jadwal_piket;

-- Cek setting
SELECT * FROM settings WHERE setting_key = 'jam_piket_default';
```

### Test API (Browser)
```
GET All: https://kelolasekolah.web.id/api/jadwal_piket.php
GET Today: https://kelolasekolah.web.id/api/jadwal_piket.php?today=1
```

---

## 📚 DOKUMENTASI LENGKAP

Untuk info lebih detail, baca:

1. **HASIL_PENGECEKAN_LENGKAP.md** - Hasil pengecekan semua komponen
2. **UPLOAD_FITUR_STATISTIK_DAN_PIKET.md** - Panduan upload lengkap
3. **CHECKLIST_UPLOAD_CEPAT.md** - Checklist step-by-step
4. **TECHNICAL_SUMMARY_FITUR_BARU.md** - Technical details
5. **VISUAL_GUIDE_FITUR_BARU.txt** - Visual guide

---

**Dibuat oleh**: Kiro AI Assistant  
**Tanggal**: 26 Desember 2025  
**Untuk**: Uji Coba Guru - GeoPresensi Sekolah
