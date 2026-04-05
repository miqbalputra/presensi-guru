# ✅ SIAP UPLOAD KE CPANEL!

Build berhasil! Folder `dist` sudah ada. Sekarang Anda siap upload ke cPanel.

---

## 📦 FILE YANG PERLU DIUPLOAD

### ✅ GRUP 1: Backend API (6 file PHP)

**Lokasi di komputer Anda**:
```
D:\Kiro\12 Des 2025\api\
```

**File yang diupload**:
1. ✅ config.php
2. ✅ auth.php
3. ✅ guru.php
4. ✅ presensi.php
5. ✅ activity.php
6. ✅ test.php

**Upload ke**: `/home/username/api/` (buat folder `api` dulu)

---

### ✅ GRUP 2: Frontend (2 item dari folder dist)

**Lokasi di komputer Anda**:
```
D:\Kiro\12 Des 2025\dist\
```

**File/Folder yang diupload**:
1. ✅ index.html
2. ✅ assets (folder + isinya)

**Upload ke**: `/home/username/public_html/`

**PENTING**: Upload ISI folder dist, BUKAN folder dist itu sendiri!

---

### ✅ GRUP 3: File .htaccess

**Lokasi di komputer Anda**:
```
D:\Kiro\12 Des 2025\.htaccess
```

**Upload ke**: `/home/username/public_html/.htaccess`

---

### ✅ GRUP 4: Database SQL

**Lokasi di komputer Anda**:
```
D:\Kiro\12 Des 2025\database.sql
```

**Import via**: phpMyAdmin (bukan upload biasa)

---

## 🎯 LANGKAH UPLOAD KE CPANEL

### LANGKAH 1: Setup Database (5 menit)

1. **Login ke cPanel** → `https://domainanda.com/cpanel`

2. **Buka "MySQL Databases"**

3. **Buat Database**:
   - Nama: `geopresensi_db`
   - Klik "Create Database"
   - **CATAT nama lengkap**: `username_geopresensi_db`

4. **Buat User**:
   - Username: `geopresensi_user`
   - Password: [buat password kuat]
   - Klik "Create User"
   - **CATAT username lengkap**: `username_geopresensi_user`
   - **CATAT password**: [password yang Anda buat]

5. **Add User to Database**:
   - Pilih user: `username_geopresensi_user`
   - Pilih database: `username_geopresensi_db`
   - Klik "Add"
   - Centang "ALL PRIVILEGES"
   - Klik "Make Changes"

6. **Import Database**:
   - Kembali ke cPanel
   - Klik "phpMyAdmin"
   - Pilih database `username_geopresensi_db`
   - Tab "Import"
   - Choose File → pilih `database.sql` dari komputer
   - Klik "Go"
   - Tunggu sampai selesai

✅ **Database selesai!**

---

### LANGKAH 2: Upload Backend API (3 menit)

1. **Buka "File Manager"** di cPanel

2. **Pastikan di root** (`/home/username/`)

3. **Buat folder baru**:
   - Klik "+ Folder"
   - Nama: `api`
   - Klik "Create New Folder"

4. **Masuk ke folder `api`** (double-click)

