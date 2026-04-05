# Panduan Integrasi Webhook n8n untuk Reminder Presensi

## 📋 Daftar Isi
1. [Cara Kerja Sistem](#cara-kerja-sistem)
2. [Setup Database](#setup-database)
3. [Setup n8n Workflow](#setup-n8n-workflow)
4. [Setup Cron Job](#setup-cron-job)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Cara Kerja Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    FLOW REMINDER SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

08:30 Pagi (Senin-Jumat)
    ↓
Cron Job Jalan
    ↓
PHP Script: webhook_reminder.php
    ↓
Cek Guru Belum Presensi
    ↓
Kirim Data ke Webhook n8n
    ↓
n8n Workflow Process
    ↓
Kirim WhatsApp/Email ke Guru
```

### Data yang Dikirim ke n8n:
```json
{
  "event": "presensi_reminder",
  "timestamp": "2025-12-15 08:30:00",
  "date": "2025-12-15",
  "school_name": "Sekolah Anda",
  "total_guru": 10,
  "sudah_presensi": 7,
  "belum_presensi": 3,
  "guru_list": [
    {
      "id": 1,
      "nama": "Budi Santoso",
      "email": "budi@example.com",
      "no_hp": "081234567890"
    },
    {
      "id": 2,
      "nama": "Siti Aminah",
      "email": "siti@example.com",
      "no_hp": "081234567891"
    }
  ]
}
```

---

## 🗄️ Setup Database

### 1. Jalankan SQL Script

**Via phpMyAdmin:**
1. Login phpMyAdmin
2. Pilih database `sobataja2_geopresence`
3. Tab "SQL"
4. Copy-paste isi file `database_webhook.sql`
5. Klik "Go"

**Via MySQL Command:**
```bash
mysql -u sobataja2_mip -p sobataja2_geopresence < database_webhook.sql
```

### 2. Verifikasi Tabel

Cek apakah tabel sudah dibuat:
```sql
SHOW TABLES LIKE 'webhook%';
```

Harusnya muncul:
- `webhook_config`
- `webhook_logs`

---

## 🔧 Setup n8n Workflow

### 1. Install n8n

**Opsi A: n8n Cloud (Mudah)**
- Daftar di https://n8n.io
- Buat workspace baru
- Gratis untuk 5 workflows

**Opsi B: Self-hosted (Advanced)**
```bash
# Via Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Buat Workflow Baru

1. Login n8n
2. Klik "New Workflow"
3. Nama: "Presensi Reminder"

### 3. Setup Webhook Node

**Node 1: Webhook Trigger**
- Add Node → Trigger → Webhook
- HTTP Method: POST
- Path: `presensi-reminder`
- Response Mode: "When Last Node Finishes"
- Copy Webhook URL (contoh: `https://your-n8n.app.n8n.cloud/webhook/presensi-reminder`)

### 4. Setup WhatsApp Node (via Fonnte/Wablas)

**Node 2: HTTP Request (Fonnte)**
```
Method: POST
URL: https://api.fonnte.com/send
Headers:
  Authorization: YOUR_FONNTE_TOKEN

Body (JSON):
{
  "target": "{{ $json.guru_list[0].no_hp }}",
  "message": "Halo {{ $json.guru_list[0].nama }},\n\nAnda belum melakukan presensi hari ini ({{ $json.date }}).\n\nSilakan segera isi presensi melalui:\nhttps://kelolasekolah.web.id\n\nTerima kasih.\n\n{{ $json.school_name }}"
}
```

**Alternative: Wablas**
```
Method: POST
URL: https://console.wablas.com/api/send-message
Headers:
  Authorization: YOUR_WABLAS_TOKEN

Body (JSON):
{
  "phone": "{{ $json.guru_list[0].no_hp }}",
  "message": "Halo {{ $json.guru_list[0].nama }},\n\nAnda belum melakukan presensi hari ini ({{ $json.date }}).\n\nSilakan segera isi presensi melalui:\nhttps://kelolasekolah.web.id\n\nTerima kasih.\n\n{{ $json.school_name }}"
}
```

### 5. Setup Loop untuk Multiple Guru

**Node 3: Split In Batches**
- Batch Size: 1
- Input: `{{ $json.guru_list }}`

**Node 4: HTTP Request (dalam loop)**
- Connect dari Split In Batches
- Kirim pesan ke setiap guru

### 6. Setup Email Node (Optional)

**Node 5: Send Email**
```
To: {{ $json.guru_list[0].email }}
Subject: Reminder Presensi - {{ $json.date }}
Body:
Yth. {{ $json.guru_list[0].nama }},

Anda belum melakukan presensi hari ini ({{ $json.date }}).

Silakan segera isi presensi melalui:
https://kelolasekolah.web.id

Terima kasih.

{{ $json.school_name }}
```

### 7. Activate Workflow

- Klik "Active" toggle di kanan atas
- Workflow sekarang siap menerima webhook

---

## ⏰ Setup Cron Job di cPanel

### 1. Login cPanel

URL: https://kelolasekolah.web.id/cpanel

### 2. Buka Cron Jobs

- Cari "Cron Jobs" di search
- Atau Advanced → Cron Jobs

### 3. Tambah Cron Job Baru

**Common Settings:**
- Pilih: "Once Per Day" atau "Custom"

**Custom Settings (Recommended):**
```
Minute: 30
Hour: 8
Day: *
Month: *
Weekday: 1-5  (Senin-Jumat)
```

**Command:**
```bash
/usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

**Atau dengan curl:**
```bash
curl -s https://kelolasekolah.web.id/api/webhook_reminder.php
```

### 4. Email Notification

- Uncheck "Email" jika tidak mau notifikasi setiap run
- Atau isi email untuk monitoring

### 5. Save

Klik "Add New Cron Job"

---

## 🧪 Testing

### Test 1: Manual Run PHP Script

**Via Browser:**
```
https://kelolasekolah.web.id/api/webhook_reminder.php
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reminder berhasil dikirim",
  "data": {
    "total_guru": 10,
    "sudah_presensi": 7,
    "belum_presensi": 3
  }
}
```

### Test 2: Test Webhook n8n

**Via Postman/Insomnia:**
```
POST https://your-n8n.app.n8n.cloud/webhook/presensi-reminder
Content-Type: application/json

{
  "event": "test_webhook",
  "timestamp": "2025-12-15 08:30:00",
  "date": "2025-12-15",
  "school_name": "Test School",
  "total_guru": 1,
  "sudah_presensi": 0,
  "belum_presensi": 1,
  "guru_list": [
    {
      "id": 1,
      "nama": "Test Guru",
      "email": "test@example.com",
      "no_hp": "6281234567890"
    }
  ]
}
```

### Test 3: Cek Log

**File Log:**
```
/home/sobataja2/public_html/logs/webhook_reminder.log
```

**Database Log:**
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🔧 Konfigurasi

### Update Webhook URL

**Edit file:** `api/webhook_reminder.php`

```php
// Line 15
$N8N_WEBHOOK_URL = 'https://your-n8n.app.n8n.cloud/webhook/presensi-reminder';
```

### Update School Name

```php
// Line 18
$SCHOOL_NAME = 'SMA Negeri 1 Jakarta';
```

### Update Reminder Time

```php
// Line 17
$REMINDER_TIME = '08:30'; // Format HH:MM
```

---

## 📱 Template Pesan WhatsApp

### Template 1: Formal
```
Yth. Bapak/Ibu {{ nama }},

Kami informasikan bahwa Anda belum melakukan presensi pada hari ini, {{ tanggal }}.

Mohon segera melakukan presensi melalui aplikasi GeoPresensi:
https://kelolasekolah.web.id

Terima kasih atas perhatiannya.

Hormat kami,
{{ nama_sekolah }}
```

### Template 2: Friendly
```
Halo {{ nama }} 👋

Reminder: Kamu belum presensi hari ini ya ({{ tanggal }})

Yuk segera isi presensi di:
https://kelolasekolah.web.id

Terima kasih! 😊

{{ nama_sekolah }}
```

### Template 3: Urgent
```
⚠️ REMINDER PRESENSI ⚠️

{{ nama }}, Anda belum presensi hari ini!

Tanggal: {{ tanggal }}
Batas waktu: 09:00 WIB

Segera isi presensi:
https://kelolasekolah.web.id

{{ nama_sekolah }}
```

---

## 🐛 Troubleshooting

### Webhook tidak jalan

**1. Cek Cron Job**
```bash
# Via SSH
crontab -l
```

**2. Cek Log**
```bash
tail -f /home/sobataja2/public_html/logs/webhook_reminder.log
```

**3. Cek PHP Error**
```bash
tail -f /home/sobataja2/public_html/error_log
```

### n8n tidak menerima data

**1. Cek Webhook URL**
- Pastikan URL benar
- Pastikan workflow active

**2. Test Manual**
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/presensi-reminder \
  -H "Content-Type: application/json" \
  -d '{"event":"test","message":"hello"}'
```

**3. Cek n8n Execution Log**
- Buka n8n dashboard
- Tab "Executions"
- Lihat error jika ada

### WhatsApp tidak terkirim

**1. Cek API Token**
- Fonnte: https://console.fonnte.com
- Wablas: https://console.wablas.com

**2. Cek Format Nomor**
- Harus format internasional: `6281234567890`
- Tanpa `+` atau `0` di depan

**3. Cek Quota**
- Pastikan masih ada quota/saldo

### Pesan terkirim duplicate

**1. Cek Cron Job**
- Pastikan hanya 1 cron job aktif
- Cek tidak ada duplicate

**2. Cek n8n Loop**
- Pastikan Split In Batches benar
- Cek tidak ada infinite loop

---

## 📊 Monitoring

### Dashboard Webhook Logs

Buat query untuk monitoring:

```sql
-- Total webhook hari ini
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM webhook_logs
WHERE DATE(created_at) = CURDATE();

-- Webhook terakhir
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Success rate
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM webhook_logs
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

---

## 💰 Estimasi Biaya

### n8n Cloud
- **Free Plan:** 5 workflows, 2,500 executions/month
- **Starter:** $20/month, 20 workflows, 10,000 executions
- **Pro:** $50/month, unlimited workflows, 50,000 executions

### WhatsApp Gateway
- **Fonnte:** Rp 50.000 = 1000 pesan
- **Wablas:** Rp 100.000 = 2000 pesan
- **Twilio:** $0.005/pesan (sekitar Rp 80/pesan)

### Estimasi Bulanan (30 guru)
- Reminder per hari: 5 guru (rata-rata)
- Total per bulan: 5 × 22 hari kerja = 110 pesan
- Biaya: Rp 5.500 (Fonnte) atau Rp 5.500 (Wablas)

**Sangat terjangkau!** 🎉

---

## 🚀 Fitur Tambahan (Future)

### 1. Multiple Reminder
- Reminder ke-2 jam 10:00 jika masih belum presensi
- Reminder ke-3 jam 12:00 (urgent)

### 2. Notifikasi Admin
- Kirim summary ke admin jam 09:00
- List guru yang belum presensi

### 3. Escalation
- Jika guru tidak presensi 3 hari berturut-turut
- Kirim notifikasi ke kepala sekolah

### 4. Analytics
- Dashboard webhook statistics
- Success rate per hari/minggu/bulan
- Response time monitoring

---

## 📞 Support

Jika ada pertanyaan atau butuh bantuan setup:
- Email: support@geopresensi.id
- WhatsApp: 081234567890
- Dokumentasi: https://docs.geopresensi.id

---

**Selamat! Sistem reminder presensi otomatis sudah siap! 🎉**
