# Perbaikan HTTPS Redirect

## Masalah
- Website bisa diakses via HTTP tapi **tidak bisa login**
- Website bisa diakses via HTTPS dan **bisa login**
- Perlu redirect otomatis dari HTTP ke HTTPS

## Penyebab
1. **Session/Cookie tidak berfungsi di HTTP** karena security policy browser modern
2. **Mixed content** - HTTPS API tidak bisa dipanggil dari HTTP page
3. **Secure cookies** - Cookie dengan flag `Secure` hanya dikirim via HTTPS

## Solusi

### 1. Aktifkan HTTPS Redirect di .htaccess

**Sebelum:**
```apache
# Redirect HTTP to HTTPS (optional, tapi direkomendasikan)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Sesudah:**
```apache
# Force HTTPS - Redirect HTTP to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 2. Cara Kerja

**Request HTTP:**
```
User ketik: http://kelolasekolah.web.id
↓
.htaccess detect: HTTPS off
↓
Redirect 301 ke: https://kelolasekolah.web.id
↓
Browser otomatis pindah ke HTTPS
```

**Request HTTPS:**
```
User ketik: https://kelolasekolah.web.id
↓
.htaccess detect: HTTPS on
↓
Tidak redirect, lanjut ke aplikasi
```

## File yang Diubah
```
.htaccess
```

## Cara Upload ke cPanel

### 1. Upload File .htaccess

**Via File Manager:**
1. Login cPanel: https://kelolasekolah.web.id/cpanel
2. Buka File Manager
3. Masuk ke folder `public_html`
4. Upload file `.htaccess` (overwrite yang lama)
5. Selesai!

**Via Edit Langsung di cPanel:**
1. Login cPanel
2. Buka File Manager → public_html
3. Klik kanan file `.htaccess` → Edit
4. Hapus comment (`#`) di baris redirect HTTPS
5. Save

### 2. Verifikasi

**Test 1: HTTP Redirect**
1. Buka browser (mode Incognito)
2. Ketik: `http://kelolasekolah.web.id`
3. Tekan Enter
4. **Hasil:** Otomatis redirect ke `https://kelolasekolah.web.id` ✅

**Test 2: HTTPS Direct**
1. Ketik: `https://kelolasekolah.web.id`
2. Tekan Enter
3. **Hasil:** Langsung buka tanpa redirect ✅

**Test 3: Login**
1. Akses via HTTP: `http://kelolasekolah.web.id`
2. Otomatis redirect ke HTTPS
3. Login dengan username: miputra, password: manduraga
4. **Hasil:** Login berhasil ✅

## Keuntungan HTTPS

### 1. Security
- ✅ Data terenkripsi (username, password, data presensi)
- ✅ Tidak bisa disadap di jaringan
- ✅ Proteksi dari man-in-the-middle attack

### 2. Functionality
- ✅ Session/Cookie berfungsi dengan baik
- ✅ Login berhasil
- ✅ Geolocation API berfungsi (butuh HTTPS)
- ✅ Service Worker berfungsi (butuh HTTPS)

### 3. SEO & Trust
- ✅ Google ranking lebih tinggi
- ✅ Browser tidak tampilkan warning "Not Secure"
- ✅ User lebih percaya (ada icon gembok)

### 4. Compliance
- ✅ Sesuai standar keamanan modern
- ✅ Required untuk PWA (Progressive Web App)
- ✅ Required untuk banyak API modern

## Redirect Code Explanation

```apache
RewriteCond %{HTTPS} off
```
**Artinya:** Jika HTTPS sedang off (user akses via HTTP)

```apache
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```
**Artinya:** 
- `^(.*)$` - Match semua URL
- `https://%{HTTP_HOST}` - Redirect ke HTTPS dengan domain yang sama
- `%{REQUEST_URI}` - Pertahankan path/URL yang sama
- `[L,R=301]` - Last rule, Redirect permanent (301)

**Contoh:**
- `http://kelolasekolah.web.id/admin` → `https://kelolasekolah.web.id/admin`
- `http://kelolasekolah.web.id/login` → `https://kelolasekolah.web.id/login`

## Troubleshooting

### Redirect tidak berfungsi

