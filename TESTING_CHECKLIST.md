# ✅ Testing Checklist - GeoPresensi Sekolah

## Fitur Baru yang Perlu Ditest

### 1. Update Username & Password Guru

**Test Case 1: Update Username**
- [ ] Login sebagai admin
- [ ] Buka Data Guru
- [ ] Edit salah satu guru
- [ ] Ubah username (misal: guru1 → guru_baru)
- [ ] Simpan
- [ ] Logout
- [ ] Login dengan username baru
- [ ] ✅ Berhasil login dengan username baru

**Test Case 2: Update Password**
- [ ] Login sebagai admin
- [ ] Edit guru
- [ ] Ubah password (misal: guru123 → password_baru)
- [ ] Simpan
- [ ] Logout
- [ ] Login dengan password baru
- [ ] ✅ Berhasil login dengan password baru

**Test Case 3: Password Kosong (Tidak Berubah)**
- [ ] Login sebagai admin
- [ ] Edit guru
- [ ] Kosongkan field password
- [ ] Simpan
- [ ] Logout
- [ ] Login dengan password lama
- [ ] ✅ Berhasil login (password tidak berubah)

---

### 2. Multiple Jabatan

**Test Case 1: Tambah Guru dengan Multiple Jabatan**
- [ ] Login sebagai admin
- [ ] Klik "Tambah Guru"
- [ ] Isi data guru
- [ ] Isi jabatan pertama: "Guru Matematika"
- [ ] Klik "Tambah Jabatan"
- [ ] Isi jabatan kedua: "Wali Kelas 7A"
- [ ] Klik "Tambah Jabatan"
- [ ] Isi jabatan ketiga: "Koordinator MGMP"
- [ ] Simpan
- [ ] ✅ Guru tersimpan dengan 3 jabatan
- [ ] ✅ Di tabel, semua jabatan tampil dipisah koma

**Test Case 2: Edit Jabatan Existing**
- [ ] Edit guru yang sudah ada
- [ ] Klik "Tambah Jabatan"
- [ ] Tambah jabatan baru
- [ ] Simpan
- [ ] ✅ Jabatan baru tersimpan

**Test Case 3: Hapus Jabatan**
- [ ] Edit guru dengan multiple jabatan
- [ ] Klik icon tempat sampah pada salah satu jabatan
- [ ] Simpan
- [ ] ✅ Jabatan terhapus

**Test Case 4: Export Excel dengan Multiple Jabatan**
- [ ] Klik "Export Excel"
- [ ] Buka file Excel
- [ ] ✅ Kolom jabatan menampilkan semua jabatan dipisah koma

**Test Case 5: Status Rekan (Guru View)**
- [ ] Login sebagai guru
- [ ] Buka tab "Status Rekan"
- [ ] ✅ Guru dengan multiple jabatan menampilkan semua jabatan

---

### 3. Edit Presensi yang Sudah Ada

**Test Case 1: Edit Status Presensi**
- [ ] Login sebagai admin
- [ ] Buka Edit Presensi
- [ ] Pilih tanggal yang ada presensi
- [ ] Klik Edit pada salah satu presensi
- [ ] Form terisi otomatis
- [ ] Ubah status (misal: Izin → Hadir)
- [ ] Klik "Update Presensi"
- [ ] ✅ Status berubah
- [ ] ✅ Muncul di Log Aktivitas

**Test Case 2: Edit Jam Masuk**
- [ ] Edit presensi dengan status Hadir
- [ ] Ubah jam masuk (misal: 07:15 → 08:00)
- [ ] Update
- [ ] ✅ Jam masuk berubah

**Test Case 3: Edit Keterangan**
- [ ] Edit presensi
- [ ] Ubah keterangan
- [ ] Update
- [ ] ✅ Keterangan berubah

**Test Case 4: Batal Edit**
- [ ] Klik Edit pada presensi
- [ ] Klik "Batal Edit"
- [ ] ✅ Form kembali ke mode tambah
- [ ] ✅ Field kosong

**Test Case 5: Nama & Tanggal Disabled**
- [ ] Klik Edit pada presensi
- [ ] ✅ Field nama guru disabled
- [ ] ✅ Field tanggal disabled

---

### 4. Hapus Presensi

