# Daftar File yang Perlu Diupload ke cPanel

## 📦 PERSIAPAN: Build Aplikasi Dulu!

**PENTING**: Sebelum upload, Anda HARUS build aplikasi dulu!

```bash
# 1. Buka terminal/command prompt
# 2. Masuk ke folder project
cd "D:\Kiro\12 Des 2025"

# 3. Edit file .env (ganti dengan domain Anda)
# Buka file .env dengan notepad, ganti baris:
VITE_API_URL=https://namadomainanda.com/api

# 4. Build aplikasi
npm run build
```

Setelah build selesai, akan muncul folder baru bernama **`dist`**

---

## 📂 LOKASI FILE DI KOMPUTER ANDA

```
D:\Kiro\12 Des 2025\
│
├── dist/                    ← FOLDER INI MUNCUL SETELAH BUILD
│   ├── index.html
│   ├── assets/
│   │   ├── index-abc123.js
│   │   └── index-xyz789.css
│   └── vite.svg
│
├── api/                     ← FOLDER INI SUDAH ADA
│   ├── config.php
│   ├── auth.php
│   ├── guru.php
│   ├── presensi.php
│   ├── activity.php
│   └── test.php
│
├── database.sql             ← FILE INI SUDAH ADA
├── .htaccess                ← FILE INI SUDAH ADA
└── ... (file lainnya tidak perlu diupload)
```

---

## 🎯 FILE YANG PERLU DIUPLOAD

### ✅ GRUP 1: Backend API (6 file)

**Lokasi di komputer**: `D:\Kiro\12 Des 2025\api\`

**Upload ke**: `/home/username/api/` (buat folder `api` dulu di root cPanel)

**File yang diupload**:
1. ✅ `config.php`
2. ✅ `auth.php`
3. ✅ `guru.php`
4. ✅ `presensi.php`
5. ✅ `activity.php`
6. ✅ `test.php`

**Cara upload**:
- Buka File Manager di cPanel
- Pastikan di root directory (`/home/username/`)
- Klik "+ Folder" → buat folder bernama `api`
- Masuk ke folder `api`
- Klik "Upload"
- Pilih SEMUA 6 file dari folder `api` di komputer Anda
- Tunggu sampai selesai

---

### ✅ GRUP 2: Frontend (Semua isi folder dist)

**Lokasi di komputer**: `D:\Kiro\12 Des 2025\dist\`

**Upload ke**: `/home/username/public_html/`

**File yang diupload** (SEMUA file di dalam folder dist):
1. ✅ `index.html`
2. ✅ Folder `assets` (beserta isinya)
   - `index-abc123.js` (nama file bisa beda)
   - `index-xyz789.css` (nama file bisa beda)
3. ✅ `vite.svg` (jika ada)
4. ✅ File lain yang ada di folder `dist`

**Cara upload**:
- Buka File Manager di cPanel
- Masuk ke folder `public_html`
- **HAPUS DULU** semua file yang ada (index.html lama, cgi-bin, dll)
- Klik "Upload"
- Pilih SEMUA file dari folder `dist` di komputer Anda
- Tunggu sampai selesai

**PENTING**: Upload ISI folder `dist`, BUKAN folder `dist` itu sendiri!

```
❌ SALAH:
public_html/
└── dist/
    └── index.html

✅ BENAR:
public_html/
├── index.html
└── assets/
```

---

### ✅ GRUP 3: File .htaccess

**Lokasi di komputer**: `D:\Kiro\12 Des 2025\.htaccess`

**Upload ke**: `/home/username/public_html/.htaccess`

**File yang diupload**:
1. ✅ `.htaccess`

**Cara upload**:
- Buka File Manager di cPanel
- Masuk ke folder `public_html`
- Klik "Upload"
- Pilih file `.htaccess` dari root project Anda
- Tunggu sampai selesai

**CATATAN**: File ini mungkin tidak terlihat karena hidden. Untuk melihatnya:
- Klik "Settings" di kanan atas File Manager
- Centang "Show Hidden Files (dotfiles)"
- Klik "Save"

---

### ✅ GRUP 4: Database SQL (Import, bukan upload)

**Lokasi di komputer**: `D:\Kiro\12 Des 2025\database.sql`

**Import ke**: phpMyAdmin

**File yang diimport**:
1. ✅ `database.sql`

**Cara import**:
- Buka cPanel
- Klik "phpMyAdmin"
- Pilih database yang sudah dibuat (contoh: `johndoe_geopresensi_db`)
- Klik tab "Import"
- Klik "Choose File"
- Pilih file `database.sql` dari komputer Anda
- Scroll ke bawah, klik "Go"
- Tunggu sampai selesai

---

## 📊 RINGKASAN UPLOAD

| No | File/Folder | Dari Komputer | Upload Ke | Jumlah |
|----|-------------|---------------|-----------|--------|
| 1 | Backend API | `api/` | `/home/username/api/` | 6 file |
| 2 | Frontend | `dist/` | `/home/username/public_html/` | Semua isi |
| 3 | .htaccess | `.htaccess` | `/home/username/public_html/.htaccess` | 1 file |
| 4 | Database | `database.sql` | Import via phpMyAdmin | 1 file |

**Total**: 6 file API + isi folder dist + 1 file .htaccess + 1 file SQL

---

## 🗂️ STRUKTUR AKHIR DI SERVER

Setelah semua diupload, struktur di server harus seperti ini:

```
/home/username/
│
├── api/                          ← Folder yang Anda buat
│   ├── config.php               ← Upload dari komputer
│   ├── auth.php                 ← Upload dari komputer
│   ├── guru.php                 ← Upload dari komputer
│   ├── presensi.php             ← Upload dari komputer
│   ├── activity.php             ← Upload dari komputer
│   └── test.php                 ← Upload dari komputer
│
└── public_html/                  ← Folder sudah ada
    ├── index.html               ← Upload dari dist/
    ├── .htaccess                ← Upload dari root project
    └── assets/                  ← Upload dari dist/
        ├── index-abc123.js      ← Upload dari dist/assets/
        └── index-xyz789.css     ← Upload dari dist/assets/
