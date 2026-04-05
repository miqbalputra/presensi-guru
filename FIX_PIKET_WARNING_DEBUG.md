# 🔧 FIX: Warning Terlambat Piket Tidak Muncul

## 🐛 MASALAH

**Gejala:**
- Guru punya jadwal piket hari ini
- Guru datang terlambat dari jam piket
- Warning "⚠️ Anda terlambat hadir piket..." **TIDAK MUNCUL**

**Expected:**
- Jika jam piket 07:00, presensi jam 07:15
- Harus muncul warning: "⚠️ Anda terlambat hadir piket 15 menit. Jam piket: 07:00 WIB"

---

## 🔍 ANALISIS MASALAH

### Kemungkinan Penyebab

1. **`isPiketToday` atau `jadwalPiketHariIni` tidak ter-set**
   - API `jadwalPiketAPI.getToday()` tidak return data
   - User ID tidak match dengan jadwal
   - Response format salah

2. **Format jam_piket berbeda**
   - Database: `07:00:00` (HH:MM:SS)
   - Code expect: `07:00` (HH:MM)
   - Split error jika format berbeda

3. **Logika perhitungan salah**
   - Konversi jam ke menit salah
   - Perbandingan waktu salah

---

## ✅ SOLUSI YANG DITERAPKAN

### 1. Tambah Console Log untuk Debugging

#### Di `checkJadwalPiket()`

**Sebelum:**
```javascript
const response = await jadwalPiketAPI.getToday()
if (response && response.success && response.data && response.data.jadwal) {
  const { jadwal } = response.data
  const myPiket = jadwal.find(j => j.user_id === user.id)
  ...
}
```

**Sesudah:**
```javascript
console.log('📋 Checking jadwal piket...')
const response = await jadwalPiketAPI.getToday()
console.log('📋 Jadwal piket response:', response)

if (response && response.success && response.data && response.data.jadwal) {
  const { jadwal } = response.data
  console.log('📋 Jadwal list:', jadwal)
  console.log('📋 Current user ID:', user.id)
  
  const myPiket = jadwal.find(j => {
    console.log('📋 Comparing:', j.user_id, 'with', user.id)
    return j.user_id === user.id
  })
  
  if (myPiket) {
    console.log('✅ Piket hari ini:', myPiket)
    ...
  } else {
    console.log('ℹ️ Tidak ada piket hari ini untuk user:', user.id)
    ...
  }
}
```

#### Di `saveAttendance()` - Piket Check

**Sebelum:**
```javascript
if (isPiketToday && jadwalPiketHariIni) {
  const [jamPiket, menitPiket] = jadwalPiketHariIni.jam_piket.split(':').map(Number)
  ...
}
```

**Sesudah:**
```javascript
if (isPiketToday && jadwalPiketHariIni) {
  console.log('🔍 Checking piket late:', {
    isPiketToday,
    jadwalPiketHariIni,
    currentTime
  })
  
  // Format jam_piket bisa HH:MM:SS atau HH:MM, ambil HH:MM saja
  const jamPiketStr = jadwalPiketHariIni.jam_piket.substring(0, 5)
  const [jamPiket, menitPiket] = jamPiketStr.split(':').map(Number)
  const [jamPresensi, menitPresensi] = currentTime.split(':').map(Number)
  
  const waktuPiket = jamPiket * 60 + menitPiket
  const waktuPresensi = jamPresensi * 60 + menitPresensi
  
  console.log('⏰ Piket time comparison:', {
    jamPiketStr,
    waktuPiket,
    waktuPresensi,
    isLate: waktuPresensi > waktuPiket
  })
  
  if (waktuPresensi > waktuPiket) {
    const selisihMenitPiket = waktuPresensi - waktuPiket
    piketWarning = `⚠️ Anda terlambat hadir piket ${selisihMenitPiket} menit. Jam piket: ${jamPiketStr} WIB`
    console.log('⚠️ Piket warning:', piketWarning)
  } else {
    console.log('✅ Tidak terlambat piket')
  }
} else {
  console.log('ℹ️ No piket check:', { isPiketToday, jadwalPiketHariIni })
}
```

### 2. Fix Format Jam Piket

**Masalah:**
- Database return `07:00:00` (HH:MM:SS)
- Code split langsung tanpa substring
- Bisa error jika format berbeda

**Solusi:**
```javascript
// Ambil HH:MM saja (5 karakter pertama)
const jamPiketStr = jadwalPiketHariIni.jam_piket.substring(0, 5)
```

**Keuntungan:**
- ✅ Support format HH:MM:SS
- ✅ Support format HH:MM
- ✅ Tidak error jika format berbeda

---

