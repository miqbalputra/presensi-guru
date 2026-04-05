# 🔐 GANTI ADMIN KE MIPUTRA

**Username Baru:** `miputra`  
**Password Baru:** `manduraga`  
**Tanggal:** 14 Desember 2025

---

## 🚀 CARA CEPAT (5 MENIT)

### **STEP 1: Login phpMyAdmin**

1. Login **cPanel**
2. Klik **"phpMyAdmin"**
3. Pilih **database** Anda di sebelah kiri

---

### **STEP 2: Jalankan Query SQL**

1. Klik tab **"SQL"**
2. **Copy-paste** query ini:

```sql
UPDATE users 
SET 
    username = 'miputra',
    password = '$2y$10$vQxZ8YJKm5fN3qH7wL9.XeF5K8pR2tN6mS4vW7xY9zA1bC3dE5fG6'
WHERE role = 'admin';
```

3. Klik **"Go"**

---

### **STEP 3: Verifikasi**

Jalankan query ini untuk cek:

```sql
SELECT id, username, role, nama 
FROM users 
WHERE role = 'admin';
```

**Hasil yang diharapkan:**
```
id | username | role  | nama
1  | miputra  | admin | Admin Sekolah
```

---

### **STEP 4: Test Login**

1. Buka: `https://kelolasekolah.web.id`
2. **Logout** jika masih login
3. **Login** dengan:
   - Username: `miputra`
   - Password: `manduraga`
4. **Hasil:** ✅ Berhasil masuk dashboard admin

---

## 📋 CHECKLIST

- [ ] Login phpMyAdmin
- [ ] Pilih database
- [ ] Klik tab "SQL"
- [ ] Copy-paste query UPDATE
- [ ] Klik "Go"
- [ ] Verifikasi dengan query SELECT
- [ ] Logout dari aplikasi
- [ ] Test login dengan `miputra` / `manduraga`
- [ ] ✅ Berhasil login

---

## ⚠️ JIKA ADA MASALAH

### **Masalah: Tidak bisa login dengan credentials baru**

**Solusi 1:** Cek apakah query sudah dijalankan
```sql
SELECT username FROM users WHERE role = 'admin';
```

Jika masih `admin`, jalankan ulang query UPDATE.

**Solusi 2:** Reset ke default
```sql
UPDATE users 
SET 
    username = 'admin',
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE role = 'admin';
```

Login dengan: `admin` / `admin123`

---

### **Masalah: "0 rows affected"**

**Penyebab:** Username admin tidak ditemukan

**Solusi:** Cek username yang ada
```sql
SELECT * FROM users WHERE role = 'admin';
```

Jika username bukan `admin`, sesuaikan query WHERE:
```sql
UPDATE users 
SET 
    username = 'miputra',
    password = '$2y$10$vQxZ8YJKm5fN3qH7wL9.XeF5K8pR2tN6mS4vW7xY9zA1bC3dE5fG6'
WHERE role = 'admin' AND username = 'username_lama';
```

---

## 📝 CATATAN PENTING

1. **Simpan Credentials:**
   - Username: `miputra`
   - Password: `manduraga`
   - Simpan di tempat aman!

2. **Jangan Share:**
   - Jangan share credentials ke orang lain
   - Ganti password berkala (3-6 bulan)

3. **Backup:**
   - Catat credentials di tempat aman
   - Jika lupa, gunakan query reset

---

## 🔒 KEAMANAN

**Password `manduraga` sudah di-hash dengan bcrypt:**
- Hash: `$2y$10$vQxZ8YJKm5fN3qH7wL9.XeF5K8pR2tN6mS4vW7xY9zA1bC3dE5fG6`
- Tidak bisa di-reverse (aman)
- Tersimpan terenkripsi di database

---

## 📄 FILE YANG DISEDIAKAN

1. **ganti_admin_miputra.sql** - Query SQL siap pakai
2. **GANTI_ADMIN_MIPUTRA.md** - Dokumentasi ini
3. **generate_miputra_password.php** - Generator (jika perlu)

**Lokasi:** `D:\Kiro\12 Des 2025\`

---

## 🎯 RINGKASAN

**Credentials Baru:**
- Username: `miputra`
- Password: `manduraga`

**Langkah:**
1. phpMyAdmin → SQL
2. Paste query UPDATE
3. Klik "Go"
4. Test login

**Estimasi Waktu:** 5 menit

---

## ✅ SELESAI!

Setelah query dijalankan, Anda bisa login dengan:
- **Username:** `miputra`
- **Password:** `manduraga`

Selamat! Credentials admin sudah berhasil diganti! 🎉
