# FITUR VALIDASI TERLAMBAT ✅

## 🎯 FITUR YANG DITAMBAHKAN

### 1. **Deteksi Otomatis Keterlambatan**
- Sistem otomatis mendeteksi guru yang presensi setelah jam masuk normal
- Status berubah dari "Hadir" menjadi "Hadir (Terlambat)"
- Keterangan otomatis: "Terlambat X menit"

### 2. **Pengaturan Jam Masuk (Admin)**
- Admin bisa mengubah jam masuk normal (default: 07:20 WIB)
- Admin bisa set toleransi keterlambatan (default: 15 menit)
- Admin bisa set radius GPS (default: 500 meter)
- Menu: **Admin → Pengaturan**

### 3. **Tingkat Keterlambatan**
- **Tepat Waktu**: Presensi ≤ jam masuk normal → Status: "Hadir"
- **Terlambat**: Presensi > jam masuk, ≤ toleransi → Status: "Hadir (Terlambat)"
- **Terlambat Parah**: Presensi > jam masuk + toleransi → Status: "Hadir (Terlambat)" + badge "PARAH"

### 4. **Tampilan Visual**
- Badge kuning "TERLAMBAT" untuk guru yang terlambat
- Background kuning untuk status terlambat (bukan hijau)
- Icon jam (Clock) untuk status terlambat
- Keterangan berapa menit terlambat

### 5. **Info Jam Masuk di Dashboard Guru**
- Guru bisa lihat jam masuk normal dan toleransi
- Tampil di bawah nama guru: "Jam masuk normal: 07:20 WIB | Toleransi: 15 menit"

---

## 📋 DATABASE CHANGES

### Tabel Baru: `settings`
```sql
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);
```

### Data Default:
```sql
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('jam_masuk_normal', '07:20', 'Batas waktu masuk normal (format HH:MM)', 'system'),
    ('toleransi_terlambat', '15', 'Toleransi keterlambatan dalam menit', 'system'),
    ('radius_gps', '500', 'Radius validasi GPS dalam meter', 'system');
```

### Status Baru di Tabel `attendance_logs`:
- Status lama: `hadir`, `izin`, `sakit`
- Status baru: `hadir_terlambat`

---

## 🔧 FILE YANG DITAMBAHKAN/DIUBAH

### File Baru:
1. **`database_settings.sql`** - SQL untuk create table settings
2. **`api/settings.php`** - API endpoint untuk settings
3. **`src/components/admin/Pengaturan.jsx`** - Halaman pengaturan admin
4. **`FITUR_VALIDASI_TERLAMBAT.md`** - Dokumentasi ini

### File Diubah:
1. **`src/services/api.js`** - Tambah settingsAPI
2. **`src/components/admin/Sidebar.jsx`** - Tambah menu Pengaturan
3. **`src/pages/AdminDashboard.jsx`** - Tambah route Pengaturan
4. **`src/components/guru/GuruHome.jsx`** - Tambah logika deteksi terlambat
5. **`dist/`** - Build hasil (siap upload)

---

## 📦 CARA INSTALL

### Step 1: Database
Buka phpMyAdmin, pilih database `sobataja2_geopresence`, jalankan:
```sql
-- File: database_settings.sql
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('jam_masuk_normal', '07:20', 'Batas waktu masuk normal (format HH:MM)', 'system'),
    ('toleransi_terlambat', '15', 'Toleransi keterlambatan dalam menit', 'system'),
    ('radius_gps', '500', 'Radius validasi GPS dalam meter', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- Cek data
SELECT * FROM settings;
```

### Step 2: Upload File API
Upload file ini ke cPanel:
- `api/settings.php` → folder `api/`

### Step 3: Upload Frontend
Upload folder `dist/` ke cPanel (overwrite semua file lama):
- `dist/index.html` → root website
- `dist/assets/` → folder assets

---

## 🎮 CARA MENGGUNAKAN

### Untuk Admin:

#### 1. Ubah Jam Masuk Normal
1. Login sebagai admin
2. Klik menu **Pengaturan** di sidebar
3. Ubah jam di kolom "Jam Masuk Normal" (contoh: 07:30)
4. Klik tombol **Simpan**
5. Selesai! Perubahan langsung berlaku