**Test Case 1: Hapus Presensi**
- [ ] Buka Edit Presensi
- [ ] Filter tanggal
- [ ] Klik icon Hapus pada presensi
- [ ] Konfirmasi
- [ ] ✅ Presensi terhapus
- [ ] ✅ Tercatat di Log Aktivitas

**Test Case 2: Konfirmasi Hapus**
- [ ] Klik Hapus
- [ ] Klik Cancel di konfirmasi
- [ ] ✅ Presensi tidak terhapus

---

### 5. Tambah Presensi Manual

**Test Case 1: Tambah Presensi Hadir dengan Jam Manual**
- [ ] Pilih guru
- [ ] Pilih tanggal
- [ ] Pilih status "Hadir"
- [ ] Isi jam masuk: 07:30
- [ ] Klik "Tambah Presensi"
- [ ] ✅ Presensi tersimpan dengan jam 07:30

**Test Case 2: Tambah Presensi Hadir tanpa Jam (Otomatis)**
- [ ] Pilih guru
- [ ] Pilih tanggal
- [ ] Pilih status "Hadir"
- [ ] Kosongkan jam masuk
- [ ] Klik "Tambah Presensi"
- [ ] ✅ Presensi tersimpan dengan jam sekarang

**Test Case 3: Tambah Presensi Izin**
- [ ] Pilih guru
- [ ] Pilih tanggal
- [ ] Pilih status "Izin"
- [ ] Isi keterangan
- [ ] Klik "Tambah Presensi"
- [ ] ✅ Presensi tersimpan
- [ ] ✅ Jam masuk = "-"

---

### 6. Validasi Duplikasi

**Test Case 1: Cegah Duplikasi**
- [ ] Tambah presensi untuk guru A tanggal X
- [ ] Coba tambah presensi lagi untuk guru A tanggal X
- [ ] ✅ Muncul error: "Guru ini sudah memiliki presensi pada tanggal tersebut"
- [ ] ✅ Presensi tidak tersimpan

**Test Case 2: Boleh Tambah Tanggal Berbeda**
- [ ] Tambah presensi untuk guru A tanggal X
- [ ] Tambah presensi untuk guru A tanggal Y
- [ ] ✅ Berhasil (tanggal berbeda)

**Test Case 3: Boleh Tambah Guru Berbeda**
- [ ] Tambah presensi untuk guru A tanggal X
- [ ] Tambah presensi untuk guru B tanggal X
- [ ] ✅ Berhasil (guru berbeda)

---

### 7. Filter Daftar Presensi

**Test Case 1: Filter Tanggal**
- [ ] Buka Edit Presensi
- [ ] Pilih tanggal di filter
- [ ] ✅ Tabel menampilkan presensi tanggal tersebut

**Test Case 2: Tanggal Tanpa Data**
- [ ] Pilih tanggal yang tidak ada presensi
- [ ] ✅ Tabel menampilkan "Tidak ada data presensi pada tanggal ini"

**Test Case 3: Ganti Filter**
- [ ] Filter tanggal A (ada data)
- [ ] Ganti filter ke tanggal B (ada data)
- [ ] ✅ Tabel update otomatis

---

## Fitur Existing yang Perlu Ditest Ulang

### 8. Login

**Test Case 1: Login Admin**
- [ ] Username: admin, Password: admin123
- [ ] ✅ Redirect ke /admin

**Test Case 2: Login Guru**
- [ ] Username: guru1, Password: guru123
- [ ] ✅ Redirect ke /guru

**Test Case 3: Login dengan Username Baru**
- [ ] Login dengan username yang sudah diupdate
- [ ] ✅ Berhasil login

---

### 9. Dashboard Admin

**Test Case 1: Statistik Cards**
- [ ] ✅ Total Guru benar
- [ ] ✅ Hadir Hari Ini benar
- [ ] ✅ Izin benar
- [ ] ✅ Sakit benar

**Test Case 2: Charts**
- [ ] ✅ Line Chart tampil
- [ ] ✅ Pie Chart tampil
- [ ] ✅ Data sesuai dengan filter

**Test Case 3: Tabel Realtime**
- [ ] ✅ Menampilkan presensi hari ini
- [ ] ✅ Status badge warna benar

---

### 10. Data Guru

**Test Case 1: Tambah Guru**
- [ ] ✅ Form bisa diisi
- [ ] ✅ Data tersimpan
- [ ] ✅ Muncul di tabel

**Test Case 2: Edit Guru**
- [ ] ✅ Form terisi data existing
- [ ] ✅ Perubahan tersimpan

