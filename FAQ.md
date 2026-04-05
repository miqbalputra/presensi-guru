# ❓ FAQ - GeoPresensi Sekolah

## Pertanyaan Umum

### 1. Apa itu GeoPresensi Sekolah?

GeoPresensi Sekolah adalah aplikasi web untuk sistem absensi guru berbasis lokasi GPS. Aplikasi ini memvalidasi kehadiran guru berdasarkan jarak dari sekolah menggunakan teknologi geolocation.

---

### 2. Siapa saja yang bisa menggunakan aplikasi ini?

Ada 3 role pengguna:
- **Admin**: Akses penuh ke semua fitur
- **Kepala Sekolah**: Akses penuh (sama dengan Admin)
- **Guru**: Akses terbatas untuk input presensi dan melihat riwayat

---

### 3. Apakah aplikasi ini gratis?

Ya, aplikasi ini open source dengan lisensi MIT. Anda bebas menggunakan, memodifikasi, dan mendistribusikan.

---

## Fitur & Fungsi

### 4. Bagaimana cara kerja validasi lokasi GPS?

Aplikasi menggunakan **Haversine Formula** untuk menghitung jarak antara lokasi guru dengan koordinat sekolah. Guru hanya bisa absen "Hadir" jika berada dalam radius 100 meter dari sekolah.

---

### 5. Apakah radius 100 meter bisa diubah?

Ya, bisa. Edit file `src/data/dummyData.js` dan ubah nilai `radius` di objek `SCHOOL_LOCATION`.

```javascript
export const SCHOOL_LOCATION = {
  latitude: -6.2088,
  longitude: 106.8456,
  radius: 200 // Ubah jadi 200 meter
}
```

---

### 6. Bagaimana jika guru lupa absen?

Admin bisa menambahkan presensi manual melalui menu **Edit Presensi**. Admin bisa memilih tanggal, status, dan bahkan jam masuk spesifik.

---

### 7. Apakah guru bisa absen lebih dari 1x per hari?

Tidak. Sistem memiliki validasi duplikasi. Satu guru hanya bisa memiliki 1 presensi per hari. Jika perlu mengubah, gunakan fitur Edit.

---

### 8. Bagaimana jika guru salah klik status presensi?

Admin bisa mengedit presensi yang sudah ada melalui menu **Edit Presensi**. Cari presensi dengan filter tanggal, lalu klik Edit.

---

### 9. Apakah bisa menghapus presensi?

Ya, Admin bisa menghapus presensi melalui menu **Edit Presensi**. Klik icon tempat sampah pada presensi yang ingin dihapus.

---

### 10. Apakah guru bisa memiliki lebih dari 1 jabatan?

Ya! Fitur baru memungkinkan guru memiliki multiple jabatan. Contoh: "Guru Matematika" + "Wali Kelas 7A" + "Koordinator MGMP".

---

## Login & Akun

### 11. Bagaimana cara login pertama kali?

Gunakan akun demo:
- **Admin**: username `admin`, password `admin123`
- **Guru**: username `guru1`, password `guru123`

---

### 12. Bagaimana cara mengganti password?

**Untuk Admin:**
- Admin bisa mengubah password sendiri atau guru lain melalui menu **Data Guru**

**Untuk Guru:**
- Hubungi Admin untuk reset password

---

### 13. Apakah username bisa diubah?

Ya, Admin bisa mengubah username guru melalui menu **Data Guru** → Edit.

---

### 14. Bagaimana jika lupa password?

Hubungi Admin untuk reset password. Admin bisa mengubah password melalui menu **Data Guru**.

---

## Data & Laporan

### 15. Dimana data disimpan?

Data disimpan di **localStorage** browser. Ini adalah storage lokal di browser pengguna.

---

### 16. Apakah data aman?

Data di localStorage relatif aman untuk development/testing. Untuk production, disarankan menggunakan backend API dengan database.

---

### 17. Bagaimana cara backup data?

**Manual:**
1. Export data guru ke Excel melalui menu **Data Guru**
2. Download laporan presensi melalui dashboard guru

**Otomatis:**
- Untuk production, implementasikan backend dengan database backup

---

### 18. Apakah bisa export data ke Excel?

Ya, ada 2 fitur export:
1. **Data Guru**: Export semua data guru ke Excel
2. **Riwayat Presensi**: Guru bisa download riwayat mereka ke Excel

---

### 19. Apakah bisa export ke PDF?

Ya, guru bisa download laporan riwayat presensi mereka dalam format PDF.

---

### 20. Apakah bisa import data guru dari Excel?

Ya, Admin bisa import data guru dari file Excel melalui menu **Data Guru** → Import Excel.

---

## Teknis

### 21. Teknologi apa yang digunakan?

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Excel**: SheetJS (xlsx)
- **PDF**: jsPDF

---

### 22. Apakah perlu backend?

Tidak untuk development/testing. Aplikasi ini frontend-only dengan localStorage. Untuk production, disarankan menggunakan backend API.

---

### 23. Apakah bisa diakses offline?

Tidak sepenuhnya. Aplikasi perlu internet untuk:
- Load pertama kali
- Akses geolocation API

Setelah load, beberapa fitur bisa bekerja offline (kecuali geolocation).

---

### 24. Browser apa yang didukung?

Aplikasi mendukung browser modern:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

### 25. Apakah responsive untuk mobile?

Ya! Aplikasi fully responsive:
- **Desktop**: Layout sidebar untuk Admin
- **Mobile**: Bottom navigation untuk Guru (Mobile First)

---

## Geolocation

### 26. Kenapa muncul "Gagal mendapatkan lokasi"?

