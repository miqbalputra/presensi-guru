# 🔧 FIX: Error 404 Saat Reload Halaman

## ❌ MASALAH

Ketika reload halaman `/admin/download-laporan` atau halaman lain, muncul error **404 Not Found**.

**Penyebab:**
- React Router menggunakan client-side routing
- Server tidak tahu route `/admin/download-laporan`
- File `.htaccess` perlu dikonfigurasi untuk redirect semua request ke `index.html`

---

## ✅ SOLUSI

File `.htaccess` sudah diperbaiki untuk handle React Router dengan benar.

### **Perubahan di `.htaccess`:**

**Sebelum:**
```apache
RewriteRule . /index.html [L]
```

**Sesudah:**
```apache
# Jangan redirect jika request ke folder api
RewriteCond %{REQUEST_URI} ^/api/ [OR]
RewriteCond %{REQUEST_URI} ^/api$ [OR]
RewriteCond %{REQUEST_URI} \.php$
RewriteRule ^ - [L]

# Handle React Router
RewriteRule ^ /index.html [L,QSA]
```

**Penjelasan:**
1. Request ke `/api/` tidak di-redirect (untuk API backend)
2. Request ke file `.php` tidak di-redirect
3. Semua request lain di-redirect ke `index.html`
4. Flag `QSA` (Query String Append) mempertahankan query parameters

---

## 📦 FILE YANG PERLU DIUPLOAD

### **File Update:**
- `.htaccess` (di `public_html/`)

### **File Frontend (Build Baru):**
- `dist/index.html`
- `dist/assets/`

---

## 🚀 CARA UPLOAD

### **STEP 1: Upload .htaccess**

1. Login cPanel → File Manager
2. Masuk ke folder `public_html`
3. Upload file `.htaccess` dari `D:\Kiro\12 Des 2025\.htaccess`
4. Jika ada konfirmasi overwrite, klik **"Yes"** atau **"Replace"**

**PENTING:** File `.htaccess` dimulai dengan titik (`.`), jadi mungkin hidden. Pastikan "Show Hidden Files" aktif di File Manager.

### **STEP 2: Upload Frontend Baru (Opsional)**

Jika mau update frontend juga:

1. Hapus `index.html` dan `assets` lama
2. Upload `dist/index.html` dan `dist/assets` baru

---

## 🧪 TEST SETELAH UPLOAD

### **Test 1: Reload Halaman Download Laporan**

1. Login sebagai admin
2. Klik menu **"Download Laporan"**
3. URL: `https://kelolasekolah.web.id/admin/download-laporan`
4. Tekan **F5** atau **Ctrl + R** (reload)
5. **Hasil:** ✅ Halaman tetap di Download Laporan (tidak error 404)

### **Test 2: Reload Halaman Lain**

Test di halaman-halaman ini:
- `/admin` → Reload → ✅ Tetap di Dashboard
- `/admin/data-guru` → Reload → ✅ Tetap di Data Guru
- `/admin/edit-presensi` → Reload → ✅ Tetap di Edit Presensi
- `/admin/hari-libur` → Reload → ✅ Tetap di Hari Libur
- `/admin/log-aktivitas` → Reload → ✅ Tetap di Log Aktivitas

### **Test 3: Direct URL Access**

1. Logout dari aplikasi
2. Buka URL langsung: `https://kelolasekolah.web.id/admin/download-laporan`
3. **Hasil:** ✅ Redirect ke halaman login (bukan 404)

### **Test 4: API Masih Berfungsi**

1. Login sebagai admin
2. Buka menu Data Guru
3. **Hasil:** ✅ Data guru muncul (API berfungsi)

---

## ⚠️ TROUBLESHOOTING

### **Masalah 1: Masih error 404 setelah upload**

**Penyebab:** File `.htaccess` tidak terupload atau tidak aktif

**Solusi:**
1. Cek apakah file `.htaccess` ada di `public_html`
2. Aktifkan "Show Hidden Files" di File Manager
3. Cek permission file: 644
4. Pastikan server support `mod_rewrite`

**Cara cek mod_rewrite:**
- Buat file `test.php` di `public_html`:
```php
<?php
phpinfo();
?>
```
- Buka: `https://kelolasekolah.web.id/test.php`
- Cari "mod_rewrite" → Harus "Loaded"
- Hapus `test.php` setelah cek

---

### **Masalah 2: API tidak berfungsi setelah update**

**Penyebab:** Rule `.htaccess` terlalu agresif

**Solusi:**
Sudah diperbaiki dengan menambahkan exception untuk `/api/` dan `.php` files.

---

### **Masalah 3: File .htaccess tidak terlihat**

**Penyebab:** File hidden (dimulai dengan titik)

**Solusi:**
1. Di File Manager, klik **"Settings"** (icon gear)
2. Centang **"Show Hidden Files (dotfiles)"**
3. Klik **"Save"**
4. File `.htaccess` akan terlihat

---

### **Masalah 4: Redirect loop**

**Penyebab:** Konfigurasi `.htaccess` bentrok

**Solusi:**
1. Hapus file `.htaccess` lama
2. Upload file `.htaccess` baru
3. Clear cache browser

---

## 📋 CHECKLIST

- [ ] Upload `.htaccess` baru ke `public_html`
- [ ] Aktifkan "Show Hidden Files" di File Manager
- [ ] Verifikasi file `.htaccess` ada dan permission 644
- [ ] Clear cache browser (Ctrl + Shift + Delete)
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test reload di halaman Download Laporan
- [ ] Test reload di halaman lain
- [ ] Test direct URL access
- [ ] Test API masih berfungsi

---

## 🎯 HASIL YANG DIHARAPKAN

### **Sebelum Perbaikan:**
- ❌ Reload halaman → Error 404
- ❌ Direct URL access → Error 404
- ❌ User harus klik menu lagi

### **Sesudah Perbaikan:**
- ✅ Reload halaman → Tetap di halaman yang sama
- ✅ Direct URL access → Redirect ke login (jika belum login)
- ✅ User experience lebih baik
- ✅ API tetap berfungsi normal

---

## 📝 CATATAN TEKNIS

### **Kenapa Perlu .htaccess?**

React Router menggunakan **HTML5 History API** untuk routing:
- URL: `/admin/download-laporan`
- Browser request ke server: `/admin/download-laporan`
- Server tidak punya file ini → 404

**Solusi:**
- `.htaccess` redirect semua request ke `index.html`
- React Router handle routing di client-side
- User tetap di halaman yang benar

### **Kenapa Perlu Exception untuk /api/?**

- Request ke `/api/guru.php` harus sampai ke file PHP
- Jika di-redirect ke `index.html`, API tidak berfungsi
- Exception memastikan API request tidak di-redirect

---

## 🎉 KESIMPULAN

**Masalah:** Error 404 saat reload halaman  
**Penyebab:** React Router tidak di-handle oleh server  
**Solusi:** Update `.htaccess` dengan rule yang benar  
**Status:** ✅ FIXED  

**File yang diupdate:**
- `.htaccess` (di `public_html/`)

**Dampak:**
- ✅ Reload halaman tidak error
- ✅ Direct URL access berfungsi
- ✅ API tetap berfungsi
- ✅ User experience lebih baik

---

**Build:** 14 Desember 2025, 06:00 AM  
**Status:** ✅ READY TO UPLOAD
