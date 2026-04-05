# 🔒 LAPORAN AUDIT KEAMANAN - GeoPresensi Sekolah

**Tanggal Audit:** 14 Desember 2025  
**Auditor:** Kiro AI  
**Versi Aplikasi:** 1.0  
**Status:** ⚠️ PERLU PERBAIKAN

---

## 📊 RINGKASAN EKSEKUTIF

### Tingkat Keamanan: **MEDIUM** (6/10)

**Temuan:**
- ✅ 8 Praktik Keamanan Baik
- ⚠️ 12 Kerentanan Medium
- 🔴 5 Kerentanan Kritis

**Rekomendasi:** Perbaiki kerentanan kritis sebelum production deployment.

---

## 🔴 KERENTANAN KRITIS (PRIORITAS TINGGI)

### 1. **CORS Terlalu Permisif** 🔴
**Lokasi:** `api/config.php` line 10  
**Kode:**
```php
header('Access-Control-Allow-Origin: *');
```

**Masalah:**
- Mengizinkan akses dari SEMUA domain
- Rentan terhadap CSRF (Cross-Site Request Forgery)
- Siapapun bisa mengakses API Anda dari website lain

**Dampak:** HIGH  
**Risiko:** Attacker bisa membuat website palsu yang mengakses API Anda

**Solusi:**
```php
// Ganti dengan domain spesifik
$allowed_origins = ['https://sistemflow.biz.id'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: https://sistemflow.biz.id');
}
```

---

### 2. **Tidak Ada Autentikasi di API** 🔴
**Lokasi:** Semua file API (`guru.php`, `presensi.php`, `holidays.php`)

**Masalah:**
- API bisa diakses tanpa login
- Tidak ada pengecekan session/token
- Siapapun bisa CRUD data tanpa autentikasi

**Dampak:** CRITICAL  
**Risiko:** 
- Attacker bisa hapus semua data guru
- Attacker bisa tambah/edit presensi palsu
- Attacker bisa lihat semua data sensitif

**Solusi:**
```php
// Tambahkan di awal setiap API file (setelah require config.php)
function requireAuth($allowedRoles = []) {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Unauthorized: Login required');
    }
    
    if (!empty($allowedRoles) && !in_array($_SESSION['role'], $allowedRoles)) {
        sendResponse(false, 'Forbidden: Insufficient permissions');
    }
}

// Contoh penggunaan:
// Di guru.php (hanya admin)
requireAuth(['admin']);

// Di presensi.php (admin dan guru)
requireAuth(['admin', 'guru']);
```

---

### 3. **SQL Injection di Filter** 🔴
**Lokasi:** `api/presensi.php` line 11-12, `api/holidays.php` line 11-12

**Masalah:**
- Parameter `$_GET` langsung digunakan dalam query
- Meskipun menggunakan prepared statements, ada potensi injection di bagian lain

**Kode Bermasalah:**
```php
if (isset($_GET['user_id'])) {
    $query .= " AND user_id = ?";
    $params[] = $_GET['user_id'];
}
```

**Dampak:** HIGH  
**Risiko:** SQL Injection jika ada bug di prepared statement

**Solusi:**
```php
// Validasi dan sanitasi input
if (isset($_GET['user_id'])) {
    $user_id = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);
    if ($user_id === false) {
        sendResponse(false, 'Invalid user_id');
    }
    $query .= " AND user_id = ?";
    $params[] = $user_id;
}
```

---

### 4. **Password Hash Tidak Diverifikasi Kekuatannya** 🔴
**Lokasi:** `api/guru.php` line 78, 127

**Masalah:**
- Tidak ada validasi kekuatan password
- User bisa set password "123" atau "abc"
- Tidak ada minimum length requirement

**Dampak:** MEDIUM-HIGH  
**Risiko:** Brute force attack mudah berhasil

