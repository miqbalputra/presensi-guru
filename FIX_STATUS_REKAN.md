# Fix: Status Guru Lain Tidak Muncul

## Masalah
Halaman "Status Rekan" menampilkan "Tidak ada guru lain" padahal ada guru lain yang terdaftar di sistem.

## Penyebab
API `guru.php` hanya bisa diakses oleh role **admin** (`requireAuth(['admin'])`), sehingga ketika **guru** mencoba mengakses endpoint untuk melihat daftar guru lain, request ditolak dengan error 403 Forbidden.

## Solusi
Ubah permission di `api/guru.php` agar:
1. **GET endpoints** (GET ALL dan GET BY ID) bisa diakses oleh **admin** dan **guru**
2. **POST/PUT/DELETE endpoints** tetap hanya bisa diakses oleh **admin**

### Perubahan di `api/guru.php`

#### SEBELUM:
```php
require_once 'config.php';

// Hanya admin yang bisa akses endpoint ini
requireAuth(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL GURU
if ($method === 'GET' && !isset($_GET['id'])) {
    // ...
}
```

#### SESUDAH:
```php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL GURU - Admin dan Guru bisa akses
if ($method === 'GET' && !isset($_GET['id'])) {
    requireAuth(['admin', 'guru']);
    // ...
}

// GET GURU BY ID - Admin dan Guru bisa akses
if ($method === 'GET' && isset($_GET['id'])) {
    requireAuth(['admin', 'guru']);
    // ...
}

// CREATE GURU - Hanya Admin
if ($method === 'POST') {
    requireAuth(['admin']);
    // ...
}

// UPDATE GURU - Hanya Admin
if ($method === 'PUT') {
    requireAuth(['admin']);
    // ...
}

// DELETE GURU - Hanya Admin
if ($method === 'DELETE') {
    requireAuth(['admin']);
    // ...
}
```

## Perubahan di Frontend
Menambahkan console.log untuk debugging di `src/components/guru/GuruStatus.jsx`:
- Log current user ID
- Log semua guru yang diambil dari API
- Log presensi hari ini
- Log proses filtering dan mapping
- Memperbaiki field mapping untuk `user_id` vs `userId` dan `jam_masuk` vs `jamMasuk`

## Cara Kerja
1. Guru login dan masuk ke tab "Status Rekan"
2. Frontend memanggil `guruAPI.getAll()` → request ke `api/guru.php`
3. API mengecek auth dengan `requireAuth(['admin', 'guru'])` → **BERHASIL** (sebelumnya ditolak)
4. API mengembalikan daftar semua guru
5. Frontend filter guru (exclude current user) dan map dengan data presensi
6. Tampilkan status setiap guru (Hadir/Izin/Sakit/Belum Absen)

## Security
Guru hanya bisa:
- ✅ Melihat daftar guru (GET)
- ✅ Melihat detail guru (GET BY ID)
- ❌ Menambah guru baru (POST) - Hanya Admin
- ❌ Edit data guru (PUT) - Hanya Admin
- ❌ Hapus guru (DELETE) - Hanya Admin

## Testing
1. Login sebagai guru
2. Klik tab "Status Rekan" di bottom navigation
3. Seharusnya muncul daftar guru lain dengan status:
   - **Hadir** (hijau) - jika sudah presensi hadir
   - **Izin** (kuning) - jika sudah presensi izin
   - **Sakit** (merah) - jika sudah presensi sakit
   - **Belum Absen** (abu-abu) - jika belum presensi
4. Cek console browser untuk melihat log debugging
5. Klik tombol "🔄 Refresh" untuk reload data

## File yang Diubah
1. `api/guru.php` - Ubah permission untuk GET endpoints
2. `src/components/guru/GuruStatus.jsx` - Tambah debugging dan perbaiki field mapping

## Status
✅ **SELESAI** - Siap di-upload ke cPanel
