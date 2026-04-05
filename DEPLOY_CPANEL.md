# Panduan Deploy ke cPanel dengan MySQL

## Persiapan

### 1. Build Aplikasi Frontend
```bash
npm run build
```
Ini akan menghasilkan folder `dist` yang berisi file production-ready.

### 2. Struktur yang Dibutuhkan
```
hosting/
├── public_html/          # Frontend (hasil build)
│   ├── index.html
│   ├── assets/
│   └── ...
├── api/                  # Backend API (PHP)
│   ├── config.php
│   ├── auth.php
│   ├── guru.php
│   ├── presensi.php
│   └── laporan.php
└── database.sql          # SQL untuk setup database
```

## Langkah Deploy

### A. Setup Database MySQL di cPanel

1. **Login ke cPanel**
2. **Buka "MySQL Databases"**
3. **Buat Database Baru**
   - Nama: `geopresensi_db`
   - Catat nama lengkap: `username_geopresensi_db`

4. **Buat User Database**
   - Username: `geopresensi_user`
   - Password: [buat password kuat]
   - Catat credentials ini!

5. **Tambahkan User ke Database**
   - Pilih user dan database yang baru dibuat
   - Berikan ALL PRIVILEGES

6. **Import Database**
   - Buka phpMyAdmin
   - Pilih database yang baru dibuat
   - Import file `database.sql`

### B. Upload Backend API (PHP)

1. **Buka File Manager di cPanel**
2. **Buat folder `api` di root (sejajar dengan public_html)**
3. **Upload semua file PHP ke folder `api/`**
4. **Edit `api/config.php`** dengan credentials database Anda

### C. Upload Frontend

1. **Buka folder `public_html`**
2. **Hapus semua file default (index.html, dll)**
3. **Upload semua file dari folder `dist/`**
4. **Pastikan file `.htaccess` sudah ada**

### D. Konfigurasi

1. **Update API URL di Frontend**
   - Edit file build untuk mengarah ke API Anda
   - Contoh: `https://yourdomain.com/api/`

2. **Test Koneksi**
   - Buka: `https://yourdomain.com/api/test.php`
   - Harus menampilkan: "API Connected"

## Troubleshooting

### Error 500
- Cek file permissions (755 untuk folder, 644 untuk file)
- Cek error_log di cPanel

### Database Connection Failed
- Pastikan credentials di config.php benar
- Cek apakah user sudah ditambahkan ke database

### CORS Error
- Tambahkan header CORS di file PHP
- Atau gunakan .htaccess untuk handle CORS

### 404 Not Found
- Pastikan .htaccess sudah di-upload
- Cek mod_rewrite sudah aktif

## Keamanan

1. **Jangan expose credentials**
2. **Gunakan HTTPS** (SSL Certificate dari cPanel)
3. **Backup database** secara berkala
4. **Update password** secara berkala
5. **Batasi akses API** dengan token/session
