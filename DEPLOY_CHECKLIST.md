# Checklist Deploy ke cPanel

## Persiapan Lokal

- [ ] Build aplikasi: `npm run build`
- [ ] Pastikan folder `dist` sudah ada
- [ ] Compress folder `dist` menjadi `dist.zip`
- [ ] Compress folder `api` menjadi `api.zip`

## Setup Database di cPanel

- [ ] Login ke cPanel
- [ ] Buka **MySQL Databases**
- [ ] Buat database baru (contoh: `geopresensi_db`)
- [ ] Catat nama lengkap database (contoh: `username_geopresensi_db`)
- [ ] Buat user database baru (contoh: `geopresensi_user`)
- [ ] Buat password yang kuat dan catat
- [ ] Tambahkan user ke database dengan ALL PRIVILEGES
- [ ] Buka **phpMyAdmin**
- [ ] Pilih database yang baru dibuat
- [ ] Import file `database.sql`
- [ ] Pastikan semua tabel berhasil dibuat (users, attendance_logs, activity_logs)

## Upload Backend API

- [ ] Buka **File Manager** di cPanel
- [ ] Navigasi ke root directory (biasanya `/home/username/`)
- [ ] Buat folder baru bernama `api`
- [ ] Upload `api.zip` ke folder `api`
- [ ] Extract `api.zip`
- [ ] Hapus file `api.zip`
- [ ] Edit file `api/config.php`:
  - [ ] Ganti `DB_NAME` dengan nama database Anda
  - [ ] Ganti `DB_USER` dengan username database Anda
  - [ ] Ganti `DB_PASS` dengan password database Anda
- [ ] Set permissions:
  - [ ] Folder `api`: 755
  - [ ] Semua file PHP: 644

## Upload Frontend

- [ ] Buka folder `public_html`
- [ ] Hapus semua file default (index.html, cgi-bin, dll)
- [ ] Upload `dist.zip` ke `public_html`
- [ ] Extract `dist.zip`
- [ ] Pindahkan semua file dari folder `dist` ke `public_html`
- [ ] Hapus folder `dist` dan `dist.zip`
- [ ] Upload file `.htaccess` ke `public_html`
- [ ] Set permissions:
  - [ ] Folder: 755
  - [ ] File: 644

## Konfigurasi Frontend untuk API

Karena aplikasi ini menggunakan localStorage, Anda perlu membuat versi baru yang terhubung ke API.

**Opsi 1: Gunakan localStorage dulu (untuk testing cepat)**
- Aplikasi akan berjalan dengan localStorage
- Data tidak tersimpan di database
- Cocok untuk demo/testing

**Opsi 2: Integrasikan dengan API (production)**
- Perlu modifikasi kode frontend
- Ganti semua `localStorage` dengan API calls
- Data tersimpan di database MySQL

## Testing

- [ ] Buka: `https://yourdomain.com/api/test.php`
- [ ] Harus menampilkan: `{"success":true,"message":"API Connected Successfully"}`
- [ ] Buka: `https://yourdomain.com`
- [ ] Harus menampilkan aplikasi GeoPresensi
- [ ] Test login dengan:
  - Username: `admin`, Password: `admin123`
  - Username: `guru1`, Password: `guru123`

## SSL Certificate (HTTPS)

- [ ] Buka **SSL/TLS Status** di cPanel
- [ ] Aktifkan AutoSSL untuk domain Anda
- [ ] Tunggu beberapa menit hingga SSL aktif
- [ ] Akses website dengan `https://`

## Backup

- [ ] Backup database dari phpMyAdmin
- [ ] Download semua file dari File Manager
- [ ] Simpan credentials database di tempat aman

## Troubleshooting

### API tidak bisa diakses
1. Cek file permissions (755 untuk folder, 644 untuk file)
2. Cek apakah PHP sudah terinstall di hosting
3. Cek error_log di cPanel

### Database connection failed
1. Pastikan credentials di `config.php` benar
2. Cek apakah user sudah ditambahkan ke database
3. Cek apakah database sudah di-import

### Website tidak muncul
1. Pastikan file ada di `public_html`
2. Pastikan ada file `index.html`
3. Cek error_log di cPanel

### CORS Error
1. Pastikan header CORS sudah ada di `config.php`
2. Cek apakah mod_headers aktif di hosting

## Informasi Penting

**Default Login:**
- Admin: `admin` / `admin123`
- Kepala Sekolah: `kepsek` / `kepsek123`
- Guru: `guru1` / `guru123`

**Database Tables:**
- `users` - Data pengguna (admin, kepala sekolah, guru)
- `attendance_logs` - Data presensi
- `activity_logs` - Log aktivitas

**API Endpoints:**
- `POST /api/auth.php?action=login` - Login
- `GET /api/guru.php` - Get all guru
- `POST /api/guru.php` - Create guru
- `PUT /api/guru.php` - Update guru
- `DELETE /api/guru.php?id=X` - Delete guru
- `GET /api/presensi.php` - Get presensi
- `POST /api/presensi.php` - Create presensi
- `PUT /api/presensi.php` - Update presensi

## Keamanan

- [ ] Ganti semua password default
- [ ] Gunakan HTTPS
- [ ] Backup database secara berkala
- [ ] Jangan expose credentials di code
- [ ] Update password database secara berkala
