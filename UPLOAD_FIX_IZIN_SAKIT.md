# Upload Fix: Izin dan Sakit Tidak Perlu GPS

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
dist/assets/index.es-DmX-ysX4.js
dist/assets/html2canvas.esm-CBrSDip1.js
dist/assets/index-BVwMZGGB.js
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/`
3. Hapus file lama di `public_html/assets/` (file dengan nama berbeda)
4. Upload `dist/index.html` ke `public_html/` (replace)
5. Upload semua file di `dist/assets/` ke `public_html/assets/` (replace)

## Testing Setelah Upload

### Test 1: Presensi Hadir (Masih Perlu GPS)
1. Buka https://kelolasekolah.web.id
2. Login sebagai guru
3. Klik tombol **HADIR**
4. Browser akan minta izin akses lokasi
5. ✅ Presensi berhasil dengan koordinat GPS
6. Cek database: `latitude` dan `longitude` terisi koordinat sebenarnya

### Test 2: Presensi Izin (Tidak Perlu GPS)
1. Login sebagai guru lain (atau logout dulu)
2. Klik tombol **IZIN**
3. Modal muncul
4. Isi keterangan: "Ada keperluan keluarga"
5. Klik **Simpan**
6. ✅ Presensi berhasil tanpa minta akses GPS
7. Pesan sukses: "Presensi izin berhasil disimpan!"
8. Cek database:
   - `status = 'izin'`
   - `jam_izin = HH:MM:SS`
   - `keterangan = 'Ada keperluan keluarga'`
   - `latitude = 0`
   - `longitude = 0`

### Test 3: Presensi Sakit (Tidak Perlu GPS)
1. Login sebagai guru lain
2. Klik tombol **SAKIT**
3. Modal muncul
4. Isi keterangan: "Demam tinggi"
5. Klik **Simpan**
6. ✅ Presensi berhasil tanpa minta akses GPS
7. Pesan sukses: "Presensi sakit berhasil disimpan!"
8. Cek database:
   - `status = 'sakit'`
   - `jam_sakit = HH:MM:SS`
   - `keterangan = 'Demam tinggi'`
   - `latitude = 0`
   - `longitude = 0`

### Test 4: Cek di Dashboard Admin
1. Login sebagai admin
2. Masuk ke Dashboard
3. Lihat statistik hari ini:
   - Hadir: X guru (dengan GPS)
   - Izin: Y guru (tanpa GPS)
   - Sakit: Z guru (tanpa GPS)
4. ✅ Semua data muncul dengan benar

### Test 5: Cek di Preview Laporan
1. Masih login sebagai admin
2. Masuk ke menu **Download Laporan**
3. Tab **Semua Guru**
4. Klik **Preview**
5. ✅ Data izin dan sakit muncul dengan keterangan
6. Koordinat untuk izin/sakit akan menampilkan `0, 0`

## Perubahan yang Dilakukan
1. **Validasi GPS** - Hanya untuk status HADIR
2. **Izin/Sakit** - Tidak perlu GPS, koordinat otomatis `0, 0`
3. **Loading State** - Tambah loading saat submit izin/sakit

## Error yang Diperbaiki
- ❌ SEBELUM: "Koordinat GPS tidak valid" saat isi izin/sakit
- ✅ SESUDAH: Izin/sakit berhasil tanpa GPS

## Dokumentasi
Lihat file `FIX_IZIN_SAKIT_GPS.md` untuk detail teknis lengkap.

## Status
✅ Build berhasil
✅ Siap di-upload ke cPanel
