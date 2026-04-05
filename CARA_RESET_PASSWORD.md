# Cara Reset Password Admin

## 🔴 MASALAH
Tidak bisa login dengan password `admin123` atau password lama.

---

## ✅ SOLUSI (3 CARA)

### **CARA 1: Menggunakan Script PHP** (PALING MUDAH)

#### Langkah 1: Upload File
1. Buka **File Manager** di cPanel
2. Masuk ke folder `/home/username/api/`
3. Upload file **`reset_password.php`** dari komputer Anda

#### Langkah 2: Akses Script
1. Buka browser
2. Ketik URL: `https://sistemflow.biz.id/api/reset_password.php`
3. Tekan Enter

#### Langkah 3: Lihat Hasil
Jika berhasil, akan muncul:
```
✅ Password Berhasil Direset!

Username: admin
Password Baru: admin123
Status: ✅ Updated
```

#### Langkah 4: Test Login
1. Buka: `https://sistemflow.biz.id`
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`

#### Langkah 5: Hapus File (PENTING!)
Setelah berhasil login, **HAPUS** file `reset_password.php` dari server untuk keamanan!

---

### **CARA 2: Menggunakan phpMyAdmin** (MANUAL)

#### Langkah 1: Buka phpMyAdmin
1. Login ke **cPanel**
2. Klik **phpMyAdmin**
3. Pilih database Anda (contoh: `sistemflow_geopresensi_db`)

#### Langkah 2: Jalankan Query SQL
1. Klik tab **"SQL"**
2. Copy-paste query ini:

```sql
-- Reset Password Admin (admin123)
UPDATE users SET password = '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm' WHERE username = 'admin';

-- Verifikasi
SELECT id, username, role, nama FROM users WHERE username = 'admin';
```

3. Klik **"Go"** atau **"Kirim"**

#### Langkah 3: Test Login
Login dengan username: `admin`, password: `admin123`

---

### **CARA 3: Generate Hash Baru** (JIKA CARA 1 & 2 GAGAL)

#### Langkah 1: Upload File Generator
1. Upload file **`generate_password.php`** ke folder `/home/username/api/`

#### Langkah 2: Akses Generator
1. Buka: `https://sistemflow.biz.id/api/generate_password.php`
2. Akan muncul tabel dengan password hash baru

#### Langkah 3: Copy Hash Baru
Copy hash untuk password `admin123` (panjangnya 60 karakter, dimulai dengan `$2y$10$`)

#### Langkah 4: Update di phpMyAdmin
```sql
UPDATE users SET password = '[PASTE_HASH_DISINI]' WHERE username = 'admin';
```

#### Langkah 5: Test Login
Login dengan username: `admin`, password: `admin123`

#### Langkah 6: Hapus File Generator
Hapus file `generate_password.php` dari server!

---

## 🔍 TROUBLESHOOTING

### Error: "Username atau password salah"

**Kemungkinan 1**: Hash password tidak cocok
- **Solusi**: Gunakan CARA 1 (script reset_password.php)

**Kemungkinan 2**: User admin tidak ada di database
- **Solusi**: Cek di phpMyAdmin, jalankan query:
```sql
SELECT * FROM users WHERE username = 'admin';
```
- Jika tidak ada, insert user admin:
```sql
INSERT INTO users (username, password, role, nama) 
VALUES ('admin', '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm', 'admin', 'Admin Sekolah');
```

**Kemungkinan 3**: File config.php salah
- **Solusi**: Cek file `api/config.php`, pastikan database credentials benar

---

### Error: "Failed to fetch"

**Penyebab**: API tidak bisa diakses

**Solusi**:
1. Test endpoint: `https://sistemflow.biz.id/api/test.php`
2. Jika error 404, cek folder `api` ada di `/home/username/api/`
3. Jika error 500, cek file `config.php`

---

### Error: "Cannot connect to database"

**Penyebab**: Database credentials salah

**Solusi**: Edit file `api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sistemflow_geopresensi_db');  // ← Sesuaikan
define('DB_USER', 'sistemflow_dbuser');          // ← Sesuaikan
define('DB_PASS', 'password_database_anda');     // ← Sesuaikan
```

---

## 📋 CHECKLIST

- [ ] Upload file `reset_password.php` ke `/home/username/api/`
- [ ] Akses `https://sistemflow.biz.id/api/reset_password.php`
- [ ] Lihat pesan "Password Berhasil Direset"
- [ ] Test login dengan admin/admin123
- [ ] Berhasil masuk ke dashboard
- [ ] Hapus file `reset_password.php` dari server

---

## 🎯 REKOMENDASI

**Gunakan CARA 1** (script reset_password.php) karena:
- ✅ Paling mudah
- ✅ Otomatis generate hash yang benar
- ✅ Langsung update ke database
- ✅ Tidak perlu copy-paste hash manual

---

## ⚠️ KEAMANAN

**PENTING**: Setelah berhasil reset password, **HAPUS** file-file ini dari server:
- ❌ `api/reset_password.php`
- ❌ `api/generate_password.php`

File ini bisa digunakan orang lain untuk reset password Anda!

---

## 📝 CATATAN

### Password Default:
- **Admin**: admin123
- **Kepala Sekolah**: kepsek123
- **Guru**: guru123

### Hash Password yang Benar:
Hash password harus:
- Panjang 60 karakter
- Dimulai dengan `$2y$10$`
- Contoh: `$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm`

---

## 🆘 JIKA MASIH GAGAL

Kirim screenshot:
1. Error message yang muncul saat login
2. Browser console (F12 → Console tab)
3. Hasil query: `SELECT * FROM users WHERE username = 'admin';`

Dengan screenshot ini saya bisa bantu lebih spesifik!
