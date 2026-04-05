# Cara Build Aplikasi - Step by Step

## 🎯 LANGKAH 1: Edit File .env

Sebelum build, Anda HARUS edit file `.env` dengan domain Anda.

### Cara Edit:

1. **Buka file `.env`** di root project (D:\Kiro\12 Des 2025\.env)
2. **Ganti baris ini**:

```
# SEBELUM (untuk development):
VITE_API_URL=http://localhost/api

# SESUDAH (untuk production - ganti dengan domain Anda):
VITE_API_URL=https://namadomainanda.com/api
```

**Contoh**:
- Jika domain Anda: `sekolahku.com`
- Maka isi: `VITE_API_URL=https://sekolahku.com/api`

3. **Save file**

---

## 🎯 LANGKAH 2: Build Aplikasi

### Cara Build:

1. **Buka Terminal/Command Prompt**
   - Windows: Tekan `Win + R`, ketik `cmd`, Enter
   - Atau: Klik kanan di folder project → "Open in Terminal"

2. **Masuk ke folder project**:
```bash
cd "D:\Kiro\12 Des 2025"
```

3. **Jalankan perintah build**:
```bash
npm run build
```

4. **Tunggu proses build** (sekitar 10-30 detik)

5. **Selesai!** Akan muncul pesan seperti ini:
```
✓ built in 5.23s
```

---

## 📁 HASIL BUILD

Setelah build selesai, akan muncul folder baru bernama **`dist`**:

```
D:\Kiro\12 Des 2025\
├── api/
├── src/
├── dist/              ← FOLDER BARU INI!
│   ├── index.html
│   └── assets/
│       ├── index-abc123.js
│       └── index-xyz789.css
├── .env
├── database.sql
└── ...
```

---

## ✅ CEK HASIL BUILD

Setelah build, cek apakah folder `dist` sudah ada:

1. **Buka File Explorer**
2. **Masuk ke**: `D:\Kiro\12 Des 2025\`
3. **Cari folder**: `dist`
4. **Buka folder `dist`**
5. **Harus ada**:
   - File `index.html`
   - Folder `assets`
   - Di dalam folder `assets` ada file `.js` dan `.css`

---

## 🚨 JIKA ADA ERROR

### Error: "npm: command not found"

**Solusi**: Node.js belum terinstall
```bash
# Download dan install Node.js dari:
https://nodejs.org/

# Pilih versi LTS (Long Term Support)
# Setelah install, restart terminal dan coba lagi
```

### Error: "Cannot find module"

**Solusi**: Dependencies belum terinstall
```bash
npm install
# Tunggu sampai selesai, lalu:
npm run build
```

### Error: "ENOENT: no such file or directory"

**Solusi**: Anda tidak berada di folder yang benar
```bash
# Pastikan Anda di folder project:
cd "D:\Kiro\12 Des 2025"

# Cek apakah ada file package.json:
dir package.json

# Jika ada, baru jalankan:
npm run build
```

### Error: "Port 5173 is already in use"

**Solusi**: Ini bukan error, abaikan saja. Build tetap jalan.

---

## 📤 SETELAH BUILD: File yang Diupload

Setelah folder `dist` muncul, inilah file yang perlu diupload:

### 1. Backend API (6 file)
```
Dari: D:\Kiro\12 Des 2025\api\
├── config.php
├── auth.php
├── guru.php
├── presensi.php
├── activity.php
└── test.php

Upload ke: /home/username/api/
```

### 2. Frontend (Isi folder dist)
```
Dari: D:\Kiro\12 Des 2025\dist\
├── index.html
└── assets/
    ├── index-abc123.js
    └── index-xyz789.css

Upload ke: /home/username/public_html/
```

### 3. File .htaccess
```
Dari: D:\Kiro\12 Des 2025\.htaccess

Upload ke: /home/username/public_html/.htaccess
```

### 4. Database
```
Dari: D:\Kiro\12 Des 2025\database.sql

Import via: phpMyAdmin
```

---

## 🎯 RINGKASAN LENGKAP

```
1. Edit .env → Ganti API URL dengan domain Anda
2. npm run build → Tunggu sampai selesai
3. Cek folder dist → Harus ada
4. Upload file → Ikuti panduan DAFTAR_FILE_UPLOAD.md
```

---

## 💡 TIPS

1. **Jangan edit file di folder `dist`**
   - Folder ini auto-generated
   - Setiap kali build, folder ini akan di-generate ulang

2. **Jika perlu build ulang**:
   ```bash
   # Hapus folder dist dulu (optional)
   rm -rf dist
   
   # Build lagi
   npm run build
   ```

3. **Untuk development (testing lokal)**:
   ```bash
   npm run dev
   # Buka: http://localhost:5173
   ```

4. **Untuk production (upload ke server)**:
   ```bash
   npm run build
   # Upload folder dist ke server
   ```

---

## ✅ CHECKLIST

- [ ] File `.env` sudah diedit dengan domain yang benar
- [ ] Sudah jalankan `npm run build`
- [ ] Folder `dist` sudah muncul
- [ ] Di dalam `dist` ada `index.html`
- [ ] Di dalam `dist` ada folder `assets`
- [ ] Siap upload ke server!

---

Setelah build selesai dan folder `dist` muncul, lanjut ke **DAFTAR_FILE_UPLOAD.md** untuk panduan upload ke cPanel!
