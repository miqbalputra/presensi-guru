# 📱 GeoPresensi Griya Quran
### Sistem Absensi Guru Berbasis Lokasi (GPS) & QR Code

## Stack migrasi dan deployment

Stack target menggunakan React 19/TypeScript/Vite/Tailwind v4 di frontend dan Go 1.25/Fiber/GORM/MySQL di backend. Frontend memanggil REST API `/api/v1`; route PHP lama hanya dipertahankan sebagai compatibility layer untuk rollback/klien lama. Image kandidat migrasi dibangun melalui `Dockerfile.migration`; deployment staging dijelaskan di [STAGING_MIGRATION.md](STAGING_MIGRATION.md). `Dockerfile` dan API PHP lama dipertahankan sementara sampai cutover disetujui.

Ringkasnya:

1. Buat database MySQL 8.4 staging/production yang terpisah.
2. Siapkan environment dari `deploy/staging.env.example` atau `.env.example`; isi semua secret dengan nilai acak.
3. Build dengan `Dockerfile.migration` dan expose port `8080`.
4. Pastikan `/health/live`, `/health/ready`, `/version`, login, dan security gate lulus sebelum cutover.
5. Ikuti runbook [STAGING_MIGRATION.md](STAGING_MIGRATION.md) dan rencana lengkap [migrasi_stack.md](migrasi_stack.md).
6. Untuk backup terjadwal, import [workflow backup n8n](n8n/backup-geopresensi.json) dan ikuti [panduan workflow](n8n/BACKUP_WORKFLOW.md).

## API Hermes Agent

Endpoint koneksi yang bisa langsung diberikan ke Hermes:

```bash
GET /api/hermes_connect.php
Header: X-API-Key: <HERMES_API_KEY>
```

Contoh cek koneksi:

```bash
curl -H "X-API-Key: $HERMES_API_KEY" \
  "https://geo.griyaquran.web.id/api/hermes_connect.php"
```

Response sukses akan berisi status koneksi database, kemampuan Hermes, dan daftar endpoint baca/edit presensi yang tersedia.

Endpoint khusus untuk cek data presensi menyeluruh:

```bash
GET /api/hermes_presensi_overview.php
Header: X-API-Key: <HERMES_API_KEY>
```

Jika `HERMES_API_KEY` belum diset, endpoint akan menerima `N8N_API_KEY` sebagai fallback.

Parameter opsional:

- `period`: `today`, `yesterday`, `7days`, `14days`, `30days`, `month`, atau `all` (default: `today`)
- `start_date` dan `end_date`: format `YYYY-MM-DD`, menggantikan `period`
- `user_id`: filter satu guru
- `include_logs=1`: sertakan log presensi mentah
- `limit`: batas log mentah saat `include_logs=1` (1-2000, default 500)

Contoh:

```bash
curl -H "X-API-Key: $HERMES_API_KEY" \
  "https://geo.griyaquran.web.id/api/hermes_presensi_overview.php?period=30days&include_logs=1"
```

Endpoint untuk melihat semua data presensi serta menambah/mengedit record:

```bash
GET /api/hermes_presensi.php
POST /api/hermes_presensi.php
PUT /api/hermes_presensi.php
Header: X-API-Key: <HERMES_API_KEY>
```

Filter `GET` opsional: `id`, `user_id`, `tanggal`, `start_date`, `end_date`, `status`, `limit`, `offset`. Tanpa filter tanggal, endpoint mengembalikan data presensi dari semua tanggal.

Contoh edit presensi:

```bash
curl -X PUT -H "X-API-Key: $HERMES_API_KEY" -H "Content-Type: application/json" \
  -d '{"id":930,"status":"hadir","jamMasuk":"07:15","jamPulang":"13:00","keterangan":"Diedit oleh Hermes"}' \
  "https://geo.griyaquran.web.id/api/hermes_presensi.php"
```

Field payload yang didukung: `id`, `userId`/`user_id`, `tanggal`, `status`, `jamMasuk`/`jam_masuk`, `jamPulang`/`jam_pulang`, `jamHadir`/`jam_hadir`, `jamIzin`/`jam_izin`, `jamSakit`/`jam_sakit`, `keterangan`, `latitude`, `longitude`, dan `metode`.

### Integrasi status presensi ke aplikasi jurnal

Aplikasi jurnal memakai endpoint baca khusus berikut:

```bash
GET /api/v1/integrations/journal/attendance
Header: X-API-Key: <JOURNAL_API_KEY>
```

Parameter wajib: `teacher_ids` (daftar `id_guru` dipisahkan koma), `start_date`, dan `end_date` dalam format `YYYY-MM-DD`. Rentang maksimal 366 hari. Respons hanya berisi `id_guru`, `tanggal`, `status`, dan `updated_at`; endpoint ini tidak dapat menambah atau mengubah presensi.

Contoh:

