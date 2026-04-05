# 🚀 CARA UPLOAD FITUR HARI LIBUR KE SERVER

## ✅ BUILD SUDAH SELESAI!

File sudah di-build dan siap upload. Lokasi: `D:\Kiro\12 Des 2025\dist`

---

## 📋 LANGKAH-LANGKAH UPLOAD

### **STEP 1: Upload Backend API (File PHP)**

1. Login ke **cPanel** → **File Manager**
2. Masuk ke folder `/home/username/api/`
3. Upload file ini:
   - **`api/holidays.php`** (dari komputer lokal)

**Lokasi file di komputer**: `D:\Kiro\12 Des 2025\api\holidays.php`

---

### **STEP 2: Jalankan SQL Script (Buat Tabel Database)**

1. Login ke **cPanel** → **phpMyAdmin**
2. Pilih database Anda (yang dipakai aplikasi)
3. Klik tab **"SQL"**
4. Buka file **`database_hari_libur.sql`** di komputer
5. Copy semua isinya
6. Paste ke phpMyAdmin
7. Klik **"Go"** atau **"Kirim"**

**Lokasi file di komputer**: `D:\Kiro\12 Des 2025\database_hari_libur.sql`

**Hasil yang diharapkan**:
- ✅ Tabel `holidays` berhasil dibuat
- ✅ 15 data hari libur nasional 2025 berhasil diinsert

---

### **STEP 3: Upload Frontend (File HTML & Assets)**

1. Login ke **cPanel** → **File Manager**
2. Masuk ke folder **`public_html`**
3. **HAPUS** file lama:
   - `index.html` (hapus)
   - Folder `assets` (hapus)

4. **UPLOAD** file baru dari folder `dist`:
   - `index.html` (upload)
   - Folder `assets` (upload seluruh folder)

**Lokasi file di komputer**: `D:\Kiro\12 Des 2025\dist\`

**Struktur setelah upload**:
```
public_html/
├── index.html (baru)
└── assets/ (baru)
    ├── index-GQUf19aP.js
    ├── index-BGLwMAXQ.css
    ├── purify.es-C_uT9hQ1.js
    ├── index.es-BmAkHNZ-.js
    └── html2canvas.esm-CBrSDip1.js
```

---

### **STEP 4: Test Aplikasi**

1. **Clear Cache Browser**:
   - Tekan `Ctrl + Shift + Delete`
   - Pilih "Cached images and files"
   - Klik "Clear data"

2. **Hard Refresh**:
   - Tekan `Ctrl + F5` atau `Shift + F5`

3. **Login sebagai Guru**:
   - Username: `guru`
   - Password: `guru123`

4. **Test Skenario**:

   **A. Test Hari Kerja (Senin-Jumat)**
   - Buka aplikasi di hari Senin-Jumat
   - **Hasil**: Tombol HADIR, IZIN, SAKIT muncul ✅

   **B. Test Hari Weekend (Sabtu-Minggu)**
   - Buka aplikasi di hari Sabtu atau Minggu
   - **Hasil**: 
     - Muncul pesan "Hari Sabtu/Minggu adalah hari libur"
     - Background biru
     - Tombol presensi TIDAK muncul ✅

   **C. Test Hari Libur Nasional**
   - Buka aplikasi di tanggal libur nasional (contoh: 25 Des 2025)
   - **Hasil**:
     - Muncul pesan "Hari Libur: Hari Raya Natal"
     - Background kuning
     - Tombol presensi TIDAK muncul ✅

---

## 🔍 VERIFIKASI DATABASE

Setelah upload, cek apakah tabel berhasil dibuat:

1. Login **phpMyAdmin**
2. Pilih database Anda
3. Jalankan query:

```sql
SELECT * FROM holidays ORDER BY tanggal;
```

**Hasil yang diharapkan**: 15 baris data hari libur 2025

---

## 📅 DAFTAR HARI LIBUR 2025 (Untuk Test)

| Tanggal | Nama Libur | Jenis |
|---------|------------|-------|
| 01 Jan 2025 | Tahun Baru 2025 | Nasional |
| 29 Mar 2025 | Isra Miraj | Nasional |
| 31 Mar 2025 | Hari Raya Nyepi | Nasional |
| 18 Apr 2025 | Wafat Isa Almasih | Nasional |
| 01 Mei 2025 | Hari Buruh | Nasional |
| 12 Mei 2025 | Hari Raya Waisak | Nasional |
| 29 Mei 2025 | Kenaikan Isa Almasih | Nasional |
| 01 Jun 2025 | Hari Lahir Pancasila | Nasional |
| 17 Agu 2025 | Hari Kemerdekaan RI | Nasional |
| 25 Des 2025 | Hari Raya Natal | Nasional |

Plus 5 cuti bersama.

---

## ⚠️ TROUBLESHOOTING

### Masalah 1: Masih bisa presensi di hari Sabtu/Minggu

**Solusi**:
1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Pastikan file `index.html` dan `assets` sudah terupdate

### Masalah 2: Error "holidays table doesn't exist"

**Solusi**:
1. Buka phpMyAdmin
2. Jalankan ulang `database_hari_libur.sql`
3. Verifikasi dengan: `SHOW TABLES;`

### Masalah 3: Hari libur nasional tidak terdeteksi

**Solusi**:
1. Cek data di database:
   ```sql
   SELECT * FROM holidays WHERE tanggal = '2025-12-25';
   ```
2. Jika kosong, insert manual:
   ```sql
   INSERT INTO holidays (tanggal, nama, jenis) 
   VALUES ('2025-12-25', 'Hari Raya Natal', 'nasional');
   ```

### Masalah 4: API Error 404

**Solusi**:
1. Pastikan `api/holidays.php` sudah diupload
2. Test endpoint: `https://sistemflow.biz.id/api/holidays.php?check=2025-12-25`
3. Harus return JSON response

---

## ✅ CHECKLIST UPLOAD

- [ ] Upload `api/holidays.php` ke `/home/username/api/`
- [ ] Jalankan `database_hari_libur.sql` di phpMyAdmin
- [ ] Verifikasi tabel `holidays` berhasil dibuat
- [ ] Hapus `index.html` dan `assets` lama di `public_html`
- [ ] Upload `index.html` dan `assets` baru dari `dist`
- [ ] Clear cache browser
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test login sebagai guru
- [ ] Test di hari kerja (tombol muncul)
- [ ] Test di hari weekend (pesan libur muncul)
- [ ] Test di hari libur nasional (pesan libur muncul)

---

## 🎯 RINGKASAN

**File yang perlu diupload**:
1. `api/holidays.php` → ke `/home/username/api/`
2. `database_hari_libur.sql` → jalankan di phpMyAdmin
3. `dist/index.html` → ke `public_html/`
4. `dist/assets/` → ke `public_html/assets/`

**Lokasi file di komputer**: `D:\Kiro\12 Des 2025\`

**Setelah upload**: Clear cache + Hard refresh + Test

---

## 📞 BANTUAN

Jika ada masalah saat upload, kabari saya dengan:
1. Screenshot error (jika ada)
2. Langkah mana yang bermasalah
3. Hasil test yang didapat

Selamat mengupload! 🚀
