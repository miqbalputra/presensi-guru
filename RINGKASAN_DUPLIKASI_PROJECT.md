# ✅ Ringkasan Duplikasi Project untuk Subdomain

## 📦 Yang Sudah Dikerjakan

Saya telah berhasil menduplikasi project ke folder **`geo-subdomain`** yang siap untuk di-upload ke subdomain **geo.kelolasekolah.web.id**.

---

## 📁 Struktur Folder

```
D:\Kiro\12 Des 2025\
├── [folder utama - project asli]
│   ├── src/
│   ├── api/
│   ├── dist/
│   └── ...
│
└── geo-subdomain/          ⭐ FOLDER BARU
    ├── src/                (duplikat)
    ├── api/                (duplikat + disesuaikan)
    ├── .env                (disesuaikan untuk subdomain)
    ├── .htaccess           (duplikat)
    ├── package.json        (duplikat)
    ├── vite.config.js      (duplikat)
    │
    ├── PANDUAN_MIGRASI_SUBDOMAIN.md    ⭐ BARU
    ├── CHECKLIST_MIGRASI.txt           ⭐ BARU
    └── README_SUBDOMAIN.md             ⭐ BARU
```

---

## ✅ File yang Sudah Disesuaikan

### 1. **`.env`** (geo-subdomain/.env)
```env
# API URL sudah ke subdomain baru
VITE_API_URL=https://geo.kelolasekolah.web.id/api

# Database tetap sama (pakai database lama)
DB_NAME=nama_database_anda
DB_USER=username_database_anda
DB_PASS=password_database_anda
```

### 2. **`api/config.php`** (geo-subdomain/api/config.php)
```php
// CORS sudah disesuaikan untuk subdomain
setupCORS('https://geo.kelolasekolah.web.id');

// Database tetap sama (pakai database lama)
define('DB_NAME', 'nama_database_anda');
define('DB_USER', 'username_database_anda');
define('DB_PASS', 'password_database_anda');
```

### 3. **`api/security.php`** (geo-subdomain/api/security.php)
```php
// Allowed origins sudah include subdomain baru
$allowed_origins = [
    'https://geo.kelolasekolah.web.id', // ⭐ BARU
    'https://kelolasekolah.web.id',
    'http://localhost:5173',
    'http://localhost:3000'
];
```

---

## 📚 Dokumentasi yang Dibuat

### 1. **PANDUAN_MIGRASI_SUBDOMAIN.md**
Panduan lengkap step-by-step untuk migrasi:
- Setup subdomain di cPanel
- Konfigurasi database
- Build aplikasi
- Upload ke server
- Testing
- Parallel run
- Full migration
- Troubleshooting
- Monitoring

### 2. **CHECKLIST_MIGRASI.txt**
Checklist yang bisa diprint dengan 71 item:
- Fase 1: Persiapan
- Fase 2: Setup Subdomain
- Fase 3: Build Aplikasi
- Fase 4: Upload ke Server
- Fase 5-6: Testing
- Fase 7-8: Browser & Technical Testing
- Fase 9: Parallel Run
- Fase 10: Full Migration
- Fase 11: Monitoring
- Fase 12: Finalisasi
- Rollback Plan
- Sign Off Form

### 3. **README_SUBDOMAIN.md**
Overview folder dan quick start guide:
- Tentang folder
- Yang sudah disesuaikan
- Yang perlu dilakukan
- Quick start
- Perbedaan dengan folder utama
- Catatan penting

---

## 🎯 Langkah Selanjutnya

### Yang Perlu Anda Lakukan:

#### 1. **Update Database Credentials** (5 menit)

**File: `geo-subdomain/.env`**
```env
# Ganti dengan database credentials Anda yang LAMA:
DB_NAME=nama_database_anda_yang_lama
DB_USER=username_database_anda_yang_lama
DB_PASS=password_database_anda_yang_lama
```

