# 🚀 UPLOAD CHECKLIST - FITUR JADWAL PIKET

## ✅ FILE YANG PERLU DIUPLOAD

### 1. Backend (API)
- [ ] `api/jadwal_piket.php` → Upload ke `public_html/api/`

### 2. Frontend (Build)
- [ ] `dist/index.html` → Upload ke `public_html/` (replace)
- [ ] `dist/assets/index-Bakoofsx.js` → Upload ke `public_html/assets/` (replace)
- [ ] `dist/assets/index-CrD9FxCh.css` → Upload ke `public_html/assets/` (replace)
- [ ] File assets lainnya dari `dist/assets/` → Upload ke `public_html/assets/`

### 3. Database
- [ ] Jalankan SQL dari `database_jadwal_piket.sql` di phpMyAdmin

---

## 📋 LANGKAH UPLOAD

### Step 1: Upload API
```
1. Buka File Manager cPanel
2. Masuk ke: public_html/api/
3. Upload: api/jadwal_piket.php
4. Set permission: 644
```

### Step 2: Upload Frontend
```
1. Masuk ke: public_html/
2. Upload: dist/index.html (replace yang lama)
3. Masuk ke: public_html/assets/
4. Upload semua file dari dist/assets/ (replace yang lama)
```

### Step 3: Update Database
```
1. Buka phpMyAdmin di cPanel
2. Pilih database: sobataja2_geopresence
3. Klik tab "SQL"
4. Copy-paste isi file: database_jadwal_piket.sql
5. Klik "Go"
6. Tunggu sampai selesai
```

---

## 🧪 TESTING SETELAH UPLOAD

### Test 1: Cek Menu Admin
- [ ] Login sebagai admin (miputra / manduraga)
- [ ] Cek menu "Jadwal Piket" muncul di sidebar
- [ ] Klik menu "Jadwal Piket"
- [ ] Halaman terbuka tanpa error

### Test 2: Tambah Jadwal Piket
- [ ] Klik "Tambah Jadwal Piket"
- [ ] Pilih guru dari dropdown
- [ ] Pilih hari: Senin
- [ ] Set jam piket: 07:00
- [ ] Isi keterangan (opsional)
- [ ] Klik "Simpan"
- [ ] Jadwal muncul di tabel

### Test 3: Cek Dashboard Guru
- [ ] Login sebagai guru yang dijadwalkan piket
- [ ] Cek badge piket muncul: "📋 Anda memiliki jadwal piket hari ini"
- [ ] Badge menampilkan jam piket yang benar

### Test 4: Presensi Guru Piket
- [ ] Klik "HADIR" setelah jam piket
- [ ] Presensi berhasil tersimpan
- [ ] Notifikasi orange muncul dengan warning piket
- [ ] Status tetap "hadir" atau "hadir_terlambat"

---

## 🔍 TROUBLESHOOTING

### Error: "Failed to load jadwal piket"
**Solusi:**
1. Cek file `api/jadwal_piket.php` sudah terupload
2. Cek permission file: 644
3. Cek di browser console untuk error detail

### Error: "Table 'jadwal_piket' doesn't exist"
**Solusi:**
1. Buka phpMyAdmin
2. Jalankan SQL dari `database_jadwal_piket.sql`
3. Refresh halaman

### Menu "Jadwal Piket" tidak muncul
**Solusi:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Cek file `dist/index.html` dan `dist/assets/*` sudah terupload

### Badge piket tidak muncul di dashboard guru
**Solusi:**
1. Cek jadwal piket sudah ditambahkan untuk guru tersebut
2. Cek hari sesuai (Senin-Minggu)
3. Cek status jadwal: is_active = 1
4. Logout dan login ulang

---

## 📊 VERIFIKASI DATABASE

### Query untuk cek tabel:
```sql
SHOW TABLES LIKE 'jadwal_piket';
```

### Query untuk cek struktur:
```sql
DESC jadwal_piket;
```

### Query untuk cek data:
```sql
SELECT * FROM jadwal_piket ORDER BY hari, jam_piket;
```

### Query untuk cek setting:
```sql
SELECT * FROM settings WHERE setting_key = 'jam_piket_default';
```

---

## ✅ CHECKLIST FINAL

- [ ] API terupload dan berfungsi
- [ ] Frontend terupload dan tampil
- [ ] Database terupdate
- [ ] Menu admin muncul
- [ ] Bisa tambah jadwal piket
- [ ] Badge piket muncul di dashboard guru
- [ ] Notifikasi piket berfungsi
- [ ] Testing selesai tanpa error

---

## 🎉 SELESAI!

Jika semua checklist di atas sudah ✅, maka fitur Jadwal Piket sudah berhasil diupload dan siap digunakan!

**Domain:** https://kelolasekolah.web.id  
**Admin:** miputra / manduraga  
**Database:** sobataja2_geopresence

---

**Dibuat:** 26 Desember 2025  
**Status:** ✅ READY TO UPLOAD
