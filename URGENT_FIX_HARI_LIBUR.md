# URGENT FIX: Hari Libur Tidak Berfungsi

## ✅ MASALAH DITEMUKAN!

**Error:** `Column not found: 1054 Unknown column 'is_active'`

Tabel `holidays` tidak punya kolom `is_active`, tapi API mencarinya.

## 🔧 SOLUSI

### 1. Upload File API yang Sudah Diperbaiki
Upload file ini ke cPanel:
- `api/holidays.php` → folder `api/`

**Perubahan:** Hapus `AND is_active = 1` dari query SQL.

### 2. Pastikan Data Hari Libur Ada di Database

Buka **phpMyAdmin** di cPanel, pilih database `sobataja2_geopresence`, jalankan query:

```sql
-- CEK apakah tanggal 25 Desember 2025 sudah ada
SELECT * FROM holidays WHERE tanggal = '2025-12-25';
```

**Jika hasilnya KOSONG**, jalankan query ini:

```sql
-- INSERT data hari Natal
INSERT INTO holidays (tanggal, nama, jenis, keterangan) 
VALUES ('2025-12-25', 'Hari Natal', 'nasional', 'Perayaan Hari Natal');
```

**Jika hasilnya ADA DATA**, skip langkah insert.

### 3. Test API Lagi

Buka browser, akses:
```
https://kelolasekolah.web.id/api/holidays.php?check=2025-12-25
```

**Expected result (BENAR):**
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-25",
    "isHoliday": true,
    "isWeekend": false,
    "isWorkday": false,
    "holidayName": "Hari Natal",
    "holidayType": "nasional",
    "dayName": "Kamis"
  }
}
```

**Perhatikan:** `isWorkday: false` dan `isHoliday: true`

### 4. Upload Frontend (Opsional - Sudah Ada Debug Log)

Jika mau lihat debug log di console, upload folder `dist/` ke cPanel.

### 5. Test di Browser

1. Clear cache browser (Ctrl + Shift + R)
2. Login sebagai guru
3. Cek halaman home guru
4. **HARUSNYA:** Tombol presensi HILANG, muncul pesan "Hari Libur: Hari Natal"

## 📋 CHECKLIST

- [ ] Upload `api/holidays.php` ke cPanel
- [ ] Cek database: `SELECT * FROM holidays WHERE tanggal = '2025-12-25'`
- [ ] Jika kosong, insert data Natal
- [ ] Test API: `https://kelolasekolah.web.id/api/holidays.php?check=2025-12-25`
- [ ] Pastikan response: `isWorkday: false`
- [ ] Clear cache browser
- [ ] Login sebagai guru
- [ ] Cek tombol presensi HILANG

## 🎯 FILE YANG PERLU DIUPLOAD

**WAJIB:**
- `api/holidays.php` (sudah diperbaiki - hapus is_active)

**OPSIONAL:**
- `dist/` (jika mau debug log di console)

## ⚠️ CATATAN PENTING

Masalah utama: **Kolom `is_active` tidak ada di tabel `holidays`**

Solusi: Hapus `AND is_active = 1` dari query SQL di `api/holidays.php`

Setelah upload `api/holidays.php` dan pastikan data Natal ada di database, masalah akan selesai! 🎉
