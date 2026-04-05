# 🚀 Setup GeoPresensi di Laragon

## Step 1️⃣ - Buat Folder di Laragon

Buat folder `geopresensi` di dalam `C:\laragon\www\`:
```
C:\laragon\www\geopresensi\
```

## Step 2️⃣ - Copy Folder API

Copy **seluruh isi** folder:
```
geo-subdomain\api\
```

Ke:
```
C:\laragon\www\geopresensi\api\
```

Hasilnya:
```
C:\laragon\www\geopresensi\
└── api\
    ├── config.php
    ├── security.php
    ├── auth.php
    ├── guru.php
    ├── presensi.php
    ├── qr_scan.php       <- File baru
    ├── qr_generate.php   <- File baru
    ├── manual_entry.php  <- File baru
    └── ... (file lainnya)
```

## Step 3️⃣ - Buat Database di Laragon

1. Buka **HeidiSQL** dari Laragon (klik kanan icon Laragon > MySQL > HeidiSQL)
2. Connect ke localhost (user: root, password: kosong)
3. Buat database baru: `geopresensi`
4. Pilih database `geopresensi`
5. Klik **File > Run SQL file...**
6. Pilih file: `geo-subdomain\database.sql`
7. Execute

Atau jalankan SQL ini secara manual:

```sql
CREATE DATABASE IF NOT EXISTS geopresensi;
USE geopresensi;

-- Kemudian copy-paste isi dari file database.sql
```

## Step 4️⃣ - Jalankan Migration QR Scan

Di HeidiSQL, jalankan SQL berikut:

```sql
USE geopresensi;

-- Tambah kolom untuk QR Scan
ALTER TABLE `attendance_logs` 
ADD COLUMN `metode` ENUM('button', 'qr_scan', 'manual') DEFAULT 'button' AFTER `longitude`,
ADD COLUMN `manual_reason` TEXT NULL AFTER `metode`,
ADD COLUMN `created_by` INT NULL AFTER `manual_reason`;

-- Tambah settings QR
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_description`, `updated_by`) VALUES
('qr_secret', 'GEOPRESENSI_2024_SECRET_KEY', 'Secret key untuk validasi QR Code', 'system'),
('qr_enabled', '1', 'Aktifkan fitur QR Code Scan (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
```

## Step 5️⃣ - Start Laragon

1. Klik **Start All** di Laragon
2. Pastikan Apache dan MySQL berjalan (hijau)

## Step 6️⃣ - Test API

Buka browser dan akses:
```
http://localhost/geopresensi/api/test.php
```

Jika berhasil, akan muncul response JSON.

## Step 7️⃣ - Restart Dev Server

Stop dev server yang sedang berjalan (Ctrl+C), lalu jalankan ulang:

```bash
cd geo-subdomain
npm run dev
```

## Step 8️⃣ - Buka Aplikasi

Buka browser:
```
http://localhost:5173
```

Login dengan:
- **Admin**: username `admin`, password `password`
- **Guru**: username `guru1`, password `password`

---

## 📂 Struktur Final

```
C:\laragon\www\geopresensi\
└── api\
    ├── config.php         <- Auto-detect Laragon/Production
    ├── security.php
    ├── auth.php
    ├── guru.php
    ├── presensi.php
    ├── holidays.php
    ├── settings.php
    ├── jadwal_piket.php
    ├── activity.php
    ├── qr_scan.php        <- BARU
    ├── qr_generate.php    <- BARU
    ├── manual_entry.php   <- BARU
    └── ... (file lainnya)

D:\Google Antigravity\Presensi Pengajar Antigravity\
└── geo-subdomain\
    ├── src\              <- Source code React
    ├── dist\             <- Build output
    ├── api\              <- API source (copy ke Laragon)
    └── .env              <- Sudah diset untuk localhost
```

---

## ⚠️ Troubleshooting

### Error: Database connection failed
- Pastikan MySQL Laragon sudah running
- Pastikan database `geopresensi` sudah dibuat
- Cek HeidiSQL apakah bisa connect

### Error: CORS
- Pastikan `config.php` sudah di-update (auto-detect localhost)
- Pastikan Laragon sudah restart setelah copy file

### Halaman blank/error
- Buka Console browser (F12) untuk lihat error
- Cek Network tab untuk lihat response API

---

*Happy coding!* 🎉
