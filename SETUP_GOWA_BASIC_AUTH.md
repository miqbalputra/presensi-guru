# Setup Gowa dengan Basic Auth (n8n Credential)

## 📋 INFO DARI SCREENSHOT

Dari screenshot Anda, saya lihat:
- **Host URL:** `http://45.13.236.95:3000/`
- **Username:** `admin`
- **Password:** (tersembunyi)
- **Auth Type:** Basic Authentication

---

## 🚀 SETUP (5 Menit)

### STEP 1: Cari Webhook URL Gowa

1. Login ke n8n di `http://45.13.236.95:3000/`
2. Buka workflow Gowa untuk kirim WhatsApp
3. Cari node **Webhook** yang menerima request kirim WA
4. Copy **Webhook URL** (contoh: `http://45.13.236.95:3000/webhook/send-wa`)

**Atau tanyakan ke admin Gowa Anda:**
> "Apa webhook URL untuk kirim WhatsApp via API?"

---

### STEP 2: Edit File webhook_reminder_direct.php

1. Buka file `api/webhook_reminder_direct.php` di cPanel
2. Cari baris ini (sekitar line 60-62):
   ```php
   $gowaUrl = 'http://45.13.236.95:3000/webhook/send-wa'; // GANTI
   $gowaUsername = 'admin';
   $gowaPassword = 'YOUR_PASSWORD'; // GANTI
   ```

3. Ganti dengan data Anda:
   ```php
   $gowaUrl = 'http://45.13.236.95:3000/webhook/send-wa'; // Webhook URL Gowa
   $gowaUsername = 'admin'; // Sudah benar
   $gowaPassword = 'password_anda_yang_sebenarnya'; // Ganti dengan password Gowa
   ```

---

### STEP 3: Cek Format Request Body

Gowa mungkin menggunakan format berbeda. Cek di workflow n8n Gowa, field apa yang dibutuhkan:

**Format 1 (Umum):**
```json
{
  "phone": "628123456789",
  "message": "Halo, ini pesan test"
}
```

**Format 2 (Alternatif):**
```json
{
  "target": "628123456789",
  "message": "Halo, ini pesan test"
}
```

**Format 3 (Alternatif):**
```json
{
  "number": "628123456789",
  "text": "Halo, ini pesan test"
}
```

**Jika format berbeda**, edit fungsi `sendWhatsApp()` di file:
```php
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'phone' => $phone,  // Ganti 'phone' dengan field yang benar
    'message' => $message  // Ganti 'message' dengan field yang benar
]));
```

---

### STEP 4: Test

Akses:
```
https://kelolasekolah.web.id/api/webhook_reminder_direct.php
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Reminder sent successfully",
  "data": {
    "success_count": 2,
    "failed_count": 0
  }
}
```

✅ **Guru seharusnya terima WhatsApp!**

---

## 🔧 TROUBLESHOOTING

### Error: "HTTP 401 Unauthorized"

**Penyebab:** Username atau password salah

**Solusi:**
- Cek username: `admin` (sudah benar?)
- Cek password: Pastikan tidak ada typo
- Test login manual ke n8n dengan username/password tersebut

---

### Error: "HTTP 404 Not Found"

**Penyebab:** Webhook URL salah

**Solusi:**
- Cek URL webhook di n8n
- Pastikan workflow Gowa sudah aktif (toggle ON)
- Pastikan path benar (contoh: `/webhook/send-wa`)

---

### Error: "Connection refused" atau "HTTP 0"

**Penyebab:** Server cPanel tidak bisa akses ke `45.13.236.95:3000`

**Solusi:**
- Cek apakah `45.13.236.95:3000` bisa diakses dari browser Anda
- Jika tidak bisa, mungkin Gowa hanya bisa diakses dari jaringan internal
- Hubungi admin Gowa untuk whitelist IP server cPanel Anda

---

### Pesan tidak terkirim (tidak ada error)

**Cek:**
1. Format request body (phone/target/number?)
2. Format nomor HP (628xxx atau 08xxx?)
3. Cek execution log di n8n Gowa
4. Cek device WhatsApp di Gowa status online?

---

## 📝 CONTOH REQUEST MANUAL (Test dengan Postman)

**URL:**
```
http://45.13.236.95:3000/webhook/send-wa
```

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Auth:**
- Type: Basic Auth
- Username: admin
- Password: (password Anda)

**Body (raw JSON):**
```json
{
  "phone": "628123456789",
  "message": "Test pesan dari Postman"
}
```

**Klik Send** → Cek WhatsApp Anda

---

## ✅ CHECKLIST

- [ ] Webhook URL Gowa sudah didapat
- [ ] File `webhook_reminder_direct.php` sudah diedit
- [ ] Username = `admin` (sudah benar)
- [ ] Password sudah diganti dengan yang benar
- [ ] Format request body sudah sesuai (phone/message)
- [ ] Test manual berhasil
- [ ] Guru terima WhatsApp

---

## 🎯 NEXT STEPS

Setelah test berhasil:
1. Update cron job (ganti ke `webhook_reminder_direct.php`)
2. Tunggu jam 08:00 untuk test otomatis
3. Monitor log di `api/webhook_success.log`

---

**Tolong:**
1. Cari webhook URL Gowa yang benar
2. Ganti password di file
3. Test dan kirim screenshot hasilnya

Saya akan bantu troubleshoot jika ada masalah! 😊
