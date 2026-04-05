# 📋 FITUR JADWAL PIKET GURU

## 📌 DESKRIPSI
Fitur untuk mengelola jadwal piket guru dengan validasi waktu kehadiran khusus untuk guru yang bertugas piket.

---

## ✨ FITUR UTAMA

### 1. **Manajemen Jadwal Piket (Admin)**
- Admin dapat menambah, edit, dan hapus jadwal piket
- Setiap guru dapat dijadwalkan piket di hari tertentu (Senin-Minggu)
- Jam piket dapat diatur per jadwal (default: 07:00 WIB)
- Status aktif/nonaktif untuk setiap jadwal

### 2. **Validasi Piket (Guru)**
- Guru yang piket akan melihat notifikasi jadwal piket di dashboard
- Jika guru piket terlambat hadir, tetap tercatat HADIR
- Notifikasi khusus muncul jika terlambat piket: "⚠️ Anda terlambat hadir piket X menit. Jam piket: XX:XX WIB"
- Notifikasi berwarna orange (warning) untuk membedakan dari error

### 3. **Informasi Real-time**
- Dashboard guru menampilkan info piket hari ini
- Badge biru: "📋 Anda memiliki jadwal piket hari ini - Hadir maksimal: XX:XX WIB"
- Sistem otomatis cek jadwal piket saat login

---

## 🗄️ DATABASE

### Tabel: `jadwal_piket`
```sql
CREATE TABLE jadwal_piket (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nama_guru VARCHAR(255) NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_piket TIME DEFAULT '07:00:00',
    keterangan TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_hari (user_id, hari)
);
```

### Setting: `jam_piket_default`
- Default: `07:00`
- Deskripsi: Jam piket default untuk semua hari (format HH:MM)

---

## 📁 FILE YANG DIUBAH/DITAMBAH

### Backend (API)
1. **`api/jadwal_piket.php`** ✅ BARU
   - CRUD operations untuk jadwal piket
   - Endpoint GET today untuk cek jadwal hari ini
   - Validasi hari dan jam piket
   - Auth: Admin untuk write, Admin+Guru untuk read

### Frontend (React)
1. **`src/components/admin/JadwalPiket.jsx`** ✅ BARU
   - Halaman manajemen jadwal piket
   - Form tambah/edit jadwal
   - Tabel jadwal per hari
   - Filter per hari

2. **`src/components/guru/GuruHome.jsx`** ✅ UPDATED
   - Cek jadwal piket hari ini saat load
   - Tampilkan badge info piket
   - Validasi terlambat piket saat presensi
   - Notifikasi khusus jika terlambat piket

3. **`src/services/api.js`** ✅ UPDATED
   - Tambah `jadwalPiketAPI` dengan methods:
     - `getAll(filters)` - Get semua jadwal
     - `getToday()` - Get jadwal hari ini
     - `create(jadwalData)` - Tambah jadwal
     - `update(jadwalData)` - Update jadwal
     - `delete(id)` - Hapus jadwal

4. **`src/components/admin/Sidebar.jsx`** ✅ UPDATED
   - Tambah menu "Jadwal Piket"

5. **`src/pages/AdminDashboard.jsx`** ✅ UPDATED
   - Tambah route untuk JadwalPiket component

### Database
1. **`database_jadwal_piket.sql`** ✅ BARU
   - SQL untuk create table
   - SQL untuk insert setting default
   - Contoh data dan query

---

## 🎯 CARA KERJA

### Flow Admin:
1. Admin login → Dashboard
2. Klik menu "Jadwal Piket" di sidebar
3. Pilih hari (Senin-Minggu)
4. Klik "Tambah Jadwal Piket"
5. Pilih guru, set jam piket, isi keterangan (opsional)
6. Klik "Simpan"
7. Jadwal piket tersimpan dan aktif

### Flow Guru:
1. Guru login → Dashboard
2. Jika ada jadwal piket hari ini:
   - Badge biru muncul: "📋 Anda memiliki jadwal piket hari ini - Hadir maksimal: 07:00 WIB"
