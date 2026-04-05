# Upload Fix: Status Guru Lain

## File yang Perlu Di-upload

### 1. Backend (API)
Upload file ini ke folder `api/` di cPanel:
```
api/guru.php
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/api/`
3. Upload file `api/guru.php` (replace yang lama)

### 2. Frontend (Dist)
Upload semua file di folder `dist/` ke cPanel:
```
dist/index.html
dist/assets/index-Kkteg1Cr.css
dist/assets/purify.es-C_uT9hQ1.js
dist/assets/index.es-DjrQNj15.js
dist/assets/html2canvas.esm-CBrSDip1.js
dist/assets/index-hlWVOdM0.js
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/`
3. Hapus file lama di `public_html/assets/` (file dengan nama berbeda)
4. Upload `dist/index.html` ke `public_html/` (replace)
5. Upload semua file di `dist/assets/` ke `public_html/assets/` (replace)

## Testing Setelah Upload

### Test 1: Login sebagai Guru
1. Buka https://kelolasekolah.web.id
2. Login dengan akun guru (contoh: username=guru1, password=guru123)
3. Klik tab **"Status Rekan"** di bottom navigation
4. Seharusnya muncul daftar guru lain (bukan "Tidak ada guru lain")

### Test 2: Cek Status Guru
Setiap guru akan menampilkan:
- **Nama guru**
- **Jabatan** (contoh: Guru Matematika, Wali Kelas 7A)
- **Status badge:**
  - 🟢 **Hadir** (hijau) - jika sudah presensi hadir + jam masuk
  - 🟡 **Izin** (kuning) - jika sudah presensi izin
  - 🔴 **Sakit** (merah) - jika sudah presensi sakit
  - ⚪ **Belum Absen** (abu-abu) - jika belum presensi

### Test 3: Auto Refresh
- Status akan auto-refresh setiap 30 detik
- Atau klik tombol **"🔄 Refresh"** untuk manual refresh

### Test 4: Debugging (Optional)
1. Buka Console Browser (F12)
2. Lihat log:
   ```
   === Loading Status Guru Lain ===
   Current User ID: 3
   Today: 2024-12-15
   All Guru: [...]
   Today Logs: [...]
   Final Status List: [...]
   ```
3. Pastikan tidak ada error 403 Forbidden

### Test 5: Security Check (Login sebagai Admin)
1. Login sebagai admin
2. Masuk ke menu **"Kelola Guru"**
3. Pastikan admin masih bisa:
   - ✅ Tambah guru baru
   - ✅ Edit data guru
   - ✅ Hapus guru
   - ✅ Lihat daftar guru

## Perubahan yang Dilakukan
1. **API Permission** - Guru sekarang bisa akses GET endpoints untuk melihat daftar guru
2. **Security** - Guru tetap tidak bisa CREATE/UPDATE/DELETE guru (hanya admin)
3. **Debugging** - Tambah console.log untuk troubleshooting

## Dokumentasi
Lihat file `FIX_STATUS_REKAN.md` untuk detail teknis lengkap.

## Status
✅ Build berhasil
✅ Siap di-upload ke cPanel
