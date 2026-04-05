# Panduan Lengkap Upload ke cPanel

## 📋 Persiapan Sebelum Upload

### 1. Build Aplikasi Frontend

```bash
# Di terminal/command prompt, masuk ke folder project
cd D:\Kiro\12 Des 2025

# Edit file .env untuk production
# Ganti dengan domain Anda
VITE_API_URL=https://namadomainanda.com/api

# Build aplikasi
npm run build
```

Setelah build selesai, akan ada folder `dist` yang berisi file production.

### 2. Siapkan File yang Akan Diupload

Anda perlu upload 3 hal:
```
📁 dist/              → Upload ke public_html/
📁 api/               → Upload ke root (sejajar dengan public_html)
📄 database.sql       → Import ke phpMyAdmin
📄 .htaccess          → Upload ke public_html/
```

---

## 🗄️ LANGKAH 1: Setup Database MySQL

### 1.1 Login ke cPanel
- Buka browser
- Ketik: `https://namadomainanda.com/cpanel`
- Login dengan username & password dari hosting

### 1.2 Buat Database Baru

1. **Cari "MySQL Databases"** di cPanel
2. **Scroll ke "Create New Database"**
3. **Isi nama database**: `geopresensi_db`
4. **Klik "Create Database"**
5. **CATAT nama lengkap database** (biasanya: `username_geopresensi_db`)

```
Contoh:
Jika username cPanel Anda: johndoe
Maka nama database lengkap: johndoe_geopresensi_db
```

### 1.3 Buat User Database

1. **Scroll ke "MySQL Users"**
2. **Klik "Add New User"**
3. **Isi username**: `geopresensi_user`
4. **Isi password**: [buat password kuat, CATAT!]
5. **Klik "Create User"**
6. **CATAT username lengkap** (biasanya: `username_geopresensi_user`)

```
Contoh:
Username lengkap: johndoe_geopresensi_user
Password: BuatPasswordKuat123!
```

### 1.4 Tambahkan User ke Database

1. **Scroll ke "Add User To Database"**
2. **Pilih User**: `johndoe_geopresensi_user`
3. **Pilih Database**: `johndoe_geopresensi_db`
4. **Klik "Add"**
5. **Centang "ALL PRIVILEGES"**
6. **Klik "Make Changes"**

### 1.5 Import Database

1. **Kembali ke cPanel**
2. **Cari "phpMyAdmin"**
3. **Klik phpMyAdmin**
4. **Di sidebar kiri, klik database** `johndoe_geopresensi_db`
5. **Klik tab "Import"** di atas
6. **Klik "Choose File"**
7. **Pilih file** `database.sql` dari komputer Anda
8. **Scroll ke bawah, klik "Go"**
9. **Tunggu sampai muncul** "Import has been successfully finished"

✅ **Database sudah siap!**

---

## 📤 LANGKAH 2: Upload Backend API

### 2.1 Buka File Manager

1. **Kembali ke cPanel**
2. **Cari "File Manager"**
3. **Klik File Manager**
4. **Akan terbuka di tab baru**

### 2.2 Buat Folder API

1. **Pastikan Anda di root directory** (biasanya `/home/username/`)
2. **Klik tombol "+ Folder"** di atas
3. **Nama folder**: `api`
4. **Klik "Create New Folder"**

### 2.3 Upload File API

1. **Klik folder `api` yang baru dibuat**
2. **Klik tombol "Upload"** di atas
3. **Klik "Select File"**
4. **Pilih SEMUA file dari folder `api` di komputer Anda**:
   - `config.php`
   - `auth.php`
   - `guru.php`
   - `presensi.php`
   - `activity.php`
   - `test.php`
5. **Tunggu sampai upload selesai**
6. **Klik "Go Back to..."** untuk kembali ke File Manager

### 2.4 Edit config.php

1. **Masih di folder `api`**
2. **Klik kanan pada file `config.php`**
3. **Pilih "Edit"**
4. **Klik "Edit" lagi di popup**
5. **Ganti baris berikut**:

