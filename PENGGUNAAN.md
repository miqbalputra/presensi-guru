# Panduan Penggunaan GeoPresensi Sekolah

## 🔐 Login

### Akun Demo

**Admin:**
- Username: `admin`
- Password: `admin123`

**Kepala Sekolah:**
- Username: `kepsek`
- Password: `kepsek123`

**Guru:**
- Username: `guru1`, `guru2`, `guru3`, `guru4`, `guru5`
- Password: `guru123`

## 👨‍💼 Panduan untuk Admin & Kepala Sekolah

### 1. Dashboard

Setelah login, Anda akan melihat:

- **Statistik Cards**: Total guru, hadir hari ini, izin, sakit
- **Filter Waktu**: Pilih periode (Hari ini, Kemarin, 7 Hari, 14 Hari)
- **Line Chart**: Tren kehadiran vs ketidakhadiran
- **Pie Chart**: Persentase kehadiran hari ini
- **Tabel Realtime**: Daftar guru yang sudah absen hari ini

### 2. Data Guru

**Menambah Guru Baru:**
1. Klik tombol "Tambah Guru"
2. Isi form:
   - Nama Lengkap
   - Jenis Kelamin
   - Alamat
   - Jabatan (bisa tambah multiple jabatan dengan klik "Tambah Jabatan")
   - Tanggal Bertugas
   - Username (untuk login)
   - Password (untuk login)
3. Klik "Simpan"

**Mengedit Data Guru:**
1. Klik icon pensil (Edit) di baris guru yang ingin diedit
2. Ubah data yang diperlukan:
   - Bisa update username dan password login
   - Bisa tambah/hapus jabatan
   - Password: kosongkan jika tidak ingin mengubah
3. Klik "Simpan"

**Menghapus Guru:**
1. Klik icon tempat sampah (Delete) di baris guru
2. Konfirmasi penghapusan

**Multiple Jabatan:**
- Satu guru bisa memiliki beberapa jabatan
- Contoh: "Guru Matematika" + "Wali Kelas 7A"
- Klik "Tambah Jabatan" untuk menambah jabatan baru
- Klik icon tempat sampah untuk menghapus jabatan

**Export Data ke Excel:**
1. Klik tombol "Export Excel"
2. File akan otomatis terdownload

**Import Data dari Excel:**
1. Siapkan file Excel dengan kolom: Nama, Jenis Kelamin, Alamat, Jabatan, Tanggal Bertugas
2. Klik tombol "Import Excel"
3. Pilih file Excel
4. Data akan otomatis ditambahkan

### 3. Edit Presensi

Fitur lengkap untuk mengelola presensi guru:

**Menambah Presensi Manual:**
1. Pilih nama guru dari dropdown
2. Pilih tanggal
3. Pilih status (Hadir/Izin/Sakit)
4. Jika status Hadir, bisa isi jam masuk (opsional, otomatis jika kosong)
5. Isi keterangan (opsional)
6. Klik "Tambah Presensi"

**Mengedit Presensi yang Sudah Ada:**
1. Gunakan filter tanggal untuk mencari presensi
2. Klik icon pensil (Edit) di baris presensi yang ingin diubah
3. Form akan terisi otomatis dengan data presensi tersebut
4. Ubah status, jam masuk, atau keterangan
5. Klik "Update Presensi"

**Menghapus Presensi:**
1. Klik icon tempat sampah (Delete) di baris presensi
2. Konfirmasi penghapusan

**Filter Daftar Presensi:**
- Gunakan filter tanggal untuk melihat presensi pada tanggal tertentu
- Tabel akan menampilkan semua presensi pada tanggal yang dipilih

**Catatan:**
- Sistem akan mencegah duplikasi (1 guru hanya bisa 1 presensi per hari)
- Jika guru sudah ada presensi, gunakan tombol Edit untuk mengubah
- Semua perubahan akan tercatat di Log Aktivitas

### 4. Log Aktivitas

Melihat semua aktivitas sistem:
- Login/Logout user
- Input presensi
- Edit data
- Timestamp lengkap

## 👨‍🏫 Panduan untuk Guru

### 1. Home (Input Presensi)