**1. Cek mod_rewrite aktif**
```apache
<IfModule mod_rewrite.c>
  # Kode redirect ada di sini
</IfModule>
```
Jika tidak aktif, hubungi hosting support.

**2. Cek .htaccess ter-upload**
- Pastikan file `.htaccess` ada di `public_html`
- Pastikan nama file benar (dengan titik di depan)
- Pastikan tidak ada typo

**3. Clear cache browser**
- Ctrl + Shift + Delete
- Atau gunakan mode Incognito

**4. Cek SSL Certificate**
- Pastikan SSL certificate aktif di cPanel
- Jika belum, aktifkan SSL gratis (Let's Encrypt)

### Redirect loop (redirect terus-menerus)

**Penyebab:** Server proxy/load balancer tidak set HTTPS header dengan benar

**Solusi:** Ganti kondisi redirect:
```apache
# Ganti ini:
RewriteCond %{HTTPS} off

# Dengan ini (untuk beberapa hosting):
RewriteCond %{HTTP:X-Forwarded-Proto} !https
```

### Mixed content warning

**Penyebab:** Ada resource (gambar, CSS, JS) yang di-load via HTTP

**Solusi:** Pastikan semua resource menggunakan HTTPS atau relative URL:
```javascript
// Buruk
const API_URL = 'http://kelolasekolah.web.id/api'

// Baik
const API_URL = 'https://kelolasekolah.web.id/api'

// Lebih baik (relative)
const API_URL = '/api'
```

## Best Practices

### 1. HSTS (HTTP Strict Transport Security)
Tambahkan di `.htaccess` untuk security lebih:
```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

**Artinya:** Browser akan selalu gunakan HTTPS untuk 1 tahun ke depan.

### 2. Secure Cookies
Pastikan cookie di-set dengan flag `Secure`:
```php
// Di api/config.php
session_set_cookie_params([
    'secure' => true,      // Hanya kirim via HTTPS
    'httponly' => true,    // Tidak bisa diakses JavaScript
    'samesite' => 'Strict' // Proteksi CSRF
]);
```

### 3. Content Security Policy
Tambahkan header untuk proteksi XSS:
```apache
<IfModule mod_headers.c>
  Header set Content-Security-Policy "upgrade-insecure-requests"
</IfModule>
```

## Testing Checklist

### Test HTTP Redirect
- [ ] `http://kelolasekolah.web.id` → redirect ke HTTPS
- [ ] `http://kelolasekolah.web.id/admin` → redirect ke HTTPS
- [ ] `http://kelolasekolah.web.id/login` → redirect ke HTTPS

### Test HTTPS Direct
- [ ] `https://kelolasekolah.web.id` → buka langsung
- [ ] `https://kelolasekolah.web.id/admin` → buka langsung
- [ ] Icon gembok muncul di browser ✅

### Test Functionality
- [ ] Login berhasil
- [ ] Session tersimpan
- [ ] Presensi berfungsi
- [ ] GPS/Geolocation berfungsi
- [ ] Download laporan berfungsi

### Test Browser
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile browser ✅

## Monitoring

### 1. Cek SSL Certificate Expiry
- Login cPanel → SSL/TLS Status
- Pastikan auto-renew aktif (Let's Encrypt)
- Certificate valid minimal 30 hari ke depan

### 2. Cek HTTPS Status
- Gunakan: https://www.ssllabs.com/ssltest/
- Target: Grade A atau A+
- Fix jika ada warning

### 3. Cek Mixed Content
- Buka Console browser (F12)
- Lihat warning "Mixed Content"
- Fix semua resource yang masih HTTP

## Kesimpulan

✅ **HTTP otomatis redirect ke HTTPS**
✅ **Login sekarang berfungsi di semua akses**
✅ **Security meningkat**
✅ **SEO lebih baik**
✅ **User experience lebih baik**

## Catatan Penting

⚠️ **Setelah aktifkan HTTPS redirect:**
1. Update semua bookmark/link ke HTTPS
2. Update link di Google/Facebook ke HTTPS
3. Update link di brosur/marketing material
4. Inform user untuk gunakan HTTPS

🎉 **Selamat! Website sekarang aman dan selalu menggunakan HTTPS!**
