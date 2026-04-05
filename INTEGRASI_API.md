# Integrasi API - GeoPresensi Sekolah

## Perubahan yang Dilakukan

### 1. Service Layer (`src/services/api.js`)
File baru yang berisi semua fungsi untuk berkomunikasi dengan backend API:
- `authAPI` - Login, logout, check session
- `guruAPI` - CRUD data guru
- `presensiAPI` - CRUD presensi
- `activityAPI` - Log aktivitas

### 2. Environment Variables
- `.env` - Konfigurasi API URL untuk development
- `.env.example` - Template untuk production

### 3. Komponen yang Sudah Diupdate
✅ **Login.jsx** - Menggunakan `authAPI.login()`
✅ **DataGuru.jsx** - Menggunakan `guruAPI` untuk CRUD

### 4. Komponen yang Perlu Diupdate (Belum)
⏳ **GuruHome.jsx** - Presensi guru
⏳ **EditPresensi.jsx** - Edit presensi admin
⏳ **DashboardHome.jsx** - Dashboard statistics
⏳ **DownloadLaporan.jsx** - Download reports
⏳ **GuruRiwayat.jsx** - Riwayat presensi guru
⏳ **LogAktivitas.jsx** - Log aktivitas

## Cara Menggunakan

### Development (Lokal)

1. **Setup Backend Lokal**
   ```bash
   # Install XAMPP atau WAMP
   # Copy folder 'api' ke htdocs/
   # Import database.sql ke phpMyAdmin
   # Edit api/config.php dengan credentials lokal
   ```

2. **Konfigurasi Frontend**
   ```bash
   # Copy .env.example ke .env
   cp .env.example .env
   
   # Edit .env
   VITE_API_URL=http://localhost/api
   ```

3. **Jalankan Aplikasi**
   ```bash
   npm install
   npm run dev
   ```

### Production (cPanel)

1. **Build Aplikasi**
   ```bash
   # Edit .env untuk production
   VITE_API_URL=https://yourdomain.com/api
   
   # Build
   npm run build
   ```

2. **Upload ke cPanel**
   - Upload folder `api/` ke root
   - Upload isi folder `dist/` ke `public_html/`
   - Edit `api/config.php` dengan credentials database cPanel

## API Endpoints

### Auth
- `POST /api/auth.php?action=login` - Login
- `POST /api/auth.php?action=logout` - Logout
- `GET /api/auth.php?action=check` - Check session

### Guru
- `GET /api/guru.php` - Get all guru
- `GET /api/guru.php?id=X` - Get guru by ID
- `POST /api/guru.php` - Create guru
- `PUT /api/guru.php` - Update guru
- `DELETE /api/guru.php?id=X` - Delete guru

### Presensi
- `GET /api/presensi.php` - Get all presensi
- `GET /api/presensi.php?user_id=X` - Get by user
- `GET /api/presensi.php?tanggal=YYYY-MM-DD` - Get by date
- `GET /api/presensi.php?start_date=X&end_date=Y` - Get by range
- `POST /api/presensi.php` - Create presensi
- `PUT /api/presensi.php` - Update presensi
- `DELETE /api/presensi.php?id=X` - Delete presensi

### Activity Logs
- `GET /api/activity.php` - Get all logs
- `POST /api/activity.php` - Create log

## Format Data

### Login Request
```json
{
  "username": "guru1",
  "password": "guru123"
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "id": 3,
    "id_guru": "G2020001",
    "username": "guru1",
    "role": "guru",
    "nama": "Budi Santoso",
    "jenis_kelamin": "Laki-laki",
    "alamat": "Jl. Merdeka No. 10",
    "no_hp": "081234567890",
    "jabatan": ["Guru Matematika", "Wali Kelas 7A"],
    "tanggal_bertugas": "2020-01-15"
  }
}
```

### Create Guru Request
```json
{
  "idGuru": "G2023001",
  "username": "guru6",
  "password": "guru123",
  "nama": "John Doe",
  "jenisKelamin": "Laki-laki",
  "alamat": "Jl. Example No. 1",
  "noHP": "081234567890",
  "jabatan": ["Guru Matematika"],
  "tanggalBertugas": "2023-01-01"
}
```

### Create Presensi Request
```json
{
  "userId": 3,
  "nama": "Budi Santoso",
  "tanggal": "2025-12-13",
  "status": "hadir",
  "jamMasuk": "07:15:00",
  "jamHadir": "07:15:00",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

## Error Handling

Semua API response mengikuti format:
```json
{
  "success": false,
  "message": "Error message here",
  "data": null
}
```

## Testing

### Test API Connection
```bash
curl https://yourdomain.com/api/test.php
```

Expected response:
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

### Test Login
```bash
curl -X POST https://yourdomain.com/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### CORS Error
Pastikan header CORS sudah ada di `api/config.php`:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

### 404 Not Found
- Pastikan mod_rewrite aktif
- Cek file .htaccess sudah di-upload
- Cek path API URL di .env

### Database Connection Failed
- Cek credentials di `api/config.php`
- Pastikan database sudah di-import
- Cek apakah user sudah ditambahkan ke database

### Session Not Working
- Pastikan `session_start()` dipanggil di `config.php`
- Cek cookie settings di browser
- Gunakan `credentials: 'include'` di fetch options

## Next Steps

Untuk melengkapi integrasi, perlu update komponen berikut:
1. GuruHome.jsx - Presensi masuk/pulang
2. EditPresensi.jsx - CRUD presensi admin
3. DashboardHome.jsx - Load data dari API
4. DownloadLaporan.jsx - Load data dari API
5. GuruRiwayat.jsx - Load riwayat dari API
6. LogAktivitas.jsx - Load logs dari API

Apakah Anda ingin saya lanjutkan update komponen-komponen tersebut?
