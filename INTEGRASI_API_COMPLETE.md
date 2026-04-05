# Integrasi API - SELESAI

## Status Integrasi

### ✅ Komponen yang Sudah Terintegrasi

1. **Login.jsx** - Login dengan API
2. **DataGuru.jsx** - CRUD data guru dengan API
3. **GuruHome.jsx** - Presensi masuk/pulang dengan API
4. **DashboardHome.jsx** - Load data dari API
5. **DownloadLaporan.jsx** - Load data dari API
6. **GuruRiwayat.jsx** - Load riwayat dari API
7. **EditPresensi.jsx** - CRUD presensi dengan API

### 📁 File Backend API

1. **api/config.php** - Konfigurasi database & CORS
2. **api/auth.php** - Login/logout/check session
3. **api/guru.php** - CRUD data guru
4. **api/presensi.php** - CRUD presensi
5. **api/activity.php** - Log aktivitas
6. **api/test.php** - Test koneksi

### 📁 File Frontend

1. **src/services/api.js** - Service layer untuk API calls
2. **.env** - Konfigurasi API URL
3. **.env.example** - Template environment

### 📁 File Database

1. **database.sql** - Schema & data initial

## Cara Deploy

### 1. Persiapan Lokal

```bash
# Install dependencies
npm install

# Copy .env.example ke .env
cp .env.example .env

# Edit .env untuk production
VITE_API_URL=https://yourdomain.com/api

# Build aplikasi
npm run build
```

### 2. Setup Database di cPanel

1. Login ke cPanel
2. Buka **MySQL Databases**
3. Buat database baru (contoh: `geopresensi_db`)
4. Buat user database (contoh: `geopresensi_user`)
5. Tambahkan user ke database dengan ALL PRIVILEGES
6. Buka **phpMyAdmin**
7. Import file `database.sql`

### 3. Upload Backend API

1. Buka **File Manager** di cPanel
2. Buat folder `api` di root
3. Upload semua file dari folder `api/` lokal
4. Edit `api/config.php`:
   ```php
   define('DB_NAME', 'username_geopresensi_db');
   define('DB_USER', 'username_geopresensi_user');
   define('DB_PASS', 'your_password_here');
   ```
5. Set permissions:
   - Folder `api`: 755
   - File PHP: 644

### 4. Upload Frontend

1. Buka folder `public_html`
2. Hapus semua file default
3. Upload semua file dari folder `dist/`
4. Upload file `.htaccess`
5. Set permissions:
   - Folder: 755
   - File: 644

### 5. Testing

1. Test API: `https://yourdomain.com/api/test.php`
2. Test Login: `https://yourdomain.com`
3. Login dengan:
   - Admin: `admin` / `admin123`
   - Guru: `guru1` / `guru123`

## Perbedaan dengan Versi localStorage

### Sebelum (localStorage)
- Data tersimpan di browser
- Hilang jika clear cache
- Tidak bisa diakses dari device lain
- Tidak ada sinkronisasi

### Sesudah (MySQL + API)
- Data tersimpan di database server
- Permanen dan aman
- Bisa diakses dari device mana saja
- Real-time sync antar user

## API Endpoints

### Auth
- `POST /api/auth.php?action=login`
- `POST /api/auth.php?action=logout`
- `GET /api/auth.php?action=check`

### Guru
- `GET /api/guru.php` - Get all
- `GET /api/guru.php?id=X` - Get by ID
- `POST /api/guru.php` - Create
- `PUT /api/guru.php` - Update
- `DELETE /api/guru.php?id=X` - Delete

### Presensi
- `GET /api/presensi.php` - Get all
- `GET /api/presensi.php?user_id=X` - By user
- `GET /api/presensi.php?tanggal=YYYY-MM-DD` - By date
- `GET /api/presensi.php?start_date=X&end_date=Y` - By range
- `POST /api/presensi.php` - Create
- `PUT /api/presensi.php` - Update
- `DELETE /api/presensi.php?id=X` - Delete

### Activity
- `GET /api/activity.php` - Get all logs
- `POST /api/activity.php` - Create log

## Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Kepala Sekolah | kepsek | kepsek123 |
| Guru 1 | guru1 | guru123 |
| Guru 2 | guru2 | guru123 |
| Guru 3 | guru3 | guru123 |
| Guru 4 | guru4 | guru123 |
| Guru 5 | guru5 | guru123 |

## Troubleshooting

### API tidak bisa diakses
- Cek file permissions
- Cek error_log di cPanel
- Pastikan PHP versi 7.4+

### CORS Error
- Pastikan header CORS ada di `config.php`
- Cek browser console untuk detail error

### Database connection failed
- Cek credentials di `config.php`
- Pastikan database sudah di-import
- Cek user sudah ditambahkan ke database

### Login gagal
- Cek API test endpoint dulu
- Cek network tab di browser
- Pastikan password di-hash dengan benar

## Keamanan

1. **Ganti semua password default**
2. **Gunakan HTTPS** (SSL dari cPanel)
3. **Backup database** secara berkala
4. **Update password** secara berkala
5. **Jangan expose credentials** di code

## Maintenance

### Backup Database
```bash
# Via phpMyAdmin
1. Pilih database
2. Export
3. Format: SQL
4. Download
```

### Update Data
```bash
# Via phpMyAdmin
1. Pilih database
2. Pilih tabel
3. Edit/Insert/Delete
```

### Monitor Logs
```bash
# Via cPanel
1. File Manager
2. Cek error_log
3. Atau Metrics > Errors
```

## Support

Jika ada masalah:
1. Cek error_log di cPanel
2. Cek browser console
3. Test API endpoint dengan curl/Postman
4. Cek database connection

## Selesai! 🎉

Aplikasi GeoPresensi Sekolah sudah siap di-deploy ke production dengan database MySQL!