**Penyebab:**
- Akses lokasi diblokir browser
- GPS tidak aktif
- Browser tidak support geolocation

**Solusi:**
1. Izinkan akses lokasi di browser
2. Aktifkan GPS/Location Services
3. Gunakan browser modern

---

### 27. Kenapa selalu "Di luar jangkauan sekolah"?

**Penyebab:**
- Koordinat sekolah salah
- Lokasi GPS tidak akurat
- Radius terlalu kecil

**Solusi:**
1. Cek koordinat sekolah di `src/data/dummyData.js`
2. Pastikan GPS akurat
3. Perbesar radius untuk testing

---

### 28. Bagaimana cara testing geolocation di komputer?

**Chrome DevTools:**
1. Tekan F12
2. Tekan Ctrl+Shift+P
3. Ketik "sensors"
4. Pilih lokasi atau input koordinat custom

**Extension:**
- Install "Location Guard" atau "Manual Geolocation"

---

### 29. Apakah bisa absen tanpa GPS?

Tidak untuk status "Hadir". Guru harus dalam radius sekolah. Tapi untuk status "Izin" atau "Sakit", tidak perlu GPS.

---

### 30. Apakah Admin perlu GPS untuk input presensi manual?

Tidak. Admin bisa input presensi manual tanpa validasi GPS.

---

## Troubleshooting

### 31. Data hilang setelah refresh

**Penyebab:**
- Browser mode incognito/private
- Browser cache dihapus

**Solusi:**
1. Jangan gunakan mode incognito
2. Jangan clear browser data
3. Export data secara berkala

---

### 32. "Guru ini sudah memiliki presensi pada tanggal tersebut"

**Solusi:**
Gunakan fitur **Edit** untuk mengubah presensi existing, bukan tambah baru.

---

### 33. Password tidak berubah setelah edit

**Penyebab:**
Field password dikosongkan (password tidak akan berubah jika kosong)

**Solusi:**
Isi field password dengan password baru, lalu simpan.

---

### 34. Jabatan tidak muncul semua

**Penyebab:**
Data lama masih format single jabatan

**Solusi:**
Edit guru tersebut, sistem akan convert otomatis ke array. Tambah jabatan lain jika perlu.

---

### 35. Chart tidak muncul

**Penyebab:**
- Tidak ada data
- Error JavaScript

**Solusi:**
1. Pastikan ada data presensi
2. Cek console browser (F12) untuk error
3. Refresh halaman

---

## Deployment

### 36. Bagaimana cara deploy aplikasi?

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
1. Build: `npm run build`
2. Drag & drop folder `dist/` ke Netlify

**GitHub Pages:**
```bash
npm install --save-dev gh-pages
npm run deploy
```

---

### 37. Apakah perlu konfigurasi khusus untuk production?

Ya, untuk production:
1. Ubah koordinat sekolah sesuai lokasi sebenarnya
2. Ganti password default semua user
3. Implementasikan backend API
4. Setup database untuk data persistence
5. Implementasikan authentication yang lebih aman

---

### 38. Apakah bisa multi-sekolah?

Tidak di versi ini. Aplikasi dirancang untuk 1 sekolah. Untuk multi-sekolah, perlu modifikasi:
- Tambah field `schoolId` di data
- Filter data berdasarkan sekolah
- Multiple koordinat sekolah

---

## Fitur Mendatang

### 39. Apakah akan ada fitur foto selfie saat absen?

Belum ada di roadmap, tapi bisa ditambahkan. Kontribusi welcome!

---

### 40. Apakah akan ada notifikasi push?

Ada di roadmap untuk versi mendatang. Akan mengirim reminder ke guru yang belum absen.

---

### 41. Apakah akan ada integrasi dengan sistem akademik?

Ada di roadmap. Akan bisa integrasi dengan sistem akademik untuk sinkronisasi data guru dan jadwal.

---

### 42. Apakah akan ada mobile app (Android/iOS)?

Belum ada rencana. Aplikasi web sudah responsive dan bisa diakses di mobile browser.

---

## Kontribusi

### 43. Bagaimana cara berkontribusi?

1. Fork repository
2. Buat branch baru
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

---

### 44. Dimana melaporkan bug?

Buat issue di GitHub repository dengan detail:
- Deskripsi bug
- Langkah reproduksi
- Screenshot (jika ada)
- Browser & OS

---

### 45. Bagaimana cara request fitur baru?

Buat issue di GitHub dengan label "feature request" dan jelaskan:
- Fitur yang diinginkan
- Use case
- Mockup (jika ada)

---

## Lisensi & Legal

### 46. Apakah boleh digunakan untuk komersial?

Ya, aplikasi ini menggunakan MIT License. Anda bebas menggunakan untuk keperluan komersial.

---

### 47. Apakah perlu credit ke developer?

Tidak wajib, tapi sangat dihargai jika Anda mencantumkan credit atau link ke repository.

---

### 48. Apakah ada garansi?

Tidak. Aplikasi disediakan "as is" tanpa garansi. Gunakan dengan risiko sendiri.

---

## Support

### 49. Dimana mendapatkan bantuan?

1. Baca dokumentasi lengkap:
   - `README.md`
   - `INSTALASI.md`
   - `PENGGUNAAN.md`
   - `FITUR_BARU.md`
2. Cek FAQ ini
3. Buat issue di GitHub
4. Hubungi admin sekolah

---

### 50. Apakah ada komunitas pengguna?

Belum ada. Jika tertarik membuat komunitas, silakan hubungi melalui GitHub.

---

**Tidak menemukan jawaban? Buat issue di GitHub repository!**
