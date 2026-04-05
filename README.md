# 📱 GeoPresensi Griya Quran
### Sistem Absensi Guru Berbasis Lokasi (GPS) & QR Code

Aplikasi web modern yang dirancang untuk mengelola kehadiran guru secara akurat, transparan, dan real-time. Menggunakan validasi Geofencing (GPS) dan QR Code untuk menjamin kehadiran fisik guru di sekolah.

---

## 🌐 Informasi Akses
*   **Domain Utama:** [https://geo.griyaquran.web.id](https://geo.griyaquran.web.id)
*   **Halaman Guru:** [https://geo.griyaquran.web.id/guru](https://geo.griyaquran.web.id/guru)
*   **Halaman Admin:** [https://geo.griyaquran.web.id/admin](https://geo.griyaquran.web.id/admin)

---

## 🚀 Fitur Unggulan

### 🏫 Manajemen Kehadiran (Geofencing)
*   **Validasi Radius 20m:** Presensi hanya bisa dilakukan jika guru berada dalam radius maksimal 20 meter dari titik koordinat sekolah.
*   **Dual Mode Presensi:** Guru dapat memilih antara menekan tombol **"HADIR"** atau melakukan **"SCAN QR CODE"**.
*   **Presensi Pulang:** Mencatat jam pulang guru (tersedia mulai jam 09:00 WIB) untuk menghitung durasi jam kerja secara akurat.
*   **Izin & Sakit:** Pelaporan mandiri bagi guru yang berhalangan hadir (tanpa validasi GPS).

### 👮 Manajemen Operasional
*   **Jadwal Piket Digital:** Penugasan guru piket harian yang terintegrasi dengan pengingat otomatis di dashboard guru.
*   **Manajemen Hari Libur:** Kalender libur sekolah yang secara otomatis menonaktifkan fitur presensi agar tidak terjadi data "Alpha" di hari libur.
*   **Dashboard Real-time:** Grafik tren kehadiran harian, mingguan, dan daftar guru yang belum hadir untuk dipantau langsung oleh Kepala Sekolah.

### 📊 Administrasi & Pelaporan
*   **Download Laporan (Excel/PDF):** Admin/Kepsek dapat mengunduh laporan kehadiran per periode atau per guru secara spesifik.
*   **Log Aktivitas:** Rekam jejak audit digital untuk setiap aksi yang dilakukan di dalam sistem.
*   **Edit/Tambah Manual:** Fitur bagi Admin untuk memperbaiki data kehadiran atau menambah absen bagi guru yang terkendala teknis.

---

## 🛠️ Tech Stack
*   **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons, Recharts.
*   **Backend:** PHP API (Custom RESTful).
*   **Database:** MySQL / PostgreSQL (Supabase).
*   **Deployment:** VPS / Shared Hosting dengan dukungan HTTPS.

---

## 📚 Panduan Penggunaan
*   📖 **[Panduan Kepala Sekolah (HTML)](PETUNJUK_PENGGUNAAN_KEPALA_SEKOLAH.html) | [Markdown](PETUNJUK_PENGGUNAAN_KEPALA_SEKOLAH.md)**
*   📖 **[Panduan Guru (HTML)](PETUNJUK_PENGGUNAAN_GURU.html) | [Markdown](PETUNJUK_PENGGUNAAN_GURU.md)**
*   🛠️ **[Dokumentasi Teknis Lengkap](DOKUMENTASI_GEOPRESENSI_LENGKAP.md)**

---

## 🆘 Kasus Masalah & Penyelesaian (Troubleshooting)

Berikut adalah daftar masalah yang sering terjadi beserta solusinya:

### 1. Masalah: "Gagal Mendapatkan Lokasi" (Browser/HP)
*   **Penyebab:** GPS HP mati, Izin lokasi (Permission) diblokir pada browser, atau sinyal GPS terhalang bangunan beton.
*   **Penyelesaian:** 
    1. Pastikan GPS HP Aktif (Akurasi Tinggi).
    2. Cek pengaturan browser, pastikan situs `geo.griyaquran.web.id` diizinkan (Allow) mengakses lokasi.
    3. Coba me-refresh halaman aplikasi.
    4. Coba berpindah ke dekat jendela atau area luar ruangan.

### 2. Masalah: "Anda berada di luar jangkauan (Radius 20m)"
*   **Penyebab:** Bapak/Ibu sudah di sekolah tapi GPS mendeteksi lokasi yang tidak akurat (biasanya karena GPS melompat atau titik tengah sekolah bergeser).
*   **Penyelesaian:**
    1. Pastikan Bapak/Ibu berada sedekat mungkin dengan titik pusat sekolah (Ruang Guru/Pintu Masuk).
    2. Tunggu 10-30 detik agar GPS HP menstabilkan koordinat (sampai akurasi tinggi).
    3. Gunakan fitur **Scan QR Code** jika tersedia, sebagai alternatif validasi.
    4. Hubungi Admin jika titik koordinat sekolah perlu dikalibrasi ulang.

### 3. Masalah: Kamera Tidak Terbuka saat Scan QR
*   **Penyebab:** Izin akses kamera (Camera Permission) belum diberikan atau browser tidak mendukung WebRTC.
*   **Penyelesaian:**
    1. Klik "Allow/Izinkan" saat browser meminta akses kamera.
    2. Jika menggunakan iPhone, pastikan menggunakan browser **Safari**. Untuk Android, gunakan **Google Chrome**.
    3. Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera secara bersamaan.

### 4. Masalah: Lupa Password Guru
*   **Penyebab:** Faktor manusia (lupa kredensial).
*   **Penyelesaian:**
    1. Hubungi Tim IT / Admin Sekolah.
    2. Admin dapat mereset password melalui menu **"Data Guru"** > **Edit** > **Update Password**.

### 5. Masalah: Data Kehadiran Belum Muncul di Dashboard Kepala Sekolah
*   **Penyebab:** Koneksi internet lambat pada sisi guru saat menekan tombol presensi, sehingga data belum terkirim ke server.
*   **Penyelesaian:**
    1. Guru harus memastikan muncul notifikasi "Presensi Berhasil".
    2. Kepala Sekolah dapat menyegarkan (Refresh) halaman Dashboard.
    3. Cek **Log Aktivitas** untuk melihat apakah ada data yang masuk dengan status pending.

---

## 📍 Konfigurasi Radius & Koordinat (Bagi Pengembang)
Jika ingin mengubah radius atau titik pusat sekolah, edit pada Database (Tabel `settings`) atau via menu **"Pengaturan"** di Dashboard Admin:
*   `radius_gps`: **20** (dalam meter).
*   `latitude_sekolah`: (Koordinat Latitude).
*   `longitude_sekolah`: (Koordinat Longitude).

---
**GeoPresensi Griya Quran** - *Membangun Kedisiplinan dengan Teknologi Modern.*
**Versi:** 2.1.0 | **Dibuat oleh:** IT Team Griya Quran