```bash
curl -H "X-API-Key: $JOURNAL_API_KEY" \
  "https://geo.griyaquran.web.id/api/v1/integrations/journal/attendance?teacher_ids=GURU001,GURU002&start_date=2026-08-01&end_date=2026-08-31"
```

`JOURNAL_API_KEY` adalah secret terpisah dari `HERMES_API_KEY` dan `N8N_API_KEY`. Identitas `id_guru` harus sama dengan `teachers.niy` pada aplikasi jurnal.

Untuk memverifikasi mapping guru tanpa membaca data presensi, aplikasi jurnal juga memakai endpoint identitas berikut:

```bash
GET /api/v1/integrations/journal/teachers
Header: X-API-Key: <JOURNAL_API_KEY>
```

Parameter wajib `teacher_ids` berisi maksimal 500 `id_guru` yang dipisahkan koma. Endpoint hanya mengembalikan guru ber-role `guru` yang belum diarsipkan dan hanya field `id_guru`.

Contoh:

```bash
curl -H "X-API-Key: $JOURNAL_API_KEY" \
  "https://geo.griyaquran.web.id/api/v1/integrations/journal/teachers?teacher_ids=GURU001,GURU002"
```

Kedua endpoint jurnal bersifat baca-saja dan hanya menerima metode `GET`. API key tidak boleh ditanam di browser atau dibagikan ke pengguna.

Untuk laporan satu guru yang dipakai Edu, tersedia endpoint kanonis berikut:

```text
GET /api/v1/integrations/journal/teacher-report
Header: X-API-Key: <JOURNAL_API_KEY>
```

Parameter wajib: `id_guru`, `start_date`, dan `end_date` (`YYYY-MM-DD`, maksimal 366 hari). Respons hanya berisi identitas guru, periode efektif, statistik kehadiran, dan baris laporan yang siap ditampilkan/diunduh. Aturan hari kerja, libur, hari opsional, override akhir pekan, dan Alfa dihitung di backend GeoPresensi. Endpoint hanya untuk komunikasi server-ke-server; browser menggunakan endpoint guru yang terautentikasi dan tidak pernah menerima API key integrasi.

Reminder WhatsApp direct ke GOWA tersedia melalui `GET/POST /api/webhook_reminder_direct.php` dengan header `X-API-Key`. Aktifkan hanya jika `GOWA_WEBHOOK_URL`, `GOWA_USERNAME`, dan `GOWA_PASSWORD` sudah diisi; endpoint menerapkan HTTPS/SSRF validation dan tidak menonaktifkan verifikasi TLS.

Aplikasi web modern yang dirancang untuk mengelola kehadiran guru secara akurat, transparan, dan real-time. Menggunakan validasi Geofencing (GPS) dan QR Code untuk menjamin kehadiran fisik guru di sekolah.

---

