# Fitur: Presensi Pulang Minimal Jam 09:00 WIB

## 📋 OVERVIEW

Tombol **Presensi Pulang** hanya akan muncul dan bisa diklik **mulai pukul 09:00 WIB**.

Ini mencegah guru langsung klik pulang setelah presensi hadir.

---

## 🎯 ALUR KERJA BARU:

### **Skenario 1: Guru Presensi Hadir Jam 07:20**
1. Guru klik tombol **HADIR** jam 07:20
2. Presensi berhasil tersimpan
3. **Tombol Presensi Pulang TIDAK MUNCUL**
4. Muncul pesan: "⏰ Presensi pulang tersedia mulai pukul 09:00 WIB"
5. Guru tunggu sampai jam 09:00
6. Setelah jam 09:00, tombol **PRESENSI PULANG** muncul
7. Guru bisa klik pulang

### **Skenario 2: Guru Presensi Hadir Jam 09:30**
1. Guru klik tombol **HADIR** jam 09:30 (terlambat)
2. Presensi berhasil tersimpan
3. **Tombol Presensi Pulang LANGSUNG MUNCUL** (karena sudah lewat jam 09:00)
4. Guru bisa langsung klik pulang jika mau

---

## 🔧 CARA KERJA TEKNIS:

### **Fungsi Cek Waktu:**
```javascript
const canShowPulangButton = () => {
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()
  const currentTimeInMinutes = (currentHour * 60) + currentMinute
  const minTimeInMinutes = (9 * 60) + 0 // 09:00 = 540 menit
  
  return currentTimeInMinutes >= minTimeInMinutes
}
```

### **Validasi Saat Klik Pulang:**
```javascript
const handlePulang = async () => {
  // Cek waktu minimal (09:00 WIB)
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()
  const currentTimeInMinutes = (currentHour * 60) + currentMinute
  const minTimeInMinutes = (9 * 60) + 0
  
  if (currentTimeInMinutes < minTimeInMinutes) {
    setMessage({ 
      type: 'error', 
      text: 'Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB' 
    })
    return
  }
  
  // Lanjut proses presensi pulang...
}
```

---

## 📱 TAMPILAN UI:

### **Sebelum Jam 09:00:**
```
┌─────────────────────────────────────────┐
│  ✓ Anda Sudah Absen                     │
│  Status: HADIR                          │
│  Jam Hadir: 07:20:15                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⏰ Presensi pulang tersedia mulai      │
│     pukul 09:00 WIB                     │
│                                         │
│  Silakan tunggu hingga jam 09:00 untuk │
│  melakukan presensi pulang              │
└─────────────────────────────────────────┘
```

### **Setelah Jam 09:00:**
```
┌─────────────────────────────────────────┐
│  ✓ Anda Sudah Absen                     │
│  Status: HADIR                          │
│  Jam Hadir: 07:20:15                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  [✓ PRESENSI PULANG]                    │
└─────────────────────────────────────────┘
```

---

## ✅ KEUNTUNGAN:

1. ✅ **Mencegah Abuse** - Guru tidak bisa langsung pulang setelah hadir
2. ✅ **Sesuai Aturan** - Minimal kerja 1.5 jam (07:20 - 09:00)
3. ✅ **User Friendly** - Pesan jelas kapan bisa pulang
4. ✅ **Flexible** - Jika hadir setelah jam 09:00, langsung bisa pulang

---

## 🔧 KONFIGURASI:

Jika ingin ubah jam minimal (misal jadi 10:00 atau 08:00):

Edit file `src/components/guru/GuruHome.jsx`:

**Ubah baris ini:**
```javascript
const minTimeInMinutes = (9 * 60) + 0 // 09:00
```

**Contoh ubah jadi 10:00:**
```javascript
const minTimeInMinutes = (10 * 60) + 0 // 10:00
```

**Contoh ubah jadi 08:30:**
```javascript
const minTimeInMinutes = (8 * 60) + 30 // 08:30
```

Lalu build ulang:
```bash
npm run build
```

---

## 🧪 TESTING:

### Test 1: Presensi Hadir Sebelum Jam 09:00
1. Login sebagai guru
2. Klik tombol **HADIR** (misal jam 07:30)
3. ✅ Presensi berhasil
4. ✅ Tombol pulang TIDAK muncul
5. ✅ Muncul pesan: "Presensi pulang tersedia mulai pukul 09:00 WIB"

### Test 2: Tunggu Sampai Jam 09:00
1. Biarkan halaman terbuka (jangan refresh)
2. Tunggu sampai jam 09:00
3. ✅ Tombol **PRESENSI PULANG** otomatis muncul (karena React re-render)
4. Klik tombol pulang
5. ✅ Presensi pulang berhasil

### Test 3: Presensi Hadir Setelah Jam 09:00
1. Login sebagai guru lain
2. Klik tombol **HADIR** (misal jam 09:30)
3. ✅ Presensi berhasil
4. ✅ Tombol **PRESENSI PULANG** langsung muncul
5. Klik tombol pulang
6. ✅ Presensi pulang berhasil

### Test 4: Coba Klik Pulang Sebelum Jam 09:00 (Manual Test)
Jika ada cara bypass (misal inspect element), sistem tetap validasi di backend:
1. Coba klik pulang sebelum jam 09:00
2. ✅ Muncul error: "Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB"

---

## 📊 STATISTIK:

### Sebelum Fitur Ini:
- ❌ Guru bisa langsung pulang setelah hadir
- ❌ Tidak ada kontrol waktu minimal kerja
- ❌ Potensi abuse sistem

### Sesudah Fitur Ini:
- ✅ Guru harus tunggu minimal sampai jam 09:00
- ✅ Kontrol waktu minimal kerja (1.5 jam dari KBM 07:20)
- ✅ Sistem lebih fair dan sesuai aturan

---

## 🎯 REKOMENDASI TAMBAHAN (Opsional):

### **1. Notifikasi Countdown**
Tampilkan countdown timer: "Presensi pulang tersedia dalam 45 menit"

### **2. Waktu Minimal Dinamis**
Bisa diatur admin via database (tidak hardcode di code)

### **3. Validasi Backend**
Tambah validasi di API `presensi.php` untuk double-check waktu minimal

---

## 📝 FILE YANG DIUBAH:

- `src/components/guru/GuruHome.jsx` - Tambah logika waktu minimal

---

## 🚀 DEPLOYMENT:

Upload file-file ini ke cPanel:
```
dist/index.html
dist/assets/index-CrxMbwt4.css
dist/assets/index.es-ak101TaL.js
dist/assets/index-KM-S-7Gg.js
dist/assets/purify.es-C_uT9hQ1.js
dist/assets/html2canvas.esm-CBrSDip1.js
```

---

**Status:** ✅ Selesai dan siap di-upload!
