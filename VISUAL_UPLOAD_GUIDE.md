# Visual Guide - File Upload ke cPanel

## 🎯 RINGKASAN SUPER SINGKAT

```
KOMPUTER ANDA                    →    SERVER cPanel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 dist/                         →    📁 public_html/
   ├── index.html                →       ├── index.html
   └── assets/                   →       └── assets/

📁 api/                          →    📁 api/
   ├── config.php                →       ├── config.php ⚠️ EDIT INI!
   ├── auth.php                  →       ├── auth.php
   ├── guru.php                  →       ├── guru.php
   ├── presensi.php              →       ├── presensi.php
   ├── activity.php              →       ├── activity.php
   └── test.php                  →       └── test.php

📄 .htaccess                     →    📁 public_html/
                                          └── .htaccess

📄 database.sql                  →    💾 phpMyAdmin (Import)
```

---

## 📦 LANGKAH 1: Build Aplikasi

```bash
# Di terminal/command prompt:
cd "D:\Kiro\12 Des 2025"
npm run build
```

**Hasil**: Muncul folder `dist` baru

```
SEBELUM BUILD:                   SETELAH BUILD:
D:\Kiro\12 Des 2025\            D:\Kiro\12 Des 2025\
├── src/                        ├── src/
├── api/                        ├── api/
├── package.json                ├── dist/  ← FOLDER BARU INI!
└── ...                         │   ├── index.html
                                │   └── assets/
                                └── ...
```

---

## 📤 LANGKAH 2: Upload Backend (Folder api)

### Dari Komputer:
```
D:\Kiro\12 Des 2025\api\
├── config.php      ← Ambil file ini
├── auth.php        ← Ambil file ini
├── guru.php        ← Ambil file ini
├── presensi.php    ← Ambil file ini
├── activity.php    ← Ambil file ini
└── test.php        ← Ambil file ini
```

### Ke Server:
```
cPanel File Manager
→ /home/username/
  → Buat folder "api"
    → Upload 6 file di atas ke sini
```

### Hasil di Server:
```
/home/username/
└── api/
    ├── config.php
    ├── auth.php
    ├── guru.php
    ├── presensi.php
    ├── activity.php
    └── test.php
```

---

## 🌐 LANGKAH 3: Upload Frontend (Folder dist)

### Dari Komputer:
```
D:\Kiro\12 Des 2025\dist\
├── index.html      ← Ambil file ini
├── assets/         ← Ambil folder ini (beserta isinya)
│   ├── index-abc.js
│   └── index-xyz.css
└── vite.svg        ← Ambil file ini (jika ada)
```

### Ke Server:
```
cPanel File Manager
→ /home/username/public_html/
  → HAPUS semua file lama
  → Upload SEMUA file dari folder dist
```

### Hasil di Server:
```
/home/username/public_html/
├── index.html
├── assets/
│   ├── index-abc.js
│   └── index-xyz.css
└── vite.svg
```

**⚠️ PENTING**: Upload ISI folder dist, BUKAN folder dist-nya!

```
❌ SALAH:
public_html/
└── dist/          ← Jangan seperti ini!
    └── index.html

✅ BENAR:
public_html/
├── index.html     ← Langsung seperti ini!
└── assets/
```

---

## 📄 LANGKAH 4: Upload .htaccess

### Dari Komputer:
```
D:\Kiro\12 Des 2025\
└── .htaccess       ← Ambil file ini
```

### Ke Server:
```
cPanel File Manager
→ /home/username/public_html/
  → Upload file .htaccess
```

### Hasil di Server:
```
/home/username/public_html/
├── index.html
├── assets/
└── .htaccess       ← File ini mungkin hidden
```

**💡 TIP**: Jika tidak terlihat:
- Klik "Settings" di File Manager
- Centang "Show Hidden Files"

---

## 💾 LANGKAH 5: Import Database

### Dari Komputer:
```
D:\Kiro\12 Des 2025\
└── database.sql    ← Ambil file ini
```

