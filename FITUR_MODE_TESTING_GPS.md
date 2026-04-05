# FITUR MODE TESTING GPS ✅

## 🎯 FITUR YANG DITAMBAHKAN

### 1. **Toggle Mode Testing di Pengaturan** 🧪
- Admin bisa aktifkan/nonaktifkan mode testing dengan 1 klik
- Toggle switch yang jelas (orange = testing, red = produksi)
- Status real-time: "AKTIF (Testing Mode)" atau "NONAKTIF (Produksi)"

### 2. **Validasi GPS Dinamis** 📍
- **Mode Testing AKTIF (1)**: Validasi GPS dinonaktifkan
  - Guru bisa presensi hadir dari lokasi mana saja
  - Cocok untuk testing sistem atau demo
  - Tidak perlu berada di radius sekolah
  
- **Mode Testing NONAKTIF (0)**: Validasi GPS aktif
  - Guru HARUS berada dalam radius sekolah
  - Validasi koordinat GPS berjalan normal
  - Sistem produksi sebenarnya

### 3. **Info Mode Testing di Dashboard Guru** 🔔
- Badge orange muncul jika mode testing aktif
- Guru tahu bahwa GPS validation sedang nonaktif
- Transparansi untuk user

### 4. **Aturan Presensi** 📋
- **Presensi HADIR**: Tergantung mode testing
  - Testing aktif → Tidak perlu validasi GPS
  - Testing nonaktif → Harus dalam radius sekolah
  
- **Presensi IZIN & SAKIT**: Tetap tidak perlu GPS (seperti sebelumnya)
  - Tidak terpengaruh mode testing
  - Bisa diisi dari mana saja

---

## 📋 DATABASE CHANGES

### Update Tabel `settings`:
```sql
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('mode_testing', '1', 'Mode testing GPS (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);
```

**Nilai:**
- `1` = Mode testing AKTIF (GPS validation nonaktif)
- `0` = Mode testing NONAKTIF (GPS validation aktif)

---

## 🔧 FILE YANG DIUBAH

### 1. **`database_settings.sql`**
- Tambah setting `mode_testing` dengan default value `1` (aktif)

### 2. **`api/settings.php`**
- Tambah `mode_testing` ke allowed keys
- Tambah validasi: hanya boleh 0 atau 1

### 3. **`src/components/admin/Pengaturan.jsx`**
- Tambah section "Mode Testing GPS" dengan icon TestTube
- Tambah toggle switch (orange/red)
- Tambah warning box untuk mode testing aktif
- Tambah info box untuk mode produksi aktif
- Auto-save saat toggle diklik

### 4. **`src/components/guru/GuruHome.jsx`**
- Update `handleHadir()`: gunakan `settings.mode_testing` (bukan hardcoded)
- Update `handlePulang()`: gunakan `settings.mode_testing`
- Tambah badge orange di dashboard jika mode testing aktif
- Validasi GPS hanya jalan jika mode testing nonaktif

### 5. **`dist/`**
- Build hasil (siap upload)

---

## 📦 CARA INSTALL

### Step 1: Update Database
Buka phpMyAdmin, pilih database `sobataja2_geopresence`, jalankan:
```sql
-- Tambah setting mode testing
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('mode_testing', '1', 'Mode testing GPS (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- Cek data
SELECT * FROM settings WHERE setting_key = 'mode_testing';
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

#### 1. Aktifkan Mode Testing (untuk Testing/Demo)
1. Login sebagai admin
2. Klik menu **Pengaturan** di sidebar
3. Scroll ke section **Mode Testing GPS**
4. Klik toggle switch (akan berubah jadi orange)
5. Status berubah: **"AKTIF (Testing Mode)"**
6. Selesai! Guru bisa presensi dari mana saja

#### 2. Nonaktifkan Mode Testing (untuk Produksi)
1. Login sebagai admin
2. Klik menu **Pengaturan** di sidebar
3. Scroll ke section **Mode Testing GPS**
4. Klik toggle switch (akan berubah jadi red)
5. Status berubah: **"NONAKTIF (Produksi)"**
6. Selesai! Validasi GPS aktif, guru harus di sekolah

### Untuk Guru:

#### Mode Testing AKTIF:
1. Login sebagai guru
2. Lihat badge orange: "🧪 Mode Testing Aktif"
3. Klik tombol **HADIR**
4. Presensi berhasil tanpa validasi GPS
5. Bisa dari rumah, kantor, atau mana saja

#### Mode Testing NONAKTIF:
1. Login sebagai guru
2. Tidak ada badge orange
3. Klik tombol **HADIR**
4. Sistem cek lokasi GPS
5. Jika di luar radius → Error: "Anda berada di luar jangkauan sekolah"
6. Jika di dalam radius → Presensi berhasil

---

## 📊 PERBANDINGAN MODE

### Mode Testing AKTIF (1) 🧪
| Fitur | Status |
|-------|--------|
| Validasi GPS Hadir | ❌ Nonaktif |
| Presensi dari mana saja | ✅ Bisa |
| Cocok untuk | Testing, Demo, Development |
| Badge di dashboard guru | ✅ Muncul (orange) |
| Validasi Izin/Sakit | ❌ Tetap tidak perlu GPS |

### Mode Testing NONAKTIF (0) 🏫
| Fitur | Status |
|-------|--------|
| Validasi GPS Hadir | ✅ Aktif |
| Presensi dari mana saja | ❌ Harus di sekolah |
| Cocok untuk | Produksi, Penggunaan sebenarnya |
| Badge di dashboard guru | ❌ Tidak muncul |
| Validasi Izin/Sakit | ❌ Tetap tidak perlu GPS |

---

## 🔍 TESTING CHECKLIST

### Database:
- [ ] Setting `mode_testing` ada di tabel settings
- [ ] Default value = `1` (aktif)
- [ ] Query `SELECT * FROM settings WHERE setting_key = 'mode_testing'` menampilkan 1 baris

### API:
- [ ] Test API: `https://kelolasekolah.web.id/api/settings.php`
- [ ] Response include: `"mode_testing":"1"` atau `"mode_testing":"0"`

