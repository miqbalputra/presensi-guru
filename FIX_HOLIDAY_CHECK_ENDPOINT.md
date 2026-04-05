# Perbaikan Holiday Check Endpoint

## Masalah
API endpoint `/api/holidays.php?check=2025-12-15` mengembalikan array semua hari libur, bukan data untuk tanggal spesifik.

**Response yang salah:**
```json
{
  "success": true,
  "message": "Data hari libur berhasil diambil",
  "data": [
    {...}, {...}, {...} // 153 items
  ]
}
```

**Response yang benar:**
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-15",
    "isHoliday": false,
    "isWeekend": false,
    "isWorkday": true,
    "holidayName": null,
    "dayName": "Senin"
  }
}
```

## Penyebab
Urutan kondisi di `holidays.php` salah. Kondisi `GET ALL` dijalankan sebelum kondisi `CHECK`, sehingga parameter `?check=` diabaikan.

**Urutan Salah:**
```php
// GET ALL HOLIDAYS
if ($method === 'GET' && !isset($_GET['id'])) {
    // Ini dijalankan duluan karena !isset($_GET['id']) = true
}

// CHECK IF DATE IS HOLIDAY
if ($method === 'GET' && isset($_GET['check'])) {
    // Ini tidak pernah dijalankan
}
```

## Solusi
Ubah urutan kondisi: CHECK harus dicek duluan sebelum GET ALL.

**Urutan Benar:**
```php
// CHECK IF DATE IS HOLIDAY (harus dicek duluan)
if ($method === 'GET' && isset($_GET['check'])) {
    // Cek tanggal spesifik
}

// GET ALL HOLIDAYS
if ($method === 'GET' && !isset($_GET['id']) && !isset($_GET['check'])) {
    // Get semua hari libur
}
```

## File yang Diubah
```
api/holidays.php
```

## Perubahan Detail

### 1. Pindahkan CHECK ke Atas
```php
// Line 17-48: CHECK IF DATE IS HOLIDAY
if ($method === 'GET' && isset($_GET['check'])) {
    $tanggal = $_GET['check'];
    
    // Check if date is holiday
    $stmt = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ? AND is_active = 1");
    $stmt->execute([$tanggal]);
    $holiday = $stmt->fetch();
    
    // Check if date is weekend
    $dayOfWeek = date('w', strtotime($tanggal));
    $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
    
    $response = [
        'tanggal' => $tanggal,
        'isHoliday' => $holiday ? true : false,
        'isWeekend' => $isWeekend,
        'isWorkday' => !$holiday && !$isWeekend,
        'holidayName' => $holiday ? $holiday['nama'] : null,
        'dayName' => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][$dayOfWeek]
    ];
    
    sendResponse(true, 'Pengecekan hari berhasil', $response);
}
```

### 2. Tambah Kondisi di GET ALL
```php
// Line 50-80: GET ALL HOLIDAYS
if ($method === 'GET' && !isset($_GET['id']) && !isset($_GET['check'])) {
    // Tambah: && !isset($_GET['check'])
    // Agar tidak bentrok dengan CHECK endpoint
}
```

## Cara Upload ke cPanel

### 1. Upload File API
```
api/holidays.php (updated)
```

**Via File Manager:**
1. Login cPanel → File Manager
2. Masuk ke `public_html/api`
3. Upload `holidays.php` (overwrite)
4. Set permission 644

### 2. Test Endpoint

**Test CHECK:**
```
https://kelolasekolah.web.id/api/holidays.php?check=2025-12-15
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-15",
    "isHoliday": false,
    "isWeekend": false,
    "isWorkday": true,
    "holidayName": null,
    "dayName": "Senin"
  }
}
```

**Test GET ALL:**
```
https://kelolasekolah.web.id/api/holidays.php
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Data hari libur berhasil diambil",
  "data": [
    {...}, {...}, {...}
  ]
}
```

### 3. Test di Aplikasi
1. Logout dari aplikasi
2. Clear browser cache
3. Login kembali sebagai guru
4. Buka halaman home
5. **Seharusnya muncul tombol HADIR, IZIN, SAKIT** ✅

## Troubleshooting

### Endpoint masih return array

**Cek urutan kondisi:**
```bash
# Via SSH atau File Manager, cek line 17-20
grep -n "CHECK IF DATE" api/holidays.php
```

Harusnya muncul di line 17, SEBELUM GET ALL.

### Response masih salah

**Clear PHP OPcache:**
- cPanel → Select PHP Version → Options
- Klik "Reset OPcache"

**Atau restart PHP-FPM:**
- cPanel → MultiPHP Manager
- Pilih domain → Apply

### Tombol masih tidak muncul

**Cek Console Log:**
```
Holiday data: {isWorkday: true, isHoliday: false, isWeekend: false, ...}
```

Jika `isWorkday: true`, tombol seharusnya muncul.

**Jika masih tidak muncul:**
1. Upload file frontend baru (dist/)
2. Clear browser cache
3. Hard refresh (Ctrl + F5)

## Testing Checklist

### Test API Endpoint
- [ ] `/api/holidays.php?check=2025-12-15` return object (bukan array)
- [ ] Response ada field `isWorkday`, `isHoliday`, `isWeekend`
- [ ] `/api/holidays.php` (tanpa param) return array semua holidays

### Test Weekend
- [ ] `/api/holidays.php?check=2025-12-13` (Sabtu) → `isWeekend: true`
- [ ] `/api/holidays.php?check=2025-12-14` (Minggu) → `isWeekend: true`
- [ ] `/api/holidays.php?check=2025-12-15` (Senin) → `isWeekend: false`

### Test Holiday
- [ ] Tambah hari libur di admin panel
- [ ] Check tanggal tersebut → `isHoliday: true`
- [ ] Check tanggal lain → `isHoliday: false`

### Test UI
- [ ] Login sebagai guru
- [ ] Hari kerja → tombol HADIR, IZIN, SAKIT muncul
- [ ] Weekend → pesan "Hari Sabtu/Minggu adalah hari libur"
- [ ] Hari libur → pesan "Hari Libur: [Nama Libur]"

## Endpoint Specification

### CHECK Endpoint
```
GET /api/holidays.php?check={tanggal}
```

**Parameters:**
- `check` (required): Tanggal format YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "message": "Pengecekan hari berhasil",
  "data": {
    "tanggal": "2025-12-15",
    "isHoliday": false,
    "isWeekend": false,
    "isWorkday": true,
    "holidayName": null,
    "holidayType": null,
    "dayName": "Senin"
  }
}
```

### GET ALL Endpoint
```
GET /api/holidays.php
```

**Optional Parameters:**
- `tanggal`: Filter by specific date
- `start_date` & `end_date`: Filter by date range
- `year`: Filter by year

**Response:**
```json
{
  "success": true,
  "message": "Data hari libur berhasil diambil",
  "data": [
    {
      "id": 1,
      "tanggal": "2025-01-01",
      "nama": "Tahun Baru",
      "jenis": "nasional",
      "is_active": 1
    },
    ...
  ]
}
```

## Build Status
✅ API fixed
✅ Frontend build berhasil
✅ Siap untuk production

## Catatan
⚠️ **Setelah upload:**
1. Test endpoint via browser/Postman
2. Clear PHP cache jika perlu
3. Test di aplikasi
4. Tombol presensi seharusnya muncul! 🎉
