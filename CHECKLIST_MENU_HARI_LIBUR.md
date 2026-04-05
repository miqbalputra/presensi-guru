# ✅ CHECKLIST MENU HARI LIBUR

Gunakan checklist ini untuk memastikan fitur berfungsi dengan sempurna.

---

## 📦 PERSIAPAN UPLOAD

- [ ] File `dist/index.html` sudah ada
- [ ] Folder `dist/assets/` sudah ada (5 file)
- [ ] Koneksi internet stabil
- [ ] Login cPanel siap

---

## 🚀 PROSES UPLOAD

### **1. Backup File Lama (Opsional)**
- [ ] Download `index.html` lama dari `public_html`
- [ ] Download folder `assets` lama dari `public_html`

### **2. Hapus File Lama**
- [ ] Login cPanel → File Manager
- [ ] Masuk ke folder `public_html`
- [ ] Hapus `index.html` lama
- [ ] Hapus folder `assets` lama

### **3. Upload File Baru**
- [ ] Upload `dist/index.html` ke `public_html`
- [ ] Upload folder `dist/assets` ke `public_html`
- [ ] Verifikasi file terupload (cek tanggal modified)

### **4. Clear Cache Browser**
- [ ] Tekan `Ctrl + Shift + Delete`
- [ ] Pilih "Cached images and files"
- [ ] Pilih "All time"
- [ ] Klik "Clear data"

### **5. Hard Refresh**
- [ ] Tekan `Ctrl + F5` atau `Shift + F5`
- [ ] Atau `Ctrl + Shift + R` (Firefox)

---

## 🧪 TEST FITUR ADMIN

### **1. Login Admin**
- [ ] Buka `https://sistemflow.biz.id`
- [ ] Login: `admin` / `admin123`
- [ ] Berhasil masuk dashboard

### **2. Cek Menu Baru**
- [ ] Menu "Hari Libur" muncul di sidebar
- [ ] Icon kalender (📅) muncul
- [ ] Posisi: Setelah "Download Laporan"

### **3. Buka Halaman Hari Libur**
- [ ] Klik menu "Hari Libur"
- [ ] Halaman terbuka tanpa error
- [ ] Header "Pengaturan Hari Libur" muncul
- [ ] Tombol "Tambah Hari Libur" muncul

### **4. Cek Tabel Data**
- [ ] Tabel menampilkan data hari libur
- [ ] Total: 15 hari libur (jika database sudah ada)
- [ ] Kolom: No, Tanggal, Nama Libur, Jenis, Aksi
- [ ] Badge warna muncul (🔴🟡🔵)
- [ ] Icon edit (✏️) dan hapus (🗑️) muncul

### **5. Test Filter Tahun**
- [ ] Dropdown tahun muncul (2024-2030)
- [ ] Pilih tahun 2025
- [ ] Tabel menampilkan data 2025
- [ ] Pilih tahun 2026
- [ ] Tabel kosong (jika belum ada data)
- [ ] Total hari libur update sesuai filter

### **6. Test Tambah Hari Libur**
- [ ] Klik tombol "Tambah Hari Libur"
- [ ] Modal form muncul
- [ ] Field tanggal, nama, jenis, keterangan muncul
- [ ] Isi form:
  - Tanggal: `2025-12-26`
  - Nama: `Test Hari Libur`
  - Jenis: `Libur Sekolah`
  - Keterangan: `Test tambah`
- [ ] Klik "Simpan"
- [ ] Pesan sukses muncul
- [ ] Data muncul di tabel
- [ ] Badge biru muncul (Libur Sekolah)

### **7. Test Edit Hari Libur**
- [ ] Klik icon edit (✏️) di baris "Test Hari Libur"
- [ ] Modal form muncul
- [ ] Data ter-populate otomatis
- [ ] Ubah nama menjadi `Test Edit Hari Libur`
- [ ] Klik "Simpan"
- [ ] Pesan sukses muncul
- [ ] Nama berhasil diupdate di tabel

