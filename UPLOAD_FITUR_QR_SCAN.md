# ⚡ Upload Cepat Fitur QR Code Scan

## Step 1️⃣ - Database (phpMyAdmin)
Jalankan SQL berikut di phpMyAdmin:

```sql
ALTER TABLE `attendance_logs` 
ADD COLUMN `metode` ENUM('button', 'qr_scan', 'manual') DEFAULT 'button' AFTER `longitude`,
ADD COLUMN `manual_reason` TEXT NULL AFTER `metode`,
ADD COLUMN `created_by` INT NULL AFTER `manual_reason`;

INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_description`, `updated_by`) VALUES
('qr_secret', 'GEOPRESENSI_2024_SECRET_KEY', 'Secret key untuk validasi QR Code', 'system'),
('qr_enabled', '1', 'Aktifkan fitur QR Code Scan (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
```

## Step 2️⃣ - Upload API Files
Upload 3 file ini ke folder `api/` di server:

| File | Lokasi Asal |
|------|-------------|
| `qr_scan.php` | `geo-subdomain/api/qr_scan.php` |
| `qr_generate.php` | `geo-subdomain/api/qr_generate.php` |
| `manual_entry.php` | `geo-subdomain/api/manual_entry.php` |

## Step 3️⃣ - Upload Frontend Build
Upload **SEMUA isi** folder `geo-subdomain/dist/` ke root server.

⚠️ **PENTING**: Ini akan menimpa file-file frontend yang lama.

## Step 4️⃣ - Test
1. Buka https://geoloc.kelolasekolah.web.id
2. Login sebagai Admin
3. Lihat menu baru di sidebar:
   - **QR Code Presensi** - Generate dan cetak QR
   - **Presensi Manual** - Input presensi darurat
4. Login sebagai Guru
5. Lihat tombol baru "SCAN QR CODE" di halaman home

## Checklist

- [ ] SQL migration sudah dijalankan
- [ ] File `qr_scan.php` sudah di-upload
- [ ] File `qr_generate.php` sudah di-upload
- [ ] File `manual_entry.php` sudah di-upload
- [ ] Folder `dist/` sudah di-upload
- [ ] Menu QR Code muncul di admin
- [ ] Tombol Scan QR muncul di guru

---

*Selamat! Fitur QR Code Scan sudah aktif!* 🎉
