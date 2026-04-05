# Troubleshooting: Update Data Guru Tidak Tersimpan

## 🔴 MASALAH

Ketika update data guru (ID Guru, Nomor HP), data tidak tersimpan ke database.

---

## 🔍 KEMUNGKINAN PENYEBAB

### 1. **Struktur Database Tidak Sesuai**
Kolom `id_guru` dan `no_hp` tidak ada atau tipe datanya salah.

### 2. **UNIQUE Constraint Error**
ID Guru atau Username yang diinput sudah digunakan oleh guru lain.

### 3. **Data Tidak Terkirim dengan Benar**
Frontend mengirim data dengan format yang salah.

### 4. **Permission Database**
User database tidak punya akses UPDATE.

---

## ✅ SOLUSI

### LANGKAH 1: Cek Struktur Database

1. Login ke **cPanel** → **phpMyAdmin**
2. Pilih database Anda (contoh: `username_geopresensi_db`)
3. Klik tabel **`users`**
4. Klik tab **"Structure"**

**Pastikan ada kolom**:
- `id_guru` → Type: `VARCHAR(20)`, Null: `YES`, Key: `UNI`
- `no_hp` → Type: `VARCHAR(20)`, Null: `YES`

**Jika tidak ada atau salah**, jalankan query ini:

```sql
ALTER TABLE users MODIFY COLUMN id_guru VARCHAR(20) DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN no_hp VARCHAR(20) DEFAULT NULL;
```

---

### LANGKAH 2: Perbaiki UNIQUE Key

Jalankan script `fix_database.sql` yang sudah saya buat:

1. Buka **phpMyAdmin**
2. Pilih database Anda
3. Klik tab **"SQL"**
4. Copy-paste isi file `fix_database.sql`
5. Klik **"Go"**

Script ini akan:
- ✅ Cek struktur tabel
- ✅ Perbaiki tipe data kolom
- ✅ Tambah UNIQUE key yang benar
- ✅ Cek data duplikat
- ✅ Update password ke admin123/kepsek123/guru123

---

### LANGKAH 3: Upload File Backend yang Sudah Diperbaiki

File `api/guru.php` sudah saya perbaiki dengan:
- ✅ Validasi data lebih ketat
- ✅ Cek duplikat sebelum update
- ✅ Error handling lebih baik
- ✅ Response yang lebih jelas

**Upload file ini ke server**:
1. Buka **File Manager** di cPanel
2. Masuk ke folder `/home/username/api/`
3. Upload file `api/guru.php` (overwrite yang lama)

---

### LANGKAH 4: Test Update Guru

1. Login ke aplikasi: `https://sistemflow.biz.id`
2. Masuk ke menu **Data Guru**
3. Klik **Edit** pada salah satu guru
4. Ubah **Nomor HP** atau **ID Guru**
5. Klik **Simpan**

**Jika berhasil**: Muncul notifikasi hijau "Guru berhasil diupdate"

**Jika gagal**: 
- Lihat error message yang muncul
- Buka **Browser Console** (F12) → tab Console
- Screenshot error dan kirim ke saya

---

## 🔧 DEBUGGING MANUAL

### Cek Data di Database

Jalankan query ini di phpMyAdmin:

```sql
-- Lihat semua data guru
SELECT id, id_guru, username, nama, no_hp, jenis_kelamin 
FROM users 
WHERE role = 'guru';
```

### Cek Apakah Ada Duplikat

```sql
-- Cek duplikat id_guru
SELECT id_guru, COUNT(*) as jumlah 
FROM users 
WHERE id_guru IS NOT NULL 
GROUP BY id_guru 
HAVING COUNT(*) > 1;

-- Cek duplikat username
SELECT username, COUNT(*) as jumlah 
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;
```

**Jika ada duplikat**, hapus yang duplikat:

```sql
-- Ganti [ID] dengan ID yang mau dihapus
DELETE FROM users WHERE id = [ID];
```

---

## 📋 CHECKLIST PERBAIKAN

- [ ] Struktur database sudah benar (kolom id_guru dan no_hp ada)
- [ ] UNIQUE key sudah ditambahkan
- [ ] Tidak ada data duplikat
- [ ] File `api/guru.php` sudah diupload ke server
- [ ] Password sudah diupdate (admin123, kepsek123, guru123)
- [ ] Test update guru berhasil

---

## 🆘 JIKA MASIH ERROR

### Error: "ID Guru atau Username sudah digunakan"

**Penyebab**: ID Guru atau Username yang Anda input sudah ada di database.

**Solusi**: 
- Gunakan ID Guru yang berbeda (contoh: G2023001, G2023002)
- Atau gunakan Username yang berbeda

### Error: "Tidak ada perubahan data"

**Penyebab**: Data yang Anda input sama persis dengan data yang sudah ada.

**Solusi**: Ubah minimal 1 field (nama, alamat, atau no HP).

### Error: "Failed to fetch"

**Penyebab**: API tidak bisa diakses.

**Solusi**: 
1. Cek apakah file `api/guru.php` sudah ada di server
2. Test endpoint: `https://sistemflow.biz.id/api/guru.php`
3. Harus muncul data guru dalam format JSON

---

## 📝 CATATAN PENTING

### Field yang Wajib Diisi:
- ✅ ID Guru (contoh: G2020001)
- ✅ Nama Lengkap
- ✅ Jenis Kelamin
- ✅ Alamat
- ✅ Nomor HP
- ✅ Jabatan (minimal 1)
- ✅ Tanggal Bertugas
- ✅ Username
- ✅ Password (hanya saat tambah guru baru)

### Field yang Bisa Dikosongkan:
- Password (saat edit guru, jika tidak ingin mengubah password)

### Format Data:
- ID Guru: Huruf + Angka (contoh: G2020001, G2021002)
- Nomor HP: Angka saja (contoh: 081234567890)
- Username: Huruf/angka tanpa spasi (contoh: guru1, guru2)
- Password: Minimal 6 karakter

---

## 🎯 RINGKASAN

```
Masalah: Update guru tidak tersimpan
Penyebab: Struktur database atau UNIQUE constraint
Solusi: Jalankan fix_database.sql + upload guru.php baru
Waktu: ±5 menit
```

Jika masih ada masalah, screenshot error dan struktur database, saya akan bantu lebih lanjut!
