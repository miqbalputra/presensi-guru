# Fitur QR Code Scan Presensi

## Deskripsi
Fitur baru yang memungkinkan guru melakukan presensi dengan cara scan QR Code yang tersedia di sekolah. Fitur ini lebih cepat dan aman karena dikombinasikan dengan validasi GPS (Geofencing).

## Alur Kerja

### 1. Untuk Guru
```
Guru Datang ke Sekolah
        ↓
Buka Aplikasi Presensi (PWA)
        ↓
Klik tombol "SCAN QR CODE"
        ↓
Aplikasi mengakses Kamera + GPS
        ↓
Scan QR Code yang dipasang di sekolah
        ↓
Sistem validasi:
  ✓ QR Code valid
  ✓ Lokasi dalam radius sekolah
  ✓ Waktu dalam jam presensi
        ↓
Presensi Berhasil!
```

### 2. Untuk Admin
```
Login sebagai Admin
        ↓
Buka menu "QR Code Presensi"
        ↓
Download atau Print QR Code
        ↓
Pasang QR Code di lokasi strategis
  (Ruang guru, pintu masuk, dll)
```

## File yang Ditambahkan

### Backend (API)
1. **`api/qr_scan.php`** - Endpoint untuk proses scan QR Code
   - POST: Submit presensi via QR
   - GET: Cek status presensi hari ini

2. **`api/qr_generate.php`** - Endpoint untuk generate QR Code
   - GET: Generate data QR Code
   - PUT: Regenerate QR secret

3. **`api/manual_entry.php`** - Endpoint untuk presensi manual
   - GET: Daftar guru untuk dropdown
   - POST: Submit presensi manual

### Frontend
1. **`src/components/guru/QRScanner.jsx`** - Komponen scanner QR untuk guru
2. **`src/components/admin/QRCodeGenerator.jsx`** - Halaman generate QR untuk admin
3. **`src/components/admin/ManualEntry.jsx`** - Halaman presensi manual untuk admin

### Database
1. **`database_qr_scan.sql`** - Migration script untuk:
   - Menambah kolom `metode` di tabel `attendance_logs`
   - Menambah kolom `manual_reason` dan `created_by`
   - Menambah settings `qr_secret` dan `qr_enabled`

## Cara Implementasi

### Step 1: Jalankan Migration Database
```sql
-- Jalankan di phpMyAdmin
-- File: geo-subdomain/database_qr_scan.sql

ALTER TABLE `attendance_logs` 
ADD COLUMN `metode` ENUM('button', 'qr_scan', 'manual') DEFAULT 'button' AFTER `longitude`,
ADD COLUMN `manual_reason` TEXT NULL AFTER `metode`,
ADD COLUMN `created_by` INT NULL AFTER `manual_reason`;

INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_description`, `updated_by`) VALUES
('qr_secret', 'GEOPRESENSI_2024_SECRET_KEY', 'Secret key untuk validasi QR Code', 'system'),
('qr_enabled', '1', 'Aktifkan fitur QR Code Scan (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
```

### Step 2: Upload File API
Upload file-file berikut ke folder `api/` di server:
- `qr_scan.php`
- `qr_generate.php`
- `manual_entry.php`

### Step 3: Build Frontend
```bash
cd geo-subdomain
npm run build
```

### Step 4: Upload Build
Upload folder `dist/` ke server.

### Step 5: Print QR Code
1. Login sebagai admin
2. Buka menu "QR Code Presensi"
3. Klik "Print" untuk mencetak
4. Pasang di lokasi strategis

## Keamanan

### 1. Validasi QR Code
- QR Code berisi secret key yang dicocokkan dengan database
- Jika QR Code bocor, admin bisa regenerate secret baru

### 2. Validasi GPS (Geofencing)
- Guru hanya bisa presensi jika berada dalam radius sekolah
- Radius dapat diatur di Pengaturan (default: 100 meter)

### 3. Mode Testing
- Jika mode testing aktif, validasi GPS di-skip
- Berguna untuk development dan demo

### 4. Audit Trail
- Setiap presensi tercatat metode yang digunakan (button/qr_scan/manual)
- Presensi manual tercatat siapa yang menginput dan alasannya

## Tampilan UI

### Halaman Guru (Belum Presensi)
```
┌─────────────────────────────────────┐
│  [========== SCAN QR CODE =========]│  <- Tombol utama (gradient biru)
│                                     │
│  ─────── atau presensi manual ───── │
│                                     │
│  [========= HADIR =========]        │  <- Tombol hijau
│                                     │
│  [ IZIN ]          [ SAKIT ]        │  <- Tombol kuning & merah
└─────────────────────────────────────┘
```

### Admin Sidebar
```
├── Dashboard
├── Data Guru
├── Jadwal Piket
├── Edit Presensi
├── Download Laporan
├── Hari Libur
├── Log Aktivitas
├── QR Code Presensi   [New]  <- Menu baru
├── Presensi Manual    [New]  <- Menu baru
└── Pengaturan
```

## FAQ

### Q: Bagaimana jika QR Code bocor/di-screenshot?
A: Meski di-screenshot, guru tetap harus berada di lokasi sekolah (validasi GPS). Admin juga bisa regenerate secret untuk membuat QR lama tidak berfungsi.

### Q: Bagaimana jika HP guru rusak?
A: Admin bisa menggunakan fitur "Presensi Manual" dengan mencatat alasan.

### Q: Apakah bisa presensi tanpa GPS?
A: Tidak, kecuali mode testing aktif. Ini adalah fitur keamanan utama.

### Q: Bagaimana cara cetak QR Code?
A: Buka menu "QR Code Presensi" > Klik "Print" > Akan terbuka halaman print yang rapi.

---

*Dokumentasi ini dibuat pada: Februari 2026*
