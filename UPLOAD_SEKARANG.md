# 🚀 UPLOAD FITUR HARI LIBUR - PANDUAN CEPAT

## ✅ BUILD SELESAI! SIAP UPLOAD!

---

## 📦 FILE YANG PERLU DIUPLOAD

### **1. Backend API (1 file)**
```
📁 Lokasi: D:\Kiro\12 Des 2025\api\holidays.php
📤 Upload ke: /home/username/api/holidays.php
```

### **2. Database SQL (jalankan di phpMyAdmin)**
```
📁 Lokasi: D:\Kiro\12 Des 2025\database_hari_libur.sql
📤 Jalankan di: phpMyAdmin → SQL
```

### **3. Frontend (2 item)**
```
📁 Lokasi: D:\Kiro\12 Des 2025\dist\
📤 Upload ke: public_html/

Yang diupload:
✓ index.html
✓ assets/ (seluruh folder)
```

---

## 🎯 LANGKAH UPLOAD (3 STEP SAJA!)

### **STEP 1: Upload Backend**
1. Login cPanel → File Manager
2. Masuk ke `/home/username/api/`
3. Upload file: `api/holidays.php`

### **STEP 2: Jalankan SQL**
1. Login cPanel → phpMyAdmin
2. Pilih database aplikasi
3. Klik tab "SQL"
4. Copy-paste isi file `database_hari_libur.sql`
5. Klik "Go"

### **STEP 3: Upload Frontend**
1. Login cPanel → File Manager
2. Masuk ke `public_html`
3. **HAPUS** file lama:
   - `index.html` (hapus)
   - Folder `assets` (hapus)
4. **UPLOAD** file baru dari folder `dist`:
   - `index.html` (upload)
   - Folder `assets` (upload)

---

## 🧪 TEST SETELAH UPLOAD

1. **Clear Cache**: Ctrl + Shift + Delete
2. **Hard Refresh**: Ctrl + F5
3. **Login sebagai guru**: guru / guru123
4. **Cek tampilan**:
   - Hari Senin-Jumat: Tombol presensi muncul ✅
   - Hari Sabtu-Minggu: Pesan libur (biru) ✅
   - Hari libur nasional: Pesan libur (kuning) ✅

---

## 📅 TEST DI TANGGAL INI

**Hari ini**: Sabtu, 14 Desember 2025

**Hasil yang diharapkan**:
- ✅ Muncul pesan: "Hari Sabtu adalah hari libur"
- ✅ Background biru
- ✅ Tombol HADIR, IZIN, SAKIT TIDAK muncul
- ✅ Pesan: "Tidak perlu melakukan presensi hari ini"

---

## ⚠️ JIKA ADA MASALAH

### Masalah: Masih muncul tombol presensi di hari Sabtu
**Solusi**: Clear cache + Hard refresh (Ctrl + F5)

### Masalah: Error "holidays table doesn't exist"
**Solusi**: Jalankan ulang `database_hari_libur.sql` di phpMyAdmin

### Masalah: API Error 404
**Solusi**: Pastikan `api/holidays.php` sudah diupload dengan benar

---

## ✅ CHECKLIST

- [ ] Upload `api/holidays.php`
- [ ] Jalankan `database_hari_libur.sql`
- [ ] Hapus `index.html` lama
- [ ] Hapus folder `assets` lama
- [ ] Upload `index.html` baru
- [ ] Upload folder `assets` baru
- [ ] Clear cache browser
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test login
- [ ] Cek tampilan hari Sabtu (hari ini!)

---

## 🎉 SETELAH BERHASIL

Kabari saya dengan:
- ✅ "Sudah berhasil upload"
- ✅ Screenshot tampilan (jika perlu)
- ✅ Hasil test

Atau jika ada masalah:
- ❌ Screenshot error
- ❌ Langkah mana yang bermasalah

---

**Lokasi semua file**: `D:\Kiro\12 Des 2025\`

**Dokumentasi lengkap**: Baca `FITUR_HARI_LIBUR.md`

Selamat mengupload! 🚀
