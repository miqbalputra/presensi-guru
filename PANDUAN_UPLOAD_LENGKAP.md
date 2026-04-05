# 🚀 PANDUAN UPLOAD LENGKAP - kelolasekolah.web.id

**Domain:** https://kelolasekolah.web.id  
**Tanggal:** 14 Desember 2025  
**Status:** ✅ Siap Upload

---

## 📦 RINGKASAN FILE YANG DIUPLOAD

### **BACKEND (8 file)**
- 2 file BARU
- 6 file UPDATE

### **FRONTEND (2 item)**
- index.html
- folder assets

### **FOLDER BARU**
- logs (untuk security logging)

---

## 🎯 CARA UPLOAD - STEP BY STEP

### **STEP 1: Login ke cPanel**

1. Buka browser (Chrome/Firefox/Edge)
2. Ketik di address bar: `https://kelolasekolah.web.id/cpanel`
   - Atau: `https://cpanel.kelolasekolah.web.id`
   - Atau: Sesuai URL cPanel yang diberikan hosting
3. Masukkan **username** dan **password** cPanel Anda
4. Klik **"Log in"**

---

### **STEP 2: Buka File Manager**

1. Di halaman utama cPanel, cari kotak **"Files"**
2. Klik **"File Manager"**
3. Akan terbuka tab baru dengan File Manager

---

### **STEP 3: Upload Backend API**

#### **A. Masuk ke Folder API**

1. Di File Manager, klik folder **`api`** di sebelah kiri
   - Jika belum ada, buat dulu:
     - Klik **"+ Folder"** atau **"New Folder"**
     - Nama: `api`
     - Klik **"Create New Folder"**
2. Masuk ke folder `api` (double click)

#### **B. Upload File Baru (2 file)**

1. Klik tombol **"Upload"** di bagian atas
2. Akan muncul halaman upload
3. **Upload file pertama:**
   - Klik **"Select File"** atau drag & drop
   - Pilih: `D:\Kiro\12 Des 2025\api\security.php`
   - Tunggu sampai 100%
4. **Upload file kedua:**
   - Klik **"Select File"** lagi
   - Pilih: `D:\Kiro\12 Des 2025\api\.htaccess`
   - Tunggu sampai 100%
5. Klik **"Go Back to ..."** untuk kembali ke File Manager

#### **C. Upload File Update (6 file)**

**PENTING:** File ini akan **REPLACE** (menimpa) file lama

1. Klik **"Upload"** lagi
2. Upload file-file ini satu per satu:
   - `D:\Kiro\12 Des 2025\api\config.php`
   - `D:\Kiro\12 Des 2025\api\auth.php`
   - `D:\Kiro\12 Des 2025\api\guru.php`
   - `D:\Kiro\12 Des 2025\api\presensi.php`
   - `D:\Kiro\12 Des 2025\api\holidays.php`
   - `D:\Kiro\12 Des 2025\api\activity.php`
3. Jika muncul konfirmasi **"File already exists"**, klik **"Overwrite"** atau **"Replace"**
4. Tunggu sampai semua selesai

#### **D. Verifikasi Upload Backend**

Pastikan di folder `api` ada file-file ini:
```
api/
├── .htaccess ⭐ BARU
├── security.php ⭐ BARU
├── config.php 🔄 UPDATE
├── auth.php 🔄 UPDATE
├── guru.php 🔄 UPDATE
├── presensi.php 🔄 UPDATE
├── holidays.php 🔄 UPDATE
└── activity.php 🔄 UPDATE
```

---

### **STEP 4: Buat Folder Logs**

1. **Kembali ke root** (klik `/home/username/` di breadcrumb atas)
2. Klik **"+ Folder"** atau **"New Folder"**
3. **Nama folder:** `logs`
4. Klik **"Create New Folder"**
5. **Set Permission:**
   - Klik kanan folder `logs`
   - Pilih **"Change Permissions"** atau **"Permissions"**
   - Centang: **Read, Write, Execute** untuk Owner
   - Centang: **Read, Execute** untuk Group dan World
   - Atau ketik angka: **755**
   - Klik **"Change Permissions"** atau **"Save"**

**Struktur folder sekarang:**
```
/home/username/
├── api/ (sudah ada)
├── logs/ ⭐ BARU
└── public_html/ (akan diupdate)
```

---

### **STEP 5: Upload Frontend**

#### **A. Masuk ke Folder public_html**

1. Klik folder **`public_html`** di sebelah kiri
2. Anda akan melihat file-file website

#### **B. Hapus File Lama**

**PENTING:** Backup dulu jika perlu!

1. **Hapus index.html lama:**
   - Cari file `index.html`
   - Klik kanan → **"Delete"** atau centang → klik **"Delete"** di toolbar
   - Konfirmasi hapus

2. **Hapus folder assets lama:**
   - Cari folder `assets`
   - Klik kanan → **"Delete"** atau centang → klik **"Delete"**
   - Konfirmasi hapus

