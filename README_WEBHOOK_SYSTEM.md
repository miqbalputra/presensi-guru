# 🔔 Sistem Pengingat Presensi Otomatis

Sistem otomatis untuk mengirim pengingat WhatsApp kepada guru yang belum presensi.

---

## 📦 FILE YANG SUDAH DIBUAT

### Backend (PHP)
- `api/webhook_reminder.php` - Script utama
- `api/webhook_config.php` - API konfigurasi

### Database
- `database_webhook_v2.sql` - Schema database

### n8n Workflow
- `n8n_workflow_reminder_presensi.json` - **JSON workflow siap import**
- `CARA_IMPORT_N8N_WORKFLOW.md` - Panduan import

### Dokumentasi
- `QUICK_START_WEBHOOK.md` - **MULAI DARI SINI** (30 menit)
- `PANDUAN_WEBHOOK_REMINDER_LENGKAP.md` - Setup lengkap
- `PANDUAN_INTEGRASI_GOWA_API.md` - Integrasi WhatsApp
- `TESTING_CHECKLIST_WEBHOOK.md` - Testing lengkap
- `SUMMARY_WEBHOOK_IMPLEMENTATION.md` - Ringkasan

---

## 🚀 QUICK START (30 Menit)

### 1. Upload Backend (5 menit)
```
api/webhook_reminder.php  → cPanel
api/webhook_config.php    → cPanel
```

### 2. Setup Database (5 menit)
```sql
-- Jalankan di phpMyAdmin
-- File: database_webhook_v2.sql
```

### 3. Setup Cron Jobs (5 menit)
```bash
# Jam 08:00
0 8 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php

# Jam 09:00
0 9 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php

# Jam 10:00
0 10 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

### 4. Import n8n Workflow (10 menit)
1. Buka n8n → Import from File
2. Upload: `n8n_workflow_reminder_presensi.json`
3. Konfigurasi:
   - Ubah URL Gowa API
   - Ubah API key Gowa
4. Copy webhook URL
5. Aktifkan workflow

### 5. Konfigurasi (5 menit)
```sql
UPDATE webhook_config SET
  enabled = 1,
  n8n_webhook_url = 'https://your-n8n.com/webhook/reminder-presensi',
  admin_phone = '081234567890'
WHERE id = 1;
```

### 6. Test
```
https://kelolasekolah.web.id/api/webhook_reminder.php
```

✅ Guru seharusnya terima WhatsApp!

---

## 🎯 FITUR

- ✅ **3x Reminder:** 08:00, 09:00, 10:00 WIB
- ✅ **Admin Alert:** Laporan jam 10:00
- ✅ **Smart Skip:** Auto-skip libur & weekend
- ✅ **Pesan Personal:** Nama guru di-mention
- ✅ **Logging:** Track success/failed

---

## 📚 DOKUMENTASI

| File | Deskripsi |
|------|-----------|
| `QUICK_START_WEBHOOK.md` | **Mulai dari sini** (30 menit setup) |
| `CARA_IMPORT_N8N_WORKFLOW.md` | Cara import & konfigurasi n8n |
| `PANDUAN_WEBHOOK_REMINDER_LENGKAP.md` | Setup lengkap step-by-step |
| `PANDUAN_INTEGRASI_GOWA_API.md` | Integrasi WhatsApp Gateway |
| `TESTING_CHECKLIST_WEBHOOK.md` | 13 test scenarios |
| `SUMMARY_WEBHOOK_IMPLEMENTATION.md` | Ringkasan lengkap |

---

## 💰 BIAYA

- **WhatsApp (Gowa):** ~Rp 136,400/bulan
- **n8n:** Gratis (self-hosted) atau $20/bulan (cloud)

---

## 🧪 TESTING

### Quick Test:
```
https://kelolasekolah.web.id/api/webhook_reminder.php
```

### Full Test:
Lihat `TESTING_CHECKLIST_WEBHOOK.md`

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek `api/webhook_error.log`
2. Cek tabel `webhook_logs`
3. Cek execution di n8n
4. Lihat troubleshooting di dokumentasi

---

## ✅ CHECKLIST

- [ ] Backend uploaded
- [ ] Database setup
- [ ] Cron jobs created
- [ ] n8n workflow imported & configured
- [ ] Webhook config updated
- [ ] Test manual success
- [ ] Test cron job (tunggu jam 08:00)

---

**Status:** ✅ Siap digunakan!

**Estimasi Setup:** 30-60 menit

**ROI:** Tinggi (hemat waktu admin, tingkatkan kepatuhan presensi)
