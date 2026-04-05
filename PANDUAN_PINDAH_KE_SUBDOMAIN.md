# 🚀 PANDUAN PINDAH KE SUBDOMAIN geo.kelolasekolah.web.id

## ⚠️ PENTING: TIDAK BISA LANGSUNG COPY-PASTE!

Ada beberapa file yang perlu disesuaikan sebelum aplikasi bisa jalan di subdomain.

---

## 📋 CHECKLIST PERSIAPAN

### 1. **Buat Subdomain di cPanel**

**Langkah:**
1. Login cPanel
2. Cari menu **"Subdomains"**
3. Isi:
   - Subdomain: `geo`
   - Domain: `kelolasekolah.web.id`
   - Document Root: Biarkan default (biasanya: `public_html/geo`)
4. Klik **"Create"**

**Hasil:** Subdomain `geo.kelolasekolah.web.id` akan mengarah ke folder `public_html/geo/`

---

### 2. **Buat Database Baru (Opsional tapi Direkomendasikan)**

**Opsi A: Database Baru (Direkomendasikan)**
1. cPanel → **"MySQL Databases"**
2. Buat database baru:
   - Nama: `sobataja2_geo` (atau nama lain)
3. Buat user baru:
   - Username: `sobataja2_geo_user`
   - Password: (generate strong password)
4. Assign user ke database (All Privileges)
5. **Catat:** Database name, username, password

**Opsi B: Pakai Database yang Sama**
- Bisa pakai database yang sama dengan domain utama
- Tapi tidak direkomendasikan (untuk isolasi data)

---

## 📝 FILE YANG PERLU DISESUAIKAN

### **File 1: `api/config.php`**

**Yang Perlu Diubah:**
```php
// SEBELUM (domain utama)
define('DB_NAME', 'sobataja2_geopresence');
define('DB_USER', 'sobataja2_mip');
define('DB_PASS', 'Alhamdulillah`123');

// SESUDAH (subdomain - jika pakai database baru)
define('DB_NAME', 'sobataja2_geo');
define('DB_USER', 'sobataja2_geo_user');
define('DB_PASS', 'password_baru_anda');

// ATAU jika pakai database yang sama
define('DB_NAME', 'sobataja2_geopresence');
define('DB_USER', 'sobataja2_mip');
define('DB_PASS', 'Alhamdulillah`123');
```

---

### **File 2: `api/security.php`**

**Yang Perlu Diubah:**
```php
// SEBELUM
function setupCORS() {
    $allowed_origins = [
        'https://kelolasekolah.web.id',
        'http://localhost:5173',
        'http://localhost:3000'
    ];
    
    // ...
    
    // Default ke domain production
    header('Access-Control-Allow-Origin: https://kelolasekolah.web.id');
}

// SESUDAH
function setupCORS() {
    $allowed_origins = [
        'https://geo.kelolasekolah.web.id',  // ← TAMBAH INI
        'https://kelolasekolah.web.id',
        'http://localhost:5173',
        'http://localhost:3000'
    ];
    
    // ...
    
    // Default ke subdomain
    header('Access-Control-Allow-Origin: https://geo.kelolasekolah.web.id');
}

// Dan ubah juga di bagian isProduction
$isProduction = ($_SERVER['HTTP_HOST'] ?? '') === 'geo.kelolasekolah.web.id';
```

---

### **File 3: `.htaccess` (Jika Ada)**

**Pastikan ada file `.htaccess` di root folder dengan isi:**
```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React Router (SPA)
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

---

## 🗂️ STRUKTUR FOLDER DI SERVER

```
public_html/
├── geo/                          ← Folder subdomain
│   ├── index.html               ← File utama
│   ├── .htaccess                ← Routing config
│   ├── assets/                  ← File JS, CSS
│   │   ├── index-xxx.js
│   │   ├── index.es-xxx.js
│   │   └── index-xxx.css
│   └── api/                     ← Backend API
│       ├── config.php           ← ⚠️ EDIT INI!
│       ├── security.php         ← ⚠️ EDIT INI!
│       ├── auth.php
│       ├── users.php
│       ├── presensi.php
│       ├── holidays.php
│       ├── settings.php
│       ├── jadwal_piket.php
│       └── ... (file API lainnya)
```

---

## 📤 LANGKAH UPLOAD

### **Step 1: Upload File**

1. **Compress folder lokal:**
   - Zip folder `dist/` (berisi index.html, assets/, dll)
   - Zip folder `api/` (berisi semua file PHP)

2. **Upload ke cPanel:**
   - Login cPanel → File Manager
   - Masuk ke folder `public_html/geo/`
   - Upload file zip
   - Extract di sana

3. **Atau upload manual:**
   - Upload file satu per satu via FTP/File Manager
   - Pastikan struktur folder sama

---

### **Step 2: Edit File Config**

1. **Edit `api/config.php`:**
   - File Manager → Klik kanan → Edit
   - Ubah DB_NAME, DB_USER, DB_PASS
   - Save

2. **Edit `api/security.php`:**
   - File Manager → Klik kanan → Edit
   - Ubah allowed_origins dan default origin
   - Ubah isProduction check
   - Save

---

### **Step 3: Import Database**

**Jika Pakai Database Baru:**

