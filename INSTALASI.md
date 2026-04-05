# Panduan Instalasi GeoPresensi Sekolah

## Prasyarat

Pastikan Anda sudah menginstall:
- **Node.js** (versi 16 atau lebih baru)
- **npm** atau **yarn**

## Langkah Instalasi

### 1. Install Dependencies

Buka terminal/command prompt di folder project, lalu jalankan:

```bash
npm install
```

Atau jika menggunakan yarn:

```bash
yarn install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Atau dengan yarn:

```bash
yarn dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 3. Build untuk Production

```bash
npm run build
```

Hasil build akan ada di folder `dist/`

### 4. Preview Production Build

```bash
npm run preview
```

## Troubleshooting

### Error: "Cannot find module"

Solusi: Hapus folder `node_modules` dan file `package-lock.json`, lalu install ulang:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 5173 already in use"

Solusi: Ubah port di `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 // Ganti dengan port yang tersedia
  }
})
```

### Geolocation tidak bekerja

Pastikan:
1. Aplikasi dijalankan dengan HTTPS atau localhost
2. Browser mendukung Geolocation API
3. User memberikan izin akses lokasi

Untuk testing di localhost, browser akan otomatis mengizinkan akses lokasi.

### Data tidak tersimpan

Data disimpan di localStorage browser. Pastikan:
1. Browser tidak dalam mode incognito/private
2. localStorage tidak diblokir oleh browser
3. Tidak ada extension yang memblokir localStorage

## Konfigurasi Lanjutan

### Mengubah Koordinat Sekolah

Edit file `src/data/dummyData.js`:

```javascript
export const SCHOOL_LOCATION = {
  latitude: -6.2088,  // Koordinat sekolah Anda
  longitude: 106.8456,
  radius: 100 // Radius dalam meter
}
```

### Menambah User/Guru Baru

Edit file `src/data/dummyData.js` di array `users`:

```javascript
{
  id: 8, // ID unik
  username: 'guru6',
  password: 'guru123',
  role: 'guru',
  nama: 'Nama Lengkap',
  jenisKelamin: 'Laki-laki',
  alamat: 'Alamat Lengkap',
  jabatan: 'Guru Matematika',
  tanggalBertugas: '2023-01-01'
}
```

## Testing Geolocation

### Cara 1: Mock Location di Chrome DevTools

1. Buka Chrome DevTools (F12)
2. Tekan `Ctrl+Shift+P` (Windows) atau `Cmd+Shift+P` (Mac)
3. Ketik "sensors" dan pilih "Show Sensors"
4. Di tab Sensors, pilih lokasi atau masukkan koordinat custom

### Cara 2: Extension Browser

Install extension seperti:
- **Location Guard** (Chrome/Firefox)
- **Manual Geolocation** (Chrome)

### Cara 3: Ubah Radius untuk Testing

Sementara untuk testing, ubah radius menjadi lebih besar di `src/data/dummyData.js`:

```javascript
export const SCHOOL_LOCATION = {
  latitude: -6.2088,
  longitude: 106.8456,
  radius: 10000 // 10km untuk testing
}
```

## Deploy ke Production

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Netlify

1. Build project:
```bash
npm run build
```

2. Drag & drop folder `dist/` ke Netlify

### GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Tambahkan di `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

## Kontak & Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository GitHub.
