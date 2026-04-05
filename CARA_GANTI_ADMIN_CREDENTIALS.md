# 🔐 CARA GANTI USERNAME & PASSWORD ADMIN

**Tanggal:** 14 Desember 2025  
**Untuk:** Admin GeoPresensi Sekolah

---

## 🎯 2 CARA MUDAH

### **CARA 1: Menggunakan File PHP Generator (Paling Mudah)** ⭐
### **CARA 2: Langsung via phpMyAdmin**

---

## 🚀 CARA 1: Menggunakan File PHP Generator

### **STEP 1: Upload File Generator**

1. Login cPanel → File Manager
2. Masuk ke folder `public_html`
3. Upload file `generate_password.php` dari `D:\Kiro\12 Des 2025\generate_password.php`

### **STEP 2: Buka di Browser**

1. Buka: `https://kelolasekolah.web.id/generate_password.php`
2. Anda akan melihat form generator

### **STEP 3: Isi Form**

1. **Username Baru** (opsional): 
   - Isi jika mau ganti username
   - Kosongkan jika username tetap `admin`
   
2. **Password Baru**: 
   - Masukkan password yang Anda inginkan
   - Minimal 6 karakter
   
3. **Konfirmasi Password**: 
   - Ketik ulang password yang sama

4. Klik **"Generate Hash"**

### **STEP 4: Copy Query SQL**

Setelah generate, akan muncul:
- Hash password
- Query SQL yang siap digunakan

Copy query SQL yang muncul.

### **STEP 5: Jalankan di phpMyAdmin**

1. Login cPanel → phpMyAdmin
2. Pilih database Anda
3. Klik tab **"SQL"**
4. Paste query yang sudah dicopy
5. Klik **"Go"**

### **STEP 6: HAPUS File Generator**

**PENTING!** Hapus file `generate_password.php` dari server:
1. File Manager → `public_html`
2. Klik kanan `generate_password.php` → **Delete**

### **STEP 7: Test Login**

1. Logout dari aplikasi
2. Login dengan username & password baru
3. **Hasil:** ✅ Berhasil login

---

## 🔧 CARA 2: Langsung via phpMyAdmin

### **STEP 1: Login phpMyAdmin**

1. Login cPanel
2. Klik **"phpMyAdmin"**
3. Pilih database Anda di sebelah kiri

### **STEP 2: Pilih Query**

Klik tab **"SQL"**, lalu pilih salah satu:

#### **Opsi A: Ganti Username & Password**
```sql
UPDATE users 
SET 
    username = 'adminbaru',  -- Ganti dengan username baru
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- Password: admin123
WHERE role = 'admin' AND username = 'admin';
```

#### **Opsi B: Hanya Ganti Password**
```sql
UPDATE users 
SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- Password: admin123
WHERE role = 'admin' AND username = 'admin';
```

#### **Opsi C: Hanya Ganti Username**
```sql
UPDATE users 
SET username = 'adminbaru'  -- Ganti dengan username baru
WHERE role = 'admin' AND username = 'admin';
```

### **STEP 3: Klik "Go"**

Query akan dijalankan.

### **STEP 4: Test Login**

Login dengan credentials baru.

---

## 🔑 DAFTAR PASSWORD HASH SIAP PAKAI

Jika mau cepat, gunakan hash ini:

| Password | Hash |
|----------|------|
| `admin123` | `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` |
| `password123` | `$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |

**Contoh penggunaan:**
```sql
-- Ganti password ke "password123"
UPDATE users 
SET password = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE role = 'admin' AND username = 'admin';
```

---

## 📝 CONTOH LENGKAP

### **Skenario: Ganti ke username "superadmin" dan password "sekolah2024"**

**Menggunakan Cara 1 (File Generator):**

1. Upload `generate_password.php`
2. Buka: `https://kelolasekolah.web.id/generate_password.php`
3. Isi form:
   - Username: `superadmin`
   - Password: `sekolah2024`
   - Konfirmasi: `sekolah2024`
4. Klik "Generate Hash"
5. Copy query SQL yang muncul
6. Paste di phpMyAdmin → Klik "Go"
7. Hapus `generate_password.php`
8. Test login dengan `superadmin` / `sekolah2024`

---

## 🧪 VERIFIKASI

Setelah update, cek dengan query ini di phpMyAdmin:

```sql
SELECT id, username, role, nama 
FROM users 
WHERE role = 'admin';
```

**Hasil yang diharapkan:**
```
id | username    | role  | nama
1  | superadmin  | admin | Admin Sekolah
```

---

## ⚠️ TROUBLESHOOTING

### **Masalah 1: "0 rows affected"**

**Penyebab:** Username admin tidak ditemukan

**Solusi:** Cek username yang ada
```sql
SELECT * FROM users WHERE role = 'admin';
```

Sesuaikan query dengan username yang ada.

---

### **Masalah 2: Tidak bisa login setelah ganti**

**Penyebab:** Hash password salah atau typo

**Solusi:** Reset ke password default
```sql
UPDATE users 
SET 
    username = 'admin',
    password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE role = 'admin';
```

Login dengan: `admin` / `admin123`

---

### **Masalah 3: File generate_password.php error**

**Penyebab:** PHP version atau permission

**Solusi:** Gunakan Cara 2 (langsung via phpMyAdmin)

---

## 📋 CHECKLIST

### **Menggunakan Cara 1:**
- [ ] Upload `generate_password.php` ke `public_html`
- [ ] Buka di browser
- [ ] Isi form (username & password baru)
- [ ] Generate hash
- [ ] Copy query SQL
- [ ] Jalankan di phpMyAdmin
- [ ] **HAPUS `generate_password.php`**
- [ ] Test login dengan credentials baru

### **Menggunakan Cara 2:**
- [ ] Login phpMyAdmin
- [ ] Pilih database
- [ ] Klik tab "SQL"
- [ ] Paste query UPDATE
- [ ] Klik "Go"
- [ ] Test login dengan credentials baru

---

## 🔒 TIPS KEAMANAN

1. **Password Kuat:**
   - Minimal 8 karakter
   - Kombinasi huruf besar, kecil, angka
   - Contoh: `Admin2024!`, `Sekolah#123`

2. **Jangan Gunakan:**
   - Password mudah: `123456`, `password`, `admin`
   - Tanggal lahir atau nama
   - Password yang sama dengan username

3. **Simpan dengan Aman:**
   - Catat di tempat aman
   - Jangan share ke orang lain
   - Ganti berkala (3-6 bulan sekali)

4. **Keamanan File:**
   - Hapus `generate_password.php` setelah digunakan
   - Jangan biarkan file ini tetap di server

---

## 📄 FILE YANG DISEDIAKAN

1. **generate_password.php** - File generator (upload ke `public_html`)
2. **ganti_admin_credentials.sql** - Script SQL siap pakai
3. **CARA_GANTI_ADMIN_CREDENTIALS.md** - Dokumentasi ini

---

## 🎯 RINGKASAN

**Cara Tercepat:**
1. Upload `generate_password.php`
2. Buka di browser
3. Generate hash
4. Jalankan query di phpMyAdmin
5. Hapus file generator
6. Test login

**Estimasi Waktu:** 5-10 menit

---

## 📞 BANTUAN

Jika ada masalah:
- Cek apakah query SQL sudah benar
- Cek apakah username lama sesuai
- Coba reset ke default dulu
- Tanya jika masih bingung

---

**Lokasi file:** `D:\Kiro\12 Des 2025\`  
**File generator:** `generate_password.php`  
**File SQL:** `ganti_admin_credentials.sql`

Selamat mengganti credentials! 🔐
