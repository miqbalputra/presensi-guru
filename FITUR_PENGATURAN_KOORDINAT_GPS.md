# FITUR PENGATURAN KOORDINAT GPS SEKOLAH ✅

## 🎯 FITUR YANG DITAMBAHKAN

### 1. **Input Koordinat GPS Sekolah (Admin)**
- Admin bisa mengubah koordinat Latitude sekolah
- Admin bisa mengubah koordinat Longitude sekolah
- Admin bisa mengubah nama sekolah
- Perubahan langsung aktif untuk semua user

### 2. **Panduan Cara Isi Koordinat**
- Panduan lengkap cara mendapatkan koordinat dari Google Maps
- Validasi format koordinat (Latitude: -90 sampai 90, Longitude: -180 sampai 180)
- Link langsung ke Google Maps untuk cek lokasi
- Tombol "Lihat Panduan" yang bisa dibuka/tutup

### 3. **Integrasi dengan Sistem Presensi**
- Koordinat dari settings digunakan untuk validasi GPS presensi
- Tidak perlu hardcode koordinat di kode lagi
- Radius GPS juga bisa diubah dari pengaturan

---

## 📋 DATABASE CHANGES

### Update Tabel `settings`:
```sql
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('sekolah_latitude', '-5.1477', 'Koordinat Latitude sekolah', 'system'),
    ('sekolah_longitude', '119.4327', 'Koordinat Longitude sekolah', 'system'),
    ('sekolah_nama', 'Sekolah', 'Nama sekolah', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);
```

---

## 🔧 FILE YANG DIUBAH

### 1. **`database_settings.sql`**
- Tambah 3 setting baru: sekolah_latitude, sekolah_longitude, sekolah_nama

### 2. **`api/settings.php`**
- Tambah validasi untuk koordinat latitude (-90 sampai 90)
- Tambah validasi untuk koordinat longitude (-180 sampai 180)
- Tambah sekolah_nama ke allowed keys

### 3. **`src/components/admin/Pengaturan.jsx`**
- Tambah section "Lokasi Sekolah" dengan icon School
- Tambah input Nama Sekolah
- Tambah input Latitude dengan validasi
- Tambah input Longitude dengan validasi
- Tambah panduan cara isi koordinat (toggle show/hide)
- Tambah link "Lihat di Google Maps" untuk cek lokasi

### 4. **`src/components/guru/GuruHome.jsx`**
- Update `handleHadir()` untuk gunakan koordinat dari settings
- Update `handlePulang()` untuk gunakan koordinat dari settings
- Update kondisi tombol pulang untuk include `hadir_terlambat`
- Tidak lagi hardcode koordinat dari `SCHOOL_LOCATION`

### 5. **`dist/`**
- Build hasil (siap upload)

---

## 📦 CARA INSTALL

### Step 1: Update Database
Buka phpMyAdmin, pilih database `sobataja2_geopresence`, jalankan:
```sql
-- Tambah setting koordinat sekolah
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('sekolah_latitude', '-5.1477', 'Koordinat Latitude sekolah', 'system'),
    ('sekolah_longitude', '119.4327', 'Koordinat Longitude sekolah', 'system'),
    ('sekolah_nama', 'Sekolah', 'Nama sekolah', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- Cek data
SELECT * FROM settings;
```

### Step 2: Upload File API
Upload file ini ke cPanel (overwrite yang lama):
- `api/settings.php` → folder `api/`

### Step 3: Upload Frontend
Upload folder `dist/` ke cPanel (overwrite semua file lama):
- `dist/index.html` → root website
- `dist/assets/` → folder assets

---

## 🎮 CARA MENGGUNAKAN

### Untuk Admin:

#### 1. Buka Halaman Pengaturan
1. Login sebagai admin
2. Klik menu **Pengaturan** di sidebar
3. Scroll ke section **Lokasi Sekolah**

#### 2. Lihat Panduan
1. Klik tombol **"Lihat Panduan"** di kanan atas section
2. Baca panduan cara mendapatkan koordinat dari Google Maps