```php
// SEBELUM (bawaan)
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_geopresensi_db');
define('DB_USER', 'username_geopresensi_user');
define('DB_PASS', 'your_password_here');

// SESUDAH (ganti dengan data Anda)
define('DB_HOST', 'localhost');
define('DB_NAME', 'johndoe_geopresensi_db');      // ← Ganti ini
define('DB_USER', 'johndoe_geopresensi_user');    // ← Ganti ini
define('DB_PASS', 'BuatPasswordKuat123!');        // ← Ganti ini
```

6. **Klik "Save Changes"** di kanan atas
7. **Klik "Close"**

### 2.5 Set Permissions

1. **Pilih folder `api`** (centang checkbox)
2. **Klik "Permissions"** di atas
3. **Isi dengan**: `755`
4. **Centang "Recurse into subdirectories"**
5. **Klik "Change Permissions"**

✅ **Backend API sudah siap!**

---

## 🌐 LANGKAH 3: Upload Frontend

### 3.1 Buka Folder public_html

1. **Di File Manager, klik "Home"** (icon rumah di atas)
2. **Double-click folder `public_html`**
3. **Hapus semua file default** (index.html, cgi-bin, dll)
   - Pilih semua file (centang checkbox)
   - Klik "Delete"
   - Konfirmasi "Delete"

### 3.2 Upload File Frontend

1. **Masih di folder `public_html`**
2. **Klik tombol "Upload"**
3. **Klik "Select File"**
4. **Pilih SEMUA file dari folder `dist` di komputer Anda**:
   - `index.html`
   - Folder `assets`
   - File lainnya
5. **Tunggu sampai upload selesai**

### 3.3 Upload .htaccess

1. **Kembali ke File Manager** (klik "Go Back to...")
2. **Masih di `public_html`**
3. **Klik "Upload"**
4. **Upload file `.htaccess`** dari root project Anda
5. **Tunggu sampai selesai**

**PENTING**: Jika file `.htaccess` tidak terlihat:
1. **Klik "Settings"** di kanan atas File Manager
2. **Centang "Show Hidden Files (dotfiles)"**
3. **Klik "Save"**

### 3.4 Set Permissions

1. **Pilih semua file di `public_html`**
2. **Klik "Permissions"**
3. **Isi dengan**: `644` untuk file, `755` untuk folder
4. **Klik "Change Permissions"**

✅ **Frontend sudah siap!**

---

## 🧪 LANGKAH 4: Testing

### 4.1 Test API Connection

1. **Buka browser**
2. **Ketik**: `https://namadomainanda.com/api/test.php`
3. **Harus muncul**:
```json
{
  "success": true,
  "message": "API Connected Successfully",
  "data": {
    "database": "Connected",
    "total_users": 7,
    "timestamp": "2025-12-13 10:30:00"
  }
}
```

❌ **Jika error**:
- Cek `api/config.php` → credentials database benar?
- Cek phpMyAdmin → database sudah di-import?
- Cek File Manager → file API sudah di-upload?

### 4.2 Test Website

1. **Buka**: `https://namadomainanda.com`
2. **Harus muncul halaman login**
3. **Test login**:
   - Username: `admin`
   - Password: `admin123`
4. **Harus masuk ke dashboard**

❌ **Jika error**:
- Cek browser console (F12) → ada error?
- Cek `.env` → API_URL sudah benar?
- Cek File Manager → file frontend sudah di-upload?

---

## 🔒 LANGKAH 5: Setup SSL (HTTPS)

### 5.1 Aktifkan SSL

1. **Kembali ke cPanel**
2. **Cari "SSL/TLS Status"**
3. **Klik SSL/TLS Status**
4. **Cari domain Anda**
5. **Klik "Run AutoSSL"**
6. **Tunggu beberapa menit**
7. **Refresh halaman**
8. **Status harus "Active"**

### 5.2 Force HTTPS (Optional)

Edit file `.htaccess` di `public_html`:

```apache
# Tambahkan di paling atas
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

✅ **SSL sudah aktif!**

---

## 📊 Struktur File di Server

```
/home/username/
├── api/                          ← Backend API
│   ├── config.php               ← Edit credentials di sini
│   ├── auth.php
│   ├── guru.php
│   ├── presensi.php
│   ├── activity.php
│   └── test.php
│
└── public_html/                  ← Frontend
    ├── index.html
    ├── .htaccess
    └── assets/
        ├── index-xxx.js
        └── index-xxx.css
