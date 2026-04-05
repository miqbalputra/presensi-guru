# Troubleshooting: Failed to Fetch

Error "Failed to fetch" berarti frontend tidak bisa connect ke API backend.

## 🔍 LANGKAH DEBUGGING

### 1. Test API Endpoint

Buka browser dan ketik:
```
https://sistemflow.biz.id/api/test.php
```

**Jika berhasil**, harus muncul:
```json
{
  "success": true,
  "message": "API Connected Successfully",
  "data": {
    "database": "Connected",
    "total_users": 7
  }
}
```

**Jika gagal** (error 404/500), lanjut ke langkah 2.

---

### 2. Cek Struktur Folder di Server

Login ke cPanel → File Manager

**Pastikan struktur seperti ini**:
```
/home/username/
├── api/                    ← Harus ada di sini (ROOT)
│   ├── config.php
│   ├── auth.php
│   ├── guru.php
│   ├── presensi.php
│   ├── activity.php
│   └── test.php
│
└── public_html/
    ├── index.html
    ├── assets/
    └── .htaccess
```

**PENTING**: Folder `api` harus di ROOT (sejajar dengan public_html), BUKAN di dalam public_html!

❌ **SALAH**:
```
public_html/
└── api/          ← Salah!
```

✅ **BENAR**:
```
/home/username/
├── api/          ← Benar!
└── public_html/
```

---

### 3. Cek File config.php

Buka: `/home/username/api/config.php`

**Pastikan credentials database benar**:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_geopresensi_db');  // ← Harus sesuai
define('DB_USER', 'username_geopresensi_user'); // ← Harus sesuai
define('DB_PASS', 'password_anda');             // ← Harus sesuai
```

**Cara cek nama database yang benar**:
1. cPanel → MySQL Databases
2. Lihat di "Current Databases"
3. Nama lengkap biasanya: `cpanelusername_geopresensi_db`

---

### 4. Cek Browser Console

1. Tekan **F12** di browser
2. Klik tab **Console**
3. Refresh halaman (F5)
4. Lihat error yang muncul

**Kemungkinan error**:

#### Error: "CORS policy"
**Solusi**: Cek file `api/config.php` ada header CORS:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

#### Error: "404 Not Found"
**Solusi**: Folder `api` tidak ada atau salah lokasi

#### Error: "500 Internal Server Error"
**Solusi**: Ada error di PHP, cek error_log

---

### 5. Cek Network Tab

1. Tekan **F12** di browser
2. Klik tab **Network**
3. Klik tombol "Masuk"
4. Lihat request ke API

**Yang harus dicek**:
- Request URL: Harus `https://sistemflow.biz.id/api/auth.php?action=login`
- Status: Harus 200 (bukan 404/500)
- Response: Lihat apa error message-nya

---

### 6. Cek File .env di Build

**PENTING**: Pastikan saat build, file `.env` sudah benar!

File `.env` di komputer Anda harus:
```
VITE_API_URL=https://sistemflow.biz.id/api
```

**Jika salah**, Anda harus:
1. Edit file `.env` di komputer
2. Build ulang: `npm run build`
3. Upload ulang isi folder `dist` ke `public_html`

---

## 🔧 SOLUSI CEPAT

### Solusi 1: Cek API Test Endpoint

```bash
# Buka di browser:
https://sistemflow.biz.id/api/test.php

# Jika error 404:
→ Folder api tidak ada atau salah lokasi

# Jika error 500:
→ Ada error di config.php atau database

# Jika blank/tidak muncul apa-apa:
→ PHP tidak berjalan atau file tidak ada
```

### Solusi 2: Cek Permissions

Di File Manager:
1. Folder `api` → Permissions: **755**
2. File PHP → Permissions: **644**

Cara set:
- Klik kanan folder/file → Permissions
- Isi angka: 755 atau 644
- Klik "Change Permissions"

### Solusi 3: Cek Database Connection

1. cPanel → phpMyAdmin
2. Pilih database `username_geopresensi_db`
3. Cek ada 3 tabel:
   - users (7 rows)
   - attendance_logs
   - activity_logs

Jika tidak ada → Import ulang `database.sql`

---

## 📋 CHECKLIST DEBUGGING

- [ ] Test `https://sistemflow.biz.id/api/test.php` → berhasil?
- [ ] Folder `api` ada di `/home/username/api/` (bukan di public_html)?
- [ ] File `config.php` credentials database benar?
- [ ] Database sudah di-import?
- [ ] User database sudah ditambahkan ke database?
- [ ] Browser console (F12) → ada error apa?
- [ ] Network tab → request ke API berhasil?
- [ ] File `.env` saat build sudah benar?

---

## 🆘 JIKA MASIH ERROR

Kirim screenshot:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab → klik request yang error)
3. Hasil buka: `https://sistemflow.biz.id/api/test.php`
4. File Manager → struktur folder

Dengan screenshot ini saya bisa bantu lebih spesifik!