3. Guru klik "HADIR"
4. Sistem cek:
   - Apakah terlambat dari jam masuk normal (07:20)?
   - Apakah terlambat dari jam piket (07:00)?
5. Jika terlambat piket:
   - Status tetap: `hadir` atau `hadir_terlambat` (sesuai jam masuk normal)
   - Notifikasi orange: "⚠️ Anda terlambat hadir piket 15 menit. Jam piket: 07:00 WIB"
6. Presensi tersimpan

---

## 🔍 LOGIKA VALIDASI

### Prioritas Validasi:
1. **Validasi Jam Masuk Normal** (07:20 WIB)
   - Jika > 07:20 → Status: `hadir_terlambat`
   - Keterangan: "Terlambat X menit"

2. **Validasi Jam Piket** (07:00 WIB)
   - Jika guru piket hari ini DAN > jam piket
   - Status tetap sama (tidak berubah)
   - Tambah notifikasi warning piket

### Contoh Skenario:

**Skenario 1: Guru piket hadir jam 06:50**
- ✅ Tidak terlambat jam masuk
- ✅ Tidak terlambat piket
- Status: `hadir`
- Notifikasi: "Presensi hadir berhasil disimpan!"

**Skenario 2: Guru piket hadir jam 07:10**
- ✅ Tidak terlambat jam masuk (masih < 07:20)
- ⚠️ Terlambat piket 10 menit
- Status: `hadir`
- Notifikasi: "Presensi hadir berhasil disimpan! ⚠️ Anda terlambat hadir piket 10 menit. Jam piket: 07:00 WIB"

**Skenario 3: Guru piket hadir jam 07:30**
- ❌ Terlambat jam masuk 10 menit
- ⚠️ Terlambat piket 30 menit
- Status: `hadir_terlambat`
- Keterangan: "Terlambat 10 menit"
- Notifikasi: "Presensi hadir berhasil disimpan! (Terlambat 10 menit) ⚠️ Anda terlambat hadir piket 30 menit. Jam piket: 07:00 WIB"

**Skenario 4: Guru BUKAN piket hadir jam 07:30**
- ❌ Terlambat jam masuk 10 menit
- Status: `hadir_terlambat`
- Keterangan: "Terlambat 10 menit"
- Notifikasi: "Presensi hadir berhasil disimpan! (Terlambat 10 menit)"

---

## 📊 TAMPILAN UI

### Admin - Halaman Jadwal Piket:
```
┌─────────────────────────────────────────────┐
│ 📋 Jadwal Piket Guru                        │
├─────────────────────────────────────────────┤
│ Filter Hari: [Senin ▼]  [+ Tambah Jadwal]  │
├─────────────────────────────────────────────┤
│ Nama Guru    │ Hari   │ Jam    │ Aksi      │
├──────────────┼────────┼────────┼───────────┤
│ Budi Santoso │ Senin  │ 07:00  │ Edit Hapus│
│ Siti Aminah  │ Senin  │ 07:00  │ Edit Hapus│
└─────────────────────────────────────────────┘
```

### Guru - Dashboard dengan Piket:
```
┌─────────────────────────────────────────────┐
│ Kamis, 26 Desember 2025                     │
│ Selamat datang, Budi Santoso                │
│ Jam masuk normal: 07:20 WIB | Toleransi: 15│
│ 📋 Anda memiliki jadwal piket hari ini -    │
│    Hadir maksimal: 07:00 WIB                │
└─────────────────────────────────────────────┘
```

### Notifikasi Terlambat Piket:
```
┌─────────────────────────────────────────────┐
│ ⚠️ Presensi hadir berhasil disimpan!        │
│    (Terlambat 10 menit)                     │
│                                             │
│ ⚠️ Anda terlambat hadir piket 30 menit.     │
│    Jam piket: 07:00 WIB                     │
└─────────────────────────────────────────────┘
```

---