### Admin:
- [ ] Section "Mode Testing GPS" muncul di halaman Pengaturan
- [ ] Toggle switch bisa diklik
- [ ] Warna berubah: orange (aktif) / red (nonaktif)
- [ ] Status text berubah: "AKTIF (Testing Mode)" / "NONAKTIF (Produksi)"
- [ ] Warning box muncul sesuai mode
- [ ] Notifikasi "Pengaturan berhasil disimpan!" muncul

### Guru (Mode Testing AKTIF):
- [ ] Badge orange "🧪 Mode Testing Aktif" muncul di dashboard
- [ ] Presensi hadir berhasil dari lokasi mana saja
- [ ] Tidak ada error "di luar jangkauan sekolah"
- [ ] Presensi izin/sakit tetap bisa (tidak terpengaruh)

### Guru (Mode Testing NONAKTIF):
- [ ] Badge orange TIDAK muncul di dashboard
- [ ] Presensi hadir dari luar radius → Error
- [ ] Presensi hadir dari dalam radius → Berhasil
- [ ] Presensi izin/sakit tetap bisa (tidak terpengaruh)

---

## 📝 CONTOH SKENARIO

### Skenario 1: Testing Sistem Baru
**Situasi**: Admin mau testing fitur baru tanpa harus ke sekolah

**Langkah**:
1. Admin aktifkan mode testing
2. Admin coba presensi dari rumah
3. Presensi berhasil tanpa error
4. Testing selesai, nonaktifkan mode testing

### Skenario 2: Demo ke Kepala Sekolah
**Situasi**: Mau demo sistem ke kepala sekolah di ruang rapat

**Langkah**:
1. Admin aktifkan mode testing
2. Demo presensi di ruang rapat (bukan di lokasi sekolah)
3. Semua fitur berjalan lancar
4. Setelah demo, nonaktifkan mode testing

### Skenario 3: Produksi (Penggunaan Sebenarnya)
**Situasi**: Sistem sudah siap dipakai guru setiap hari

**Langkah**:
1. Admin nonaktifkan mode testing
2. Guru harus berada di sekolah untuk presensi hadir
3. Validasi GPS aktif
4. Sistem berjalan sesuai aturan sebenarnya

### Skenario 4: Guru Lupa Presensi di Sekolah
**Situasi**: Guru sudah pulang, lupa presensi, mau presensi dari rumah

**Dengan Mode Testing AKTIF**:
- Guru bisa presensi dari rumah
- Presensi berhasil (tapi tidak sesuai aturan)

**Dengan Mode Testing NONAKTIF**:
- Guru tidak bisa presensi dari rumah
- Error: "Anda berada di luar jangkauan sekolah"
- Guru harus hubungi admin untuk edit manual

---

## ⚠️ CATATAN PENTING

1. **Default Mode Testing = AKTIF (1)**
   - Saat pertama install, mode testing aktif
   - Cocok untuk testing awal
   - Jangan lupa nonaktifkan saat produksi

2. **Presensi Izin & Sakit Tidak Terpengaruh**
   - Tetap tidak perlu validasi GPS
   - Bisa diisi dari mana saja
   - Mode testing hanya untuk presensi HADIR

3. **Perubahan Langsung Aktif**
   - Toggle mode testing langsung berlaku
   - Tidak perlu restart aplikasi
   - Guru langsung terpengaruh

4. **Badge di Dashboard Guru**
   - Muncul jika mode testing aktif
   - Transparansi untuk user
   - Guru tahu sistem sedang testing

5. **Rekomendasi Penggunaan**
   - Testing/Demo: Mode testing AKTIF
   - Produksi: Mode testing NONAKTIF
   - Jangan lupa switch ke produksi saat sudah siap

---

## 🎉 FITUR SELESAI!

Sistem sekarang bisa:
✅ Admin toggle mode testing dengan 1 klik
✅ Validasi GPS aktif/nonaktif sesuai mode
✅ Badge info mode testing di dashboard guru
✅ Presensi izin/sakit tetap tidak perlu GPS
✅ Fleksibel untuk testing dan produksi
✅ Perubahan langsung aktif tanpa restart

**Siap digunakan!** 🚀

---

## 🔄 WORKFLOW LENGKAP

### Fase Testing:
1. Admin aktifkan mode testing
2. Testing semua fitur dari mana saja
3. Perbaiki bug jika ada
4. Testing ulang sampai sempurna

### Fase Produksi:
1. Admin nonaktifkan mode testing
2. Validasi GPS aktif
3. Guru harus di sekolah untuk presensi hadir
4. Sistem berjalan sesuai aturan

### Fase Maintenance:
1. Jika ada bug, aktifkan mode testing
2. Perbaiki bug
3. Testing ulang
4. Nonaktifkan mode testing lagi

**Perfect!** 🎯