5. **Upload file PHP**:
   - Klik "Upload"
   - Klik "Select File"
   - Pilih SEMUA 6 file dari `D:\Kiro\12 Des 2025\api\`:
     - config.php
     - auth.php
     - guru.php
     - presensi.php
     - activity.php
     - test.php
   - Tunggu sampai selesai
   - Klik "Go Back to..."

6. **Edit config.php**:
   - Masih di folder `api`
   - Klik kanan `config.php` → Edit
   - Klik "Edit" lagi
   - **Ganti baris 4-6**:
     ```php
     define('DB_NAME', 'username_geopresensi_db');  // ← Ganti
     define('DB_USER', 'username_geopresensi_user'); // ← Ganti
     define('DB_PASS', 'password_anda');             // ← Ganti
     ```
   - Klik "Save Changes"
   - Klik "Close"

✅ **Backend API selesai!**

---

### LANGKAH 3: Upload Frontend (3 menit)

1. **Di File Manager, klik "Home"** (icon rumah)

2. **Masuk ke folder `public_html`** (double-click)

3. **Hapus semua file default**:
   - Pilih semua file (centang checkbox)
   - Klik "Delete"
   - Konfirmasi "Delete"

4. **Upload file frontend**:
   - Klik "Upload"
   - Klik "Select File"
   - Pilih dari `D:\Kiro\12 Des 2025\dist\`:
     - ✅ index.html
     - ✅ Folder assets (pilih folder, bukan isinya)
   - Tunggu sampai selesai
   - Klik "Go Back to..."

5. **Upload .htaccess**:
   - Masih di `public_html`
   - Klik "Upload"
   - Pilih file `.htaccess` dari `D:\Kiro\12 Des 2025\`
   - Tunggu sampai selesai

6. **Cek file .htaccess terlihat**:
   - Klik "Settings" (kanan atas)
   - Centang "Show Hidden Files (dotfiles)"
   - Klik "Save"
   - File `.htaccess` harus terlihat

✅ **Frontend selesai!**

---

### LANGKAH 4: Testing (2 menit)

1. **Test API**:
   - Buka browser
   - Ketik: `https://domainanda.com/api/test.php`
   - **Harus muncul**:
     ```json
     {
       "success": true,
       "message": "API Connected Successfully",
       "data": {
         "database": "Connected",
         "total_users": 7
       }
     }
     ```

2. **Test Website**:
   - Buka: `https://domainanda.com`
   - **Harus muncul**: Halaman login

3. **Test Login**:
   - Username: `admin`
   - Password: `admin123`
   - **Harus masuk**: Dashboard admin

✅ **Aplikasi sudah online!**

---

## 📊 STRUKTUR AKHIR DI SERVER

```
/home/username/
│
├── api/                          ← Backend
│   ├── config.php               ← SUDAH DIEDIT
│   ├── auth.php
│   ├── guru.php
│   ├── presensi.php
│   ├── activity.php
│   └── test.php
│
└── public_html/                  ← Frontend
    ├── index.html
    ├── assets/
    │   ├── index-xxx.js
    │   └── index-xxx.css
    └── .htaccess
```

---

## 🔑 CREDENTIALS YANG PERLU DICATAT

```
=== DATABASE ===
Database Name: username_geopresensi_db
Database User: username_geopresensi_user
Database Pass: [password Anda]

=== LOGIN APLIKASI ===
Admin:
- Username: admin
- Password: admin123

Guru:
- Username: guru1
- Password: guru123
```

---

## ⚠️ TROUBLESHOOTING

### API test gagal (error 500)
→ Cek `api/config.php` → credentials database benar?

### Login gagal
→ Cek browser console (F12) → ada error?

### Blank page
→ Cek file `index.html` ada di `public_html`?

### Database connection failed
→ Cek phpMyAdmin → database sudah di-import?

---

## ✅ CHECKLIST UPLOAD

- [ ] Database sudah dibuat
- [ ] User database sudah dibuat
- [ ] User sudah ditambahkan ke database
- [ ] File database.sql sudah di-import
- [ ] Folder api sudah dibuat di root
- [ ] 6 file PHP sudah diupload ke folder api
- [ ] File config.php sudah diedit dengan credentials
- [ ] Folder public_html sudah dikosongkan
- [ ] File index.html sudah diupload
- [ ] Folder assets sudah diupload
- [ ] File .htaccess sudah diupload
- [ ] Test API berhasil (https://domain.com/api/test.php)
- [ ] Website bisa dibuka (https://domain.com)
- [ ] Login berhasil (admin/admin123)

---

## 🎉 SELESAI!

Setelah semua checklist ✅, aplikasi Anda sudah online!

**URL Aplikasi**: `https://domainanda.com`

Selamat! 🎊
