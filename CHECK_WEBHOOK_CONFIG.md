# Troubleshooting: Webhook Tidak Jalan

## Error yang Muncul:
```json
{"success":false,"message":"Failed to send reminder","error":"HTTP 0"}
```

## Kemungkinan Penyebab:

### 1. **Tabel `webhook_config` Belum Dibuat**
Cek di phpMyAdmin:
```sql
SELECT * FROM webhook_config WHERE id = 1;
```

**Jika error "Table doesn't exist":**
- Jalankan file `database_webhook_v2.sql` di phpMyAdmin

---

### 2. **URL n8n Webhook Kosong**
Cek di phpMyAdmin:
```sql
SELECT * FROM webhook_config WHERE id = 1;
```

**Jika `n8n_webhook_url` kosong atau NULL:**
```sql
UPDATE webhook_config SET
  enabled = 1,
  n8n_webhook_url = 'https://your-n8n.com/webhook/reminder-presensi',
  admin_phone = '081234567890'
WHERE id = 1;
```

**Ganti:**
- `https://your-n8n.com/webhook/reminder-presensi` → URL webhook dari n8n Anda
- `081234567890` → Nomor HP admin

---

### 3. **Workflow n8n Belum Aktif**
1. Login ke n8n
2. Buka workflow "Reminder Presensi Guru"
3. Pastikan toggle **Active** = ON (hijau)
4. Copy webhook URL dari node "Webhook Trigger"

---

### 4. **URL n8n Salah**
Pastikan URL webhook format:
```
https://your-n8n-domain.com/webhook/reminder-presensi
```

**BUKAN:**
- `http://` (harus `https://`)
- URL tanpa `/webhook/`
- URL dengan typo

---

## LANGKAH TROUBLESHOOTING:

### STEP 1: Cek Database
```sql
-- Cek apakah tabel ada
SHOW TABLES LIKE 'webhook_config';

-- Cek isi config
SELECT * FROM webhook_config WHERE id = 1;
```

**Expected Result:**
```
id | enabled | n8n_webhook_url                                    | admin_phone
1  | 1       | https://your-n8n.com/webhook/reminder-presensi    | 081234567890
```

---

### STEP 2: Jika Tabel Belum Ada
1. Buka phpMyAdmin
2. Pilih database `sobataja2_geopresence`
3. Klik tab **SQL**
4. Copy-paste isi file `database_webhook_v2.sql`
5. Klik **Go**

---

### STEP 3: Update Config
```sql
UPDATE webhook_config SET
  enabled = 1,
  n8n_webhook_url = 'PASTE_URL_N8N_DISINI',
  admin_phone = '081234567890'
WHERE id = 1;
```

**Cara Dapat URL n8n:**
1. Login ke n8n
2. Buka workflow "Reminder Presensi Guru"
3. Klik node "Webhook Trigger"
4. Copy **Production URL** atau **Test URL**

---

### STEP 4: Test Lagi
```
https://kelolasekolah.web.id/api/webhook_reminder.php
```

**Expected Result (Success):**
```json
{
  "success": true,
  "message": "Reminder sent successfully",
  "data": { ... }
}
```

**Jika Masih Error:**
Response sekarang akan menampilkan debug info:
```json
{
  "success": false,
  "message": "Failed to send reminder",
  "error": "...",
  "debug": {
    "url": "...",
    "http_code": 0,
    "curl_error": "...",
    "data_sent": { ... }
  }
}
```

Kirim screenshot debug info ini untuk analisa lebih lanjut.

---

## QUICK FIX:

### Jika Belum Setup n8n:
Untuk sementara, Anda bisa **skip n8n** dan test langsung kirim WhatsApp dari PHP:

1. Buat file `api/test_direct_wa.php`:
```php
<?php
// Test kirim WhatsApp langsung tanpa n8n

$phone = '081234567890'; // Ganti dengan nomor Anda
$message = '🔔 Test Pengingat Presensi\n\nHalo, ini test pesan dari sistem.';

// Ganti dengan endpoint Gowa Anda
$gowaUrl = 'https://api.gowa.id/send';
$gowaApiKey = 'YOUR_GOWA_API_KEY';

$ch = curl_init($gowaUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'target' => $phone,
    'message' => $message
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $gowaApiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
?>
```

2. Akses: `https://kelolasekolah.web.id/api/test_direct_wa.php`
3. Cek WhatsApp Anda

Jika ini berhasil, berarti masalahnya di n8n setup.

---

## CHECKLIST:

- [ ] Tabel `webhook_config` sudah dibuat
- [ ] Config `enabled` = 1
- [ ] Config `n8n_webhook_url` sudah diisi (tidak kosong)
- [ ] URL n8n valid (https://, format benar)
- [ ] Workflow n8n sudah di-import
- [ ] Workflow n8n sudah aktif (toggle ON)
- [ ] Test webhook_reminder.php → lihat debug info

---

**Tolong cek step-step di atas dan beritahu saya hasil dari:**
1. `SELECT * FROM webhook_config WHERE id = 1;`
2. Screenshot debug info dari webhook_reminder.php

Saya akan bantu troubleshoot lebih lanjut! 😊