### **8. Test Hapus Hari Libur**
- [ ] Klik icon hapus (🗑️) di baris "Test Edit Hari Libur"
- [ ] Konfirmasi muncul
- [ ] Klik "OK"
- [ ] Pesan sukses muncul
- [ ] Data terhapus dari tabel

### **9. Test Validasi Form**
- [ ] Klik "Tambah Hari Libur"
- [ ] Kosongkan field tanggal dan nama
- [ ] Klik "Simpan"
- [ ] Pesan error muncul: "Tanggal dan nama harus diisi"

### **10. Test Info Box**
- [ ] Info box muncul di atas tabel
- [ ] Icon ℹ️ muncul
- [ ] 3 poin informasi muncul:
  - Sabtu-Minggu otomatis libur
  - Guru tidak bisa presensi di hari libur
  - Pesan khusus ditampilkan

---

## 🧪 TEST INTEGRASI GURU

### **1. Tambah Hari Libur Hari Ini**
- [ ] Login sebagai admin
- [ ] Klik "Tambah Hari Libur"
- [ ] Isi tanggal: `2025-12-14` (hari ini - Sabtu)
- [ ] Nama: `Test Libur Hari Ini`
- [ ] Jenis: `Libur Sekolah`
- [ ] Klik "Simpan"

### **2. Test di Aplikasi Guru**
- [ ] Logout dari admin
- [ ] Login sebagai guru: `guru` / `guru123`
- [ ] Halaman guru terbuka
- [ ] Pesan libur muncul (karena hari Sabtu)
- [ ] Kotak biru atau kuning muncul
- [ ] Pesan: "Hari Sabtu adalah hari libur" atau "Hari Libur: Test Libur Hari Ini"
- [ ] Tombol HADIR tidak muncul
- [ ] Tombol IZIN tidak muncul
- [ ] Tombol SAKIT tidak muncul

### **3. Hapus Test Data**
- [ ] Logout dari guru
- [ ] Login sebagai admin
- [ ] Buka menu "Hari Libur"
- [ ] Hapus "Test Libur Hari Ini"

### **4. Test Hari Kerja (Senin-Jumat)**
- [ ] Logout admin
- [ ] Login guru
- [ ] Jika hari ini Senin-Jumat:
  - [ ] Tombol HADIR muncul
  - [ ] Tombol IZIN muncul
  - [ ] Tombol SAKIT muncul
  - [ ] Tidak ada pesan libur

---

## 🧪 TEST LOG AKTIVITAS

### **1. Cek Log Tambah**
- [ ] Login admin
- [ ] Buka menu "Log Aktivitas"
- [ ] Cari log "Tambah Hari Libur"
- [ ] Status: Nama hari libur yang ditambahkan
- [ ] User: Admin Sekolah

### **2. Cek Log Edit**
- [ ] Cari log "Edit Hari Libur"
- [ ] Status: Nama hari libur yang diedit
- [ ] User: Admin Sekolah

### **3. Cek Log Hapus**
- [ ] Cari log "Hapus Hari Libur"
- [ ] Status: Nama hari libur yang dihapus
- [ ] User: Admin Sekolah

---

## 🧪 TEST RESPONSIVE

### **1. Desktop (Lebar)**
- [ ] Tabel full width
- [ ] Semua kolom terlihat
- [ ] Sidebar tidak overlap

### **2. Tablet (Sedang)**
- [ ] Tabel scroll horizontal
- [ ] Sidebar collapse
- [ ] Tombol hamburger muncul

### **3. Mobile (Sempit)**
- [ ] Tabel scroll horizontal
- [ ] Modal full screen
- [ ] Sidebar slide dari kiri

---

## 🧪 TEST BROWSER

### **1. Chrome**
- [ ] Menu muncul
- [ ] Fitur berfungsi
- [ ] Tidak ada error di console (F12)

