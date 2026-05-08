# Deploy GeoPresensi di Coolify

Repo ini sudah disiapkan untuk deploy sebagai Docker image berbasis **FrankenPHP classic mode**. Coolify cukup pull repo GitHub dan build dari `Dockerfile`.

## 1. Buat Database

Di Coolify, buat service database **MySQL 8**. Hindari MariaDB untuk import awal karena dump cPanel memakai collation `utf8mb4_0900_ai_ci`.

Import dump `geogqpresence.sql` ke database MySQL 8. File dump sengaja tidak ikut Git karena berisi data produksi.

Setelah import, pastikan setting produksi:

```sql
UPDATE settings SET setting_value = '0' WHERE setting_key = 'mode_testing';
```

## 2. Buat Application

1. Pilih repository `https://github.com/miqbalputra/presensi-guru.git`.
2. Build Pack: **Dockerfile**.
3. Port aplikasi: `80`.
4. Domain: arahkan ke domain/subdomain presensi.

## 3. Environment Variables

Isi variable berikut di Coolify:

```env
APP_ENV=production
APP_URL=https://domain-presensi-anda.com
APP_TIMEZONE=Asia/Jakarta
CORS_ALLOWED_ORIGINS=https://domain-presensi-anda.com

DB_HOST=nama-service-mysql-atau-host-internal
DB_PORT=3306
DB_NAME=geogqpresence
DB_USER=user_database
DB_PASS=password_database
DB_TIMEZONE=+07:00

N8N_API_KEY=isi-dengan-random-key-yang-kuat
```

Opsional jika memakai webhook WhatsApp direct:

```env
GOWA_WEBHOOK_URL=
GOWA_USERNAME=
GOWA_PASSWORD=
```

Frontend di dalam Docker default memakai `VITE_API_URL=/api`, jadi API berjalan same-origin dan tidak perlu URL API berbeda.

## 4. Cron Reminder

Jika fitur reminder dipakai, buat scheduled task di Coolify atau cron VPS untuk memanggil:

```bash
curl -fsS https://domain-presensi-anda.com/api/webhook_reminder.php
```

Jalankan pada jam `08:00`, `09:00`, dan `10:00` WIB.

## 5. Optimasi Database Produksi

Setelah import database dan deploy pertama berhasil, jalankan migrasi index berikut satu kali di database MySQL produksi:

```sql
SOURCE migrations/2026-05-08-performance-indexes.sql;
```

Jika menjalankan dari SQL console Coolify/MySQL, copy isi file `migrations/2026-05-08-performance-indexes.sql` lalu execute. Migrasi ini hanya menambahkan index jika belum ada, sehingga aman dijalankan ulang dan tidak mengubah isi data presensi.

## 6. Catatan Keamanan

Endpoint debug/reset/import lama sudah dikeluarkan dari image production. Credential database dan API key harus disimpan di environment variable Coolify, bukan di file PHP.

Runtime production memakai FrankenPHP classic mode dengan OPcache aktif. Worker mode belum dipakai supaya tetap aman untuk struktur PHP procedural saat ini.

## 7. Healthcheck

Image Docker sudah punya healthcheck bawaan ke:

```bash
/api/health.php
```

Endpoint ini mengecek runtime FrankenPHP/PHP dan koneksi MySQL ringan (`SELECT 1`). Jika Coolify menampilkan container unhealthy, cek env database (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`) dan pastikan service MySQL berjalan.
