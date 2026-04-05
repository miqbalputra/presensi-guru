# 📱 SISTEM GEOPRESENSI SEKOLAH
## Dokumentasi Lengkap untuk Kepala Sekolah, Admin, dan Guru

---

## 📋 DAFTAR ISI

1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Fitur dan Manfaat](#fitur-dan-manfaat)
3. [Panduan untuk Kepala Sekolah](#panduan-kepala-sekolah)
4. [Panduan untuk Admin](#panduan-admin)
5. [Panduan untuk Guru](#panduan-guru)
6. [FAQ (Pertanyaan Umum)](#faq)

---

## 🎯 TENTANG APLIKASI

**GeoPresensi Sekolah** adalah sistem presensi digital berbasis web yang menggunakan teknologi GPS untuk memvalidasi kehadiran guru. Sistem ini dirancang untuk:

- ✅ Memudahkan pencatatan kehadiran guru secara real-time
- ✅ Memastikan guru berada di lokasi sekolah saat presensi
- ✅ Menyediakan laporan kehadiran yang akurat dan transparan
- ✅ Mengurangi manipulasi data kehadiran
- ✅ Meningkatkan disiplin dan akuntabilitas

**Akses Aplikasi:** https://kelolasekolah.web.id

---

## 🌟 FITUR DAN MANFAAT

### 1. **Presensi Berbasis GPS**
**Fitur:**
- Guru melakukan presensi melalui smartphone/komputer
- Sistem memvalidasi lokasi guru menggunakan GPS
- Guru harus berada dalam radius tertentu dari sekolah (default: 500 meter)

**Manfaat:**
- Mencegah presensi dari luar sekolah
- Memastikan guru benar-benar hadir di lokasi
- Mengurangi kecurangan presensi

---

### 2. **Tiga Jenis Status Kehadiran**
**Fitur:**
- **HADIR:** Guru hadir tepat waktu di sekolah
- **IZIN:** Guru tidak hadir dengan alasan tertentu (perlu keterangan)
- **SAKIT:** Guru tidak hadir karena sakit (perlu keterangan)

**Manfaat:**
- Pencatatan status yang jelas dan terstruktur
- Memudahkan analisis pola kehadiran
- Dokumentasi alasan ketidakhadiran

---

### 3. **Deteksi Keterlambatan Otomatis**
**Fitur:**
- Sistem otomatis mendeteksi jika guru terlambat
- Status berubah menjadi "Hadir Terlambat" jika melewati batas waktu
- Keterangan otomatis mencatat berapa menit terlambat
- Toleransi keterlambatan dapat diatur (default: 15 menit)

**Manfaat:**
- Meningkatkan kedisiplinan waktu
- Data keterlambatan tercatat otomatis
- Transparansi dalam penilaian kehadiran

---

### 4. **Jadwal Piket Guru**
**Fitur:**
- Admin dapat mengatur jadwal piket per hari per guru
- Guru yang piket mendapat notifikasi di dashboard
- Sistem mendeteksi jika guru piket terlambat
- Warning khusus untuk keterlambatan piket

**Manfaat:**
- Manajemen jadwal piket yang terorganisir
- Reminder otomatis untuk guru yang piket
- Monitoring keterlambatan piket
- Meningkatkan tanggung jawab tugas piket

---

### 5. **Presensi Pulang**
**Fitur:**
- Guru dapat melakukan presensi pulang
- Tersedia mulai pukul 09:00 WIB
- Validasi GPS juga berlaku untuk presensi pulang

**Manfaat:**
- Monitoring jam kerja lengkap (masuk dan pulang)
- Data kehadiran lebih komprehensif
- Transparansi waktu kerja guru

---

### 6. **Manajemen Hari Libur**
**Fitur:**
- Admin dapat menambah/edit/hapus hari libur
- Sistem otomatis memblokir presensi di hari libur
- Weekend (Sabtu-Minggu) otomatis dianggap libur
- Notifikasi hari libur di dashboard guru

**Manfaat:**
- Tidak ada presensi di hari libur
- Kalender libur yang jelas
- Menghindari kesalahan presensi

---

### 7. **Dashboard Real-time**
**Fitur:**
- **Dashboard Admin:** Melihat semua guru yang sudah/belum presensi hari ini
- **Dashboard Guru:** Melihat status presensi sendiri
- Update otomatis setelah presensi
- Statistik kehadiran

**Manfaat:**
- Monitoring kehadiran secara real-time
- Kepala sekolah dapat langsung melihat siapa yang belum hadir
- Transparansi data kehadiran

---

### 8. **Statistik Kehadiran Individual**
**Fitur:**
- Setiap guru dapat melihat statistik kehadiran sendiri
- Filter periode: Bulan Ini, Bulan Lalu, 3 Bulan, Tahun Ini
- Persentase kehadiran otomatis
- Rincian: Total Hadir, Terlambat, Izin, Sakit
- Riwayat presensi lengkap dengan tanggal dan jam

**Manfaat:**
- Guru dapat memantau kehadiran sendiri
- Self-evaluation kedisiplinan
- Data untuk penilaian kinerja
- Transparansi pencatatan

---

### 9. **Download Laporan Excel**
**Fitur:**
- Download laporan kehadiran dalam format Excel (.xlsx)
- Filter berdasarkan periode tanggal
- Filter berdasarkan guru tertentu atau semua guru
- Data lengkap: Nama, Tanggal, Status, Jam Masuk, Jam Pulang, Keterangan

**Manfaat:**
- Laporan untuk keperluan administrasi
- Data untuk evaluasi kinerja
- Arsip digital yang rapi
- Mudah dibagikan ke pihak terkait

---

### 10. **Log Aktivitas**
**Fitur:**
- Semua aktivitas tercatat otomatis
- Mencatat: Siapa, Kapan, Aktivitas Apa, Status
- Pagination untuk data yang banyak
- Riwayat lengkap semua presensi

**Manfaat:**
- Audit trail yang jelas
- Transparansi sistem
- Deteksi anomali atau kesalahan
- Dokumentasi lengkap

---

### 11. **Status Rekan Kerja**
**Fitur:**
- Guru dapat melihat status kehadiran rekan kerja hari ini
- Informasi: Nama, Status, Jam Hadir
- Update real-time

**Manfaat:**
- Transparansi antar guru
- Koordinasi tugas lebih mudah
- Mengetahui siapa yang hadir/tidak hadir

---

### 12. **Pengaturan Fleksibel (Admin)**
**Fitur:**
Admin dapat mengatur:
- Jam masuk normal (default: 07:20)
- Toleransi keterlambatan (default: 15 menit)
- Radius GPS (default: 500 meter)
- Koordinat lokasi sekolah
- Mode testing (untuk uji coba tanpa GPS)
- Jam piket default
- Aturan terlambat piket

**Manfaat:**
- Sistem dapat disesuaikan dengan kebijakan sekolah
- Fleksibilitas pengaturan
- Tidak perlu ubah kode program
- Mudah beradaptasi dengan perubahan aturan

---

### 13. **Mode Testing GPS**
**Fitur:**
- Admin dapat mengaktifkan/nonaktifkan mode testing
- Saat aktif: Validasi GPS dinonaktifkan
- Cocok untuk demo atau testing sistem

**Manfaat:**
- Testing sistem tanpa harus di lokasi sekolah
- Demo aplikasi untuk pihak luar
- Troubleshooting masalah GPS
- Fleksibilitas pengembangan

---

### 14. **Keamanan dan Privasi**
**Fitur:**
- Login dengan username dan password
- Session timeout otomatis (30 menit tidak aktif)
- Role-based access (Admin dan Guru)
- Data GPS hanya untuk validasi, tidak disimpan permanen

**Manfaat:**
- Data kehadiran aman
- Privasi guru terjaga
- Akses sesuai wewenang
- Mencegah akses tidak sah

---

### 15. **Responsive Design**
**Fitur:**
- Tampilan otomatis menyesuaikan ukuran layar
- Dapat diakses dari smartphone, tablet, atau komputer
- Antarmuka user-friendly

**Manfaat:**
- Guru dapat presensi dari smartphone
- Tidak perlu aplikasi khusus, cukup browser
- Akses kapan saja, di mana saja (dalam radius sekolah)
- Hemat biaya (tidak perlu hardware khusus)

---

## 👔 PANDUAN UNTUK KEPALA SEKOLAH

### Akses Sistem
Kepala sekolah dapat menggunakan akun **Admin** untuk:
- Monitoring kehadiran semua guru
- Melihat laporan dan statistik
- Mengatur kebijakan presensi
- Download laporan untuk evaluasi

**Login:** https://kelolasekolah.web.id/admin
- Username: (hubungi admin IT)
- Password: (hubungi admin IT)

---

### Dashboard Kepala Sekolah

Setelah login, Anda akan melihat:

#### 1. **Widget "Belum Presensi Hari Ini"**
- Menampilkan daftar guru yang belum presensi
- Update real-time
- Warna merah untuk menarik perhatian
- Jika semua sudah presensi, muncul widget hijau

**Manfaat:** Langsung tahu siapa yang belum hadir tanpa perlu cek satu-satu

#### 2. **Statistik Kehadiran**
- Total guru hadir hari ini
- Persentase kehadiran
- Grafik tren kehadiran

#### 3. **Tabel Presensi Hari Ini**
- Daftar semua guru dengan status
- Badge warna:
  - 🟢 Hijau: Hadir
  - 🟡 Kuning: Hadir Terlambat
  - 🔵 Biru: Izin
  - 🔴 Merah: Sakit
- Jam hadir tercatat

---

### Menu yang Tersedia

#### 📊 **Dashboard**
Ringkasan kehadiran hari ini

#### 👥 **Data Guru**
- Lihat daftar semua guru
- Tambah/edit/hapus data guru
- Atur username dan password

#### 📅 **Hari Libur**
- Lihat kalender hari libur
- Tambah hari libur nasional/sekolah
- Edit/hapus hari libur

#### 🗓️ **Jadwal Piket**
- Atur jadwal piket per hari
- Assign guru untuk piket
- Set jam piket

#### 📥 **Download Laporan**
- Download laporan Excel
- Filter berdasarkan periode
- Filter berdasarkan guru

#### 📋 **Log Aktivitas**
- Lihat semua aktivitas presensi
- Audit trail lengkap

#### ⚙️ **Pengaturan**
- Atur jam masuk normal
- Atur toleransi keterlambatan
- Atur radius GPS
- Atur koordinat sekolah
- Mode testing
- Aturan terlambat piket

---

### Tips Monitoring Efektif

1. **Cek Dashboard Setiap Pagi**
   - Buka dashboard sekitar jam 08:00
   - Lihat widget "Belum Presensi Hari Ini"
   - Follow up guru yang belum hadir

2. **Review Laporan Mingguan**
   - Download laporan setiap akhir minggu
   - Analisis pola keterlambatan
   - Identifikasi guru yang sering terlambat

3. **Evaluasi Bulanan**
   - Download laporan bulanan
   - Hitung persentase kehadiran per guru
   - Gunakan untuk penilaian kinerja

4. **Atur Kebijakan yang Jelas**
   - Tentukan jam masuk yang sesuai
   - Tentukan toleransi keterlambatan
   - Komunikasikan ke semua guru

---

### Pengaturan yang Direkomendasikan

**Untuk Sekolah Umum:**
- Jam masuk: 07:20
- Toleransi: 15 menit
- Radius GPS: 500 meter
- Mode testing: Nonaktif
- Terlambat piket = Hadir terlambat: Aktif (untuk disiplin ketat)

**Untuk Sekolah Fleksibel:**
- Jam masuk: 07:30
- Toleransi: 20 menit
- Radius GPS: 1000 meter
- Mode testing: Nonaktif
- Terlambat piket = Hadir terlambat: Nonaktif (warning saja)

---

## 🔧 PANDUAN UNTUK ADMIN

### Tugas dan Tanggung Jawab
Admin bertanggung jawab untuk:
- Mengelola data guru
- Mengatur jadwal piket
- Mengelola hari libur
- Mengatur pengaturan sistem
- Monitoring kehadiran
- Generate laporan

**Login:** https://kelolasekolah.web.id/admin

---

### 1. Mengelola Data Guru

**Langkah:**
1. Login sebagai admin
2. Klik menu **"Data Guru"**
3. Untuk menambah guru baru:
   - Klik tombol **"+ Tambah Guru"**
   - Isi form: Nama, Username, Password, Jabatan
   - Klik **"Simpan"**
4. Untuk edit guru:
   - Klik tombol **"Edit"** pada guru yang ingin diubah
   - Ubah data yang diperlukan
   - Klik **"Simpan"**
5. Untuk hapus guru:
   - Klik tombol **"Hapus"**
   - Konfirmasi penghapusan

**Tips:**
- Username sebaiknya sederhana (contoh: guru1, guru2)
- Password awal bisa sama untuk semua, nanti guru bisa ubah sendiri
- Jabatan diisi sesuai posisi (Guru Kelas, Guru Mapel, dll)

---

### 2. Mengatur Hari Libur

**Langkah:**
1. Klik menu **"Hari Libur"**
2. Untuk menambah hari libur:
   - Klik tombol **"+ Tambah Hari Libur"**
   - Pilih tanggal
   - Isi nama hari libur (contoh: Hari Raya Idul Fitri)
   - Klik **"Simpan"**
3. Untuk edit/hapus:
   - Gunakan tombol Edit/Hapus pada daftar

**Tips:**
- Input hari libur nasional di awal tahun
- Input hari libur sekolah (study tour, dll)
- Weekend (Sabtu-Minggu) otomatis libur, tidak perlu diinput

---

### 3. Mengatur Jadwal Piket

**Langkah:**
1. Klik menu **"Jadwal Piket"**
2. Pilih hari (Senin - Minggu)
3. Klik **"+ Tambah Jadwal"**
4. Pilih guru dari dropdown
5. Set jam piket (contoh: 07:00)
6. Isi keterangan jika perlu
7. Klik **"Simpan"**

**Tips:**
- Satu guru bisa piket di beberapa hari
- Jam piket biasanya lebih awal dari jam masuk normal
- Koordinasikan dengan guru sebelum assign jadwal

---

### 4. Mengatur Pengaturan Sistem

**Langkah:**
1. Klik menu **"Pengaturan"**
2. Atur setiap setting sesuai kebutuhan:

#### **Jam Masuk Normal**
- Isi jam masuk sesuai aturan sekolah
- Format: HH:MM (contoh: 07:20)
- Klik **"Simpan"**

#### **Toleransi Terlambat**
- Isi dalam menit (contoh: 15)
- Guru yang terlambat 1-15 menit = "Terlambat"
- Lebih dari 15 menit = "Terlambat Parah"
- Klik **"Simpan"**

#### **Radius GPS**
- Isi dalam meter (contoh: 500)
- Guru harus dalam radius ini untuk bisa presensi
- Jangan terlalu kecil (guru kesulitan presensi)
- Jangan terlalu besar (validasi tidak efektif)
- Klik **"Simpan"**

#### **Lokasi Sekolah**
- Isi nama sekolah
- Isi koordinat GPS (latitude dan longitude)
- **Cara mendapatkan koordinat:**
  1. Buka Google Maps
  2. Cari lokasi sekolah
  3. Klik kanan pada pin lokasi
  4. Pilih koordinat yang muncul (akan ter-copy)
  5. Paste di form (format: -5.1477, 119.4327)
- Klik **"Simpan"**

#### **Mode Testing GPS**
- **Aktif (Orange):** Validasi GPS dinonaktifkan
  - Gunakan untuk testing/demo
  - Guru bisa presensi dari mana saja
- **Nonaktif (Merah):** Validasi GPS aktif
  - Gunakan untuk produksi
  - Guru harus di dalam radius sekolah
- Toggle switch untuk ubah
- Otomatis tersimpan

#### **Terlambat Piket = Hadir Terlambat**
- **Aktif (Merah):** Terlambat piket ubah status jadi "Hadir Terlambat"
  - Cocok untuk aturan ketat
  - Muncul di statistik
- **Nonaktif (Abu-abu):** Terlambat piket hanya warning
  - Cocok untuk aturan fleksibel
  - Tidak ubah status
- Toggle switch untuk ubah
- Otomatis tersimpan

---

### 5. Download Laporan

**Langkah:**
1. Klik menu **"Download Laporan"**
2. Pilih periode:
   - Tanggal Mulai
   - Tanggal Selesai
3. Pilih guru:
   - "Semua Guru" untuk laporan lengkap
   - Pilih nama guru untuk laporan individual
4. Klik **"Download Excel"**
5. File akan terdownload otomatis

**Tips:**
- Laporan harian: Set tanggal sama (contoh: 26/12/2025 - 26/12/2025)
- Laporan mingguan: Set 7 hari (contoh: 20/12/2025 - 26/12/2025)
- Laporan bulanan: Set 1 bulan (contoh: 01/12/2025 - 31/12/2025)
- Simpan laporan untuk arsip

---

### 6. Monitoring Log Aktivitas

**Langkah:**
1. Klik menu **"Log Aktivitas"**
2. Lihat daftar semua aktivitas
3. Gunakan pagination untuk navigasi
4. Perhatikan:
   - Siapa yang melakukan aktivitas
   - Kapan (tanggal dan jam)
   - Aktivitas apa
   - Status apa

**Tips:**
- Cek log jika ada laporan anomali
- Gunakan untuk audit
- Identifikasi pola presensi

---

### Troubleshooting Umum

**Masalah: Guru tidak bisa presensi (GPS error)**
- Cek apakah Mode Testing aktif (jika ya, nonaktifkan)
- Cek apakah koordinat sekolah sudah benar
- Cek apakah radius GPS tidak terlalu kecil
- Minta guru aktifkan GPS di smartphone

**Masalah: Guru lupa password**
- Login sebagai admin
- Masuk menu Data Guru
- Edit guru tersebut
- Set password baru
- Beritahu guru password barunya

**Masalah: Presensi tidak muncul di dashboard**
- Refresh halaman (F5)
- Cek di Log Aktivitas apakah presensi tercatat
- Cek koneksi internet

---

## 👨‍🏫 PANDUAN UNTUK GURU

### Akses Sistem
**Login:** https://kelolasekolah.web.id/guru
- Username: (diberikan oleh admin)
- Password: (diberikan oleh admin)

**Perangkat yang Bisa Digunakan:**
- Smartphone (Android/iOS)
- Tablet
- Laptop/Komputer

**Browser yang Direkomendasikan:**
- Google Chrome
- Mozilla Firefox
- Safari (untuk iOS)

---

### Langkah-langkah Presensi

#### **Presensi HADIR**

1. **Pastikan GPS Aktif**
   - Buka Settings smartphone
   - Aktifkan Location/GPS
   - Set ke "High Accuracy" untuk hasil terbaik

2. **Buka Aplikasi**
   - Buka browser (Chrome/Firefox/Safari)
   - Ketik: https://kelolasekolah.web.id/guru
   - Atau gunakan bookmark jika sudah disimpan

3. **Login**
   - Masukkan username
   - Masukkan password
   - Klik **"Login"**

4. **Pastikan Berada di Sekolah**
   - Anda harus berada dalam radius sekolah (default: 500 meter)
   - Jika terlalu jauh, sistem akan menolak presensi

5. **Klik Tombol HADIR**
   - Tombol hijau besar di tengah
   - Browser akan minta izin akses lokasi → Klik **"Allow/Izinkan"**
   - Tunggu proses validasi GPS
   - Jika berhasil, muncul pesan sukses

6. **Cek Status**
   - Status Anda akan berubah menjadi "Anda Sudah Absen"
   - Jam hadir tercatat
   - Jika terlambat, akan ada badge "TERLAMBAT"

#### **Presensi IZIN atau SAKIT**

1. Login ke sistem
2. Klik tombol **"IZIN"** (kuning) atau **"SAKIT"** (merah)
3. Isi keterangan (wajib):
   - Untuk Izin: Alasan izin (contoh: "Keperluan keluarga")
   - Untuk Sakit: Jenis sakit (contoh: "Demam tinggi")
4. Klik **"Simpan"**
5. Status tercatat, tidak perlu GPS

**Catatan:** Presensi Izin/Sakit tidak memerlukan validasi GPS, bisa dari mana saja.

#### **Presensi PULANG**

1. Presensi pulang tersedia mulai **pukul 09:00 WIB**
2. Pastikan Anda sudah presensi HADIR di pagi hari
3. Pastikan GPS aktif dan berada di sekolah
4. Klik tombol **"PRESENSI PULANG"** (biru)
5. Tunggu validasi GPS
6. Jam pulang tercatat

**Catatan:** Jika belum jam 09:00, tombol tidak akan muncul.

---

### Dashboard Guru

Setelah login, Anda akan melihat:

#### 1. **Tanggal dan Informasi**
- Tanggal lengkap hari ini
- Jam masuk normal dan toleransi
- Badge "Mode Testing Aktif" (jika admin aktifkan)
- Badge "Jadwal Piket" (jika Anda piket hari ini)

#### 2. **Status Hari Libur**
- Jika hari libur, muncul notifikasi
- Tombol presensi tidak muncul
- Tidak perlu presensi di hari libur

#### 3. **Status Presensi Anda**
- Jika belum presensi: Muncul 3 tombol (Hadir, Izin, Sakit)
- Jika sudah presensi: Muncul status dan jam
- Jika sudah hadir: Muncul tombol Presensi Pulang (setelah jam 09:00)

#### 4. **Menu Navigasi Bawah**
- **Home:** Dashboard utama
- **Riwayat Saya:** Lihat riwayat presensi
- **Status Rekan:** Lihat status rekan kerja
- **Statistik Saya:** Lihat statistik kehadiran

---

### Menu Riwayat Saya

**Fungsi:** Melihat semua riwayat presensi Anda

**Cara Pakai:**
1. Klik tab **"Riwayat Saya"** di menu bawah
2. Lihat daftar presensi dari yang terbaru
3. Informasi yang ditampilkan:
   - Tanggal
   - Status (Hadir/Terlambat/Izin/Sakit)
   - Jam Masuk
   - Jam Pulang (jika ada)
   - Keterangan (jika ada)

**Tips:**
- Gunakan untuk cek apakah presensi tercatat
- Cek jam hadir untuk memastikan tidak terlambat
- Screenshot jika perlu bukti

---

### Menu Status Rekan

**Fungsi:** Melihat status kehadiran rekan kerja hari ini

**Cara Pakai:**
1. Klik tab **"Status Rekan"** di menu bawah
2. Lihat daftar semua guru dengan status hari ini
3. Informasi yang ditampilkan:
   - Nama guru
   - Status (Hadir/Terlambat/Izin/Sakit/Belum Presensi)
   - Jam hadir (jika sudah presensi)

**Manfaat:**
- Tahu siapa yang sudah/belum hadir
- Koordinasi tugas lebih mudah
- Transparansi kehadiran

---

### Menu Statistik Saya

**Fungsi:** Melihat statistik kehadiran Anda

**Cara Pakai:**
1. Klik tab **"Statistik Saya"** di menu bawah
2. Pilih periode di dropdown:
   - **Bulan Ini:** Kehadiran bulan berjalan
   - **Bulan Lalu:** Kehadiran bulan sebelumnya
   - **3 Bulan:** Kehadiran 3 bulan terakhir
   - **Tahun Ini:** Kehadiran tahun berjalan
3. Lihat statistik:
   - **Persentase Kehadiran:** Angka besar di atas (contoh: 95.5%)
   - **Total Hadir:** Jumlah hari hadir
   - **Terlambat:** Jumlah hari terlambat
   - **Izin:** Jumlah hari izin
   - **Sakit:** Jumlah hari sakit
4. Scroll ke bawah untuk lihat **Riwayat Presensi** periode tersebut

**Manfaat:**
- Self-monitoring kehadiran
- Evaluasi kedisiplinan sendiri
- Data untuk penilaian kinerja

---

### Tips dan Trik

#### **Agar Presensi Lancar:**
1. **Aktifkan GPS sebelum presensi**
   - Jangan tunggu sampai mau presensi baru aktifkan
   - GPS butuh waktu untuk lock lokasi

2. **Gunakan koneksi internet yang stabil**
   - WiFi sekolah atau data seluler
   - Pastikan sinyal kuat

3. **Presensi di area terbuka**
   - GPS lebih akurat di area terbuka
   - Hindari presensi di dalam ruangan tertutup

4. **Bookmark halaman login**
   - Simpan link di bookmark browser
   - Lebih cepat akses

5. **Jangan tunggu mepet**
   - Presensi 5-10 menit sebelum jam masuk
   - Antisipasi masalah teknis

#### **Jika Terlambat:**
- Tetap lakukan presensi
- Sistem otomatis catat sebagai "Hadir Terlambat"
- Lebih baik terlambat tercatat daripada tidak presensi

#### **Jika Lupa Presensi:**
- Hubungi admin untuk input manual
- Jelaskan alasan lupa
- Berikan bukti kehadiran jika ada

#### **Jika GPS Error:**
- Cek apakah GPS smartphone aktif
- Coba keluar dan masuk lagi ke aplikasi
- Coba di area yang lebih terbuka
- Restart smartphone jika perlu
- Hubungi admin jika masih error

---

### Notifikasi dan Pesan

#### **Pesan Sukses (Hijau)**
- "Presensi hadir berhasil disimpan!"
- Artinya: Presensi Anda tercatat dengan baik

#### **Pesan Warning (Orange)**
- "Presensi hadir berhasil disimpan! ⚠️ Anda terlambat hadir piket X menit..."
- Artinya: Presensi tercatat, tapi Anda terlambat piket

#### **Pesan Error (Merah)**
- "Anda berada di luar jangkauan sekolah..."
- Artinya: Anda terlalu jauh dari sekolah, tidak bisa presensi
- Solusi: Mendekatlah ke sekolah

- "Gagal mendapatkan lokasi..."
- Artinya: GPS tidak bisa mendeteksi lokasi
- Solusi: Aktifkan GPS, izinkan akses lokasi, coba lagi

- "Tidak dapat melakukan presensi pada hari libur..."
- Artinya: Hari ini libur, tidak perlu presensi

---

### Keamanan Akun

#### **Ganti Password (Opsional)**
Saat ini fitur ganti password belum tersedia. Jika ingin ganti password:
1. Hubungi admin
2. Minta admin untuk set password baru
3. Admin akan beritahu password baru Anda

#### **Logout**
1. Klik tombol **"Logout"** di pojok kanan atas
2. Anda akan keluar dari sistem
3. Harus login lagi untuk akses

#### **Auto Logout**
- Sistem otomatis logout setelah 30 menit tidak aktif
- Untuk keamanan akun Anda
- Jika ter-logout, login lagi

---

### FAQ Guru

**Q: Apakah bisa presensi dari rumah?**
A: Tidak. Sistem memvalidasi GPS, Anda harus berada di sekolah (dalam radius yang ditentukan).

**Q: Bagaimana jika smartphone tidak punya GPS?**
A: Semua smartphone modern punya GPS. Pastikan GPS aktif di Settings. Jika benar-benar tidak ada, hubungi admin untuk solusi alternatif.

**Q: Apakah bisa presensi pakai komputer?**
A: Bisa, tapi komputer harus punya GPS atau berada di lokasi sekolah dengan WiFi yang ter-track lokasinya.

**Q: Bagaimana jika lupa username/password?**
A: Hubungi admin untuk reset.

**Q: Apakah presensi pulang wajib?**
A: Tergantung kebijakan sekolah. Tapi sebaiknya presensi pulang untuk data lengkap.

**Q: Bagaimana jika GPS error terus?**
A: Hubungi admin. Admin bisa aktifkan Mode Testing sementara atau input manual.

**Q: Apakah data GPS saya disimpan?**
A: Tidak. GPS hanya untuk validasi saat presensi, tidak disimpan permanen.

---

## ❓ FAQ (PERTANYAAN UMUM)

### Umum

**Q: Apakah perlu install aplikasi?**
A: Tidak. Sistem berbasis web, cukup buka di browser (Chrome, Firefox, Safari).

**Q: Apakah gratis?**
A: Tergantung kebijakan sekolah. Hubungi admin IT untuk informasi biaya.

**Q: Apakah data aman?**
A: Ya. Sistem menggunakan enkripsi dan session management. Data hanya bisa diakses oleh yang berwenang.

**Q: Apakah bisa diakses dari luar sekolah?**
A: Bisa untuk login dan lihat data. Tapi untuk presensi HADIR, harus di sekolah (validasi GPS).

**Q: Bagaimana jika internet mati?**
A: Presensi memerlukan internet. Jika internet mati, tunggu sampai nyala lagi atau hubungi admin untuk input manual.

---

### Teknis

**Q: Berapa radius GPS yang digunakan?**
A: Default 500 meter, bisa diatur admin. Cek di dashboard atau tanya admin.

**Q: Apakah bisa presensi jika GPS tidak akurat?**
A: Jika GPS error, hubungi admin. Admin bisa aktifkan Mode Testing sementara.

**Q: Bagaimana sistem tahu saya terlambat?**
A: Sistem membandingkan jam presensi dengan jam masuk normal yang diatur admin.

**Q: Apakah weekend otomatis libur?**
A: Ya. Sabtu dan Minggu otomatis dianggap libur, tidak perlu presensi.

**Q: Bagaimana jika presensi tidak tercatat?**
A: Cek di menu Riwayat Saya atau Log Aktivitas. Jika benar tidak tercatat, hubungi admin untuk input manual.

---

### Kebijakan

**Q: Berapa toleransi keterlambatan?**
A: Default 15 menit, bisa diatur admin. Tanya admin untuk kebijakan sekolah Anda.

**Q: Apakah terlambat piket sama dengan terlambat masuk?**
A: Tergantung setting admin. Admin bisa atur apakah terlambat piket mengubah status atau hanya warning.

**Q: Bagaimana jika sakit tapi tidak bisa presensi?**
A: Hubungi admin. Admin bisa input manual dengan status Sakit dan keterangan.

**Q: Apakah bisa presensi untuk orang lain?**
A: Tidak. Setiap guru harus presensi dengan akun sendiri. Presensi untuk orang lain adalah pelanggaran.

---

### Troubleshooting

**Q: Kenapa tombol presensi tidak muncul?**
A: Kemungkinan:
- Hari libur (cek notifikasi di dashboard)
- Sudah presensi hari ini (cek status)
- Sistem maintenance (hubungi admin)

**Q: Kenapa muncul "Anda berada di luar jangkauan sekolah"?**
A: Anda terlalu jauh dari sekolah. Mendekatlah ke area sekolah dan coba lagi.

**Q: Kenapa presensi pulang tidak muncul?**
A: Kemungkinan:
- Belum jam 09:00 (presensi pulang mulai jam 09:00)
- Belum presensi hadir di pagi hari
- Status bukan "Hadir" (Izin/Sakit tidak ada presensi pulang)

**Q: Kenapa statistik tidak update?**
A: Refresh halaman (F5) atau logout dan login lagi.

---

## 📞 KONTAK DUKUNGAN

Jika mengalami masalah atau butuh bantuan:

**Admin IT Sekolah:**
- Nama: (isi nama admin)
- Email: (isi email admin)
- Telepon: (isi nomor admin)
- Jam kerja: Senin-Jumat, 07:00-15:00

**Developer:**
- Email: (isi email developer)
- Untuk masalah teknis sistem

---

## 📝 CATATAN PENTING

### Untuk Kepala Sekolah:
1. Sosialisasikan sistem ke semua guru sebelum implementasi
2. Berikan training singkat cara penggunaan
3. Tentukan kebijakan yang jelas (jam masuk, toleransi, sanksi)
4. Monitor secara berkala dan evaluasi
5. Dengarkan feedback guru untuk perbaikan

### Untuk Admin:
1. Pastikan data guru sudah lengkap sebelum go-live
2. Test sistem terlebih dahulu (gunakan Mode Testing)
3. Siapkan SOP troubleshooting
4. Backup data secara berkala
5. Update pengaturan sesuai kebijakan yang berubah

### Untuk Guru:
1. Simpan username dan password dengan aman
2. Biasakan presensi tepat waktu
3. Jangan tunggu mepet jam masuk
4. Laporkan masalah teknis segera ke admin
5. Gunakan fitur statistik untuk self-monitoring

---

## 🎯 KESIMPULAN

Sistem GeoPresensi Sekolah dirancang untuk:
- ✅ Meningkatkan disiplin dan akuntabilitas
- ✅ Memudahkan administrasi kehadiran
- ✅ Menyediakan data akurat untuk evaluasi
- ✅ Mengurangi manipulasi data
- ✅ Transparansi untuk semua pihak

**Keberhasilan sistem ini tergantung pada:**
- Komitmen semua pihak (kepala sekolah, admin, guru)
- Sosialisasi yang baik
- Kebijakan yang jelas dan konsisten
- Dukungan teknis yang responsif
- Evaluasi dan perbaikan berkelanjutan

---

## 📅 VERSI DOKUMEN

- **Versi:** 1.0
- **Tanggal:** 26 Desember 2025
- **Dibuat oleh:** Tim IT Sekolah
- **Terakhir diupdate:** 26 Desember 2025

---

**Terima kasih telah menggunakan Sistem GeoPresensi Sekolah!**

Untuk pertanyaan lebih lanjut, silakan hubungi admin IT sekolah.

---

*Dokumen ini bersifat rahasia dan hanya untuk internal sekolah.*
