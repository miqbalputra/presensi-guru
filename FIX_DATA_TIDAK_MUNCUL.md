# Fix: Data Presensi Tidak Muncul di Riwayat & Dashboard

## 🔴 MASALAH

Presensi sudah berhasil tersimpan ke database, tapi:
- ❌ Tidak muncul di Riwayat Guru
- ❌ Tidak muncul di Dashboard Admin
- ❌ Tidak muncul di Download Laporan

**Penyebab**: 
Format tanggal saat filter/query data salah. Database menyimpan format `yyyy-mm-dd`, tapi kode masih mengasumsikan format `dd-mm-yyyy`.

---

## ✅ SOLUSI

### **File yang Diperbaiki:**

1. **src/components/guru/GuruRiwayat.jsx**
   - Fix filter tanggal saat load riwayat
   - Fix query check attendance

2. **src/components/admin/DashboardHome.jsx**
   - Fix filter hari ini, kemarin, 7/14/30 hari
   - Fix query data untuk chart

3. **src/components/admin/DownloadLaporan.jsx**
   - Fix filter tanggal untuk download laporan
   - Fix preview data guru

---

## 🔧 PERUBAHAN DETAIL

### **GuruRiwayat.jsx**

**SEBELUM (Salah)**:
```javascript
const logDate = new Date(log.tanggal.split('-').reverse().join('-'))
// Mengasumsikan format dd-mm-yyyy, tapi database yyyy-mm-dd
```

**SEKARANG (Benar)**:
```javascript
const logDate = new Date(log.tanggal)
// Langsung parse yyyy-mm-dd dari database
```

### **DashboardHome.jsx**

**SEBELUM (Salah)**:
```javascript
const todayStr = formatDate(today) // Hasil: "14-12-2025"
return attendanceLogs.filter(log => log.tanggal === todayStr) // Tidak cocok!
```

**SEKARANG (Benar)**:
```javascript
const todayStr = formatDateForInput(today) // Hasil: "2025-12-14"
return attendanceLogs.filter(log => log.tanggal === todayStr) // Cocok!
```

### **DownloadLaporan.jsx**

**SEBELUM (Salah)**:
```javascript
const logDate = new Date(log.tanggal.split('-').reverse().join('-'))
```

**SEKARANG (Benar)**:
```javascript
const logDate = new Date(log.tanggal)
```

---

## 📤 CARA UPLOAD

### **STEP 1: Build Aplikasi**

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

### **STEP 2: Upload ke Server**

1. Login ke cPanel
2. Buka File Manager
3. Masuk ke `public_html`
4. Hapus `index.html` dan folder `assets` lama
5. Upload `index.html` dan folder `assets` baru dari `dist`

### **STEP 3: Clear Cache & Test**

1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Test semua fitur

---

## 🧪 TEST LENGKAP

### **Test 1: Riwayat Guru**
1. Login sebagai guru yang sudah presensi
2. Klik tab **Riwayat Saya**
3. **Hasil**: Data presensi muncul ✅

### **Test 2: Dashboard Admin - Hari Ini**
1. Login sebagai admin
2. Lihat dashboard
3. Filter: **Hari Ini**
4. **Hasil**: Data presensi hari ini muncul ✅

### **Test 3: Dashboard Admin - 7 Hari**
1. Filter: **7 Hari Terakhir**
2. **Hasil**: Data 7 hari terakhir muncul di chart ✅

### **Test 4: Download Laporan - Semua Guru**
1. Klik menu **Download Laporan**
2. Tab: **Semua Guru**
3. Pilih range tanggal
4. **Hasil**: Preview data muncul ✅
5. Download PDF/Excel
6. **Hasil**: File berisi data presensi ✅

### **Test 5: Download Laporan - Guru Tertentu**
1. Tab: **Guru Tertentu**
2. Pilih guru
3. Pilih range tanggal
4. **Hasil**: Preview data guru muncul ✅
5. Download PDF/Excel
6. **Hasil**: File berisi data presensi guru ✅

---

## 📋 CHECKLIST

- [ ] Build aplikasi: `npm run build`
- [ ] Upload `index.html` dan `assets` baru
- [ ] Clear cache browser
- [ ] Test riwayat guru (harus muncul data)
- [ ] Test dashboard admin (harus muncul data hari ini)
- [ ] Test filter 7/14/30 hari (harus muncul data)
- [ ] Test download laporan semua guru (harus muncul preview)
- [ ] Test download laporan guru tertentu (harus muncul preview)
- [ ] Test download PDF (harus berisi data)
- [ ] Test download Excel (harus berisi data)

---

## 🔍 TROUBLESHOOTING

### Masalah: Data masih tidak muncul

**Kemungkinan 1**: File belum diupload
- **Solusi**: Pastikan sudah upload file baru dari `dist`

**Kemungkinan 2**: Cache belum clear
- **Solusi**: Clear cache (Ctrl + Shift + Delete) + Hard refresh (Ctrl + F5)

**Kemungkinan 3**: Data belum ada di database
- **Solusi**: Cek database di phpMyAdmin
```sql
SELECT * FROM attendance_logs WHERE tanggal = CURDATE();
```

**Kemungkinan 4**: Format tanggal di database salah
- **Solusi**: Cek format tanggal di database, harus `yyyy-mm-dd`
```sql
SELECT tanggal FROM attendance_logs LIMIT 5;
```

---

### Masalah: Data muncul tapi tanggal salah

**Penyebab**: Timezone atau format tampilan

**Solusi**: 
- Data di database format `yyyy-mm-dd` (benar)
- Tampilan UI format `dd-mm-yyyy` (untuk Indonesia)
- Ini sudah benar, tidak perlu diubah

---

## 📝 QUERY BERGUNA

### **Cek Data Presensi Hari Ini**
```sql
SELECT * FROM attendance_logs WHERE tanggal = CURDATE();
```

### **Cek Data Presensi 7 Hari Terakhir**
```sql
SELECT * FROM attendance_logs 
WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY tanggal DESC;
```

### **Cek Data Presensi Per Guru**
```sql
SELECT u.nama, a.* 
FROM attendance_logs a
JOIN users u ON a.user_id = u.id
WHERE a.tanggal = CURDATE();
```

### **Cek Format Tanggal di Database**
```sql
SELECT tanggal, DATE_FORMAT(tanggal, '%Y-%m-%d') as format_check 
FROM attendance_logs 
LIMIT 5;
```

---

## 🎯 RINGKASAN

```
Masalah: Data presensi tidak muncul di riwayat & dashboard
Penyebab: Format tanggal saat filter salah (dd-mm-yyyy vs yyyy-mm-dd)

Solusi:
- GuruRiwayat: Fix filter tanggal
- DashboardHome: Fix query hari ini & filter range
- DownloadLaporan: Fix filter tanggal

File: GuruRiwayat.jsx, DashboardHome.jsx, DownloadLaporan.jsx
Status: ✅ Fixed
```

---

## 📞 CATATAN PENTING

**Format Tanggal:**
- Database: `yyyy-mm-dd` (contoh: 2025-12-14)
- Tampilan UI: `dd-mm-yyyy` (contoh: 14-12-2025)
- Query/Filter: Harus pakai `yyyy-mm-dd`

**Fungsi yang Benar:**
- Untuk database/query: `formatDateForInput()` → `yyyy-mm-dd`
- Untuk tampilan UI: `formatDate()` → `dd-mm-yyyy`
- Untuk header: `formatFullDate()` → `Minggu, 14 Desember 2025`

---

Sekarang semua data presensi akan muncul dengan benar di riwayat, dashboard, dan download laporan! 🎉
