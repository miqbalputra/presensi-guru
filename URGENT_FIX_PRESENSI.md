# URGENT: Fix Error Presensi Guru

## ⚠️ PENTING!

File di komputer sudah diperbaiki, tapi **belum diupload ke server**.
Server masih menggunakan file lama yang error.

---

## 🚀 LANGKAH CEPAT (WAJIB DILAKUKAN):

### **STEP 1: Build Aplikasi**

1. Buka **Command Prompt** (CMD) - BUKAN PowerShell!
   - Tekan Windows + R
   - Ketik: `cmd`
   - Tekan Enter

2. Jalankan command ini:

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

3. Tunggu sampai selesai (±10-30 detik)
4. Harus muncul pesan "build complete" atau "built in XXs"

---

### **STEP 2: Cek Hasil Build**

1. Buka folder: `D:\Kiro\12 Des 2025\dist`
2. Pastikan ada:
   - ✅ File `index.html` (tanggal hari ini)
   - ✅ Folder `assets` (tanggal hari ini)

Jika tidak ada atau tanggalnya lama, build belum berhasil!

---

### **STEP 3: Upload ke Server**

1. Login ke **cPanel**
2. Buka **File Manager**
3. Masuk ke folder **`public_html`**

4. **HAPUS file lama**:
   - Centang `index.html`
   - Centang folder `assets`
   - Klik **Delete**
   - Konfirmasi

5. **Upload file baru**:
   - Klik tombol **Upload** (di toolbar atas)
   - Pilih file dari `D:\Kiro\12 Des 2025\dist\`:
     - `index.html`
     - Folder `assets` (upload semua isinya)
   - Tunggu sampai upload selesai (100%)

---

### **STEP 4: Clear Cache & Test**

1. **Clear cache browser**:
   - Tekan **Ctrl + Shift + Delete**
   - Pilih "Cached images and files"
   - Pilih "All time"
   - Klik "Clear data"

2. **Hard refresh**:
   - Tekan **Ctrl + F5** (beberapa kali)

3. **Test presensi**:
   - Login sebagai guru
   - Klik tombol **HADIR**
   - **Harus berhasil** tanpa error ✅

---

## 🔍 TROUBLESHOOTING

### Masalah: npm run build error

**Error PowerShell**:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded
```

**Solusi**: Gunakan **Command Prompt (CMD)**, bukan PowerShell!

---

### Masalah: Build berhasil tapi masih error

**Kemungkinan 1**: File belum diupload
- **Solusi**: Pastikan sudah upload file dari folder `dist`

**Kemungkinan 2**: Upload file salah
- **Solusi**: Upload file dari `D:\Kiro\12 Des 2025\dist\`, BUKAN dari `D:\Kiro\12 Des 2025\src\`

**Kemungkinan 3**: Cache belum clear
- **Solusi**: 
  1. Clear cache (Ctrl + Shift + Delete)
  2. Hard refresh (Ctrl + F5)
  3. Atau buka di Incognito mode (Ctrl + Shift + N)

---

### Masalah: Tidak bisa hapus file di cPanel

**Penyebab**: File sedang digunakan atau permission error

**Solusi**:
1. Tunggu beberapa detik
2. Refresh File Manager (F5)
3. Coba hapus lagi
4. Jika masih gagal, rename file lama (tambah `.old`)
5. Lalu upload file baru

---

## 📋 CHECKLIST WAJIB

- [ ] Buka CMD (bukan PowerShell)
- [ ] Jalankan `npm run build`
- [ ] Build berhasil (muncul "build complete")
- [ ] Cek folder `dist` ada file baru (tanggal hari ini)
- [ ] Login cPanel
- [ ] Hapus `index.html` dan `assets` lama di `public_html`
- [ ] Upload `index.html` dan `assets` baru dari `dist`
- [ ] Upload selesai 100%
- [ ] Clear cache browser (Ctrl + Shift + Delete)
- [ ] Hard refresh (Ctrl + F5)
- [ ] Test presensi guru
- [ ] Berhasil tanpa error ✅

---

## 🎯 VERIFIKASI

### **Cara Memastikan File Sudah Terupload:**

1. Buka browser console (F12)
2. Klik tab **Network**
3. Refresh halaman (F5)
4. Cari file JavaScript (di folder assets)
5. Klik file tersebut
6. Cek tanggal modified → Harus hari ini!

### **Cara Memastikan Kode Sudah Benar:**

1. Buka browser console (F12)
2. Klik tab **Console**
3. Ketik: `localStorage.clear()`
4. Tekan Enter
5. Refresh halaman (F5)
6. Login sebagai guru
7. Klik HADIR
8. Lihat di tab **Network** → Request ke API
9. Cek payload → Field `tanggal` harus format `2025-12-14` (bukan `14-12-2025`)

---

## ⏱️ ESTIMASI WAKTU

- Build: 30 detik
- Upload: 1-2 menit (tergantung internet)
- Clear cache & test: 30 detik

**Total: ±3-5 menit**

---

## 🆘 JIKA MASIH GAGAL

Screenshot dan kirim ke saya:
1. Error message yang muncul
2. Browser console (F12 → Console tab)
3. Network tab (F12 → Network tab → klik request yang error)
4. Hasil `npm run build` di Command Prompt

Dengan screenshot ini saya bisa bantu lebih spesifik!

---

## 📝 CATATAN

**File yang sudah diperbaiki di komputer:**
- ✅ `src/components/guru/GuruHome.jsx`
- ✅ `src/components/admin/EditPresensi.jsx`

**Yang perlu dilakukan:**
- ⏳ Build aplikasi (`npm run build`)
- ⏳ Upload hasil build ke server
- ⏳ Clear cache browser
- ⏳ Test presensi

**JANGAN edit file di cPanel!** File di `public_html` adalah hasil build yang sudah di-minify. Edit harus dilakukan di komputer, lalu build & upload.

---

Silakan ikuti **STEP 1-4** di atas dengan teliti. Jika ada yang tidak jelas atau error, screenshot dan beritahu saya!