**Absen Hadir:**
1. Pastikan Anda berada di area sekolah (dalam radius 100m)
2. Klik tombol "HADIR" (hijau)
3. Browser akan meminta izin akses lokasi - klik "Izinkan"
4. Sistem akan validasi lokasi Anda
5. Jika valid, presensi tersimpan
6. Jika di luar radius, akan muncul pesan error

**Absen Izin:**
1. Klik tombol "IZIN" (kuning)
2. Isi keterangan izin
3. Klik "Simpan"

**Absen Sakit:**
1. Klik tombol "SAKIT" (merah)
2. Isi keterangan sakit
3. Klik "Simpan"

**Catatan:**
- Anda hanya bisa absen 1x per hari
- Setelah absen, tombol akan disabled dan menampilkan status

### 2. Riwayat Saya

**Melihat Riwayat:**
1. Pilih rentang tanggal (Dari - Sampai)
2. Atau gunakan preset: 7 Hari / 30 Hari
3. Tabel akan menampilkan riwayat presensi

**Download Laporan:**

**PDF:**
1. Pilih rentang tanggal
2. Klik tombol "PDF"
3. File PDF akan terdownload

**Excel:**
1. Pilih rentang tanggal
2. Klik tombol "Excel"
3. File Excel akan terdownload

### 3. Status Rekan

Melihat status kehadiran guru lain hari ini:
- **Hijau**: Hadir (dengan jam masuk)
- **Kuning**: Izin
- **Merah**: Sakit
- **Abu-abu**: Belum Absen

## 📍 Tips Geolocation

### Jika Lokasi Tidak Terdeteksi:

1. **Pastikan GPS aktif** di perangkat Anda
2. **Izinkan akses lokasi** saat browser meminta
3. **Gunakan HTTPS** atau localhost
4. **Refresh halaman** dan coba lagi

### Jika Selalu "Di Luar Jangkauan":

1. Cek koordinat sekolah di `src/data/dummyData.js`
2. Pastikan koordinat sesuai dengan lokasi sekolah
3. Untuk testing, bisa perbesar radius sementara

### Testing di Komputer:

1. Buka Chrome DevTools (F12)
2. Tekan Ctrl+Shift+P
3. Ketik "sensors"
4. Pilih lokasi atau input koordinat custom

## 💡 Tips & Trik

### Untuk Admin:

1. **Backup Data**: Export data guru secara berkala
2. **Monitor Log**: Cek log aktivitas untuk audit
3. **Edit Manual**: Gunakan fitur Edit Presensi untuk koreksi

### Untuk Guru:

1. **Absen Pagi**: Absen segera saat tiba di sekolah
2. **Cek Riwayat**: Review riwayat presensi secara berkala
3. **Download Laporan**: Simpan laporan bulanan untuk arsip

## ⚠️ Troubleshooting

### "Anda berada di luar jangkauan sekolah"

**Penyebab:**
- Lokasi GPS tidak akurat
- Koordinat sekolah salah
- Radius terlalu kecil

**Solusi:**
1. Pastikan GPS aktif dan akurat
2. Coba lagi di lokasi yang lebih dekat dengan titik pusat sekolah
3. Hubungi admin untuk cek koordinat sekolah

### "Gagal mendapatkan lokasi"

**Penyebab:**
- Akses lokasi diblokir
- GPS tidak aktif
- Browser tidak support

**Solusi:**
1. Izinkan akses lokasi di browser
2. Aktifkan GPS/Location Services
3. Gunakan browser modern (Chrome, Firefox, Safari)

### Data Hilang

**Penyebab:**
- Browser cache dihapus
- Mode incognito/private

**Solusi:**
1. Jangan gunakan mode incognito
2. Jangan clear browser data
3. Admin bisa input ulang via Edit Presensi

## 📱 Akses Mobile

Aplikasi fully responsive dan optimal untuk mobile:

1. Buka browser di HP
2. Akses URL aplikasi
3. Login dengan akun guru
4. Interface akan otomatis menyesuaikan (bottom navigation)

**Rekomendasi Browser Mobile:**
- Chrome (Android)
- Safari (iOS)
- Firefox

## 🔒 Keamanan

1. **Jangan share password** dengan orang lain
2. **Logout** setelah selesai menggunakan
3. **Ganti password default** di production
4. **Backup data** secara berkala

## 📞 Bantuan

Jika mengalami kendala:
1. Cek panduan troubleshooting di atas
2. Hubungi admin sekolah
3. Buat issue di GitHub repository