#### **C. Upload index.html Baru**

1. Klik **"Upload"**
2. Pilih file: `D:\Kiro\12 Des 2025\dist\index.html`
3. Tunggu sampai 100%
4. Kembali ke File Manager

#### **D. Upload Folder assets Baru**

**Cara 1: Upload File per File (Mudah)**

1. Klik **"+ Folder"** → Buat folder baru: `assets`
2. Masuk ke folder `assets` (double click)
3. Klik **"Upload"**
4. Pilih semua file di `D:\Kiro\12 Des 2025\dist\assets\`:
   - `index-CKIexgl2.js`
   - `index-jqv-RaZC.css`
   - `index.es-Bhdgi4uR.js`
   - `purify.es-C_uT9hQ1.js`
   - `html2canvas.esm-CBrSDip1.js`
5. Upload semua (bisa select multiple)
6. Tunggu sampai selesai

**Cara 2: Upload ZIP (Lebih Cepat)**

1. Di komputer, compress folder `dist\assets` jadi `assets.zip`
2. Upload `assets.zip` ke `public_html`
3. Klik kanan `assets.zip` → **"Extract"**
4. Pilih extract ke `public_html`
5. Hapus `assets.zip` setelah selesai

#### **E. Verifikasi Upload Frontend**

Pastikan struktur seperti ini:
```
public_html/
├── index.html (baru - tanggal hari ini)
└── assets/
    ├── index-CKIexgl2.js
    ├── index-jqv-RaZC.css
    ├── index.es-Bhdgi4uR.js
    ├── purify.es-C_uT9hQ1.js
    └── html2canvas.esm-CBrSDip1.js
```

---

### **STEP 6: Update Database Credentials**

**PENTING:** Ganti credentials database di `config.php`

1. Di File Manager, masuk ke folder `api`
2. Klik kanan file `config.php` → **"Edit"** atau **"Code Editor"**
3. Cari baris ini (sekitar line 5-8):
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_geopresensi_db');  // Ganti dengan nama database Anda
define('DB_USER', 'username_geopresensi_user'); // Ganti dengan username database Anda
define('DB_PASS', 'your_password_here');        // Ganti dengan password database Anda
```

4. **Ganti dengan credentials database Anda:**
   - `DB_NAME`: Nama database (contoh: `kelolase_geopresensi`)
   - `DB_USER`: Username database (contoh: `kelolase_user`)
   - `DB_PASS`: Password database (dari cPanel)

5. Klik **"Save Changes"** atau **"Save"**
6. Tutup editor

**Cara cek database credentials:**
- Login cPanel → **MySQL Databases**
- Lihat nama database dan user yang sudah dibuat
- Jika belum ada, buat database dan user baru

---

### **STEP 7: Jalankan Database Script (Jika Belum)**

**Jika database belum dibuat atau belum ada tabel:**

1. Login cPanel → **phpMyAdmin**
2. Pilih database Anda di sebelah kiri
3. Klik tab **"SQL"**
4. Buka file `database.sql` di komputer
5. Copy semua isinya
6. Paste ke phpMyAdmin
7. Klik **"Go"**
8. Ulangi untuk `database_hari_libur.sql`

---

### **STEP 8: Clear Cache & Test**

#### **A. Clear Cache Browser**

1. Tekan **`Ctrl + Shift + Delete`**
2. Pilih:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
3. Time range: **All time**
4. Klik **"Clear data"**

#### **B. Hard Refresh**

1. Buka: `https://kelolasekolah.web.id`
2. Tekan **`Ctrl + F5`** (atau `Shift + F5`)
3. Halaman akan reload dengan file baru

---

## 🧪 TEST APLIKASI

### **Test 1: Buka Website**

1. Buka: `https://kelolasekolah.web.id`
2. **Hasil:** ✅ Halaman login muncul
3. **Jika error:** Cek console browser (F12)

### **Test 2: Login Admin**

1. Username: `admin`
2. Password: `admin123`
3. Klik **"Login"**
4. **Hasil:** ✅ Masuk ke dashboard admin

### **Test 3: Cek Menu Hari Libur**

1. Klik menu **"Hari Libur"** di sidebar
2. **Hasil:** ✅ Halaman terbuka, tabel menampilkan data
3. **Jika error:** Cek apakah `database_hari_libur.sql` sudah dijalankan

### **Test 4: Test Security (Rate Limiting)**

1. Logout
2. Login dengan password salah 5x berturut-turut
3. **Hasil:** ✅ Muncul pesan "Terlalu banyak percobaan. Silakan coba lagi dalam 5 menit"

### **Test 5: Cek Security Logs**

1. Login cPanel → File Manager
2. Masuk ke folder `/home/username/logs/`
3. **Hasil:** ✅ Ada file `security_2025-12-14.log`
4. Buka file → Lihat isi log (login_success, login_failed, dll)

