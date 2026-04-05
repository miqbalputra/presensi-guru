# Cara Mengaktifkan Validasi Geolocation (Nonaktifkan Mode Testing)

## 📍 TENTANG MODE TESTING

Saat ini aplikasi dalam **MODE TESTING**, artinya:
- ❌ Validasi GPS **DINONAKTIFKAN**
- ✅ Semua guru bisa presensi dari mana saja (tidak perlu di sekolah)
- ✅ Berguna untuk testing aplikasi

Ketika mode testing **DINONAKTIFKAN**:
- ✅ Validasi GPS **AKTIF**
- ✅ Guru hanya bisa presensi jika berada dalam radius 100 meter dari sekolah
- ✅ Menggunakan Haversine Formula untuk hitung jarak

---

## 🔧 CARA MENGAKTIFKAN VALIDASI GPS

### **OPSI 1: Edit File di Komputer Lalu Upload** (RECOMMENDED)

#### STEP 1: Edit File di Komputer

1. Buka file: `D:\Kiro\12 Des 2025\src\components\guru\GuruHome.jsx`
2. Cari baris ini (ada 2 tempat):

```javascript
// MODE TESTING: Validasi GPS dinonaktifkan
const TESTING_MODE = true
```

3. Ubah `true` menjadi `false`:

```javascript
// MODE TESTING: Validasi GPS dinonaktifkan
const TESTING_MODE = false
```

**PENTING**: Ada **2 tempat** yang harus diubah:
- Baris ~41 (untuk presensi masuk)
- Baris ~154 (untuk presensi pulang)

#### STEP 2: Build Aplikasi

Buka Command Prompt (CMD):

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

#### STEP 3: Upload ke Server

1. Buka **File Manager** di cPanel
2. Masuk ke **`public_html`**
3. **Hapus**:
   - ❌ `index.html` (lama)
   - ❌ Folder `assets` (lama)