```

---

## 🔧 Troubleshooting

### Error: "Database connection failed"

**Solusi**:
1. Buka File Manager → `api/config.php`
2. Cek credentials:
   - `DB_NAME` → harus `username_geopresensi_db`
   - `DB_USER` → harus `username_geopresensi_user`
   - `DB_PASS` → password yang Anda buat
3. Buka phpMyAdmin → cek database sudah ada?
4. Buka MySQL Databases → cek user sudah ditambahkan ke database?

### Error: "404 Not Found" untuk API

**Solusi**:
1. Cek folder `api` ada di root (sejajar dengan `public_html`)
2. Cek file PHP sudah di-upload semua
3. Cek permissions folder `api` = 755
4. Cek permissions file PHP = 644

### Error: "CORS Error" di browser console

**Solusi**:
1. Buka `api/config.php`
2. Pastikan ada baris ini:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

### Error: "Cannot GET /" atau blank page

**Solusi**:
1. Cek file `index.html` ada di `public_html`
2. Cek file `.htaccess` sudah di-upload
3. Cek browser console (F12) → ada error?
4. Cek `.env` → `VITE_API_URL` sudah benar?

### Login gagal terus

**Solusi**:
1. Test API dulu: `https://domain.com/api/test.php`
2. Jika API OK, cek browser console
3. Cek Network tab → ada request ke `/api/auth.php`?
4. Cek response → apa error message-nya?

---

## 📝 Checklist Upload

Gunakan checklist ini untuk memastikan semua sudah benar:

### Database
- [ ] Database sudah dibuat
- [ ] User database sudah dibuat
- [ ] User sudah ditambahkan ke database dengan ALL PRIVILEGES
- [ ] File `database.sql` sudah di-import
- [ ] Ada 3 tabel: `users`, `attendance_logs`, `activity_logs`
- [ ] Ada 7 users di tabel `users`

### Backend API
- [ ] Folder `api` sudah dibuat di root
- [ ] Semua file PHP sudah di-upload ke folder `api`
- [ ] File `config.php` sudah diedit dengan credentials yang benar
- [ ] Permissions folder `api` = 755
- [ ] Permissions file PHP = 644
- [ ] Test endpoint berhasil: `https://domain.com/api/test.php`

### Frontend
- [ ] Folder `public_html` sudah dikosongkan
- [ ] Semua file dari folder `dist` sudah di-upload
- [ ] File `.htaccess` sudah di-upload
- [ ] File `.htaccess` terlihat (Show Hidden Files aktif)
- [ ] Permissions file = 644, folder = 755
- [ ] Website bisa dibuka: `https://domain.com`

### Testing
- [ ] API test berhasil
- [ ] Website bisa dibuka
- [ ] Login berhasil (admin/admin123)
- [ ] Dashboard muncul
- [ ] Data guru muncul
- [ ] Bisa tambah/edit/hapus guru
- [ ] Bisa presensi (login sebagai guru)

### SSL
- [ ] SSL sudah aktif
- [ ] Website bisa diakses dengan HTTPS
- [ ] Tidak ada warning SSL

---

## 🎯 Tips Penting

1. **Catat semua credentials**:
   - Database name
   - Database user
   - Database password
   - cPanel username
   - cPanel password

2. **Backup berkala**:
   - Export database dari phpMyAdmin
   - Download semua file dari File Manager

3. **Keamanan**:
   - Ganti semua password default
   - Gunakan password yang kuat
   - Aktifkan SSL/HTTPS

4. **Monitoring**:
   - Cek error_log di cPanel secara berkala
   - Monitor penggunaan database
   - Backup database setiap minggu

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Cek error_log**:
   - File Manager → `api/error_log`
   - cPanel → Metrics → Errors

2. **Cek browser console**:
   - Tekan F12
   - Tab Console → lihat error
   - Tab Network → lihat request/response

3. **Test dengan curl**:
```bash
curl https://domain.com/api/test.php
```

4. **Hubungi support hosting** jika:
   - PHP tidak bisa diakses
   - Database tidak bisa dibuat
   - File tidak bisa di-upload

---

## ✅ Selesai!

Jika semua checklist sudah ✅, aplikasi Anda sudah online dan siap digunakan!

**URL Aplikasi**: `https://namadomainanda.com`
**URL API**: `https://namadomainanda.com/api/`

Selamat! 🎉