```

---

## ❌ FILE YANG TIDAK PERLU DIUPLOAD

Jangan upload file-file ini (biarkan di komputer saja):

```
❌ node_modules/          (folder besar, tidak perlu)
❌ src/                   (source code, sudah di-build)
❌ package.json           (tidak perlu di server)
❌ package-lock.json      (tidak perlu di server)
❌ vite.config.js         (tidak perlu di server)
❌ tailwind.config.js     (tidak perlu di server)
❌ postcss.config.js      (tidak perlu di server)
❌ .env                   (jangan upload, rahasia!)
❌ .env.example           (tidak perlu di server)
❌ README.md              (dokumentasi, tidak perlu)
❌ *.md files             (dokumentasi, tidak perlu)
```

**INGAT**: Yang diupload HANYA:
1. Isi folder `dist/` → ke `public_html/`
2. Folder `api/` → ke root
3. File `.htaccess` → ke `public_html/`
4. File `database.sql` → import ke phpMyAdmin

---

## 🔧 SETELAH UPLOAD: Edit 1 File Saja!

Setelah semua diupload, Anda HARUS edit 1 file:

**File**: `/home/username/api/config.php`

**Yang diedit**: Baris 4-6

```php
// Ganti 3 baris ini:
define('DB_NAME', 'username_geopresensi_db');  // ← Ganti dengan nama database Anda
define('DB_USER', 'username_geopresensi_user'); // ← Ganti dengan user database Anda
define('DB_PASS', 'your_password_here');        // ← Ganti dengan password database Anda
```

**Contoh**:
```php
// Jika username cPanel Anda: johndoe
// Dan password database: MyPass123!

define('DB_NAME', 'johndoe_geopresensi_db');
define('DB_USER', 'johndoe_geopresensi_user');
define('DB_PASS', 'MyPass123!');
```

---

## ✅ CHECKLIST UPLOAD

Gunakan checklist ini untuk memastikan tidak ada yang terlewat:

### Persiapan
- [ ] Sudah edit `.env` dengan domain yang benar
- [ ] Sudah jalankan `npm run build`
- [ ] Folder `dist` sudah muncul

### Database
- [ ] Database sudah dibuat di cPanel
- [ ] User database sudah dibuat
- [ ] User sudah ditambahkan ke database
- [ ] File `database.sql` sudah di-import via phpMyAdmin

### Backend API
- [ ] Folder `api` sudah dibuat di root cPanel
- [ ] File `config.php` sudah diupload
- [ ] File `auth.php` sudah diupload
- [ ] File `guru.php` sudah diupload
- [ ] File `presensi.php` sudah diupload
- [ ] File `activity.php` sudah diupload
- [ ] File `test.php` sudah diupload
- [ ] File `config.php` sudah diedit dengan credentials yang benar

### Frontend
- [ ] Folder `public_html` sudah dikosongkan
- [ ] File `index.html` dari `dist` sudah diupload
- [ ] Folder `assets` dari `dist` sudah diupload
- [ ] File `.htaccess` sudah diupload
- [ ] File `.htaccess` terlihat (Show Hidden Files aktif)

### Testing
- [ ] Buka `https://domain.com/api/test.php` → muncul success
- [ ] Buka `https://domain.com` → muncul halaman login
- [ ] Login dengan admin/admin123 → berhasil masuk

---

## 🎯 KESIMPULAN

**Yang perlu diupload**:
1. **6 file PHP** dari folder `api/` → upload ke `/home/username/api/`
2. **Semua isi folder `dist/`** → upload ke `/home/username/public_html/`
3. **1 file `.htaccess`** → upload ke `/home/username/public_html/`
4. **1 file `database.sql`** → import via phpMyAdmin

**Yang perlu diedit**:
1. **1 file `api/config.php`** → edit credentials database

**Total waktu**: 10-15 menit

Selesai! 🎉
