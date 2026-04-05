# Perbaikan: Mixed Content Error (HTTP vs HTTPS)

## 🔴 MASALAH

Website Anda menggunakan HTTPS (aman), tapi API URL di kode masih HTTP (tidak aman).
Browser memblokir request HTTP dari halaman HTTPS.

**Error**:
```
Mixed Content: The page at 'https://sistemflow.biz.id/login' 
was loaded over HTTPS, but requested an insecure resource 
'http://sistemflow.biz.id/api/...'
```

---

## ✅ SOLUSI

File `.env` sudah saya perbaiki dari:
```
VITE_API_URL=http://sistemflow.biz.id/api   ❌ HTTP
```

Menjadi:
```
VITE_API_URL=https://sistemflow.biz.id/api  ✅ HTTPS
```

Sekarang Anda perlu **build ulang** dan **upload ulang frontend**.

---

## 🔧 LANGKAH PERBAIKAN

### 1. Build Ulang Aplikasi

Buka Command Prompt dan jalankan:

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

Tunggu sampai selesai (±10-30 detik).

---

### 2. Upload Ulang Frontend

**HANYA upload ulang frontend, backend tidak perlu diubah!**

#### A. Hapus File Lama di public_html

1. Login ke cPanel
2. Buka File Manager
3. Masuk ke folder `public_html`
4. **Hapus file**:
   - ❌ index.html
   - ❌ Folder assets
   - ✅ JANGAN hapus .htaccess

#### B. Upload File Baru

1. Masih di folder `public_html`
2. Klik "Upload"
3. Pilih dari `D:\Kiro\12 Des 2025\dist\`:
   - ✅ index.html (yang baru)
   - ✅ Folder assets (yang baru)
4. Tunggu sampai selesai

---

### 3. Clear Cache Browser

Setelah upload selesai:

1. **Tekan Ctrl + Shift + Delete**
2. Pilih "Cached images and files"
3. Klik "Clear data"

Atau:

1. **Tekan Ctrl + F5** (hard refresh)

---

### 4. Test Login

1. Buka: `https://sistemflow.biz.id`
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`
3. Harus berhasil masuk!

---

## 📋 CHECKLIST

- [ ] File .env sudah berubah ke HTTPS (sudah saya perbaiki)
- [ ] Sudah jalankan `npm run build`
- [ ] Folder dist sudah ter-generate ulang
- [ ] Sudah hapus index.html lama di public_html
- [ ] Sudah hapus folder assets lama di public_html
- [ ] Sudah upload index.html baru
- [ ] Sudah upload folder assets baru
- [ ] Sudah clear cache browser (Ctrl + Shift + Delete)
- [ ] Test login berhasil

---

## ⚠️ CATATAN PENTING

**JANGAN hapus atau upload ulang**:
- ❌ Folder `api` (backend tidak perlu diubah)
- ❌ File `.htaccess` (biarkan tetap ada)
- ❌ Database (tidak perlu diubah)

**HANYA upload ulang**:
- ✅ index.html (dari dist)
- ✅ Folder assets (dari dist)

---

## 🎯 RINGKASAN

```
Masalah: API URL masih HTTP, website sudah HTTPS
Solusi: Build ulang dengan HTTPS, upload ulang frontend
Waktu: ±5 menit
```

---

## 🆘 JIKA MASIH ERROR

Setelah upload ulang, jika masih error:

1. **Clear cache browser** (Ctrl + Shift + Delete)
2. **Hard refresh** (Ctrl + F5)
3. **Buka di Incognito/Private mode**
4. **Cek browser console** (F12) → ada error baru?

Jika masih gagal, screenshot error baru dan saya bantu lagi!
