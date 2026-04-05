# Fix: Error Format Tanggal Presensi

## 🔴 MASALAH

Saat guru klik tombol **HADIR**, muncul error:
```
Error: SQLSTATE[22007]: Invalid datetime format: 1292 
Incorrect date value: '14-12-2025' for column 'tanggal' at row 1
```

**Penyebab**: 
- Frontend mengirim tanggal dengan format `dd-mm-yyyy` (format Indonesia)
- Database MySQL hanya menerima format `yyyy-mm-dd` (format ISO)

---

## ✅ SOLUSI

### **File yang Diperbaiki:**

1. **src/components/guru/GuruHome.jsx**
   - Ubah `formatDate()` menjadi `formatDateForInput()` saat save presensi
   - Format tanggal dari `14-12-2025` menjadi `2025-12-14`

2. **src/components/admin/EditPresensi.jsx**
   - Hapus konversi tanggal yang tidak perlu
   - Gunakan langsung format dari input date (sudah `yyyy-mm-dd`)

---

## 🔧 PERUBAHAN DETAIL

### **GuruHome.jsx - Fungsi saveAttendance**

**SEBELUM (Salah):**
```javascript
const today = formatDate(new Date()) // Hasil: "14-12-2025" ❌
```

**SEKARANG (Benar):**
```javascript
const today = formatDateForInput(new Date()) // Hasil: "2025-12-14" ✅
```

### **EditPresensi.jsx - Fungsi handleSubmit**

**SEBELUM (Salah):**
```javascript
const targetDate = formatDate(new Date(formData.tanggal)) // Hasil: "14-12-2025" ❌
```

**SEKARANG (Benar):**
```javascript
const targetDate = formData.tanggal // Sudah "2025-12-14" dari input ✅
```

---

## 📤 CARA UPLOAD

### **STEP 1: Build Aplikasi**

Buka Command Prompt (CMD):

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

### **STEP 2: Upload ke Server**

1. Buka **File Manager** di cPanel
2. Masuk ke **`public_html`**
3. **Hapus**:
   - ❌ `index.html` (lama)
   - ❌ Folder `assets` (lama)
4. **Upload** dari `D:\Kiro\12 Des 2025\dist\`:
   - ✅ `index.html` (baru)
   - ✅ Folder `assets` (baru)

### **STEP 3: Test**

1. Clear cache browser (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Login sebagai guru
4. Klik tombol **HADIR**
5. **Harus berhasil** tanpa error ✅

---

## 🧪 TEST LENGKAP

### **Test 1: Presensi Hadir**
1. Login sebagai guru (guru1/guru123)
2. Klik tombol **HADIR**
3. **Hasil**: Muncul notifikasi hijau "Presensi berhasil disimpan!" ✅

### **Test 2: Presensi Izin**
1. Klik tombol **IZIN**
2. Isi keterangan
3. Klik **Simpan**
4. **Hasil**: Presensi berhasil tersimpan ✅

### **Test 3: Presensi Sakit**
1. Klik tombol **SAKIT**
2. Isi keterangan
3. Klik **Simpan**
4. **Hasil**: Presensi berhasil tersimpan ✅

### **Test 4: Presensi Pulang**
1. Setelah presensi hadir
2. Klik tombol **PRESENSI PULANG**
3. **Hasil**: Jam pulang berhasil tercatat ✅

### **Test 5: Admin Edit Presensi**
1. Login sebagai admin
2. Masuk menu **Edit Presensi**
3. Tambah presensi manual
4. **Hasil**: Presensi berhasil ditambahkan ✅

---

## 📋 FORMAT TANGGAL

### **Format yang Digunakan:**

| Fungsi | Format | Contoh | Kegunaan |
|--------|--------|--------|----------|
| `formatDate()` | dd-mm-yyyy | 14-12-2025 | Tampilan UI (Indonesia) |
| `formatDateForInput()` | yyyy-mm-dd | 2025-12-14 | Database & Input Date |
| `formatFullDate()` | Hari, DD Bulan YYYY | Minggu, 14 Desember 2025 | Tampilan lengkap |

### **Kapan Menggunakan:**

**formatDate() - Untuk Tampilan:**
```javascript
// Tampilkan tanggal di UI
<p>Tanggal: {formatDate(new Date())}</p>
// Output: 14-12-2025
```

**formatDateForInput() - Untuk Database:**
```javascript
// Simpan ke database
const tanggal = formatDateForInput(new Date())
// Output: 2025-12-14 (format MySQL)
```

**formatFullDate() - Untuk Header:**
```javascript
// Tampilkan di header
<h2>{formatFullDate(new Date())}</h2>
// Output: Minggu, 14 Desember 2025
```

---

## 🔍 TROUBLESHOOTING

### Masalah: Masih muncul error format tanggal

**Kemungkinan 1**: File belum diupload
- **Solusi**: Pastikan sudah upload file baru dari `dist`

**Kemungkinan 2**: Cache belum clear
- **Solusi**: Clear cache browser (Ctrl + Shift + Delete)

**Kemungkinan 3**: Build belum berhasil
- **Solusi**: Cek folder `dist`, harus ada file baru (tanggal hari ini)

---

### Masalah: Tanggal di UI tampil salah

**Penyebab**: Menggunakan fungsi format yang salah

**Solusi**: 
- Untuk tampilan UI → Gunakan `formatDate()`
- Untuk database → Gunakan `formatDateForInput()`

---

### Masalah: Error "Cannot read property 'split' of undefined"

**Penyebab**: Tanggal dari database null atau format salah

**Solusi**: Cek data di database, pastikan kolom `tanggal` format `yyyy-mm-dd`

---

## 📝 CATATAN PENTING

### **Database MySQL:**
- Kolom `tanggal` tipe: `DATE`
- Format yang diterima: `yyyy-mm-dd` (ISO 8601)
- Contoh: `2025-12-14`

### **Input HTML Date:**
- Input type="date" menghasilkan format: `yyyy-mm-dd`
- Tidak perlu konversi, langsung bisa disimpan ke database

### **Tampilan UI:**
- Gunakan format Indonesia: `dd-mm-yyyy`
- Atau format lengkap: `Minggu, 14 Desember 2025`

---

## ✅ CHECKLIST

- [ ] Build aplikasi: `npm run build`
- [ ] Upload `index.html` dan `assets` baru
- [ ] Clear cache browser
- [ ] Test presensi hadir (harus berhasil)
- [ ] Test presensi izin (harus berhasil)
- [ ] Test presensi sakit (harus berhasil)
- [ ] Test presensi pulang (harus berhasil)
- [ ] Test admin edit presensi (harus berhasil)

---

## 🎯 RINGKASAN

```
Masalah: Format tanggal dd-mm-yyyy tidak diterima MySQL
Solusi: Ubah ke format yyyy-mm-dd menggunakan formatDateForInput()
File: GuruHome.jsx, EditPresensi.jsx
Waktu: ±5 menit
Status: ✅ Fixed
```

Sekarang presensi guru sudah bisa berfungsi dengan baik tanpa error format tanggal! 🎉
