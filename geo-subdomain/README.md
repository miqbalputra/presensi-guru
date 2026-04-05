# GeoPresensi - geoloc.kelolasekolah.web.id

Aplikasi presensi berbasis GPS untuk guru/pengajar.

## 🌐 URL Produksi
https://geoloc.kelolasekolah.web.id

## 📁 Struktur
```
geo-subdomain/
├── src/          # Source code React
├── api/          # Backend PHP
├── dist/         # Build output (upload ini)
├── database*.sql # File SQL database
└── .env          # Konfigurasi
```

## 🚀 Build
```bash
npm run build
```

## 📤 Deploy
Upload ke cPanel:
- `dist/` → ke root subdomain
- `api/` → ke root subdomain
- `.htaccess` → ke root subdomain

Edit `api/config.php` dengan kredensial database.