## 📦 FILE YANG BERUBAH

### Frontend
```
src/components/guru/GuruHome.jsx
```

**Perubahan:**
- Tambah console log di `checkJadwalPiket()`
- Tambah console log di piket late check
- Fix format jam piket dengan `.substring(0, 5)`

### Build Output (NEW)
```
dist/index.html                          0.48 kB │ gzip:   0.31 kB
dist/assets/index-B2QwBo70.css          25.81 kB │ gzip:   5.07 kB
dist/assets/purify.es-C_uT9hQ1.js       21.98 kB │ gzip:   8.74 kB
dist/assets/index.es-BciDI-Zg.js       150.44 kB │ gzip:  51.42 kB (NEW)
dist/assets/html2canvas.esm-CBrSDip1.js 201.42 kB │ gzip:  48.03 kB
dist/assets/index-CIYB886m.js         1,559.86 kB │ gzip: 470.86 kB (NEW)
```

---

## 🚀 CARA UPDATE

### Upload Frontend
```
1. Login cPanel → File Manager
2. Masuk ke /public_html/
3. Backup: Rename dist → dist_backup_piket_debug
4. Upload folder dist baru
5. Clear cache (Ctrl+Shift+Del)
6. Hard reload (Ctrl+F5)
```

---

## 🧪 TESTING DENGAN CONSOLE LOG

### Skenario Test

**Setup:**
1. Admin tambah jadwal piket untuk guru X di hari ini
2. Set jam piket: 07:00
3. Login sebagai guru X
4. Presensi jam 07:15 (terlambat 15 menit)

### Expected Console Log (SUKSES)

```
=== 🚀 Loading Initial Data ===
📋 Checking jadwal piket...
📋 Jadwal piket response: { success: true, data: { hari: "Jumat", jadwal: [...] } }
📋 Jadwal list: [{ id: 1, user_id: 2, jam_piket: "07:00:00", ... }]
📋 Current user ID: 2
📋 Comparing: 2 with 2
✅ Piket hari ini: { id: 1, user_id: 2, jam_piket: "07:00:00", ... }
=== ✅ Data Loaded ===

[User klik HADIR jam 07:15]

🔍 Checking piket late: {
  isPiketToday: true,
  jadwalPiketHariIni: { id: 1, user_id: 2, jam_piket: "07:00:00", ... },
  currentTime: "07:15:00"
}
⏰ Piket time comparison: {
  jamPiketStr: "07:00",
  waktuPiket: 420,
  waktuPresensi: 435,
  isLate: true
}
⚠️ Piket warning: ⚠️ Anda terlambat hadir piket 15 menit. Jam piket: 07:00 WIB
```

**Expected UI:**
- ✅ Message muncul dengan background orange (warning)
- ✅ Text: "Presensi hadir berhasil disimpan! ⚠️ Anda terlambat hadir piket 15 menit. Jam piket: 07:00 WIB"

### Expected Console Log (TIDAK ADA PIKET)

```
=== 🚀 Loading Initial Data ===
📋 Checking jadwal piket...
📋 Jadwal piket response: { success: true, data: { hari: "Jumat", jadwal: [] } }
ℹ️ No piket data or empty response
=== ✅ Data Loaded ===

[User klik HADIR]

ℹ️ No piket check: { isPiketToday: false, jadwalPiketHariIni: null }
```

**Expected UI:**
- ✅ Message muncul dengan background hijau (success)
- ✅ Text: "Presensi hadir berhasil disimpan!"
- ✅ Tidak ada warning piket

### Expected Console Log (USER ID TIDAK MATCH)

```
=== 🚀 Loading Initial Data ===
📋 Checking jadwal piket...
📋 Jadwal piket response: { success: true, data: { hari: "Jumat", jadwal: [...] } }
📋 Jadwal list: [{ id: 1, user_id: 3, jam_piket: "07:00:00", ... }]
📋 Current user ID: 2
📋 Comparing: 3 with 2
ℹ️ Tidak ada piket hari ini untuk user: 2
=== ✅ Data Loaded ===

[User klik HADIR]

ℹ️ No piket check: { isPiketToday: false, jadwalPiketHariIni: null }
```

**Expected UI:**
- ✅ Message muncul dengan background hijau (success)
- ✅ Text: "Presensi hadir berhasil disimpan!"
- ✅ Tidak ada warning piket

---

## 🔍 DEBUGGING GUIDE

### Jika Warning Masih Tidak Muncul

#### Step 1: Cek Console Browser (F12)

**Buka Console saat presensi, cari log:**

