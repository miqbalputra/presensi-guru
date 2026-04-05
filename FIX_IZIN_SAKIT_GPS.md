# Fix: Izin dan Sakit Tidak Perlu GPS

## Masalah
Ketika guru mengisi presensi Izin atau Sakit, muncul error "Koordinat GPS tidak valid" atau "Gagal menyimpan presensi".

## Penyebab
1. **Backend**: API `presensi.php` memvalidasi koordinat GPS untuk semua status (hadir, izin, sakit)
2. **Frontend**: Saat submit izin/sakit, koordinat dikirim sebagai `null` yang gagal validasi

## Solusi
Ubah logika agar:
1. **Hanya status HADIR** yang memerlukan validasi GPS
2. **Status IZIN dan SAKIT** tidak perlu GPS, gunakan koordinat `0, 0`

### Perubahan di Backend (`api/presensi.php`)

#### SEBELUM:
```php
// Validasi koordinat jika ada
if (isset($data['latitude']) && isset($data['longitude'])) {
    if (!validateCoordinates($data['latitude'], $data['longitude'])) {
        sendResponse(false, 'Koordinat GPS tidak valid');
    }
}
```

#### SESUDAH:
```php
// Validasi koordinat hanya untuk status HADIR
if ($data['status'] === 'hadir') {
    if (isset($data['latitude']) && isset($data['longitude'])) {
        if (!validateCoordinates($data['latitude'], $data['longitude'])) {
            sendResponse(false, 'Koordinat GPS tidak valid');
        }
    }
}
```

### Perubahan di Frontend (`src/components/guru/GuruHome.jsx`)

#### SEBELUM:
```javascript
const submitIzinSakit = () => {
  if (!keterangan.trim()) {
    alert('Mohon isi keterangan')
    return
  }
  saveAttendance(modalType, keterangan, null, null)
  setShowModal(false)
}
```

#### SESUDAH:
```javascript
const submitIzinSakit = () => {
  if (!keterangan.trim()) {
    alert('Mohon isi keterangan')
    return
  }
  setLoading(true)
  setShowModal(false)
  // Untuk izin/sakit, gunakan koordinat 0 (tidak perlu GPS)
  saveAttendance(modalType, keterangan, 0, 0)
}
```

## Cara Kerja

### Status HADIR:
1. Guru klik tombol **HADIR**
2. Sistem meminta akses GPS
3. Validasi lokasi (jika TESTING_MODE = false)
4. Simpan dengan koordinat GPS sebenarnya
5. ✅ Validasi GPS di backend

### Status IZIN/SAKIT:
1. Guru klik tombol **IZIN** atau **SAKIT**
2. Modal muncul untuk isi keterangan
3. Guru isi keterangan dan klik **Simpan**
4. Simpan dengan koordinat `0, 0` (tidak perlu GPS)
5. ❌ Skip validasi GPS di backend

## Database
Koordinat untuk izin/sakit akan tersimpan sebagai:
- `latitude = 0`
- `longitude = 0`

Ini valid karena koordinat `0, 0` adalah titik di Samudra Atlantik (Gulf of Guinea), bukan lokasi sekolah, sehingga jelas bahwa ini bukan presensi hadir.

## Testing

### Test 1: Presensi Hadir
1. Login sebagai guru
2. Klik tombol **HADIR**
3. Izinkan akses lokasi
4. ✅ Presensi berhasil dengan GPS sebenarnya
5. Cek database: `latitude` dan `longitude` terisi koordinat sebenarnya

### Test 2: Presensi Izin
1. Login sebagai guru lain
2. Klik tombol **IZIN**
3. Isi keterangan: "Ada keperluan keluarga"
4. Klik **Simpan**
5. ✅ Presensi berhasil tanpa GPS
6. Cek database: `latitude = 0`, `longitude = 0`

### Test 3: Presensi Sakit
1. Login sebagai guru lain
2. Klik tombol **SAKIT**
3. Isi keterangan: "Demam tinggi"
4. Klik **Simpan**
5. ✅ Presensi berhasil tanpa GPS
6. Cek database: `latitude = 0`, `longitude = 0`

## File yang Diubah
1. `api/presensi.php` - Validasi GPS hanya untuk status hadir
2. `src/components/guru/GuruHome.jsx` - Kirim koordinat 0,0 untuk izin/sakit

## Status
✅ **SELESAI** - Siap di-upload ke cPanel