1. **Export database dari domain lama:**
   - phpMyAdmin → Pilih database `sobataja2_geopresence`
   - Tab "Export"
   - Format: SQL
   - Klik "Go"
   - Download file `.sql`

2. **Import ke database baru:**
   - phpMyAdmin → Pilih database `sobataja2_geo`
   - Tab "Import"
   - Choose file → Pilih file `.sql` tadi
   - Klik "Go"

**Jika Pakai Database yang Sama:**
- Skip step ini
- Langsung pakai database yang ada

---

### **Step 4: Set Permission**

**Set permission file:**
```
Folder api/: 755
File *.php: 644
File .htaccess: 644
File index.html: 644
Folder assets/: 755
File *.js, *.css: 644
```

**Cara set:**
- File Manager → Klik kanan file/folder
- Change Permissions
- Set sesuai di atas

---

### **Step 5: Test**

1. **Test API:**
   - Buka: `https://geo.kelolasekolah.web.id/api/auth.php`
   - Harus return JSON (bukan error 404)

2. **Test Frontend:**
   - Buka: `https://geo.kelolasekolah.web.id`
   - Harus muncul halaman login

3. **Test Login:**
   - Login dengan akun admin
   - Jika berhasil, berarti sudah OK!

---

## 🔧 TROUBLESHOOTING

### **Masalah 1: Error 500 Internal Server Error**

**Penyebab:**
- File `.htaccess` salah
- Permission file salah
- Syntax error di PHP

**Solusi:**
1. Cek error log di cPanel (Errors → Error Log)
2. Cek permission file (harus 644 untuk PHP)
3. Cek syntax PHP (buka file di browser, lihat error)

---

### **Masalah 2: CORS Error di Console Browser**

**Penyebab:**
- `api/security.php` belum diupdate
- Allowed origins tidak include subdomain

**Solusi:**
1. Edit `api/security.php`
2. Tambahkan `https://geo.kelolasekolah.web.id` ke allowed_origins
3. Ubah default origin ke subdomain

---

### **Masalah 3: Database Connection Failed**

**Penyebab:**
- Credentials database salah di `api/config.php`
- Database belum dibuat
- User belum di-assign ke database

**Solusi:**
1. Cek credentials di `api/config.php`
2. Cek database ada di phpMyAdmin
3. Cek user sudah di-assign (MySQL Databases → Current Users)

---

### **Masalah 4: Halaman Blank/Putih**

**Penyebab:**
- File `index.html` tidak ada
- Path file JS/CSS salah
- Browser cache

**Solusi:**
1. Cek file `index.html` ada di root folder subdomain
2. Clear browser cache (Ctrl+Shift+Del)
3. Hard reload (Ctrl+F5)
4. Cek Console Browser (F12) untuk error

---

### **Masalah 5: Login Berhasil tapi Redirect ke Domain Lama**

**Penyebab:**
- Hardcoded URL di frontend

**Solusi:**
- Seharusnya tidak terjadi karena frontend pakai relative URL
- Jika terjadi, clear browser cache

---

## ✅ CHECKLIST SETELAH PINDAH

- [ ] Subdomain sudah dibuat
- [ ] Database sudah dibuat (jika pakai baru)
- [ ] File sudah diupload semua
- [ ] `api/config.php` sudah diedit
- [ ] `api/security.php` sudah diedit
- [ ] Permission file sudah diset
- [ ] Database sudah diimport (jika pakai baru)
- [ ] Test API berhasil (return JSON)
- [ ] Test frontend berhasil (muncul halaman login)
- [ ] Test login berhasil
- [ ] Test presensi berhasil
- [ ] Test semua fitur berjalan normal

---

## 🎯 REKOMENDASI

### **Opsi 1: Subdomain Baru dengan Database Baru (RECOMMENDED)**

**Kelebihan:**
- Isolasi data (data subdomain terpisah)
- Lebih aman (jika ada masalah, tidak affect domain utama)
- Bisa test tanpa ganggu domain utama

**Kekurangan:**
- Perlu setup database baru
- Perlu import data

**Cocok untuk:** Production baru, testing, atau isolasi data

---

### **Opsi 2: Subdomain Baru dengan Database yang Sama**

**Kelebihan:**
- Tidak perlu setup database baru
- Data langsung tersedia
- Lebih cepat setup

**Kekurangan:**
- Data tercampur dengan domain utama
- Jika ada masalah, bisa affect domain utama

**Cocok untuk:** Testing cepat, atau jika memang ingin share data

---

## 📞 BANTUAN

Jika mengalami masalah:

1. **Cek Error Log:**
   - cPanel → Errors → Error Log
   - Lihat error terakhir

2. **Cek Console Browser:**
   - F12 → Tab Console
   - Lihat error JavaScript/CORS

3. **Test API Manual:**
   - Buka API endpoint langsung di browser
   - Lihat response JSON atau error

4. **Hubungi Developer:**
   - Kirim screenshot error
   - Kirim error log
   - Jelaskan langkah yang sudah dilakukan

---

## 🎉 SELESAI!

Setelah semua langkah di atas, aplikasi sudah bisa diakses di:

**URL Baru:** https://geo.kelolasekolah.web.id

**Login Admin:** https://geo.kelolasekolah.web.id/admin
**Login Guru:** https://geo.kelolasekolah.web.id/guru

---

**Versi:** 1.0 | **Tanggal:** 26 Desember 2025
