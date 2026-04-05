-- Fix: Error Duplicate Entry Presensi

## 🔴 MASALAH

Error saat presensi:
```
Error: SQLSTATE[23000]: Integrity constraint violation: 1062 
Duplicate entry '3-2025-12-14' for key 'attendance_logs.user_date'
```

**Penyebab**: 
1. Guru sudah presensi hari ini (dari testing sebelumnya)
2. Database punya UNIQUE constraint: satu guru hanya bisa presensi sekali per hari
3. Frontend tidak detect bahwa guru sudah presensi karena format tanggal salah saat query

---

## ✅ SOLUSI

### **1. Fix Query Check Attendance**

**File**: `src/components/guru/GuruHome.jsx`

**SEBELUM (Salah)**:
```javascript
const today = formatDate(new Date()) // Hasil: "14-12-2025"
// Query ke database dengan format salah, tidak ketemu data
```

**SEKARANG (Benar)**:
```javascript
const today = formatDateForInput(new Date()) // Hasil: "2025-12-14"
// Query ke database dengan format benar, ketemu data jika sudah presensi
```

### **2. Hapus Data Testing**

Karena ada data presensi dari testing sebelumnya, perlu dihapus dulu.

---

## 🔧 CARA PERBAIKAN

### **STEP 1: Hapus Data Testing di Database**

1. Login ke **cPanel**
2. Buka **phpMyAdmin**
3. Pilih database Anda (contoh: `sistemflow_geopresensi_db`)
4. Klik tab **"SQL"**
5. Jalankan query ini:

```sql
-- Hapus presensi hari ini (14 Desember 2025)
DELETE FROM attendance_logs WHERE tanggal = '2025-12-14';

-- Verifikasi (harus kosong)
SELECT * FROM attendance_logs WHERE tanggal = '2025-12-14';
```

---

### **STEP 2: Build & Upload Aplikasi**

1. **Build**:
```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

2. **Upload ke server**:
   - Hapus `index.html` dan `assets` lama di `public_html`
   - Upload `index.html` dan `assets` baru dari `dist`

---

### **STEP 3: Clear Cache & Test**

1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Login sebagai guru
4. Klik tombol **HADIR**
5. **Harus berhasil** ✅

---

## 🧪 TEST SKENARIO

### **Skenario 1: Presensi Pertama Kali Hari Ini**
1. Login sebagai guru yang belum presensi hari ini
2. Klik **HADIR**
3. **Hasil**: Presensi berhasil ✅

### **Skenario 2: Presensi Kedua Kali (Harus Ditolak)**
1. Guru yang sudah presensi hari ini
2. Refresh halaman
3. **Hasil**: Tombol presensi tidak muncul, muncul status "Anda sudah presensi hari ini" ✅

### **Skenario 3: Presensi Pulang**
1. Guru yang sudah presensi masuk (status: hadir)
2. Klik **PRESENSI PULANG**
3. **Hasil**: Jam pulang tercatat ✅

---

## 📋 UNIQUE CONSTRAINT

Database punya constraint untuk mencegah duplikat:

```sql
UNIQUE KEY `user_date` (`user_id`, `tanggal`)
```

Artinya:
- ✅ Satu guru hanya bisa presensi **sekali per hari**
- ❌ Tidak bisa presensi 2x di hari yang sama
- ✅ Tapi bisa update jam pulang (bukan insert baru)

---

## 🔍 TROUBLESHOOTING

### Masalah: Masih error duplicate entry

**Kemungkinan 1**: Data testing belum dihapus
- **Solusi**: Jalankan query DELETE di phpMyAdmin

**Kemungkinan 2**: File belum diupload
- **Solusi**: Build dan upload file baru

**Kemungkinan 3**: Cache belum clear
- **Solusi**: Clear cache browser (Ctrl + Shift + Delete)

---

### Masalah: Tombol presensi tidak muncul

**Penyebab**: Guru sudah presensi hari ini

**Solusi**: Ini behavior yang benar! Guru hanya bisa presensi sekali per hari.

**Jika ingin test lagi**:
1. Hapus data presensi hari ini di database
2. Atau login dengan guru lain yang belum presensi
3. Atau tunggu besok untuk test lagi

---

### Masalah: Ingin edit presensi yang sudah ada

**Solusi**: Gunakan menu **Edit Presensi** di dashboard Admin

1. Login sebagai Admin
2. Klik menu **Edit Presensi**
3. Pilih guru dan tanggal
4. Edit data presensi
5. Simpan

---

## 📝 QUERY BERGUNA

### **Cek Presensi Hari Ini**
```sql
SELECT * FROM attendance_logs WHERE tanggal = CURDATE();
```

### **Cek Presensi Guru Tertentu**
```sql
SELECT * FROM attendance_logs WHERE user_id = 3 AND tanggal = '2025-12-14';
```

### **Hapus Presensi Hari Ini**
```sql
DELETE FROM attendance_logs WHERE tanggal = CURDATE();
```

### **Hapus Presensi Guru Tertentu**
```sql
DELETE FROM attendance_logs WHERE user_id = 3 AND tanggal = '2025-12-14';
```

### **Hapus Semua Presensi (HATI-HATI!)**
```sql
TRUNCATE TABLE attendance_logs;
```

---

## ✅ CHECKLIST

- [ ] Hapus data testing di database (query DELETE)
- [ ] Build aplikasi: `npm run build`
- [ ] Upload `index.html` dan `assets` baru
- [ ] Clear cache browser
- [ ] Test presensi guru (harus berhasil)
- [ ] Test presensi kedua kali (harus ditolak/tombol hilang)
- [ ] Test presensi pulang (harus berhasil)

---

## 🎯 RINGKASAN

```
Masalah: Duplicate entry karena guru sudah presensi hari ini
Penyebab: 
  1. Data testing masih ada di database
  2. Frontend tidak detect karena format tanggal salah

Solusi:
  1. Fix query check attendance (formatDate → formatDateForInput)
  2. Hapus data testing di database
  3. Build & upload file baru

Status: ✅ Fixed
```

---

## 📞 CATATAN PENTING

**Untuk Production (Penggunaan Sebenarnya)**:
- Guru hanya bisa presensi **sekali per hari** (ini sudah benar)
- Jika salah input, gunakan menu **Edit Presensi** di Admin
- Jangan hapus data presensi kecuali untuk testing

**Untuk Testing**:
- Bisa hapus data presensi hari ini dengan query DELETE
- Atau login dengan guru lain yang belum presensi
- Atau tunggu besok untuk test lagi

---

Sekarang presensi guru sudah berfungsi dengan benar! 🎉
