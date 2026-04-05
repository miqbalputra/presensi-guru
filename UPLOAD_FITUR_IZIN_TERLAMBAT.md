# Upload Fitur: Hadir - Izin Terlambat

## Ringkasan
Fitur baru untuk menangani kasus guru yang datang terlambat dengan izin kepala sekolah.

## File yang Perlu Diupload

### 1. File Frontend (React) - WAJIB
Upload file-file berikut ke folder `src/components/admin/`:

```
src/components/admin/EditPresensi.jsx
src/components/admin/DashboardHome.jsx
src/components/admin/PersentaseKehadiran.jsx
src/components/admin/TrenKehadiran.jsx
src/components/admin/DownloadLaporan.jsx
```

### 2. File Dokumentasi - OPSIONAL (untuk referensi)
```
FITUR_HADIR_IZIN_TERLAMBAT.md
PANDUAN_ADMIN_IZIN_TERLAMBAT.md
INFO_STATUS_HADIR_IZIN_TERLAMBAT.sql
UPLOAD_FITUR_IZIN_TERLAMBAT.md (file ini)
```

## Langkah Upload ke cPanel

### Opsi 1: Upload via File Manager cPanel

1. **Login ke cPanel**
   - Buka cPanel hosting Anda
   - Login dengan kredensial

2. **Buka File Manager**
   - Cari dan klik "File Manager"
   - Navigate ke folder aplikasi Anda

3. **Upload File React**
   - Masuk ke folder: `public_html/src/components/admin/`
   - Upload 5 file JSX yang sudah dimodifikasi
   - Pilih "Overwrite" jika ada file lama

4. **Build Aplikasi** (PENTING!)
   ```bash
   # Via SSH atau Terminal di cPanel
   cd /path/to/your/app
   npm run build
   ```

5. **Copy Build ke Public**
   - Copy isi folder `dist/` ke `public_html/`
   - Atau sesuai struktur hosting Anda

### Opsi 2: Upload via FTP

1. **Buka FTP Client** (FileZilla, WinSCP, dll)
2. **Connect ke Server**
3. **Navigate ke folder**: `public_html/src/components/admin/`
4. **Upload 5 file JSX**
5. **Build dan deploy** (sama seperti Opsi 1 langkah 4-5)

### Opsi 3: Upload via Git (Jika menggunakan Git)

```bash
# Commit perubahan
git add src/components/admin/*.jsx
git commit -m "Add Hadir - Izin Terlambat feature"

# Push ke repository
git push origin main

# Di server, pull perubahan
git pull origin main

# Build aplikasi
npm run build
```

## Verifikasi Setelah Upload

### 1. Test di Browser
1. Buka aplikasi presensi
2. Login sebagai admin
3. Buka menu "Edit Presensi"
4. Cek dropdown "Status" - harus ada opsi **"Hadir - Izin Terlambat"**

### 2. Test Fungsionalitas
1. **Test Edit Presensi**:
   - Edit presensi yang sudah ada
   - Ubah status ke "Hadir - Izin Terlambat"
   - Tambahkan keterangan
   - Simpan dan cek apakah badge berwarna biru

2. **Test Dashboard**:
   - Buka Dashboard
   - Cek apakah status "Hadir - Izin Terlambat" muncul dengan badge biru
   - Cek apakah dihitung dalam statistik "Hadir"

3. **Test Download Laporan**:
   - Download laporan PDF
   - Download laporan Excel
   - Cek apakah status muncul dengan benar
   - Cek apakah dihitung dalam kolom "Hadir"

### 3. Test di Berbagai Browser
- Chrome
- Firefox
- Safari
- Edge

## Troubleshooting

### Masalah: Dropdown tidak muncul opsi baru
**Solusi**: 
- Clear cache browser (Ctrl+F5)
- Pastikan file EditPresensi.jsx sudah terupload
- Pastikan build sudah dilakukan

### Masalah: Badge tidak berwarna biru
**Solusi**:
- Clear cache browser
- Pastikan file DashboardHome.jsx dan DownloadLaporan.jsx sudah terupload
- Periksa console browser untuk error CSS

### Masalah: Statistik tidak menghitung dengan benar
**Solusi**:
- Pastikan semua 5 file JSX sudah terupload
- Clear cache browser
- Reload halaman beberapa kali

### Masalah: Error saat build
**Solusi**:
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules
npm install

# Build ulang
npm run build
```

## Rollback (Jika Ada Masalah)

Jika ada masalah setelah upload:

1. **Restore dari Backup**
   - Restore file-file lama dari backup
   - Build ulang aplikasi

2. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   npm run build
   ```

## Checklist Upload

- [ ] Backup file lama sebelum upload
- [ ] Upload EditPresensi.jsx
- [ ] Upload DashboardHome.jsx
- [ ] Upload PersentaseKehadiran.jsx
- [ ] Upload TrenKehadiran.jsx
- [ ] Upload DownloadLaporan.jsx
- [ ] Run `npm run build`
- [ ] Copy build ke public_html
- [ ] Test dropdown status di Edit Presensi
- [ ] Test badge biru di Dashboard
- [ ] Test statistik kehadiran
- [ ] Test download laporan PDF
- [ ] Test download laporan Excel
- [ ] Clear cache browser
- [ ] Test di berbagai browser
- [ ] Dokumentasikan perubahan

## Catatan Penting

1. **Tidak Ada Perubahan Database**
   - Tidak perlu menjalankan SQL apapun
   - Database sudah support status baru

2. **Tidak Ada Perubahan Backend**
   - File PHP tidak perlu diubah
   - API sudah support status apapun

3. **Hanya Frontend yang Berubah**
   - 5 file React component
   - Tidak ada perubahan di file lain

4. **Backward Compatible**
   - Data lama tetap bisa dibaca
   - Tidak ada breaking changes

## Support

Jika ada masalah atau pertanyaan:
- Cek file FITUR_HADIR_IZIN_TERLAMBAT.md untuk detail teknis
- Cek file PANDUAN_ADMIN_IZIN_TERLAMBAT.md untuk panduan penggunaan
- Hubungi developer untuk bantuan

---

**Status**: ✅ Ready to Upload
**Tanggal**: 26 Desember 2024
**Tested**: ✅ No Errors
