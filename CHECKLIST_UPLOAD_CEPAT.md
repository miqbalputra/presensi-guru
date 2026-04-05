# ✅ Checklist Upload Cepat - Fitur Statistik & Piket

## 📋 PERSIAPAN
- [ ] Login ke cPanel (https://kelolasekolah.web.id/cpanel)
- [ ] Backup database (Export dari phpMyAdmin)
- [ ] Backup folder dist lama (rename jadi dist_backup)

---

## 🗄️ DATABASE (5 menit)

### phpMyAdmin
1. [ ] Buka phpMyAdmin
2. [ ] Pilih database: `sobataja2_geopresence`
3. [ ] Tab "SQL"
4. [ ] Copy-paste isi file: `database_jadwal_piket.sql`
5. [ ] Klik "Go"
6. [ ] Verifikasi:
   - [ ] Tabel `jadwal_piket` ada
   - [ ] Setting `jam_piket_default` ada di tabel `settings`

---

## 🔌 API (2 menit)

### File Manager
1. [ ] Buka File Manager
2. [ ] Masuk ke: `/public_html/api/`
3. [ ] Upload file: `jadwal_piket.php`
4. [ ] Set permission: 644
5. [ ] Test URL: https://kelolasekolah.web.id/api/jadwal_piket.php
   - [ ] Harus return JSON (bukan error 404/500)

---

## 🎨 FRONTEND (5 menit)

### File Manager
1. [ ] Masuk ke: `/public_html/`
2. [ ] Backup: Rename folder `dist` → `dist_backup`
3. [ ] Upload folder `dist` dari lokal
4. [ ] Verifikasi file terupload:
   - [ ] `index.html`
   - [ ] `assets/index-B71MzbRN.js`
   - [ ] `assets/index-B2QwBo70.css`
   - [ ] `assets/purify.es-C_uT9hQ1.js`
   - [ ] `assets/index.es-Bt9NPZ7S.js`
   - [ ] `assets/html2canvas.esm-CBrSDip1.js`
5. [ ] Hapus file JS/CSS lama di folder assets (opsional, hemat space)

---

## 🧪 TESTING (10 menit)

### Test Admin - Jadwal Piket
1. [ ] Login admin: miputra / manduraga
2. [ ] Buka menu "Jadwal Piket" (sidebar)
3. [ ] Tambah jadwal piket:
   - [ ] Pilih hari: Senin
   - [ ] Pilih guru: (pilih salah satu)
   - [ ] Jam piket: 07:00
   - [ ] Klik "Simpan"
4. [ ] Edit jadwal piket:
   - [ ] Klik icon edit
   - [ ] Ubah jam piket: 06:30
   - [ ] Klik "Simpan"
5. [ ] Hapus jadwal piket:
   - [ ] Klik icon hapus
   - [ ] Konfirmasi hapus

### Test Guru - Piket
1. [ ] Login guru yang ada jadwal piket hari ini
2. [ ] Cek dashboard:
   - [ ] Badge info piket muncul?
   - [ ] Jam piket benar?
3. [ ] Test presensi SEBELUM jam piket:
   - [ ] Klik "HADIR"
   - [ ] Status: "hadir"
   - [ ] Tidak ada warning piket
4. [ ] Test presensi SETELAH jam piket:
   - [ ] Reset presensi (hapus di database)
   - [ ] Klik "HADIR"
   - [ ] Status: "hadir" atau "hadir_terlambat"
   - [ ] Ada warning: "⚠️ Anda terlambat hadir piket X menit"

### Test Guru - Statistik
1. [ ] Login guru (any)
2. [ ] Klik tab "Statistik Saya" (bottom navigation)
3. [ ] Cek tampilan:
   - [ ] Persentase kehadiran muncul?
   - [ ] Stats cards (Hadir, Terlambat, Izin, Sakit) muncul?
   - [ ] Riwayat presensi muncul?
4. [ ] Test filter:
   - [ ] Bulan Ini → data berubah?
   - [ ] Bulan Lalu → data berubah?
   - [ ] 3 Bulan → data berubah?
   - [ ] Tahun Ini → data berubah?
5. [ ] Cek responsif:
   - [ ] Mobile view OK?
   - [ ] Desktop view OK?

### Test Browser
1. [ ] Clear cache browser (Ctrl+Shift+Del)
2. [ ] Reload halaman (Ctrl+F5)
3. [ ] Test di browser lain (Chrome, Firefox, Edge)
4. [ ] Test di mobile (Android/iOS)

---

## ✅ VERIFIKASI AKHIR

- [ ] Database: Tabel `jadwal_piket` ada
- [ ] API: `jadwal_piket.php` bisa diakses
- [ ] Frontend: Tab "Statistik Saya" muncul
- [ ] Frontend: Menu "Jadwal Piket" muncul (admin)
- [ ] Fitur piket: Badge info piket muncul
- [ ] Fitur piket: Warning terlambat piket muncul
- [ ] Fitur statistik: Semua filter berfungsi
- [ ] Fitur statistik: Data akurat
- [ ] No errors di console browser
- [ ] No errors di Network tab

---

## 🚨 TROUBLESHOOTING

### Jika Tab Statistik Tidak Muncul
1. Clear browser cache
2. Reload halaman (Ctrl+F5)
3. Cek console browser (F12) → ada error?
4. Cek file `index.html` terupload dengan benar

### Jika Menu Jadwal Piket Tidak Muncul (Admin)
1. Clear browser cache
2. Logout → Login lagi
3. Cek console browser → ada error?

### Jika API Error
1. Cek file `jadwal_piket.php` ada di `/public_html/api/`
2. Cek permission: 644
3. Test URL langsung: https://kelolasekolah.web.id/api/jadwal_piket.php
4. Cek error log di cPanel

### Jika Database Error
1. Cek tabel `jadwal_piket` ada di phpMyAdmin
2. Cek setting `jam_piket_default` ada di tabel `settings`
3. Cek foreign key ke tabel `users` aktif

---

## 📞 BANTUAN

Jika ada masalah:
1. Cek console browser (F12)
2. Cek Network tab (F12)
3. Cek error log cPanel
4. Screenshot error → tanyakan ke developer

---

## 🎉 SELESAI!

Jika semua checklist ✅, maka:
- ✅ Fitur Jadwal Piket sudah aktif
- ✅ Fitur Statistik Guru sudah aktif
- ✅ Aplikasi siap digunakan!

**Estimasi waktu total: 20-25 menit**