**File: `geo-subdomain/api/config.php`**
```php
// Ganti dengan database credentials Anda yang LAMA:
define('DB_NAME', 'nama_database_anda_yang_lama');
define('DB_USER', 'username_database_anda_yang_lama');
define('DB_PASS', 'password_database_anda_yang_lama');
```

#### 2. **Build Aplikasi** (10 menit)
```bash
cd geo-subdomain
npm install
npm run build
```

#### 3. **Setup Subdomain di cPanel** (30 menit)
- Login ke cPanel
- Buat subdomain: geo.kelolasekolah.web.id
- Install SSL
- Verifikasi akses

#### 4. **Upload ke Server** (20 menit)
Upload ke `/public_html/geo/`:
- `dist/index.html`
- `dist/assets/`
- `api/` (semua file)
- `.htaccess`
- `.env`

#### 5. **Testing** (30 menit)
- Test login admin
- Test login guru
- Test semua fitur
- Test di berbagai browser

#### 6. **Parallel Run** (3-7 hari)
- Internal testing
- Soft launch
- Gradual migration

#### 7. **Full Migration** (Hari ke-8)
- Setup redirect URL lama
- Sosialisasi ke user
- Monitor

---

## 📊 Keuntungan Duplikasi Ini

### ✅ Keuntungan:

1. **Folder Terpisah**
   - Project asli tidak tersentuh
   - Bisa test tanpa ganggu yang lama
   - Rollback mudah

2. **Konfigurasi Sudah Siap**
   - API URL sudah disesuaikan
   - CORS sudah disesuaikan
   - Session config sudah disesuaikan

3. **Dokumentasi Lengkap**
   - Panduan step-by-step
   - Checklist detail
   - Troubleshooting guide

4. **Database Sama**
   - Tidak perlu export/import
   - Data tidak hilang
   - Rollback instant

5. **Parallel Run**
   - Bisa jalankan keduanya
   - Test dulu sebelum full switch
   - Minimal downtime

---

## ⚠️ Catatan Penting

### Database:
- ✅ **PAKAI DATABASE YANG SAMA** dengan aplikasi lama
- ✅ **JANGAN buat database baru**
- ✅ **JANGAN export/import database**
- ✅ Cukup update credentials di 2 file (.env dan api/config.php)

### Backup:
- ✅ **BACKUP database** sebelum mulai
- ✅ **BACKUP files** aplikasi lama
- ✅ Simpan backup di tempat aman

### Testing:
- ✅ **TEST semua fitur** sebelum inform user
- ✅ **MONITOR closely** 7 hari pertama
- ✅ Siap rollback jika ada masalah

---

## 📁 Lokasi File Penting

### Folder Duplikat:
```
D:\Kiro\12 Des 2025\geo-subdomain\
```

### File Konfigurasi:
```
geo-subdomain/.env
geo-subdomain/api/config.php
geo-subdomain/api/security.php
```

### Dokumentasi:
```
geo-subdomain/PANDUAN_MIGRASI_SUBDOMAIN.md
geo-subdomain/CHECKLIST_MIGRASI.txt
geo-subdomain/README_SUBDOMAIN.md
```

---

## 🚀 Ready to Deploy!

Folder **geo-subdomain** sudah siap untuk:
1. ✅ Update database credentials
2. ✅ Build
3. ✅ Upload ke server
4. ✅ Testing
5. ✅ Migration

**Total waktu estimasi: 2-3 jam setup + 1 minggu monitoring**

---

## 📞 Next Steps

1. **Baca dokumentasi**:
   - `geo-subdomain/PANDUAN_MIGRASI_SUBDOMAIN.md`
   - `geo-subdomain/README_SUBDOMAIN.md`

2. **Update database credentials**:
   - `geo-subdomain/.env`
   - `geo-subdomain/api/config.php`

3. **Build & test local** (opsional):
   ```bash
   cd geo-subdomain
   npm install
   npm run build
   ```

4. **Siap upload ke server**

---

**Status**: ✅ Duplikasi Selesai
**Date**: 26 Desember 2024
**Folder**: geo-subdomain
**Ready**: Yes

**Good luck with the migration! 🎉**
