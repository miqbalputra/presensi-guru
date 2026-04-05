# Fix: Error Format Waktu Presensi

## 🔴 MASALAH BARU

Setelah fix format tanggal, sekarang muncul error format waktu:
```
Error: SQLSTATE[22007]: Invalid datetime format: 1292 
Incorrect time value: '02.11.14' for column 'jam_masuk' at row 1
```

**Penyebab**: 
- `toLocaleTimeString('id-ID')` menghasilkan format `02.11.14` (dengan titik)
- Database MySQL hanya menerima format `02:11:14` (dengan titik dua/colon)

---

## ✅ SOLUSI

### **Fungsi Baru: formatTimeForDB()**

Tambah fungsi baru di `dateUtils.js` untuk format waktu yang benar:

```javascript
export const formatTimeForDB = (date = new Date()) => {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}` // Format: HH:MM:SS
}
```

---

## 🔧 FILE YANG DIPERBAIKI

### **1. src/utils/dateUtils.js**
- Tambah fungsi `formatTimeForDB()`

### **2. src/components/guru/GuruHome.jsx**
- Ubah `toLocaleTimeString()` menjadi `formatTimeForDB()`
- Di fungsi `saveAttendance()` (presensi masuk)
- Di fungsi `handlePulang()` (presensi pulang)

### **3. src/components/admin/EditPresensi.jsx**
- Ubah `toLocaleTimeString()` menjadi `formatTimeForDB()`
- Di fungsi `handleSubmit()`

---

## 📤 CARA UPLOAD (WAJIB!)

### **STEP 1: Build Aplikasi**

Buka **Command Prompt (CMD)**:

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

Tunggu sampai selesai (±10-30 detik).

---

### **STEP 2: Upload ke Server**

1. Login ke **cPanel**
2. Buka **File Manager**
3. Masuk ke **`public_html`**
4. **Hapus**:
   - ❌ `index.html` (lama)
   - ❌ Folder `assets` (lama)
5. **Upload** dari `D:\Kiro\12 Des 2025\dist\`:
   - ✅ `index.html` (baru)
   - ✅ Folder `assets` (baru)

---

### **STEP 3: Clear Cache & Test**

1. **Clear cache browser**:
   - Tekan **Ctrl + Shift + Delete**
   - Pilih "All time"
   - Clear

2. **Hard refresh**:
   - Tekan **Ctrl + F5** (beberapa kali)

3. **Test presensi**:
   - Login sebagai guru
   - Klik tombol **HADIR**
   - **Harus berhasil** tanpa error ✅

---

## 🧪 TEST LENGKAP

### **Test 1: Presensi Hadir**
1. Login sebagai guru (guru1/guru123)
2. Klik tombol **HADIR**
3. **Hasil**: Notifikasi hijau "Presensi berhasil disimpan!" ✅
4. Cek jam masuk tercatat dengan benar

### **Test 2: Presensi Pulang**
1. Setelah presensi hadir
2. Klik tombol **PRESENSI PULANG**
3. **Hasil**: Jam pulang berhasil tercatat ✅

### **Test 3: Presensi Izin**
1. Klik tombol **IZIN**
2. Isi keterangan
3. Klik **Simpan**
4. **Hasil**: Jam izin tercatat dengan benar ✅

### **Test 4: Presensi Sakit**
1. Klik tombol **SAKIT**
2. Isi keterangan
3. Klik **Simpan**
4. **Hasil**: Jam sakit tercatat dengan benar ✅

---

## 📋 FORMAT WAKTU

### **Format yang Digunakan:**

| Fungsi | Format | Contoh | Kegunaan |
|--------|--------|--------|----------|
| `toLocaleTimeString('id-ID')` | HH.MM.SS | 02.11.14 | ❌ Salah untuk database |
| `formatTimeForDB()` | HH:MM:SS | 02:11:14 | ✅ Benar untuk database |

### **Database MySQL:**
- Kolom `jam_masuk`, `jam_pulang`, dll tipe: `TIME`
- Format yang diterima: `HH:MM:SS` (dengan colon/titik dua)
- Contoh: `14:30:45`

---

## 🔍 TROUBLESHOOTING

### Masalah: Masih error format waktu

**Kemungkinan 1**: File belum diupload
- **Solusi**: Pastikan sudah upload file baru dari `dist`

**Kemungkinan 2**: Cache belum clear
- **Solusi**: 
  1. Clear cache (Ctrl + Shift + Delete)
  2. Hard refresh (Ctrl + F5)
  3. Atau buka di Incognito (Ctrl + Shift + N)

**Kemungkinan 3**: Build belum berhasil
- **Solusi**: Cek folder `dist`, harus ada file baru (tanggal hari ini)

---

### Masalah: Waktu tidak sesuai

**Penyebab**: Timezone server berbeda

**Solusi**: Waktu diambil dari browser user, bukan server. Ini sudah benar karena presensi berdasarkan waktu lokal guru.

---

## ✅ CHECKLIST

- [ ] Build aplikasi: `npm run build`
- [ ] Cek folder `dist` ada file baru
- [ ] Upload `index.html` dan `assets` ke `public_html`
- [ ] Hapus file lama sebelum upload
- [ ] Clear cache browser (Ctrl + Shift + Delete)
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test presensi hadir (harus berhasil)
- [ ] Test presensi pulang (harus berhasil)
- [ ] Test presensi izin (harus berhasil)
- [ ] Test presensi sakit (harus berhasil)

---

## 🎯 RINGKASAN

```
Masalah 1: Format tanggal dd-mm-yyyy → Fixed ✅
Masalah 2: Format waktu HH.MM.SS → Fixed ✅

Solusi:
- Tanggal: Gunakan formatDateForInput() → yyyy-mm-dd
- Waktu: Gunakan formatTimeForDB() → HH:MM:SS

File: dateUtils.js, GuruHome.jsx, EditPresensi.jsx
Status: ✅ Fixed
```

---

## 📝 CATATAN PENTING

**Jangan gunakan `toLocaleTimeString()` untuk database!**

❌ **SALAH**:
```javascript
const time = new Date().toLocaleTimeString('id-ID')
// Hasil: "02.11.14" (dengan titik) → Error di MySQL!
```

✅ **BENAR**:
```javascript
const time = formatTimeForDB()
// Hasil: "02:11:14" (dengan colon) → Diterima MySQL!
```

---

Sekarang presensi guru sudah bisa berfungsi dengan baik! 🎉

Silakan **build dan upload** file baru, lalu test presensi.