### Ke Server:
```
cPanel
→ phpMyAdmin
  → Pilih database (johndoe_geopresensi_db)
    → Tab "Import"
      → Choose File: database.sql
        → Klik "Go"
```

### Hasil:
```
Database: johndoe_geopresensi_db
├── users (7 rows)
├── attendance_logs (8 rows)
└── activity_logs (5 rows)
```

---

## ⚙️ LANGKAH 6: Edit config.php

### File yang Diedit:
```
/home/username/api/config.php
```

### Yang Diedit (Baris 4-6):
```php
// SEBELUM:
define('DB_NAME', 'username_geopresensi_db');
define('DB_USER', 'username_geopresensi_user');
define('DB_PASS', 'your_password_here');

// SESUDAH (contoh):
define('DB_NAME', 'johndoe_geopresensi_db');
define('DB_USER', 'johndoe_geopresensi_user');
define('DB_PASS', 'MyPassword123!');
```

### Cara Edit:
```
File Manager
→ api/config.php
  → Klik kanan → Edit
    → Ganti 3 baris di atas
      → Save Changes
```

---

## ✅ CHECKLIST CEPAT

```
[ ] 1. npm run build → folder dist muncul
[ ] 2. Upload 6 file dari api/ → ke /home/username/api/
[ ] 3. Upload isi dist/ → ke /home/username/public_html/
[ ] 4. Upload .htaccess → ke /home/username/public_html/
[ ] 5. Import database.sql → via phpMyAdmin
[ ] 6. Edit api/config.php → ganti DB credentials
[ ] 7. Test: https://domain.com/api/test.php → success
[ ] 8. Test: https://domain.com → muncul login
```

---

## 🎯 TOTAL FILE YANG DIUPLOAD

```
Backend API:     6 file
Frontend:        Semua isi folder dist (±3-5 file)
.htaccess:       1 file
Database:        1 file (import)
─────────────────────────────────────────────
Total:           ±11-13 file
```

---

## 📊 DIAGRAM LENGKAP

```
KOMPUTER                         cPanel SERVER
═══════════════════════════════════════════════════════════════

📁 D:\Kiro\12 Des 2025\
│
├─ 📁 dist/                  →   📁 /home/username/public_html/
│  ├─ 📄 index.html          →      ├─ 📄 index.html
│  └─ 📁 assets/             →      ├─ 📁 assets/
│     ├─ 📄 index-abc.js     →      │  ├─ 📄 index-abc.js
│     └─ 📄 index-xyz.css    →      │  └─ 📄 index-xyz.css
│                                   └─ 📄 .htaccess
│
├─ 📁 api/                   →   📁 /home/username/api/
│  ├─ 📄 config.php          →      ├─ 📄 config.php ⚠️ EDIT!
│  ├─ 📄 auth.php            →      ├─ 📄 auth.php
│  ├─ 📄 guru.php            →      ├─ 📄 guru.php
│  ├─ 📄 presensi.php        →      ├─ 📄 presensi.php
│  ├─ 📄 activity.php        →      ├─ 📄 activity.php
│  └─ 📄 test.php            →      └─ 📄 test.php
│
├─ 📄 .htaccess              →   (sudah diupload di atas)
│
└─ 📄 database.sql           →   💾 phpMyAdmin → Import

═══════════════════════════════════════════════════════════════

❌ JANGAN UPLOAD:
   📁 node_modules/
   📁 src/
   📄 package.json
   📄 .env
   📄 README.md
```

---

## 🚀 SELESAI!

Setelah semua langkah di atas, aplikasi Anda sudah online!

**Test**:
1. `https://domain.com/api/test.php` → Harus muncul "success"
2. `https://domain.com` → Harus muncul halaman login
3. Login: admin / admin123 → Harus masuk dashboard

**Jika error**, cek:
- Browser console (F12)
- File Manager → api/config.php → credentials benar?
- phpMyAdmin → database sudah di-import?

Selamat! 🎉
