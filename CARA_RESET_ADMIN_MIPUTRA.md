# 🔧 CARA RESET ADMIN KE MIPUTRA (PASTI BERHASIL)

**Username:** `miputra`  
**Password:** `manduraga`

---

## 🎯 CARA PALING MUDAH & PASTI BERHASIL

### **STEP 1: Edit Database Config**

1. Buka file `reset_admin_miputra.php` di komputer
2. Edit line 13-16 dengan database config Anda:

```php
$db_host = 'localhost';
$db_name = 'kelolase_geopresensi';  // GANTI dengan nama database Anda
$db_user = 'kelolase_user';         // GANTI dengan username database Anda
$db_pass = 'password_database';     // GANTI dengan password database Anda
```

**Cara cek database config:**
- Login cPanel → MySQL Databases
- Lihat nama database dan user yang ada
- Atau cek di file `api/config.php` line 5-8

3. Save file

---

### **STEP 2: Upload File**

1. Login cPanel → File Manager
2. Masuk ke folder `public_html`
3. Upload file `reset_admin_miputra.php`

---

### **STEP 3: Buka di Browser**

1. Buka: `https://kelolasekolah.web.id/reset_admin_miputra.php`
2. Anda akan melihat halaman reset
3. **Cek database config** yang ditampilkan (pastikan benar)

---

### **STEP 4: Klik Tombol Reset**

1. Klik tombol **"Reset Admin Credentials"**
2. Tunggu beberapa detik
3. **Hasil:** Muncul pesan sukses ✅

---

### **STEP 5: Test Login**

1. Buka: `https://kelolasekolah.web.id`
2. Logout jika masih login
3. Login dengan:
   - Username: `miputra`
   - Password: `manduraga`
4. **Hasil:** ✅ Berhasil masuk dashboard

---

### **STEP 6: HAPUS File Reset**

**PENTING!** Hapus file `reset_admin_miputra.php`:
1. File Manager → `public_html`
2. Klik kanan `reset_admin_miputra.php` → Delete

---

## 🔍 TROUBLESHOOTING

### **Masalah 1: "Database connection failed"**

**Penyebab:** Database config salah

**Solusi:**
1. Cek database config di cPanel → MySQL Databases
2. Edit file `reset_admin_miputra.php` line 13-16
3. Upload ulang
4. Refresh browser

---

### **Masalah 2: "Tidak ada data yang diupdate"**

**Penyebab:** Tidak ada user dengan role 'admin'

**Solusi:**
File akan menampilkan daftar user yang ada. Cek role-nya.

Jika role bukan 'admin', edit file `reset_admin_miputra.php` line 60:
```php
// Ganti dari:
WHERE role = 'admin'

// Menjadi (sesuaikan dengan role yang ada):
WHERE id = 1  // atau WHERE username = 'admin'
```

---

### **Masalah 3: Masih tidak bisa login**

**Penyebab:** Cache browser atau session lama

**Solusi:**
1. Clear cache browser (Ctrl + Shift + Delete)
2. Close semua tab browser
3. Buka browser baru
4. Coba login lagi

---

## 📋 CHECKLIST

- [ ] Edit database config di `reset_admin_miputra.php`
- [ ] Upload file ke `public_html`
- [ ] Buka di browser
- [ ] Cek database config ditampilkan benar
- [ ] Klik tombol "Reset Admin Credentials"
- [ ] Muncul pesan sukses
- [ ] Logout dari aplikasi
- [ ] Clear cache browser
- [ ] Login dengan `miputra` / `manduraga`
- [ ] Berhasil login ✅
- [ ] HAPUS file `reset_admin_miputra.php`

---

## 💡 KENAPA CARA INI PASTI BERHASIL?

1. **Generate Hash Langsung di Server**
   - Hash dibuat dengan PHP version yang sama
   - Pasti compatible dengan database

2. **Update Langsung ke Database**
   - Tidak perlu manual copy-paste query
   - Tidak ada typo

3. **Verifikasi Otomatis**
   - Langsung cek apakah berhasil
   - Tampilkan data admin setelah update

4. **Error Handling**
   - Tampilkan error jika ada masalah
   - Mudah troubleshoot

---

## 🎯 RINGKASAN

**File:** `reset_admin_miputra.php`  
**Lokasi:** `D:\Kiro\12 Des 2025\`

**Langkah:**
1. Edit database config
2. Upload ke `public_html`
3. Buka di browser
4. Klik "Reset"
5. Test login
6. Hapus file

**Estimasi Waktu:** 5-10 menit

---

## 📞 JIKA MASIH BERMASALAH

Kabari dengan:
- Screenshot halaman reset (setelah klik tombol)
- Pesan error yang muncul
- Database config yang Anda gunakan

---

**Cara ini PASTI berhasil karena:**
- ✅ Generate hash langsung di server
- ✅ Update langsung ke database
- ✅ Verifikasi otomatis
- ✅ Error handling lengkap

Selamat mencoba! 🚀
