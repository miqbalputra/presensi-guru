---
description: Konfigurasi utama project GeoPresensi
---

# Project GeoPresensi - Konfigurasi Utama

## 🌐 Domain Produksi
**URL Utama:** https://geoloc.kelolasekolah.web.id

## 📁 Folder Kerja
- **Folder Utama:** `d:\Google Antigravity\Presensi Pengajar Antigravity\geo-subdomain`
- **Frontend Source:** `geo-subdomain/src/`
- **Backend API:** `geo-subdomain/api/`
- **Build Output:** `geo-subdomain/dist/`

## 🔧 Setelah Melakukan Perubahan

1. Jika edit frontend (React/JSX/CSS):
   ```
   cd geo-subdomain
   npm run build
   ```
   Lalu upload folder `dist/` ke server

2. Jika edit backend (PHP):
   Upload langsung file yang diubah ke folder `api/` di server

## 📝 Catatan
- CORS sudah dikonfigurasi untuk `geoloc.kelolasekolah.web.id`
- API URL: `https://geoloc.kelolasekolah.web.id/api`
- Database credentials ada di `api/config.php`
