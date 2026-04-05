# Quick Start - Upload ke cPanel

## 🚀 Ringkasan Cepat (15 Menit)

### Persiapan (5 menit)
```bash
# 1. Edit .env
VITE_API_URL=https://namadomainanda.com/api

# 2. Build
npm run build

# 3. Siapkan file:
- Folder dist/ → untuk public_html
- Folder api/ → untuk root
- File database.sql → untuk import
- File .htaccess → untuk public_html
```

### Database (3 menit)
1. cPanel → MySQL Databases
2. Buat database: `geopresensi_db`
3. Buat user: `geopresensi_user` + password
4. Add user to database → ALL PRIVILEGES
5. phpMyAdmin → Import `database.sql`

### Backend (3 menit)
1. File Manager → Buat folder `api` di root
2. Upload semua file dari folder `api/`
3. Edit `api/config.php`:
   - DB_NAME = `username_geopresensi_db`
   - DB_USER = `username_geopresensi_user`
   - DB_PASS = password Anda
4. Permissions: folder 755, file 644

### Frontend (3 menit)
1. File Manager → `public_html`
2. Hapus semua file default
3. Upload semua file dari folder `dist/`
4. Upload file `.htaccess`
5. Permissions: folder 755, file 644

### Test (1 menit)
1. Buka: `https://domain.com/api/test.php` → harus success
2. Buka: `https://domain.com` → harus muncul login
3. Login: admin / admin123 → harus masuk dashboard

## ✅ Done!

---

## 📋 Credentials yang Perlu Dicatat

```
=== DATABASE ===
Database Name: username_geopresensi_db
Database User: username_geopresensi_user
Database Pass: [password Anda]

=== LOGIN APLIKASI ===
Admin:
- Username: admin
- Password: admin123

Guru:
- Username: guru1
- Password: guru123

=== CPANEL ===
URL: https://domain.com/cpanel
Username: [dari hosting]
Password: [dari hosting]
```

---

## 🔗 URL Penting

```
Website: https://namadomainanda.com
API Test: https://namadomainanda.com/api/test.php
cPanel: https://namadomainanda.com/cpanel
phpMyAdmin: https://namadomainanda.com/phpmyadmin
```

---

## ⚠️ Jika Ada Error

### API tidak bisa diakses
→ Cek `api/config.php` → credentials benar?

### Login gagal
→ Cek `https://domain.com/api/test.php` → success?

### Blank page
→ Cek browser console (F12) → ada error?

### Database error
→ Cek phpMyAdmin → database sudah di-import?

---

## 📞 Support

Jika masih error, kirim screenshot:
1. Browser console (F12)
2. Network tab (F12)
3. `https://domain.com/api/test.php`