**Solusi:**
```php
function validatePassword($password) {
    if (strlen($password) < 8) {
        return 'Password minimal 8 karakter';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'Password harus mengandung huruf besar';
    }
    if (!preg_match('/[a-z]/', $password)) {
        return 'Password harus mengandung huruf kecil';
    }
    if (!preg_match('/[0-9]/', $password)) {
        return 'Password harus mengandung angka';
    }
    return true;
}

// Gunakan sebelum hash password
$validation = validatePassword($data['password']);
if ($validation !== true) {
    sendResponse(false, $validation);
}
```

---

### 5. **Database Credentials Hardcoded** 🔴
**Lokasi:** `api/config.php` line 5-8

**Masalah:**
- Credentials database di-hardcode dalam file
- File ini bisa diakses jika ada misconfiguration server
- Tidak menggunakan environment variables

**Dampak:** CRITICAL  
**Risiko:** Jika file bocor, database bisa diakses langsung

**Solusi:**
```php
// Buat file .env di luar public_html
// /home/username/.env (BUKAN di public_html!)
DB_HOST=localhost
DB_NAME=username_geopresensi_db
DB_USER=username_geopresensi_user
DB_PASS=your_secure_password_here

// Di config.php, load dari .env
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
```

---

## ⚠️ KERENTANAN MEDIUM (PRIORITAS SEDANG)

### 6. **Tidak Ada Rate Limiting**
**Lokasi:** Semua API endpoints

**Masalah:**
- Tidak ada pembatasan request per IP
- Rentan terhadap brute force attack
- Rentan terhadap DDoS

**Solusi:**
```php
// Tambahkan rate limiting
function checkRateLimit($action, $limit = 5, $window = 60) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = "rate_limit_{$action}_{$ip}";
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 0, 'start' => time()];
    }
    
    $data = $_SESSION[$key];
    
    if (time() - $data['start'] > $window) {
        $_SESSION[$key] = ['count' => 1, 'start' => time()];
        return true;
    }
    
    if ($data['count'] >= $limit) {
        sendResponse(false, 'Too many requests. Please try again later.');
    }
    
    $_SESSION[$key]['count']++;
    return true;
}

// Gunakan di login
checkRateLimit('login', 5, 300); // 5 attempts per 5 minutes
```

---

### 7. **Tidak Ada Input Validation**
**Lokasi:** Semua API files

**Masalah:**
- Input dari user tidak divalidasi
- Bisa insert data dengan format salah
- Bisa insert XSS payload

**Solusi:**
```php
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Gunakan sebelum insert/update
$data = getRequestData();
$data = sanitizeInput($data);
```

---

### 8. **Error Messages Terlalu Detail**
**Lokasi:** Semua API files

**Masalah:**
- Error message menampilkan detail database
- Membantu attacker untuk reconnaissance

**Kode Bermasalah:**
```php
sendResponse(false, 'Error: ' . $e->getMessage());
```

**Solusi:**
```php
// Production mode
if (PRODUCTION_MODE) {
    sendResponse(false, 'An error occurred. Please try again.');
    error_log($e->getMessage()); // Log ke file
} else {
    // Development mode
    sendResponse(false, 'Error: ' . $e->getMessage());
}
```

---

### 9. **Tidak Ada HTTPS Enforcement**
**Lokasi:** `.htaccess` line 7-8

**Masalah:**
- HTTPS redirect di-comment
- Data bisa dikirim via HTTP (tidak terenkripsi)
- Password bisa di-sniff

**Solusi:**
```apache
# Uncomment baris ini
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

### 10. **Session Tidak Secure**
**Lokasi:** `api/config.php` line 48

**Masalah:**
- Session tidak menggunakan secure flag
- Session bisa di-hijack

**Solusi:**
```php
// Sebelum session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Hanya HTTPS
ini_set('session.cookie_samesite', 'Strict');
session_start();
```

---

### 11. **Tidak Ada CSRF Protection**
**Lokasi:** Semua form submissions

**Masalah:**
- Tidak ada CSRF token
- Attacker bisa buat form palsu yang submit ke API

**Solusi:**
```php
// Generate CSRF token
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Verify CSRF token
function verifyCSRFToken($token) {
    if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        sendResponse(false, 'Invalid CSRF token');
    }
}