## 🌐 Informasi Akses
*   **Domain Utama:** [https://geo.griyaquran.web.id](https://geo.griyaquran.web.id)
*   **Halaman Guru:** [https://geo.griyaquran.web.id/guru](https://geo.griyaquran.web.id/guru)
*   **Halaman Admin:** [https://geo.griyaquran.web.id/admin](https://geo.griyaquran.web.id/admin)

---

## 🚀 Fitur Unggulan

### 🏫 Manajemen Kehadiran (Geofencing)
*   **Validasi Radius 20m:** Presensi hanya bisa dilakukan jika guru berada dalam radius maksimal 20 meter dari titik koordinat sekolah.
*   **Dual Mode Presensi:** Guru dapat memilih antara menekan tombol **"HADIR"** atau melakukan **"SCAN QR CODE"**.
*   **Presensi Pulang:** Mencatat jam pulang guru (tersedia mulai jam 09:00 WIB) untuk menghitung durasi jam kerja secara akurat.
*   **Izin & Sakit:** Pelaporan mandiri bagi guru yang berhalangan hadir (tanpa validasi GPS).

### 👮 Manajemen Operasional
*   **Jadwal Piket Digital:** Penugasan guru piket harian yang terintegrasi dengan pengingat otomatis di dashboard guru.
*   **Manajemen Hari Libur:** Kalender libur sekolah yang secara otomatis menonaktifkan fitur presensi agar tidak terjadi data "Alpha" di hari libur.
*   **Dashboard Real-time:** Grafik tren kehadiran harian, mingguan, dan daftar guru yang belum hadir untuk dipantau langsung oleh Kepala Sekolah.

### 📊 Administrasi & Pelaporan
*   **Download Laporan (Excel/PDF):** Admin/Kepsek dapat mengunduh laporan kehadiran per periode atau per guru secara spesifik.
*   **Log Aktivitas:** Rekam jejak audit digital untuk setiap aksi yang dilakukan di dalam sistem.
*   **Edit/Tambah Manual:** Fitur bagi Admin untuk memperbaiki data kehadiran atau menambah absen bagi guru yang terkendala teknis.

---

## 🛠️ Tech Stack
*   **Frontend:** TailAdmin-style React 19, TypeScript, Vite, Tailwind CSS v4, Radix/shadcn custom, Lucide, Recharts.
*   **Backend:** Go 1.25, Fiber, GORM, REST API, JWT/bcrypt, Google OAuth, Cloudflare Turnstile.
*   **Database:** MySQL 8.4 untuk development, staging, dan production.
*   **Export/deployment:** ExcelJS, jsPDF, Docker multi-stage Node + Go + Alpine.
*   **Backup:** SQL/full logical backup MySQL, manifest/checksum, admin API, dan integrasi n8n ke Google Drive/S3.

---

## 📚 Panduan Penggunaan
*   📖 **[Panduan Kepala Sekolah (HTML)](PETUNJUK_PENGGUNAAN_KEPALA_SEKOLAH.html) | [Markdown](PETUNJUK_PENGGUNAAN_KEPALA_SEKOLAH.md)**
*   📖 **[Panduan Guru (HTML)](PETUNJUK_PENGGUNAAN_GURU.html) | [Markdown](PETUNJUK_PENGGUNAAN_GURU.md)**
*   🛠️ **[Dokumentasi Teknis Lengkap](DOKUMENTASI_GEOPRESENSI_LENGKAP.md)**

---

## 🆘 Kasus Masalah & Penyelesaian (Troubleshooting)

Berikut adalah daftar masalah yang sering terjadi beserta solusinya:

### 1. Masalah: "Gagal Mendapatkan Lokasi" (Browser/HP)
*   **Penyebab:** GPS HP mati, Izin lokasi (Permission) diblokir pada browser, atau sinyal GPS terhalang bangunan beton.
*   **Penyelesaian:** 
    1. Pastikan GPS HP Aktif (Akurasi Tinggi).
    2. Cek pengaturan browser, pastikan situs `geo.griyaquran.web.id` diizinkan (Allow) mengakses lokasi.
    3. Coba me-refresh halaman aplikasi.
    4. Coba berpindah ke dekat jendela atau area luar ruangan.

### 2. Masalah: "Anda berada di luar jangkauan (Radius 20m)"
*   **Penyebab:** Bapak/Ibu sudah di sekolah tapi GPS mendeteksi lokasi yang tidak akurat (biasanya karena GPS melompat atau titik tengah sekolah bergeser).
*   **Penyelesaian:**
    1. Pastikan Bapak/Ibu berada sedekat mungkin dengan titik pusat sekolah (Ruang Guru/Pintu Masuk).
    2. Tunggu 10-30 detik agar GPS HP menstabilkan koordinat (sampai akurasi tinggi).
    3. Gunakan fitur **Scan QR Code** jika tersedia, sebagai alternatif validasi.
    4. Hubungi Admin jika titik koordinat sekolah perlu dikalibrasi ulang.

### 3. Masalah: Kamera Tidak Terbuka saat Scan QR
*   **Penyebab:** Izin akses kamera (Camera Permission) belum diberikan atau browser tidak mendukung WebRTC.
*   **Penyelesaian:**
    1. Klik "Allow/Izinkan" saat browser meminta akses kamera.
    2. Jika menggunakan iPhone, pastikan menggunakan browser **Safari**. Untuk Android, gunakan **Google Chrome**.
    3. Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera secara bersamaan.

### 4. Masalah: Lupa Password Guru
*   **Penyebab:** Faktor manusia (lupa kredensial).
*   **Penyelesaian:**
    1. Hubungi Tim IT / Admin Sekolah.
    2. Admin dapat mereset password melalui menu **"Data Guru"** > **Edit** > **Update Password**.

### 5. Masalah: Data Kehadiran Belum Muncul di Dashboard Kepala Sekolah
*   **Penyebab:** Koneksi internet lambat pada sisi guru saat menekan tombol presensi, sehingga data belum terkirim ke server.
*   **Penyelesaian:**
    1. Guru harus memastikan muncul notifikasi "Presensi Berhasil".
    2. Kepala Sekolah dapat menyegarkan (Refresh) halaman Dashboard.
    3. Cek **Log Aktivitas** untuk melihat apakah ada data yang masuk dengan status pending.

---

## 📍 Konfigurasi Radius & Koordinat (Bagi Pengembang)
Jika ingin mengubah radius atau titik pusat sekolah, edit pada Database (Tabel `settings`) atau via menu **"Pengaturan"** di Dashboard Admin:
*   `radius_gps`: **20** (dalam meter).
*   `latitude_sekolah`: (Koordinat Latitude).
*   `longitude_sekolah`: (Koordinat Longitude).

---
**GeoPresensi Griya Quran** - *Membangun Kedisiplinan dengan Teknologi Modern.*
**Versi:** 2.1.0 | **Dibuat oleh:** IT Team Griya Quran
