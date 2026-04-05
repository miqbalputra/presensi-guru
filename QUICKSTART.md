# 🚀 Quick Start - GeoPresensi Sekolah

## Instalasi Cepat

```bash
# 1. Install dependencies
npm install

# 2. Jalankan aplikasi
npm run dev
```

Buka browser: `http://localhost:5173`

## Login Cepat

### Admin
```
Username: admin
Password: admin123
```

### Guru
```
Username: guru1
Password: guru123
```

## Testing Geolocation (Penting!)

Karena aplikasi menggunakan validasi lokasi GPS, untuk testing ada 2 cara:

### Cara 1: Mock Location (Recommended)

**Chrome DevTools:**
1. Tekan `F12` untuk buka DevTools
2. Tekan `Ctrl+Shift+P` (Windows) atau `Cmd+Shift+P` (Mac)
3. Ketik "sensors" → pilih "Show Sensors"
4. Di tab Sensors, pilih lokasi atau input koordinat:
   - Latitude: `-6.2088`
   - Longitude: `106.8456`

### Cara 2: Ubah Radius (Untuk Testing)

Edit `src/data/dummyData.js`:

```javascript
export const SCHOOL_LOCATION = {
  latitude: -6.2088,
  longitude: 106.8456,
  radius: 10000 // Ubah jadi 10km untuk testing
}
```

## Fitur Utama yang Bisa Dicoba

### Sebagai Admin (admin/admin123):

1. ✅ **Dashboard** - Lihat statistik dan grafik
2. ✅ **Data Guru** - Tambah/Edit/Hapus guru
   - Update username & password login guru
   - Multiple jabatan per guru
3. ✅ **Export Excel** - Download data guru
4. ✅ **Edit Presensi** - Input presensi manual
   - Tambah presensi baru
   - Edit presensi yang sudah ada
   - Hapus presensi
   - Filter dan lihat daftar presensi
5. ✅ **Log Aktivitas** - Monitor semua aktivitas

### Sebagai Guru (guru1/guru123):

1. ✅ **Absen Hadir** - Dengan validasi GPS
2. ✅ **Absen Izin/Sakit** - Dengan keterangan
3. ✅ **Riwayat** - Lihat riwayat presensi
4. ✅ **Download Laporan** - PDF & Excel
5. ✅ **Status Rekan** - Lihat status guru lain

## Struktur Data

Data disimpan di **localStorage** browser:
- `user` - Session user login
- `dataGuru` - Data semua guru
- `attendanceLogs` - Log presensi
- `activityLogs` - Log aktivitas

## Reset Data

Untuk reset semua data ke default:

1. Buka Console browser (F12)
2. Jalankan:
```javascript
localStorage.clear()
location.reload()
```

## Build Production

```bash
npm run build
```

File hasil build ada di folder `dist/`

## Troubleshooting Cepat

### Port sudah digunakan?
Edit `vite.config.js`, tambahkan:
```javascript
server: { port: 3000 }
```

### Geolocation error?
- Pastikan browser izinkan akses lokasi
- Gunakan localhost atau HTTPS
- Coba mock location (lihat di atas)

### Data hilang?
- Jangan gunakan mode incognito
- Jangan clear browser cache

## Next Steps

📖 Baca dokumentasi lengkap:
- `README.md` - Overview & fitur
- `INSTALASI.md` - Panduan instalasi detail
- `PENGGUNAAN.md` - Panduan penggunaan lengkap

## Demo Akun Lengkap

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Kepala Sekolah | kepsek | kepsek123 |
| Guru 1 | guru1 | guru123 |
| Guru 2 | guru2 | guru123 |
| Guru 3 | guru3 | guru123 |
| Guru 4 | guru4 | guru123 |
| Guru 5 | guru5 | guru123 |

## Koordinat Sekolah Default

```
Latitude: -6.2088
Longitude: 106.8456
Radius: 100 meter
Lokasi: Jakarta (contoh)
```

Untuk mengubah, edit `src/data/dummyData.js`

---

**Selamat mencoba! 🎉**