## 🚀 CARA UPLOAD KE CPANEL

### File yang perlu diupload:

1. **Backend (API):**
   ```
   api/jadwal_piket.php
   ```

2. **Frontend (Build):**
   ```
   dist/index.html
   dist/assets/*
   ```

3. **Database:**
   - Jalankan SQL dari `database_jadwal_piket.sql` di phpMyAdmin

### Langkah Upload:

1. **Upload API:**
   - Buka File Manager cPanel
   - Masuk ke folder `public_html/api/`
   - Upload file `jadwal_piket.php`

2. **Upload Frontend:**
   - Masuk ke folder `public_html/`
   - Upload `dist/index.html` (replace yang lama)
   - Masuk ke folder `public_html/assets/`
   - Upload semua file dari `dist/assets/` (replace yang lama)

3. **Update Database:**
   - Buka phpMyAdmin
   - Pilih database `sobataja2_geopresence`
   - Klik tab "SQL"
   - Copy-paste isi file `database_jadwal_piket.sql`
   - Klik "Go"

4. **Verifikasi:**
   - Login sebagai admin
   - Cek menu "Jadwal Piket" muncul
   - Coba tambah jadwal piket
   - Login sebagai guru yang dijadwalkan piket
   - Cek badge piket muncul di dashboard

---

## 🧪 TESTING

### Test Case 1: Admin Tambah Jadwal
1. Login sebagai admin
2. Klik menu "Jadwal Piket"
3. Klik "Tambah Jadwal Piket"
4. Pilih guru, hari Senin, jam 07:00
5. Klik "Simpan"
6. ✅ Jadwal muncul di tabel

### Test Case 2: Guru Piket Tepat Waktu
1. Login sebagai guru yang piket hari ini
2. ✅ Badge piket muncul di dashboard
3. Klik "HADIR" sebelum jam piket
4. ✅ Status: hadir
5. ✅ Notifikasi: "Presensi hadir berhasil disimpan!"

### Test Case 3: Guru Piket Terlambat
1. Login sebagai guru yang piket hari ini
2. ✅ Badge piket muncul di dashboard
3. Klik "HADIR" setelah jam piket
4. ✅ Status: hadir atau hadir_terlambat (tergantung jam masuk normal)
5. ✅ Notifikasi orange dengan warning piket

### Test Case 4: Guru Bukan Piket
1. Login sebagai guru yang TIDAK piket hari ini
2. ✅ Badge piket TIDAK muncul
3. Klik "HADIR"
4. ✅ Validasi normal (tidak ada warning piket)

---

## 📝 CATATAN PENTING

1. **Satu Guru, Satu Hari, Satu Jadwal**
   - Constraint UNIQUE: `(user_id, hari)`
   - Guru tidak bisa piket 2x di hari yang sama

2. **Status Tetap Hadir**
   - Guru yang terlambat piket tetap status HADIR
   - Hanya muncul notifikasi warning
   - Tidak mengubah status presensi

3. **Jam Piket vs Jam Masuk Normal**
   - Jam piket (default 07:00) untuk guru piket
   - Jam masuk normal (default 07:20) untuk semua guru
   - Validasi keduanya berjalan independen

4. **Mode Testing**
   - Mode testing tidak mempengaruhi validasi piket
   - Validasi piket tetap berjalan di mode testing

5. **Hari Libur**
   - Jika hari libur, tidak ada validasi piket
   - Badge piket tidak muncul di hari libur

---

## 🎉 FITUR SELESAI!

Fitur Jadwal Piket Guru sudah lengkap dan siap digunakan:
- ✅ Admin dapat kelola jadwal piket
- ✅ Guru dapat lihat jadwal piket hari ini
- ✅ Validasi terlambat piket dengan notifikasi khusus
- ✅ Status tetap hadir meskipun terlambat piket
- ✅ UI informatif dan user-friendly

---

**Dibuat:** 26 Desember 2025  
**Status:** ✅ SELESAI & SIAP UPLOAD