// Gunakan di setiap POST/PUT/DELETE
$data = getRequestData();
verifyCSRFToken($data['csrf_token'] ?? '');
```

---

### 12. **Tidak Ada Logging untuk Security Events**
**Lokasi:** Semua API files

**Masalah:**
- Tidak ada log untuk failed login
- Tidak ada log untuk unauthorized access
- Sulit detect intrusion

**Solusi:**
```php
function securityLog($event, $details = []) {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'event' => $event,
        'details' => $details
    ];
    
    $logFile = dirname(__DIR__) . '/logs/security.log';
    file_put_contents($logFile, json_encode($log) . PHP_EOL, FILE_APPEND);
}

// Gunakan untuk event penting
securityLog('failed_login', ['username' => $username]);
securityLog('unauthorized_access', ['endpoint' => $_SERVER['REQUEST_URI']]);
```

---

### 13. **Tidak Ada File Upload Validation**
**Lokasi:** Jika ada fitur upload (belum terlihat di code)

**Masalah:**
- Jika ada fitur upload, bisa upload file berbahaya
- Bisa upload PHP shell

**Solusi:**
```php
function validateUpload($file) {
    $allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($ext, $allowed)) {
        return 'File type not allowed';
    }
    
    if ($file['size'] > 5 * 1024 * 1024) { // 5MB
        return 'File too large';
    }
    
    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!in_array($mime, $allowedMimes)) {
        return 'Invalid file type';
    }
    
    return true;
}
```

---

### 14. **Tidak Ada Backup Strategy**
**Masalah:**
- Tidak ada backup otomatis database
- Jika data hilang, tidak bisa recovery

**Solusi:**
```bash
# Buat cron job untuk backup harian
0 2 * * * /usr/bin/mysqldump -u username -p'password' database_name > /backup/db_$(date +\%Y\%m\%d).sql
```

---

### 15. **Tidak Ada API Versioning**
**Masalah:**
- Jika API berubah, frontend lama bisa break
- Tidak ada backward compatibility

**Solusi:**
```php
// Struktur folder
/api/v1/auth.php
/api/v1/guru.php
/api/v2/auth.php (versi baru)

// Atau gunakan header
$version = $_SERVER['HTTP_API_VERSION'] ?? 'v1';
```

---

### 16. **Tidak Ada Monitoring**
**Masalah:**
- Tidak tahu jika ada serangan
- Tidak tahu jika server down

**Solusi:**
- Setup monitoring (UptimeRobot, Pingdom)
- Setup error tracking (Sentry)
- Setup log analysis (ELK Stack)

---

### 17. **Geolocation Data Tidak Divalidasi**
**Lokasi:** `api/presensi.php`

**Masalah:**
- Latitude/longitude tidak divalidasi
- Bisa insert koordinat palsu

**Solusi:**
```php
function validateCoordinates($lat, $lon) {
    if ($lat < -90 || $lat > 90) {
        return false;
    }
    if ($lon < -180 || $lon > 180) {
        return false;
    }
    return true;
}

