# ✅ VERIFIKASI UPLOAD - CHECKLIST

Gunakan checklist ini untuk memastikan semua file sudah terupload dengan benar.

---

## 1️⃣ VERIFIKASI BACKEND API

### Test Endpoint API

Buka URL ini di browser:
```
https://sistemflow.biz.id/api/holidays.php?check=2025-12-14
```

**Hasil yang diharapkan**:
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-14",
    "isHoliday": false,
    "isWeekend": true,
    "isWorkday": false,
    "holidayName": null,
    "holidayType": null,
    "dayName": "Sabtu"
  }
}
```

**Status**: 
- [ ] ✅ API berfungsi dengan benar
- [ ] ❌ Error 404 (file belum diupload)
- [ ] ❌ Error 500 (ada masalah di code)

---

## 2️⃣ VERIFIKASI DATABASE

### Cek Tabel Holidays

Login phpMyAdmin, jalankan query:
```sql
SELECT COUNT(*) as total FROM holidays;
```

**Hasil yang diharapkan**: `total = 15`

### Cek Data Hari Libur

```sql
SELECT * FROM holidays ORDER BY tanggal LIMIT 5;
```

**Hasil yang diharapkan**: Muncul 5 data hari libur 2025

**Status**:
- [ ] ✅ Tabel berhasil dibuat
- [ ] ✅ Data berhasil diinsert (15 baris)
- [ ] ❌ Tabel tidak ada (jalankan ulang SQL)
- [ ] ❌ Data kosong (jalankan ulang SQL)

---

## 3️⃣ VERIFIKASI FRONTEND

### Cek File di cPanel

Login cPanel → File Manager → `public_html`

**File yang harus ada**:
- [ ] `index.html` (ukuran ~479 bytes, tanggal hari ini)
- [ ] Folder `assets/` (berisi 5 file JS/CSS)

**File di dalam `assets/`**:
- [ ] `html2canvas.esm-CBrSDip1.js` (~202 KB)
- [ ] `index-BGLwMAXQ.css` (~20 KB)
- [ ] `index-GQUf19aP.js` (~1.5 MB)
- [ ] `index.es-BmAkHNZ-.js` (~150 KB)
- [ ] `purify.es-C_uT9hQ1.js` (~22 KB)

---

## 4️⃣ TEST APLIKASI

### Test 1: Login
1. Buka: `https://sistemflow.biz.id`
2. Login sebagai guru: `guru` / `guru123`
3. **Status**: 
   - [ ] ✅ Berhasil login
   - [ ] ❌ Gagal login

### Test 2: Tampilan Hari Sabtu (Hari Ini)

Setelah login, cek tampilan:

**Yang harus muncul**:
- [ ] ✅ Tanggal: "Sabtu, 14 Desember 2025"
- [ ] ✅ Kotak biru dengan icon ℹ️
- [ ] ✅ Pesan: "Hari Sabtu adalah hari libur"
- [ ] ✅ Pesan: "Tidak perlu melakukan presensi hari ini"
- [ ] ✅ Tombol HADIR, IZIN, SAKIT TIDAK muncul

**Yang TIDAK boleh muncul**:
- [ ] ❌ Tombol HADIR (jika muncul = gagal)
- [ ] ❌ Tombol IZIN (jika muncul = gagal)
- [ ] ❌ Tombol SAKIT (jika muncul = gagal)

### Test 3: Tampilan Hari Kerja (Senin-Jumat)

Ubah tanggal sistem komputer ke hari Senin (16 Des 2025), atau tunggu hari Senin:

**Yang harus muncul**:
- [ ] ✅ Tanggal: "Senin, 16 Desember 2025"
- [ ] ✅ Tombol HADIR (hijau)
- [ ] ✅ Tombol IZIN (kuning)
- [ ] ✅ Tombol SAKIT (merah)
- [ ] ✅ TIDAK ada pesan libur

### Test 4: Tampilan Hari Libur Nasional

Ubah tanggal sistem ke 25 Desember 2025:

**Yang harus muncul**:
- [ ] ✅ Tanggal: "Kamis, 25 Desember 2025"
- [ ] ✅ Kotak kuning dengan icon ⚠️
- [ ] ✅ Pesan: "Hari Libur: Hari Raya Natal"
- [ ] ✅ Pesan: "Tidak perlu melakukan presensi hari ini"
- [ ] ✅ Tombol HADIR, IZIN, SAKIT TIDAK muncul

---

## 5️⃣ TEST BROWSER

### Clear Cache & Hard Refresh

Sebelum test, pastikan:
- [ ] ✅ Clear cache (Ctrl + Shift + Delete)
- [ ] ✅ Hard refresh (Ctrl + F5)
- [ ] ✅ Coba di browser lain (Chrome, Firefox, Edge)

---

## 📊 RINGKASAN VERIFIKASI

### Backend
- [ ] API holidays.php berfungsi
- [ ] Endpoint check date berfungsi
- [ ] Response JSON benar

### Database
- [ ] Tabel holidays ada
- [ ] Data 15 hari libur ada
- [ ] Query berfungsi

### Frontend
- [ ] File index.html terupdate
- [ ] Folder assets terupdate
- [ ] Ukuran file sesuai

### Fungsional
- [ ] Login berfungsi
- [ ] Hari Sabtu/Minggu terdeteksi libur
- [ ] Hari libur nasional terdeteksi
- [ ] Hari kerja tombol muncul
- [ ] Hari libur tombol tidak muncul

---

## ⚠️ TROUBLESHOOTING

### Jika API Error 404
```
Solusi:
1. Cek file api/holidays.php sudah diupload
2. Cek path: /home/username/api/holidays.php
3. Cek permission: 644
```

### Jika Tabel Tidak Ada
```
Solusi:
1. Login phpMyAdmin
2. Jalankan ulang database_hari_libur.sql
3. Verifikasi: SHOW TABLES;
```

### Jika Tombol Masih Muncul di Hari Sabtu
```
Solusi:
1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Coba browser lain
4. Cek console browser (F12) untuk error
```

### Jika Tampilan Tidak Berubah
```
Solusi:
1. Pastikan file index.html dan assets sudah diupload
2. Cek tanggal modified file (harus hari ini)
3. Hapus file lama sebelum upload baru
4. Clear cache + Hard refresh
```

---

## 🎯 HASIL AKHIR

Setelah semua checklist ✅, fitur hari libur sudah berfungsi dengan sempurna!

**Fitur yang berfungsi**:
- ✅ Senin-Jumat: Hari kerja (tombol presensi muncul)
- ✅ Sabtu-Minggu: Hari libur (pesan biru, tombol tidak muncul)
- ✅ Hari libur nasional: Hari libur (pesan kuning, tombol tidak muncul)
- ✅ Nama hari libur ditampilkan
- ✅ Auto-detect hari libur dari database

---

## 📞 LAPORAN

Setelah verifikasi, kabari dengan:

**Jika Berhasil**:
```
✅ Semua checklist sudah ✅
✅ Fitur hari libur berfungsi sempurna
✅ Screenshot tampilan (opsional)
```

**Jika Ada Masalah**:
```
❌ Checklist mana yang gagal
❌ Screenshot error
❌ Pesan error yang muncul
```

Selamat melakukan verifikasi! 🚀