4. **Upload** dari `D:\Kiro\12 Des 2025\dist\`:
   - ✅ `index.html` (baru)
   - ✅ Folder `assets` (baru)

#### STEP 4: Test

1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Login sebagai guru
4. Coba presensi dari rumah (bukan di sekolah)
5. **Harus muncul error**: "Anda berada di luar jangkauan sekolah" ✅

---

### **OPSI 2: Edit File Langsung di cPanel** (TIDAK RECOMMENDED)

**⚠️ PERINGATAN**: Cara ini TIDAK RECOMMENDED karena:
- File di `public_html` adalah hasil build (sudah di-minify/compress)
- Sulit dibaca dan diedit
- Mudah salah dan merusak aplikasi
- Perubahan akan hilang saat build ulang

**Jika tetap ingin edit di cPanel**:
1. File yang perlu diedit ada di folder `assets` (file JavaScript yang sudah di-minify)
2. Cari string `TESTING_MODE=!0` atau `TESTING_MODE=true`
3. Ubah menjadi `TESTING_MODE=!1` atau `TESTING_MODE=false`
4. Tapi ini sangat sulit dan berisiko!

**REKOMENDASI**: Gunakan **OPSI 1** (edit di komputer lalu build & upload)

---

## 📋 LOKASI FILE YANG PERLU DIUBAH

### **File di Komputer:**
```
D:\Kiro\12 Des 2025\src\components\guru\GuruHome.jsx
```

### **Baris yang Perlu Diubah:**

**Lokasi 1 (Presensi Masuk):**
```javascript
// Sekitar baris 41
const TESTING_MODE = true  // ← Ubah jadi false
```

**Lokasi 2 (Presensi Pulang):**
```javascript
// Sekitar baris 154
const TESTING_MODE = true  // ← Ubah jadi false
```

---

## 🎯 PERBANDINGAN MODE

### **MODE TESTING (TESTING_MODE = true)**

**Presensi Masuk:**
- ✅ Bisa presensi dari mana saja
- ✅ Tidak perlu di sekolah
- ✅ Jika GPS error, tetap bisa presensi

**Presensi Pulang:**
- ✅ Bisa presensi pulang dari mana saja
- ✅ Tidak perlu di sekolah

**Cocok untuk:**
- Testing aplikasi
- Demo aplikasi
- Development

---

### **MODE PRODUCTION (TESTING_MODE = false)**

**Presensi Masuk:**
- ✅ Validasi GPS aktif
- ✅ Harus berada dalam radius 100m dari sekolah
- ❌ Jika di luar radius, muncul error
- ❌ Jika GPS error, tidak bisa presensi

**Presensi Pulang:**
- ✅ Validasi GPS aktif
- ✅ Harus berada dalam radius 100m dari sekolah
- ❌ Jika di luar radius, muncul error

**Cocok untuk:**
- Penggunaan sebenarnya
- Production environment
- Sekolah yang ingin validasi lokasi ketat

---

## 🗺️ KOORDINAT SEKOLAH

Koordinat sekolah yang digunakan untuk validasi:

```javascript
const SCHOOL_LOCATION = {
  latitude: -6.2088,    // Latitude sekolah
  longitude: 106.8456,  // Longitude sekolah
  radius: 100           // Radius dalam meter (100m)
}
```

**Jika ingin mengubah koordinat sekolah:**
1. Buka file `src/components/guru/GuruHome.jsx`
2. Cari `SCHOOL_LOCATION`
3. Ubah `latitude` dan `longitude` sesuai lokasi sekolah Anda
4. Ubah `radius` jika ingin jarak validasi berbeda (default: 100 meter)

**Cara mendapatkan koordinat sekolah:**
1. Buka Google Maps
2. Cari lokasi sekolah
3. Klik kanan pada lokasi
4. Pilih koordinat yang muncul (contoh: -6.2088, 106.8456)
5. Copy dan paste ke kode

---

## 🧪 CARA TEST VALIDASI GPS

### **Test 1: Presensi dari Sekolah (Harus Berhasil)**
1. Pergi ke sekolah (dalam radius 100m)
2. Login sebagai guru
3. Klik "Presensi Masuk"
4. **Hasil**: Presensi berhasil ✅

### **Test 2: Presensi dari Rumah (Harus Gagal)**
1. Di rumah (di luar radius 100m dari sekolah)
2. Login sebagai guru
3. Klik "Presensi Masuk"
4. **Hasil**: Muncul error "Anda berada di luar jangkauan sekolah (XXXm dari sekolah)" ✅

### **Test 3: GPS Dimatikan (Harus Gagal)**
1. Matikan GPS/Location di HP/Laptop
2. Login sebagai guru
3. Klik "Presensi Masuk"
4. **Hasil**: Muncul error "Gagal mendapatkan lokasi" ✅

---

## 🔍 TROUBLESHOOTING

### Masalah: Masih bisa presensi dari mana saja setelah diubah

**Penyebab**: File belum diupload atau cache belum clear

**Solusi**:
1. Pastikan sudah build ulang: `npm run build`
2. Upload file baru ke `public_html`
3. Clear cache browser (Ctrl + Shift + Delete)
4. Hard refresh (Ctrl + F5)

---

### Masalah: Error "Gagal mendapatkan lokasi" padahal GPS aktif

**Penyebab**: Browser tidak mengizinkan akses lokasi

**Solusi**:
1. Pastikan website menggunakan HTTPS (bukan HTTP)
2. Klik ikon gembok di address bar
3. Pilih "Site settings" atau "Permissions"
4. Ubah "Location" menjadi "Allow"
5. Refresh halaman

---

### Masalah: Validasi GPS terlalu ketat/longgar

**Penyebab**: Radius terlalu kecil/besar

**Solusi**: Ubah nilai `radius` di `SCHOOL_LOCATION`:
- Radius 50m = Sangat ketat (hanya di dalam gedung sekolah)
- Radius 100m = Normal (default)
- Radius 200m = Longgar (area sekitar sekolah)
- Radius 500m = Sangat longgar (area luas)

---

## 📝 CHECKLIST AKTIVASI GPS

- [ ] Edit file `GuruHome.jsx` di komputer
- [ ] Ubah `TESTING_MODE = true` menjadi `false` (2 tempat)
- [ ] (Opsional) Ubah koordinat sekolah jika perlu
- [ ] Build aplikasi: `npm run build`
- [ ] Upload `index.html` dan `assets` baru ke `public_html`
- [ ] Clear cache browser
- [ ] Test presensi dari sekolah (harus berhasil)
- [ ] Test presensi dari rumah (harus gagal)

---

## 🎯 REKOMENDASI

**Untuk Testing/Development:**
- ✅ Gunakan `TESTING_MODE = true`
- ✅ Bisa test dari mana saja

**Untuk Production/Penggunaan Sebenarnya:**
- ✅ Gunakan `TESTING_MODE = false`
- ✅ Validasi GPS aktif
- ✅ Guru harus berada di sekolah untuk presensi

---

## 📞 BANTUAN

Jika ada masalah atau pertanyaan, silakan beritahu saya dengan menyertakan:
1. Screenshot error yang muncul
2. Lokasi Anda saat mencoba presensi (di sekolah/di rumah)
3. Browser console (F12 → Console tab)

Saya akan bantu troubleshoot! 😊