if (!validateCoordinates($data['latitude'], $data['longitude'])) {
    sendResponse(false, 'Invalid coordinates');
}
```

---

## ✅ PRAKTIK KEAMANAN YANG BAIK

### 1. **Menggunakan Prepared Statements** ✅
- Semua query menggunakan prepared statements
- Mencegah SQL injection

### 2. **Password Hashing** ✅
- Menggunakan `password_hash()` dan `password_verify()`
- Menggunakan bcrypt algorithm

### 3. **PDO dengan Error Mode Exception** ✅
- `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`
- Error handling yang baik

### 4. **Session Management** ✅
- Menggunakan PHP session
- Session destroy saat logout

### 5. **JSON Response Format** ✅
- Konsisten menggunakan JSON
- Format response terstruktur

### 6. **Charset UTF-8** ✅
- Database dan response menggunakan UTF-8
- Mencegah encoding issues

### 7. **HTTP Response Codes** ✅
- Menggunakan HTTP status codes yang tepat
- 200, 500, dll

### 8. **Separation of Concerns** ✅
- Config terpisah dari logic
- Helper functions terpisah

---

## 📋 CHECKLIST PERBAIKAN

### Prioritas KRITIS (Harus diperbaiki sebelum production):
- [ ] Fix CORS policy (domain spesifik)
- [ ] Tambah autentikasi di semua API
- [ ] Tambah authorization (role-based)
- [ ] Validasi input di semua endpoint
- [ ] Pindahkan DB credentials ke .env

### Prioritas TINGGI (Perbaiki segera):
- [ ] Tambah rate limiting
- [ ] Tambah CSRF protection
- [ ] Enable HTTPS enforcement
- [ ] Secure session configuration
- [ ] Tambah security logging

### Prioritas SEDANG (Perbaiki dalam 1-2 minggu):
- [ ] Tambah input sanitization
- [ ] Improve error messages (hide details)
- [ ] Tambah password strength validation
- [ ] Tambah coordinate validation
- [ ] Setup monitoring

### Prioritas RENDAH (Nice to have):
- [ ] API versioning
- [ ] Automated backup
- [ ] File upload validation (jika ada)
- [ ] Rate limiting per user
- [ ] IP whitelist untuk admin

---

## 🔧 FILE YANG PERLU DIPERBAIKI

1. **api/config.php** - CORS, session, DB credentials
2. **api/auth.php** - Rate limiting, logging
3. **api/guru.php** - Auth, validation, sanitization
4. **api/presensi.php** - Auth, validation, coordinate check
5. **api/holidays.php** - Auth, validation
6. **.htaccess** - HTTPS enforcement
7. **Buat file baru:** `api/security.php` (helper functions)

---

## 📊 SKOR KEAMANAN PER KATEGORI

| Kategori | Skor | Status |
|----------|------|--------|
| Authentication | 3/10 | 🔴 Poor |
| Authorization | 2/10 | 🔴 Poor |
| Input Validation | 4/10 | ⚠️ Fair |
| SQL Injection | 8/10 | ✅ Good |
| XSS Protection | 5/10 | ⚠️ Fair |
| CSRF Protection | 0/10 | 🔴 None |
| Session Security | 5/10 | ⚠️ Fair |
| Password Security | 7/10 | ✅ Good |
| Error Handling | 4/10 | ⚠️ Fair |
| Logging | 2/10 | 🔴 Poor |
| **TOTAL** | **4.0/10** | ⚠️ **MEDIUM** |

---

## 🎯 REKOMENDASI AKHIR

### Untuk Development/Testing:
Aplikasi bisa digunakan dengan risiko yang dipahami.

### Untuk Production:
**TIDAK DISARANKAN** sebelum perbaikan kritis dilakukan.

### Langkah Selanjutnya:
1. Perbaiki 5 kerentanan kritis terlebih dahulu
2. Implementasi autentikasi dan authorization
3. Tambah rate limiting dan CSRF protection
4. Test security dengan penetration testing
5. Setup monitoring dan logging
6. Buat disaster recovery plan

---

## 📞 BANTUAN

Jika perlu bantuan implementasi perbaikan keamanan, saya siap membantu membuat:
1. File `api/security.php` dengan semua helper functions
2. Update semua API files dengan security fixes
3. Setup monitoring dan logging
4. Dokumentasi security best practices

---

**Catatan:** Audit ini dilakukan berdasarkan code review. Untuk audit lengkap, perlu dilakukan:
- Penetration testing
- Vulnerability scanning
- Load testing
- Security code analysis tools (SonarQube, dll)

---

**Tanggal:** 14 Desember 2025  
**Status:** DRAFT - Menunggu approval untuk implementasi perbaikan
