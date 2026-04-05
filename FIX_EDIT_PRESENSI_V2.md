# Perbaikan Edit Presensi - Error Latitude/Longitude

## Masalah
Error SQL: "Incorrect decimal value for column 'latitude' at row 1"

Terjadi karena saat status bukan "hadir" (izin/sakit), sistem mengirim `null` untuk latitude/longitude, tapi kolom database bertipe DECIMAL yang tidak menerima NULL.

## Solusi
Ubah nilai latitude/longitude menjadi `0` (nol) untuk status izin/sakit, bukan `null`.

## Perubahan Kode

### Update Presensi
```javascript
// Sebelum: mengirim null
latitude: formData.status === 'hadir' ? editingLog.latitude : null

// Sesudah: mengirim 0
latitude: formData.status === 'hadir' ? (editingLog.latitude || 0) : 0
longitude: formData.status === 'hadir' ? (editingLog.longitude || 0) : 0
```

### Create Presensi
```javascript
// Sebelum: mengirim null
latitude: formData.status === 'hadir' ? -6.2088 : null

// Sesudah: mengirim 0
if (formData.status === 'hadir') {
  createData.latitude = -6.2088
  createData.longitude = 106.8456
} else {
  createData.latitude = 0
  createData.longitude = 0
}
```

## Cara Upload ke cPanel

### 1. File yang Perlu Diupload
Hanya folder `dist/` yang sudah di-build:
```
dist/
├── index.html
└── assets/
    ├── index-3eZKUS4P.js  (file baru)
    ├── index-CVMZJeKe.css
    └── ... (file lainnya)
```

### 2. Langkah Upload

**Via File Manager cPanel:**

1. Login ke cPanel: https://kelolasekolah.web.id/cpanel
2. Buka "File Manager"
3. Masuk ke folder `public_html`
4. Upload file dari folder `dist/`:
   - Upload `index.html` (overwrite yang lama)
   - Upload folder `assets/` (overwrite yang lama)
5. Selesai!

**Via ZIP (Lebih Cepat):**

1. Compress folder `dist/` menjadi `dist.zip`
2. Upload `dist.zip` ke `public_html`
3. Extract di cPanel
4. Pindahkan isi folder `dist/` ke `public_html`
5. Hapus `dist.zip` dan folder `dist/` yang kosong

### 3. Clear Cache Browser
Setelah upload, buka browser mode Incognito atau clear cache:
- Chrome/Edge: Ctrl + Shift + Delete
- Firefox: Ctrl + Shift + Delete

### 4. Test Aplikasi
1. Login sebagai admin (miputra / manduraga)
2. Buka menu "Edit Presensi"
3. Pilih data dengan status "Izin" atau "Sakit"
4. Klik tombol Edit
5. Ubah keterangan atau status
6. Klik "Update Presensi"
7. **Seharusnya tidak ada error lagi!** ✅

## Hasil yang Diharapkan

✅ Edit presensi status "Hadir" → berfungsi
✅ Edit presensi status "Izin" → berfungsi (tidak error lagi)
✅ Edit presensi status "Sakit" → berfungsi (tidak error lagi)
✅ Tambah presensi baru → berfungsi
✅ Hapus presensi → berfungsi

## Catatan
- Nilai 0 untuk latitude/longitude tidak masalah karena hanya digunakan untuk status "hadir"
- Status izin/sakit tidak memerlukan koordinat GPS
- Database tetap menyimpan data dengan benar
