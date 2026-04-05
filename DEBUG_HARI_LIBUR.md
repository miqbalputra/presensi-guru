# DEBUG: Hari Libur Tidak Berfungsi

## Masalah
Tombol presensi masih muncul di tanggal 25 Desember 2025 padahal sudah diset sebagai hari libur.

## Langkah Debug yang Sudah Ditambahkan

### 1. Console Log Detail
Saya sudah tambahkan console.log dengan emoji untuk mudah tracking:
- 🚀 Loading Initial Data
- 🔍 Checking holiday for: [tanggal]
- 📅 Holiday API response
- 📊 Holiday data
- 🚫 NOT A WORKDAY - Setting isHoliday to TRUE
- ✅ Workday - Setting isHoliday to FALSE
- 🎨 RENDERING - isHoliday, holidayInfo, todayAttendance

### 2. Debug Info di UI
Di bawah nama user, ada text kecil:
```
Debug: isHoliday=true/false, hasHolidayInfo=yes/no
```

## Cara Debug

### Step 1: Cek Database
Pastikan tanggal 25 Desember 2025 ada di database:

```sql
SELECT * FROM holidays WHERE tanggal = '2025-12-25';
```

**Expected result:**
```
id | tanggal    | nama              | jenis    | is_active
1  | 2025-12-25 | Hari Natal        | nasional | 1
```

Jika tidak ada, insert:
```sql
INSERT INTO holidays (tanggal, nama, jenis, is_active) 
VALUES ('2025-12-25', 'Hari Natal', 'nasional', 1);
```

### Step 2: Test API Langsung
Buka browser, test API:
```
https://kelolasekolah.web.id/api/holidays.php?check=2025-12-25
```

**Expected response:**
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

**Jika `isWorkday: true`** → masalah di database
**Jika `isWorkday: false`** → masalah di frontend

### Step 3: Cek Console Browser
1. Upload file `dist/` ke cPanel
2. Login sebagai guru
3. Buka Developer Tools (F12)
4. Lihat tab Console
5. Cari log dengan emoji:
   - 🔍 Checking holiday for: 2025-12-25
   - 📅 Holiday API response: {...}
   - 🚫 NOT A WORKDAY atau ✅ Workday

### Step 4: Cek Debug Info di UI
Lihat text kecil di bawah nama user:
- `Debug: isHoliday=true` → Frontend sudah detect libur, tapi tombol masih muncul (bug logika render)
- `Debug: isHoliday=false` → Frontend tidak detect libur (bug API atau database)

## Kemungkinan Masalah

### A. Database Tidak Ada Data
**Solusi:** Insert data hari libur (lihat Step 1)

### B. API Tidak Berjalan
**Solusi:** 
- Cek file `api/holidays.php` sudah terupload
- Cek permission file (644 atau 755)
- Test API langsung di browser (Step 2)

### C. CORS atau Session Error
**Solusi:**
- Cek `api/config.php` - pastikan CORS sudah diset
- Cek session PHP aktif

### D. Cache Browser
**Solusi:**
- Hard refresh: Ctrl + Shift + R
- Clear cache browser
- Buka incognito mode

### E. File Lama Belum Terganti
**Solusi:**
- Hapus semua file di folder `assets/` lama
- Upload ulang semua file dari `dist/`
- Pastikan `index.html` juga terupload

## File yang Perlu Diupload

1. **Frontend (dist/):**
   - `index.html`
   - `assets/index-B6Oi-9N-.js` (file baru dengan debug log)
   - `assets/index-CrxMbwt4.css`
   - `assets/purify.es-C_uT9hQ1.js`
   - `assets/index.es-yUYiGNSx.js` (file baru)
   - `assets/html2canvas.esm-CBrSDip1.js`

2. **Backend (tidak perlu upload lagi):**
   - `api/presensi.php` (sudah diupload sebelumnya)
   - `api/holidays.php` (sudah ada)

## Setelah Upload

1. Clear cache browser (Ctrl + Shift + R)
2. Login sebagai guru
3. Buka Console (F12)
4. Screenshot console log dan kirim ke saya
5. Screenshot halaman guru (dengan debug info)

Dengan debug log ini, kita bisa tahu persis di mana masalahnya!