#### 3. Dapatkan Koordinat dari Google Maps
1. Buka [Google Maps](https://www.google.com/maps)
2. Cari lokasi sekolah Anda
3. Klik kanan pada titik lokasi sekolah
4. Klik angka koordinat yang muncul (contoh: -5.1477, 119.4327)
5. Koordinat akan otomatis tercopy

#### 4. Input Koordinat
1. **Nama Sekolah**: Isi nama sekolah (contoh: "SDN 1 Makassar")
2. **Latitude**: Paste koordinat latitude (contoh: -5.1477)
3. **Longitude**: Paste koordinat longitude (contoh: 119.4327)
4. Klik tombol **Simpan** di setiap kolom

#### 5. Cek Lokasi
1. Setelah simpan, klik link **"Lihat di Google Maps"**
2. Pastikan lokasi yang muncul sudah benar
3. Jika salah, ulangi langkah 3-4

---

## 📍 PANDUAN LENGKAP KOORDINAT GPS

### Format Koordinat:
- **Latitude (Garis Lintang)**: -90 sampai 90
  - Angka negatif (-) = Belahan bumi selatan
  - Angka positif (+) = Belahan bumi utara
  - Contoh: -5.1477 (Makassar, Indonesia)

- **Longitude (Garis Bujur)**: -180 sampai 180
  - Angka negatif (-) = Belahan bumi barat
  - Angka positif (+) = Belahan bumi timur
  - Contoh: 119.4327 (Makassar, Indonesia)

### Cara Mendapatkan Koordinat:

**Metode 1: Google Maps (Desktop)**
1. Buka https://www.google.com/maps
2. Cari lokasi sekolah
3. Klik kanan pada titik lokasi
4. Klik angka koordinat (akan otomatis tercopy)
5. Paste di kolom Latitude dan Longitude

**Metode 2: Google Maps (Mobile)**
1. Buka aplikasi Google Maps
2. Tekan dan tahan pada lokasi sekolah
3. Pin merah akan muncul
4. Geser panel bawah ke atas
5. Koordinat akan muncul di bawah nama lokasi
6. Tap koordinat untuk copy

**Metode 3: GPS Coordinates (Website)**
1. Buka https://www.gps-coordinates.net/
2. Cari lokasi sekolah
3. Koordinat akan muncul otomatis
4. Copy Latitude dan Longitude

### Contoh Koordinat Kota-kota di Indonesia:
- **Jakarta**: -6.2088, 106.8456
- **Surabaya**: -7.2575, 112.7521
- **Bandung**: -6.9175, 107.6191
- **Medan**: 3.5952, 98.6722
- **Makassar**: -5.1477, 119.4327
- **Yogyakarta**: -7.7956, 110.3695

---

## 🔍 TESTING CHECKLIST

### Database:
- [ ] Setting `sekolah_latitude` ada di tabel settings
- [ ] Setting `sekolah_longitude` ada di tabel settings
- [ ] Setting `sekolah_nama` ada di tabel settings
- [ ] Query `SELECT * FROM settings WHERE setting_key LIKE 'sekolah%'` menampilkan 3 baris

### API:
- [ ] Test API: `https://kelolasekolah.web.id/api/settings.php`
- [ ] Response include: `sekolah_latitude`, `sekolah_longitude`, `sekolah_nama`

### Admin:
- [ ] Section "Lokasi Sekolah" muncul di halaman Pengaturan
- [ ] Tombol "Lihat Panduan" bisa dibuka/tutup
- [ ] Panduan lengkap muncul saat diklik
- [ ] Input Nama Sekolah bisa diisi dan disimpan
- [ ] Input Latitude bisa diisi dan disimpan
- [ ] Input Longitude bisa diisi dan disimpan
- [ ] Validasi koordinat berfungsi (error jika di luar range)
- [ ] Link "Lihat di Google Maps" membuka lokasi yang benar
- [ ] Notifikasi "Pengaturan berhasil disimpan!" muncul

### Guru:
- [ ] Presensi hadir menggunakan koordinat dari settings (bukan hardcode)
- [ ] Presensi pulang menggunakan koordinat dari settings
- [ ] Validasi GPS menggunakan radius dari settings
- [ ] Tombol pulang muncul untuk status `hadir` dan `hadir_terlambat`

---

## 📊 CONTOH SKENARIO

### Skenario 1: Sekolah Pindah Lokasi
**Masalah**: Sekolah pindah ke gedung baru, koordinat GPS berubah

**Solusi**:
1. Admin login
2. Buka menu Pengaturan
3. Klik "Lihat Panduan"
4. Ikuti panduan untuk dapatkan koordinat baru dari Google Maps
5. Update Latitude dan Longitude
6. Klik Simpan
7. Selesai! Semua guru langsung pakai koordinat baru

### Skenario 2: Koordinat Salah
**Masalah**: Guru tidak bisa presensi karena koordinat salah

**Solusi**:
1. Admin cek koordinat di Pengaturan
2. Klik link "Lihat di Google Maps"
3. Jika lokasi salah, dapatkan koordinat yang benar
4. Update Latitude dan Longitude
5. Klik Simpan
6. Guru bisa presensi lagi

### Skenario 3: Radius Terlalu Kecil
**Masalah**: Guru di pinggir sekolah tidak bisa presensi

**Solusi**:
1. Admin buka Pengaturan
2. Ubah Radius GPS dari 500m menjadi 1000m
3. Klik Simpan
4. Guru bisa presensi dari jarak lebih jauh

---

## ⚠️ CATATAN PENTING

1. **Koordinat harus akurat** - Gunakan Google Maps untuk hasil terbaik
2. **Perubahan langsung aktif** - Tidak perlu restart aplikasi
3. **Validasi otomatis** - Sistem akan tolak koordinat yang tidak valid
4. **Link Google Maps** - Gunakan untuk cek apakah koordinat sudah benar
5. **Radius GPS** - Sesuaikan dengan luas area sekolah
6. **Testing mode** - Saat ini GPS validation masih dinonaktifkan (TESTING_MODE = true)
7. **Produksi** - Ubah TESTING_MODE = false untuk aktifkan validasi GPS

---

## 🎉 FITUR SELESAI!

Sistem sekarang bisa:
✅ Admin ubah koordinat GPS sekolah
✅ Admin ubah nama sekolah
✅ Admin ubah radius GPS
✅ Panduan lengkap cara isi koordinat
✅ Link langsung ke Google Maps
✅ Validasi format koordinat
✅ Perubahan langsung aktif untuk semua user
✅ Tidak perlu hardcode koordinat di kode

**Siap digunakan!** 🚀