### **2. Firefox**
- [ ] Menu muncul
- [ ] Fitur berfungsi
- [ ] Tidak ada error di console (F12)

### **3. Edge**
- [ ] Menu muncul
- [ ] Fitur berfungsi
- [ ] Tidak ada error di console (F12)

---

## 🧪 TEST BACKEND API

### **1. Test Endpoint Get All**
- [ ] Buka: `https://sistemflow.biz.id/api/holidays.php`
- [ ] Response JSON muncul
- [ ] `success: true`
- [ ] `data` berisi array hari libur

### **2. Test Endpoint Check Date**
- [ ] Buka: `https://sistemflow.biz.id/api/holidays.php?check=2025-12-14`
- [ ] Response JSON muncul
- [ ] `isWeekend: true` (karena Sabtu)
- [ ] `isWorkday: false`
- [ ] `dayName: "Sabtu"`

### **3. Test Endpoint Filter Year**
- [ ] Buka: `https://sistemflow.biz.id/api/holidays.php?year=2025`
- [ ] Response JSON muncul
- [ ] Data hanya tahun 2025

---

## 🧪 TEST DATABASE

### **1. Cek Tabel Holidays**
- [ ] Login phpMyAdmin
- [ ] Pilih database
- [ ] Tabel `holidays` ada
- [ ] Struktur: id, tanggal, nama, jenis, keterangan, created_at

### **2. Cek Data**
- [ ] Query: `SELECT COUNT(*) FROM holidays;`
- [ ] Result: 15 (jika sudah insert data 2025)

### **3. Cek Unique Constraint**
- [ ] Query: `SHOW INDEX FROM holidays;`
- [ ] Ada unique key pada kolom `tanggal`

---

## ⚠️ TROUBLESHOOTING

### **Masalah: Menu tidak muncul**
- [ ] Clear cache browser
- [ ] Hard refresh (Ctrl + F5)
- [ ] Cek file `index.html` terupdate (tanggal hari ini)
- [ ] Cek folder `assets` terupdate (tanggal hari ini)

### **Masalah: Tabel kosong**
- [ ] Cek database: `SELECT * FROM holidays;`
- [ ] Jalankan ulang `database_hari_libur.sql`
- [ ] Cek API: `https://sistemflow.biz.id/api/holidays.php`

### **Masalah: Error saat tambah**
- [ ] Cek `api/holidays.php` sudah diupload
- [ ] Cek permission file: 644
- [ ] Cek console browser (F12) untuk error

### **Masalah: Guru masih bisa presensi di hari libur**
- [ ] Clear cache browser
- [ ] Hard refresh
- [ ] Cek tanggal hari libur di database
- [ ] Cek API check date berfungsi

---

## ✅ HASIL AKHIR

Setelah semua checklist ✅:

**Admin:**
- ✅ Menu "Hari Libur" muncul dan berfungsi
- ✅ CRUD hari libur berfungsi sempurna
- ✅ Filter tahun berfungsi
- ✅ Log aktivitas tercatat

**Guru:**
- ✅ Tidak bisa presensi di hari libur
- ✅ Pesan libur muncul sesuai jenis
- ✅ Tombol presensi disabled di hari libur

**Sistem:**
- ✅ Backend API berfungsi
- ✅ Database terintegrasi
- ✅ Responsive di semua device
- ✅ Compatible di semua browser

---

## 📞 LAPORAN

**Jika Semua Berhasil:**
```
✅ Semua checklist sudah ✅
✅ Menu hari libur berfungsi sempurna
✅ Integrasi dengan guru berfungsi
✅ Siap digunakan!
```

**Jika Ada Masalah:**
```
❌ Checklist mana yang gagal: [sebutkan]
❌ Screenshot error: [lampirkan]
❌ Pesan error: [copy-paste]
```

---

Selamat melakukan testing! 🚀