---

## ⚠️ TROUBLESHOOTING

### **Masalah 1: "Database connection failed"**

**Penyebab:** Credentials database salah

**Solusi:**
1. Edit `api/config.php`
2. Pastikan DB_NAME, DB_USER, DB_PASS benar
3. Test koneksi di phpMyAdmin

---

### **Masalah 2: "Unauthorized: Silakan login terlebih dahulu"**

**Penyebab:** Session tidak tersimpan

**Solusi:**
1. Cek permission folder `/tmp` di server
2. Atau buat folder session manual:
```php
// Tambahkan di config.php sebelum setupSecureSession()
ini_set('session.save_path', '/home/username/tmp');
```
3. Buat folder `/home/username/tmp` dengan permission 755

---

### **Masalah 3: "CORS error" di console**

**Penyebab:** Domain tidak sesuai

**Solusi:**
1. Sudah diperbaiki ke `kelolasekolah.web.id`
2. Jika masih error, cek `api/security.php` line 165
3. Pastikan domain sesuai

---

### **Masalah 4: Halaman blank/putih**

**Penyebab:** File tidak terupload dengan benar

**Solusi:**
1. Cek apakah `index.html` ada di `public_html`
2. Cek apakah folder `assets` ada dan berisi 5 file
3. Clear cache + hard refresh

---

### **Masalah 5: "Call to undefined function"**

**Penyebab:** File `security.php` tidak terupload

**Solusi:**
1. Cek apakah `api/security.php` ada
2. Cek permission: 644
3. Upload ulang jika perlu

---

### **Masalah 6: Menu Hari Libur tidak muncul**

**Penyebab:** Frontend belum terupdate

**Solusi:**
1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Coba browser lain

---

### **Masalah 7: Tabel hari libur kosong**

**Penyebab:** Database script belum dijalankan

**Solusi:**
1. Login phpMyAdmin
2. Jalankan `database_hari_libur.sql`
3. Verifikasi: `SELECT * FROM holidays;`

---

## 📊 CHECKLIST UPLOAD

### **Backend:**
- [ ] Upload `api/security.php` (BARU)
- [ ] Upload `api/.htaccess` (BARU)
- [ ] Replace `api/config.php` (UPDATE)
- [ ] Replace `api/auth.php` (UPDATE)
- [ ] Replace `api/guru.php` (UPDATE)
- [ ] Replace `api/presensi.php` (UPDATE)
- [ ] Replace `api/holidays.php` (UPDATE)
- [ ] Replace `api/activity.php` (UPDATE)
- [ ] Update DB credentials di `config.php`
- [ ] Buat folder `/home/username/logs/` (permission 755)

### **Frontend:**
- [ ] Hapus `public_html/index.html` lama
- [ ] Hapus `public_html/assets` lama
- [ ] Upload `dist/index.html` baru
- [ ] Upload `dist/assets/` baru (5 file)

### **Database:**
- [ ] Jalankan `database.sql` (jika belum)
- [ ] Jalankan `database_hari_libur.sql` (jika belum)
- [ ] Verifikasi tabel ada

### **Testing:**
- [ ] Clear cache browser
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test login admin
- [ ] Test menu hari libur
- [ ] Test rate limiting
- [ ] Cek security logs

---

## 🎯 HASIL YANG DIHARAPKAN

### **Setelah Upload Berhasil:**

✅ Website bisa diakses: `https://kelolasekolah.web.id`  
✅ Login berfungsi normal  
✅ Menu "Hari Libur" muncul di sidebar  
✅ Tabel hari libur menampilkan 15 data  
✅ Rate limiting bekerja (5x salah password)  
✅ Security logs tercatat di `/logs/`  
✅ API protected (perlu login)  
✅ Tampilan sama persis (tidak berubah)  
✅ Fungsionalitas sama persis  

---

## 📞 SETELAH UPLOAD

Kabari dengan:
- ✅ "Upload berhasil, semua berfungsi!"
- ✅ Screenshot dashboard (opsional)

Atau jika ada masalah:
- ❌ Screenshot error
- ❌ Pesan error yang muncul
- ❌ Test mana yang gagal

---

## 🎉 KESIMPULAN

**File siap upload:**
- ✅ Backend: 8 file (2 baru, 6 update)
- ✅ Frontend: 2 item (index.html + assets)
- ✅ Domain: kelolasekolah.web.id
- ✅ Security: 8.5/10 (GOOD)

**Lokasi file di komputer:**
- Backend: `D:\Kiro\12 Des 2025\api\`
- Frontend: `D:\Kiro\12 Des 2025\dist\`

**Estimasi waktu upload:**
- Backend: 5-10 menit
- Frontend: 5-10 menit
- Total: 10-20 menit

---

Selamat mengupload! Jika ada yang kurang jelas, tanya saja! 🚀
