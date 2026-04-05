# FIX: Presensi di Hari Libur

## Masalah
Guru masih bisa melakukan presensi pada hari libur (25 Desember 2025 sudah diset sebagai hari libur, tapi tombol presensi masih muncul dan bisa diklik).

## Solusi yang Diterapkan

### 1. Frontend (GuruHome.jsx)
**Perubahan:**
- Tombol presensi (HADIR, IZIN, SAKIT) hanya muncul jika `!isHoliday && !todayAttendance`
- Jika hari libur, hanya tampil pesan libur (tidak ada tombol presensi sama sekali)
- Status presensi yang sudah ada tetap ditampilkan jika `todayAttendance && !isHoliday`

**Logika:**
```javascript
// Pesan libur - selalu tampil jika hari libur
{isHoliday && holidayInfo && (
  <div>Pesan Hari Libur</div>
)}

// Status presensi - hanya tampil jika sudah presensi DAN bukan hari libur
{todayAttendance && !isHoliday ? (
  <div>Status Sudah Presensi</div>
) : null}

// Tombol presensi - hanya tampil jika BELUM presensi DAN BUKAN hari libur
{!isHoliday && !todayAttendance && (
  <div>Tombol HADIR, IZIN, SAKIT</div>
)}
```

### 2. Backend (api/presensi.php)
**Perubahan:**
- Tambah validasi hari libur sebelum menyimpan presensi
- Cek database `holidays` untuk tanggal yang diinput
- Cek apakah tanggal adalah weekend (Sabtu/Minggu)
- Jika hari libur atau weekend → return error, presensi tidak disimpan

**Kode yang Ditambahkan:**
```php
// CEK APAKAH HARI LIBUR
$stmt_holiday = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ? AND is_active = 1");
$stmt_holiday->execute([$data['tanggal']]);
$holiday = $stmt_holiday->fetch();

// Check if date is weekend
$dayOfWeek = date('w', strtotime($data['tanggal']));
$isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);

if ($holiday || $isWeekend) {
    $message = $holiday ? 
        'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama'] : 
        'Tidak dapat melakukan presensi pada hari weekend';
    sendResponse(false, $message);
}
```

## Hasil
✅ Tombol presensi tidak muncul di hari libur (frontend)
✅ API menolak request presensi di hari libur (backend)
✅ Pesan libur ditampilkan dengan jelas
✅ Double protection: frontend + backend

## Testing
1. Set tanggal 25 Desember 2025 sebagai hari libur di database
2. Login sebagai guru
3. Cek halaman home guru:
   - ✅ Muncul pesan "Hari Libur: [Nama Libur]"
   - ✅ Tidak ada tombol HADIR, IZIN, SAKIT
   - ✅ Pesan "Tidak perlu melakukan presensi hari ini"

## File yang Diubah
- `src/components/guru/GuruHome.jsx` - Logika tampilan tombol
- `api/presensi.php` - Validasi backend
- `dist/` - Build hasil (siap upload)

## Upload ke cPanel
Upload file berikut:
1. `dist/` → folder root website
2. `api/presensi.php` → folder api/

Selesai! Guru tidak bisa presensi di hari libur.