1. **Cek jadwal piket ter-load?**
   ```
   📋 Checking jadwal piket...
   📋 Jadwal piket response: ...
   ```
   
   **Jika tidak ada log ini:**
   - API `jadwalPiketAPI.getToday()` error
   - Cek Network tab → ada error?

2. **Cek user ID match?**
   ```
   📋 Current user ID: 2
   📋 Comparing: 2 with 2
   ✅ Piket hari ini: { ... }
   ```
   
   **Jika log "Tidak ada piket hari ini":**
   - User ID tidak match
   - Cek jadwal di admin → user ID benar?

3. **Cek piket late check?**
   ```
   🔍 Checking piket late: { ... }
   ⏰ Piket time comparison: { ... }
   ```
   
   **Jika tidak ada log ini:**
   - `isPiketToday` atau `jadwalPiketHariIni` false/null
   - Kembali ke step 2

4. **Cek warning generated?**
   ```
   ⚠️ Piket warning: ⚠️ Anda terlambat hadir piket 15 menit...
   ```
   
   **Jika tidak ada log ini:**
   - `waktuPresensi <= waktuPiket` (tidak terlambat)
   - Cek jam presensi vs jam piket

#### Step 2: Cek Database

**Query di phpMyAdmin:**
```sql
-- Cek jadwal piket hari ini
SELECT * FROM jadwal_piket 
WHERE hari = 'Jumat' -- sesuaikan hari
AND is_active = 1;

-- Cek user ID guru
SELECT id, nama FROM users WHERE role = 'guru';
```

**Verifikasi:**
- ✅ Ada jadwal piket untuk hari ini?
- ✅ user_id sesuai dengan ID guru?
- ✅ jam_piket format benar? (HH:MM:SS atau HH:MM)

#### Step 3: Test API Langsung

**Test API jadwal piket:**
```
https://kelolasekolah.web.id/api/jadwal_piket.php?today=1
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Jadwal piket hari ini berhasil diambil",
  "data": {
    "hari": "Jumat",
    "jadwal": [
      {
        "id": 1,
        "user_id": 2,
        "nama_guru": "Iqbal",
        "hari": "Jumat",
        "jam_piket": "07:00:00",
        ...
      }
    ]
  }
}
```

**Jika response berbeda:**
- Screenshot response
- Cek struktur data

---

## 📊 FLOW DIAGRAM

### Piket Warning Flow

```
Load Initial Data
  ↓
checkJadwalPiket()
  ↓
API: jadwalPiketAPI.getToday()
  ↓
Response: { hari: "Jumat", jadwal: [...] }
  ↓
Find user in jadwal: jadwal.find(j => j.user_id === user.id)
  ↓
Found? ──YES──> setIsPiketToday(true)
  │             setJadwalPiketHariIni(myPiket)
  │
  NO
  ↓
setIsPiketToday(false)
setJadwalPiketHariIni(null)

[User klik HADIR]
  ↓
saveAttendance()
  ↓
isPiketToday && jadwalPiketHariIni? ──NO──> No piket check
  │
  YES
  ↓
Get jam_piket: "07:00:00".substring(0, 5) = "07:00"
  ↓
Convert to minutes:
  waktuPiket = 7 * 60 + 0 = 420
  waktuPresensi = 7 * 60 + 15 = 435
  ↓
waktuPresensi > waktuPiket? ──NO──> ✅ Tidak terlambat piket
  │
  YES
  ↓
selisihMenit = 435 - 420 = 15
  ↓
piketWarning = "⚠️ Anda terlambat hadir piket 15 menit..."
  ↓
setMessage({ type: 'warning', text: successMessage + piketWarning })
  ↓
✅ Warning muncul dengan background orange
```

---

## 🎯 KESIMPULAN

### ✅ PERUBAHAN YANG DILAKUKAN

1. **Tambah console log lengkap** untuk debugging
2. **Fix format jam piket** dengan `.substring(0, 5)`
3. **Tambah log di setiap step** untuk trace masalah

### 🔍 CARA DEBUG

**PENTING:** Buka Console Browser (F12) saat testing!

Console log akan menunjukkan:
- ✅ Apakah jadwal piket ter-load
- ✅ Apakah user ID match
- ✅ Apakah piket late check berjalan
- ✅ Apakah warning generated

### 🚀 NEXT STEPS

1. Upload folder `dist` baru
2. Clear cache browser
3. **Buka Console Browser (F12)**
4. Login guru yang ada jadwal piket
5. Presensi terlambat dari jam piket
6. **Lihat Console log** untuk trace masalah
7. Screenshot Console log dan kirim ke saya jika masih error

---

**Dibuat oleh**: Kiro AI Assistant  
**Tanggal**: 26 Desember 2025  
**Status**: ✅ **DEBUG MODE ENABLED**
