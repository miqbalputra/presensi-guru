# Update Fitur: Tanggal Lahir Guru

## ✅ FITUR BARU

### 1. **Tambah Kolom Tanggal Lahir**
- Field baru: Tanggal Lahir
- Tampil di tabel Data Guru
- Otomatis hitung umur guru

### 2. **Perbaikan Update Data Guru**
- Fix masalah ID Guru dan No HP tidak tersimpan
- Perbaikan mapping field antara frontend dan backend
- Validasi duplikat lebih baik

---

## 🔧 LANGKAH INSTALASI

### STEP 1: Update Database

Jalankan script SQL ini di **phpMyAdmin**:

```sql
-- Tambah Kolom Tanggal Lahir ke Tabel Users
ALTER TABLE users ADD COLUMN tanggal_lahir DATE DEFAULT NULL AFTER jenis_kelamin;

-- Update data sample (opsional)
UPDATE users SET tanggal_lahir = '1985-05-15' WHERE username = 'guru1';
UPDATE users SET tanggal_lahir = '1987-08-20' WHERE username = 'guru2';
UPDATE users SET tanggal_lahir = '1990-03-10' WHERE username = 'guru3';

-- Verifikasi
SELECT id, id_guru, nama, tanggal_lahir, jenis_kelamin FROM users WHERE role = 'guru';
```

---

### STEP 2: Upload File Backend

Upload file ini ke server (folder `/home/username/api/`):
- ✅ `api/guru.php` (sudah diperbaiki)

**Cara upload**:
1. Buka **File Manager** di cPanel
2. Masuk ke folder `/home/username/api/`
3. Upload `guru.php` (overwrite yang lama)

---

### STEP 3: Build & Upload Frontend

1. **Build aplikasi**:
```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

2. **Upload ke server**:
   - Hapus `index.html` dan folder `assets` lama di `public_html`
   - Upload `index.html` dan folder `assets` baru dari folder `dist`

---

## 📋 PERUBAHAN DETAIL

### Backend (api/guru.php)

#### 1. **Tambah Field tanggal_lahir**
- CREATE guru: Tambah kolom `tanggal_lahir`
- UPDATE guru: Tambah kolom `tanggal_lahir`
- GET guru: Return field `tanggalLahir` (camelCase)

#### 2. **Perbaikan Field Mapping**
Sekarang backend otomatis convert snake_case ke camelCase:
- `id_guru` → `idGuru`
- `no_hp` → `noHP`
- `jenis_kelamin` → `jenisKelamin`
- `tanggal_bertugas` → `tanggalBertugas`
- `tanggal_lahir` → `tanggalLahir`

#### 3. **Perbaikan Validasi**
- Cek duplikat ID Guru dan Username sebelum save
- Error handling lebih baik
- Response lebih jelas

---

### Frontend

#### 1. **GuruModal.jsx**
- Tambah field input Tanggal Lahir
- Field wajib diisi (required)
- Posisi: Setelah Nama, sebelum Jenis Kelamin

#### 2. **DataGuru.jsx**
- Tambah kolom Tanggal Lahir di tabel
- Tambah kolom Umur (otomatis hitung dari tanggal lahir)
- Export Excel include tanggal lahir dan umur

---

## 🎯 CARA PENGGUNAAN

### Tambah Guru Baru

1. Klik tombol **"Tambah Guru"**
2. Isi form:
   - ID Guru: `G2023001`
   - Nama: `Ahmad Fauzi`
   - **Tanggal Lahir**: `15-05-1990` ← BARU!
   - Jenis Kelamin: `Laki-laki`
   - Alamat: `Jl. Merdeka No. 10`
   - No HP: `081234567890`
   - Jabatan: `Guru Matematika`
   - Tanggal Bertugas: `01-01-2023`
   - Username: `guru6`
   - Password: `guru123`
3. Klik **"Simpan"**

### Edit Guru

1. Klik tombol **Edit** (ikon pensil)
2. Ubah data yang ingin diubah (termasuk Tanggal Lahir)
3. Klik **"Simpan"**

**PENTING**: Sekarang ID Guru dan No HP akan tersimpan dengan benar! ✅

---

## 📊 TAMPILAN TABEL

Tabel Data Guru sekarang menampilkan:

| No | ID Guru | Nama | Tgl Lahir | Umur | JK | Alamat | No HP | Jabatan | Tgl Bertugas | Lama Bertugas | Username | Password | Aksi |
|----|---------|------|-----------|------|-------|--------|-------|---------|--------------|---------------|----------|----------|------|
| 1  | G2020001 | Budi | 15-05-1985 | 39 tahun | L | Jl. Merdeka | 0812... | Guru Matematika | 15-01-2020 | 4 tahun 11 bulan | guru1 | •••••••• | ✏️ 🗑️ |

---

## 🔍 TROUBLESHOOTING

### Masalah: Kolom tanggal_lahir tidak ada

**Solusi**: Jalankan script SQL di STEP 1

```sql
ALTER TABLE users ADD COLUMN tanggal_lahir DATE DEFAULT NULL AFTER jenis_kelamin;
```

### Masalah: ID Guru dan No HP masih tidak tersimpan

**Solusi**: 
1. Pastikan file `api/guru.php` sudah diupload ke server
2. Clear cache browser (Ctrl + Shift + Delete)
3. Hard refresh (Ctrl + F5)
4. Coba lagi

### Masalah: Error saat update guru

**Solusi**: Cek apakah ID Guru atau Username sudah digunakan oleh guru lain

---

## 📝 CATATAN

### Field Wajib Diisi:
- ✅ ID Guru
- ✅ Nama
- ✅ Tanggal Lahir (BARU!)
- ✅ Jenis Kelamin
- ✅ Alamat
- ✅ No HP
- ✅ Jabatan (minimal 1)
- ✅ Tanggal Bertugas
- ✅ Username
- ✅ Password (hanya saat tambah baru)

### Field Opsional:
- Password (saat edit guru, kosongkan jika tidak ingin mengubah)

---

## 🎉 RINGKASAN

```
✅ Tambah field Tanggal Lahir
✅ Otomatis hitung Umur
✅ Fix masalah update ID Guru dan No HP
✅ Perbaikan field mapping (snake_case ↔ camelCase)
✅ Validasi duplikat lebih baik
✅ Export Excel include tanggal lahir dan umur
```

Sekarang aplikasi sudah lebih lengkap dan update data guru berfungsi dengan baik!
