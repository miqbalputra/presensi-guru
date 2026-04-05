# Changelog - GeoPresensi Sekolah

## [Update] - 14 Desember 2025

### ✨ Fitur Baru

#### Menu Pengaturan Hari Libur (Admin)
- ✅ **Menu Baru di Sidebar**: Menu "Hari Libur" dengan icon kalender
- ✅ **Halaman Pengaturan Lengkap**: Kelola hari libur nasional, cuti bersama, dan libur sekolah
- ✅ **CRUD Hari Libur**: 
  - Tambah hari libur baru dengan form modal
  - Edit hari libur existing
  - Hapus hari libur dengan konfirmasi
  - Lihat daftar hari libur dalam tabel
- ✅ **Filter Berdasarkan Tahun**: Dropdown tahun 2024-2030
- ✅ **Badge Warna Jenis Libur**:
  - 🔴 Merah: Libur Nasional
  - 🟡 Kuning: Cuti Bersama
  - 🔵 Biru: Libur Sekolah
- ✅ **Validasi Form**: Tanggal dan nama wajib diisi
- ✅ **Auto-Log Aktivitas**: Setiap aksi tercatat di log aktivitas
- ✅ **Info Box**: Informasi penting tentang hari libur

#### Sistem Hari Libur Otomatis (Guru)
- ✅ **Weekend Auto-Detect**: Sabtu-Minggu otomatis libur
- ✅ **Hari Libur Nasional**: Deteksi dari database
- ✅ **Auto-Disable Presensi**: Tombol presensi tidak muncul di hari libur
- ✅ **Pesan Libur Berbeda**:
  - Weekend: Kotak biru "Hari Sabtu/Minggu adalah hari libur"
  - Libur Nasional: Kotak kuning "Hari Libur: [Nama Libur]"
- ✅ **Database Hari Libur**: Tabel holidays dengan 15 data hari libur 2025

### 🔧 Integrasi
- Admin bisa menambah hari libur → Guru otomatis tidak bisa presensi
- Sistem cek hari libur setiap kali guru buka aplikasi
- API endpoint lengkap untuk manage hari libur

---

## [Update] - 12 Desember 2025

### ✨ Fitur Baru

#### Data Guru
- ✅ **Update Username & Password**: Admin sekarang bisa mengubah username dan password login setiap guru
- ✅ **Multiple Jabatan**: Guru bisa memiliki beberapa jabatan sekaligus
  - Contoh: "Guru Matematika" + "Wali Kelas 7A" + "Koordinator MGMP"
  - Tombol "Tambah Jabatan" untuk menambah jabatan baru
  - Tombol hapus untuk menghapus jabatan tertentu
  - Export Excel akan menampilkan semua jabatan (dipisah koma)

#### Edit Presensi
- ✅ **Edit Presensi Existing**: Admin bisa mengedit presensi yang sudah masuk
  - Berguna jika guru salah klik status presensi
  - Bisa ubah status (Hadir/Izin/Sakit)
  - Bisa ubah jam masuk
  - Bisa ubah keterangan
- ✅ **Hapus Presensi**: Admin bisa menghapus presensi yang salah
- ✅ **Daftar Presensi**: Tampilan tabel presensi dengan filter tanggal
- ✅ **Validasi Duplikasi**: Sistem mencegah duplikasi presensi (1 guru = 1 presensi per hari)
- ✅ **Input Jam Masuk Manual**: Admin bisa set jam masuk spesifik saat tambah presensi

### 🔧 Perbaikan

#### Data Management
- Users sekarang disimpan di localStorage dan bisa diupdate
- Sinkronisasi data guru dengan data users untuk login
- Password bisa dikosongkan saat edit (tidak akan berubah jika kosong)

#### UI/UX
- Form edit presensi lebih informatif dengan status "Edit" atau "Tambah"
- Tombol "Batal Edit" untuk kembali ke mode tambah
- Scroll otomatis ke form saat klik edit
- Icon yang lebih jelas (Edit & Delete)

### 📝 Dokumentasi
- Update README.md dengan fitur baru
- Update PENGGUNAAN.md dengan panduan lengkap
- Tambah CHANGELOG.md untuk tracking perubahan

---

## [Initial Release] - 12 Desember 2025

### 🎉 Fitur Awal

#### Autentikasi
- Login dengan 3 role: Admin, Kepala Sekolah, Guru
- Session management dengan localStorage

#### Dashboard Admin & Kepala Sekolah
- Statistik cards (Total Guru, Hadir, Izin, Sakit)
- Filter waktu (Hari ini, Kemarin, 7 hari, 14 hari)
- Line Chart: Tren kehadiran
- Pie Chart: Persentase kehadiran
- Tabel realtime presensi hari ini

#### Data Guru
- CRUD data guru
- Export ke Excel
- Import dari Excel
- Hitung lama bertugas otomatis

#### Dashboard Guru
- Input presensi dengan validasi GPS (Haversine Formula)
- Tombol Hadir/Izin/Sakit
- Riwayat presensi dengan filter tanggal
- Download laporan PDF & Excel
- Status kehadiran guru lain
- Mobile-first design dengan bottom navigation

#### Geolocation
- Validasi radius 100 meter dari sekolah
- Haversine Formula untuk hitung jarak
- Error handling untuk akses lokasi

#### Log Aktivitas
- Monitoring semua aktivitas sistem
- Timestamp lengkap
- Status badge dengan warna

---

## Roadmap

### 🚀 Fitur yang Akan Datang

- [ ] Backend API integration
- [ ] Real-time notifications
- [ ] Push notifications untuk reminder absen
- [ ] Laporan bulanan otomatis
- [ ] Dashboard analytics lebih detail
- [ ] Export PDF dengan chart
- [ ] Multi-sekolah support
- [ ] Role management lebih granular
- [ ] Foto selfie saat absen
- [ ] QR Code attendance
- [ ] Integration dengan sistem akademik

### 🐛 Bug Fixes & Improvements

- [ ] Optimasi performance untuk data besar
- [ ] Offline mode support
- [ ] Better error messages
- [ ] Loading states
- [ ] Form validation lebih ketat
- [ ] Accessibility improvements
- [ ] Dark mode

---

## Kontribusi

Jika Anda menemukan bug atau punya saran fitur, silakan buat issue di repository GitHub.

## Lisensi

MIT License
