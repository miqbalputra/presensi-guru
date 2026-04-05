# 🚀 Panduan Upload ke cPanel Shared Hosting
## GeoPresensi Griya Quran | geo.griyaquran.web.id

---

## ✅ PERSIAPAN AWAL (Sudah Selesai)

Build production sudah berhasil! Folder `dist` sudah tersedia di komputer Anda.

---

## 📦 DAFTAR FILE YANG PERLU DIUPLOAD

Berikut ini adalah **seluruh** file/folder yang wajib Anda upload ke `public_html` (atau subdirektori khusus untuk `geo.griyaquran.web.id`):

```
FILE DARI FOLDER LOKAL → TUJUAN DI CPANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dist/index.html         → public_html/index.html
dist/assets/            → public_html/assets/           ← (seluruh folder)
api/                    → public_html/api/               ← (seluruh folder)
.htaccess               → public_html/.htaccess
geopresensi_header_logo.png   → public_html/geopresensi_header_logo.png
geopresensi_teacher_banner.png → public_html/geopresensi_teacher_banner.png
```

### File yang TIDAK perlu diupload:
```
src/          ← Source code React, tidak dibutuhkan di server
node_modules/ ← Library NPM, hanya untuk development lokal
*.md, *.txt   ← Dokumentasi internal, tidak untuk server
*.sql         ← File SQL hanya untuk import di phpMyAdmin
.env          ← Jangan diupload! Konfigurasi via config.php
package.json  ← Tidak dibutuhkan di server
vite.config.js ← Tidak dibutuhkan di server
```

---

## 🗄️ LANGKAH 1: SIAPKAN DATABASE DI cPANEL

1.  Login ke **cPanel** → cari menu **"MySQL Databases"**
2.  Buat database baru (contoh: `griyaqur_presensi`)
3.  Buat user database baru (contoh: `griyaqur_presuser`) dengan password kuat
4.  **Assign** user tersebut ke database dengan hak akses **ALL PRIVILEGES**
5.  Catat: `nama_database`, `username`, `password`

---

## 📥 LANGKAH 2: IMPORT DATABASE

1.  Buka **phpMyAdmin** di cPanel
2.  Klik nama database yang baru Anda buat di panel kiri
3.  Klik tab **"Import"**
4.  Klik **"Choose File"** → pilih file **`DATABASE_PRODUKSI_GRIYA_QURAN_FULL.sql`**
5.  Pastikan format dipilih: **SQL**
6.  Klik **"Go"** / **"Execute"**
7.  Konfirmasi berhasil: akan muncul pesan "Import has been successfully finished"

---

## 📂 LANGKAH 3: UPLOAD FILE KE CPANEL

### Cara A: Pakai File Manager cPanel (Direkomendasikan)
1.  Buka **File Manager** di cPanel
2.  Navigasi ke folder `public_html` (atau folder subdomain khusus)
3.  Upload file-file di atas satu per satu

### Cara B: Pakai FileZilla / FTP
1.  Hubungkan FileZilla ke hosting menggunakan kredensial FTP dari cPanel
2.  Drag & drop semua file yang diperlukan ke folder `public_html`

---

## ⚙️ LANGKAH 4: KONFIGURASI DATABASE API

Setelah folder `api` berhasil diupload:

1.  Di **File Manager** cPanel, buka file: `public_html/api/config.php`
2.  Klik **"Edit"**
3.  Ubah baris konfigurasi berikut:

```php
define('DB_HOST', 'localhost');          // Tidak perlu diubah
define('DB_NAME', 'griyaqur_presensi'); // Ganti dengan nama database Anda
define('DB_USER', 'griyaqur_presuser'); // Ganti dengan username database Anda
define('DB_PASS', 'password_kuat_anda'); // Ganti dengan password Anda
```

4.  Klik **"Save Changes"**

---

## 🔐 LANGKAH 5: LOGIN & KONFIGURASI AWAL

Setelah semua file terupload dan database sudah terkonfigurasi:

1.  Buka browser → kunjungi **https://geo.griyaquran.web.id/admin**
2.  Login dengan akun default:
    *   **Username:** `admin`
    *   **Password:** `admin123`
3.  Masuk ke menu **"Pengaturan"** dan atur:
    *   **Koordinat Latitude & Longitude** sekolah Anda (ambil dari Google Maps)
    *   **Radius GPS:** `20` meter (sudah diset)
    *   **Jam Masuk Normal:** misal `07:20`
    *   **Mode Testing:** pastikan **DINONAKTIFKAN** (set ke `0`)

> ⚠️ **PENTING:** Segera ganti password `admin` dan `kepsek` setelah login pertama!

---

## 🆘 TROUBLESHOOTING

| Masalah | Penjelasan | Solusi |
| :--- | :--- | :--- |
| **Halaman putih / 404** | .htaccess tidak terupload | Pastikan file `.htaccess` ada di `public_html`. Di File Manager, aktifkan "Show Hidden Files" |
| **API Error / Login gagal** | Kredensial DB salah | Cek `api/config.php`. Pastikan nama DB, user, password sudah benar |
| **"CORS Error"** | Domain tidak terdaftar di API | Sudah diperbaiki. Pastikan file `api/security.php` yang terbaru sudah diupload |
| **Gambar logo tidak muncul** | File `.png` tidak di tempat yang benar | Upload `geopresensi_header_logo.png` dan `geopresensi_teacher_banner.png` ke root (bukan ke dalam folder `assets`) |
| **Guru selalu "Di luar jangkauan"** | Koordinat sekolah belum dikonfigurasi | Masuk ke Admin → Pengaturan → set Latitude & Longitude sekolah yang benar |
| **Session selalu logout** | Masalah PHP session di shared hosting | Tambahkan `php_value session.save_path "/tmp"` di `.htaccess` |

---

## 📞 AKUN DEFAULT SETELAH INSTALL

| Role | Username | Password |
| :---: | :---: | :---: |
| Admin | `admin` | `admin123` |
| Kepala Sekolah | `kepsek` | `admin123` |

> Data guru ditambahkan via menu **Admin → Data Guru** setelah aplikasi berjalan.

---

**GeoPresensi Griya Quran** | geo.griyaquran.web.id | Versi 3.0.0 (Full Feature)
