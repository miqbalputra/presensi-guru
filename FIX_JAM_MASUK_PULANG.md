# Fix: Jam Pulang/Izin/Sakit Auto-filled dengan 00:00:00

## Masalah
Ketika guru melakukan presensi (hadir/izin/sakit), kolom waktu yang seharusnya kosong (NULL) malah terisi dengan `00:00:00`:
- Presensi HADIR → `jam_izin` dan `jam_sakit` terisi `00:00:00` (seharusnya NULL)
- Presensi IZIN → `jam_hadir` dan `jam_sakit` terisi `00:00:00` (seharusnya NULL)
- Presensi SAKIT → `jam_hadir` dan `jam_izin` terisi `00:00:00` (seharusnya NULL)
- Belum presensi pulang → `jam_pulang` terisi `00:00:00` (seharusnya NULL)

## Penyebab
Di `api/presensi.php`, ketika menerima data dari frontend:
- Frontend mengirim `null` untuk field yang tidak diisi
- PHP menerima `null` tapi tidak memvalidasi apakah itu benar-benar NULL atau string kosong
- Database menerima string kosong `''` dan mengkonversinya menjadi `00:00:00` (default TIME value)

## Solusi
Ubah validasi di `api/presensi.php` dari `??` operator menjadi `!empty()` check:

### SEBELUM:
```php
$stmt->execute([
    $data['jamMasuk'] ?? null,
    $data['jamPulang'] ?? null,
    $data['jamHadir'] ?? null,
    $data['jamIzin'] ?? null,
    $data['jamSakit'] ?? null,
    // ...
]);
```

### SESUDAH:
```php
$stmt->execute([
    !empty($data['jamMasuk']) ? $data['jamMasuk'] : null,
    !empty($data['jamPulang']) ? $data['jamPulang'] : null,
    !empty($data['jamHadir']) ? $data['jamHadir'] : null,
    !empty($data['jamIzin']) ? $data['jamIzin'] : null,
    !empty($data['jamSakit']) ? $data['jamSakit'] : null,
    // ...
]);
```

## Perubahan
1. **CREATE endpoint** - Validasi semua field waktu dengan `!empty()`
2. **UPDATE endpoint** - Validasi semua field waktu dengan `!empty()`

## Cara Kerja
- `!empty($data['jamMasuk'])` akan return `false` jika:
  - Value adalah `null`
  - Value adalah string kosong `''`
  - Value adalah `0` atau `'0'`
  - Value adalah `false`
- Jika `false`, maka akan menggunakan `null` yang benar-benar NULL di database
- Jika `true`, maka akan menggunakan value asli (contoh: `'07:15:00'`)

## Testing
1. Login sebagai guru
2. Klik tombol **HADIR**
3. Cek database → `jam_hadir` terisi, `jam_izin`, `jam_sakit`, `jam_pulang` harus NULL (bukan 00:00:00)
4. Klik tombol **IZIN** (guru lain)
5. Cek database → `jam_izin` terisi, `jam_hadir`, `jam_sakit`, `jam_pulang` harus NULL
6. Klik tombol **PRESENSI PULANG**
7. Cek database → `jam_pulang` terisi, field lain tetap sesuai status

## File yang Diubah
- `api/presensi.php` - CREATE dan UPDATE endpoint

## Status
✅ **SELESAI** - Siap di-upload ke cPanel