**Test Case 3: Hapus Guru**
- [ ] ✅ Konfirmasi muncul
- [ ] ✅ Data terhapus

**Test Case 4: Export Excel**
- [ ] ✅ File terdownload
- [ ] ✅ Data lengkap
- [ ] ✅ Multiple jabatan tampil

**Test Case 5: Import Excel**
- [ ] ✅ File bisa diupload
- [ ] ✅ Data terimport

---

### 11. Dashboard Guru

**Test Case 1: Input Presensi Hadir**
- [ ] Klik "HADIR"
- [ ] Izinkan akses lokasi
- [ ] ✅ Validasi lokasi
- [ ] ✅ Presensi tersimpan (jika dalam radius)

**Test Case 2: Input Presensi Izin**
- [ ] Klik "IZIN"
- [ ] Isi keterangan
- [ ] ✅ Presensi tersimpan

**Test Case 3: Riwayat**
- [ ] ✅ Tabel menampilkan riwayat
- [ ] ✅ Filter tanggal berfungsi
- [ ] ✅ Download PDF berfungsi
- [ ] ✅ Download Excel berfungsi

**Test Case 4: Status Rekan**
- [ ] ✅ Menampilkan guru lain
- [ ] ✅ Status benar
- [ ] ✅ Multiple jabatan tampil

---

### 12. Log Aktivitas

**Test Case 1: Log Tersimpan**
- [ ] Lakukan aktivitas (login, tambah presensi, edit guru)
- [ ] Buka Log Aktivitas
- [ ] ✅ Semua aktivitas tercatat

**Test Case 2: Log Edit Presensi**
- [ ] Edit presensi
- [ ] ✅ Tercatat sebagai "Update Presensi"

**Test Case 3: Log Hapus Presensi**
- [ ] Hapus presensi
- [ ] ✅ Tercatat sebagai "Hapus Presensi"

---

## Responsive Testing

### 13. Mobile View (Guru)

**Test Case 1: Bottom Navigation**
- [ ] Buka di mobile/resize browser
- [ ] ✅ Bottom navigation tampil
- [ ] ✅ 3 tab berfungsi

**Test Case 2: Form Input**
- [ ] ✅ Tombol besar dan mudah diklik
- [ ] ✅ Modal responsive

---

### 14. Desktop View (Admin)

**Test Case 1: Sidebar**
- [ ] ✅ Sidebar tampil di desktop
- [ ] ✅ Menu berfungsi

**Test Case 2: Tabel**
- [ ] ✅ Tabel tidak overflow
- [ ] ✅ Scroll horizontal jika perlu

---

## Browser Compatibility

### 15. Cross-Browser Testing

- [ ] ✅ Chrome
- [ ] ✅ Firefox
- [ ] ✅ Safari
- [ ] ✅ Edge

---

## Performance Testing

### 16. Load Time

- [ ] ✅ Halaman load < 3 detik
- [ ] ✅ Tidak ada lag saat input

### 17. Data Besar

- [ ] Tambah 50+ guru
- [ ] Tambah 100+ presensi
- [ ] ✅ Tabel masih smooth
- [ ] ✅ Filter masih cepat

---

## Security Testing

### 18. Authorization

**Test Case 1: Guru Akses Admin**
- [ ] Login sebagai guru
- [ ] Coba akses /admin di URL
- [ ] ✅ Redirect ke /guru

**Test Case 2: Logout**
- [ ] Logout
- [ ] Coba akses halaman protected
- [ ] ✅ Redirect ke /login

---

## Bug Testing

### 19. Edge Cases

**Test Case 1: Field Kosong**
- [ ] Submit form dengan field kosong
- [ ] ✅ Validasi muncul

**Test Case 2: Data Tidak Valid**
- [ ] Input tanggal masa depan
- [ ] ✅ Bisa diinput (untuk planning)

**Test Case 3: Lokasi Ditolak**
- [ ] Tolak akses lokasi
- [ ] ✅ Error message muncul

---

## Checklist Summary

**Total Test Cases:** 60+

**Priority:**
- 🔴 High: Login, CRUD, Geolocation
- 🟡 Medium: Export/Import, Charts
- 🟢 Low: UI/UX, Responsive

**Status:**
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
- [ ] Failed (need fix)

---

**Testing Date:** ___________

**Tester:** ___________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
