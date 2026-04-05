# Upload Fix: Jam Pulang Auto-filled 00:00:00

## Masalah yang Diperbaiki
Kolom waktu (jam_pulang, jam_izin, jam_sakit) yang seharusnya NULL malah terisi `00:00:00` secara otomatis.

## File yang Perlu Di-upload

### 1. Backend (API)
Upload file ini ke folder `api/` di cPanel:
```
api/presensi.php
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/api/`
3. Upload file `api/presensi.php` (replace yang lama)

### 2. Frontend (Dist)
Upload semua file di folder `dist/` ke cPanel:
```
dist/index.html
dist/assets/index-Kkteg1Cr.css
dist/assets/purify.es-C_uT9hQ1.js
dist/assets/index.es-D_skU1tW.js
dist/assets/html2canvas.esm-CBrSDip1.js
dist/assets/index-CSUspgIR.js
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/`
3. Hapus file lama di `public_html/assets/` (file dengan nama berbeda)
4. Upload `dist/index.html` ke `public_html/` (replace)
5. Upload semua file di `dist/assets/` ke `public_html/assets/` (replace)

## Testing Setelah Upload

### Test 1: Presensi Hadir
1. Login sebagai guru
2. Klik tombol **HADIR**
3. Buka phpMyAdmin → tabel `attendance_logs`
4. Cek record terbaru:
   - ✅ `jam_hadir` = terisi (contoh: 07:15:00)
   - ✅ `jam_izin` = NULL (bukan 00:00:00)
   - ✅ `jam_sakit` = NULL (bukan 00:00:00)
   - ✅ `jam_pulang` = NULL (bukan 00:00:00)

### Test 2: Presensi Izin
1. Login sebagai guru lain
2. Klik tombol **IZIN** → isi keterangan
3. Cek database:
   - ✅ `jam_izin` = terisi
   - ✅ `jam_hadir` = NULL
   - ✅ `jam_sakit` = NULL
   - ✅ `jam_pulang` = NULL

### Test 3: Presensi Pulang
1. Login sebagai guru yang sudah hadir
2. Klik tombol **PRESENSI PULANG**
3. Cek database:
   - ✅ `jam_hadir` = tetap terisi
   - ✅ `jam_pulang` = terisi (contoh: 15:30:00)
   - ✅ `jam_izin` = NULL
   - ✅ `jam_sakit` = NULL

## Perubahan Teknis
- Mengubah validasi dari `??` operator menjadi `!empty()` check
- Memastikan string kosong `''` dikonversi menjadi `NULL` yang benar
- Berlaku untuk CREATE dan UPDATE endpoint

## Dokumentasi
Lihat file `FIX_JAM_MASUK_PULANG.md` untuk detail teknis lengkap.

## Status
✅ Build berhasil
✅ Siap di-upload ke cPanel