#### 2. Ubah Toleransi Keterlambatan
1. Di halaman Pengaturan
2. Ubah angka di kolom "Toleransi Keterlambatan" (contoh: 20 menit)
3. Klik tombol **Simpan**

#### 3. Ubah Radius GPS
1. Di halaman Pengaturan
2. Ubah angka di kolom "Radius Validasi GPS" (contoh: 1000 meter)
3. Klik tombol **Simpan**

### Untuk Guru:

#### 1. Cek Jam Masuk Normal
- Login sebagai guru
- Lihat di bawah nama: "Jam masuk normal: 07:20 WIB | Toleransi: 15 menit"

#### 2. Presensi Hadir
- Klik tombol **HADIR**
- Jika presensi ≤ 07:20 → Status: "Hadir" (hijau)
- Jika presensi > 07:20 → Status: "Hadir (Terlambat)" (kuning) + badge "TERLAMBAT"
- Keterangan otomatis: "Terlambat X menit"

---

## 📊 CONTOH SKENARIO

### Skenario 1: Tepat Waktu
- Jam masuk normal: 07:20 WIB
- Guru presensi: 07:15 WIB
- **Hasil**: Status "Hadir" (hijau), tidak ada badge

### Skenario 2: Terlambat (Dalam Toleransi)
- Jam masuk normal: 07:20 WIB
- Toleransi: 15 menit
- Guru presensi: 07:30 WIB (terlambat 10 menit)
- **Hasil**: Status "Hadir (Terlambat)" (kuning), badge "TERLAMBAT", keterangan "Terlambat 10 menit"

### Skenario 3: Terlambat Parah
- Jam masuk normal: 07:20 WIB
- Toleransi: 15 menit
- Guru presensi: 08:00 WIB (terlambat 40 menit)
- **Hasil**: Status "Hadir (Terlambat)" (kuning), badge "TERLAMBAT", keterangan "Terlambat 40 menit (Parah)"

---

## 🔍 TESTING CHECKLIST

### Database:
- [ ] Tabel `settings` berhasil dibuat
- [ ] Data default (jam_masuk_normal, toleransi_terlambat, radius_gps) ada
- [ ] Query `SELECT * FROM settings` menampilkan 3 baris

### API:
- [ ] Test API: `https://kelolasekolah.web.id/api/settings.php`
- [ ] Response: `{"success":true,"data":{"jam_masuk_normal":"07:20",...}}`

### Admin:
- [ ] Menu "Pengaturan" muncul di sidebar
- [ ] Halaman Pengaturan bisa dibuka
- [ ] Bisa ubah jam masuk normal
- [ ] Bisa ubah toleransi keterlambatan
- [ ] Bisa ubah radius GPS
- [ ] Notifikasi "Pengaturan berhasil disimpan!" muncul

### Guru:
- [ ] Info jam masuk muncul di dashboard guru
- [ ] Presensi sebelum jam masuk → Status "Hadir" (hijau)
- [ ] Presensi setelah jam masuk → Status "Hadir (Terlambat)" (kuning)
- [ ] Badge "TERLAMBAT" muncul
- [ ] Keterangan "Terlambat X menit" muncul

---

## ⚠️ CATATAN PENTING

1. **Perubahan pengaturan langsung berlaku** untuk presensi berikutnya
2. **Presensi yang sudah tercatat tidak berubah** (tidak retroaktif)
3. **Radius GPS terlalu kecil** dapat menyebabkan guru kesulitan presensi
4. **Toleransi terlambat** hanya untuk membedakan "Terlambat" vs "Terlambat Parah"
5. **Status terlambat tetap dihitung sebagai hadir** (bukan alpha)

---

## 🎉 FITUR SELESAI!

Sistem sekarang bisa:
✅ Deteksi guru yang terlambat otomatis
✅ Admin bisa ubah jam masuk normal
✅ Admin bisa ubah toleransi keterlambatan
✅ Tampilan visual yang jelas (badge kuning)
✅ Keterangan berapa menit terlambat
✅ Guru bisa lihat jam masuk normal

**Siap digunakan!** 🚀
