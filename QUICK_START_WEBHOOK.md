# Quick Start: Sistem Pengingat Presensi Otomatis

## 🚀 SETUP CEPAT (30 Menit)

### STEP 1: Database (5 menit)
```sql
-- Jalankan di phpMyAdmin
-- Copy-paste isi file: database_webhook_v2.sql
```

### STEP 2: Upload Files (5 menit)
```
api/webhook_reminder.php  → public_html/api/
api/webhook_config.php    → public_html/api/
```

### STEP 3: Setup Cron Job (5 menit)
Di cPanel → Cron Jobs, tambahkan 3 cron:

**08:00 WIB:**
```
0 8 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

**09:00 WIB:**
```
0 9 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

**10:00 WIB:**
```
0 10 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

### STEP 4: Setup n8n Workflow (10 menit)
1. Buat workflow baru: "Reminder Presensi Guru"
2. Tambah 9 nodes (lihat `PANDUAN_WEBHOOK_REMINDER_LENGKAP.md`)
3. Copy webhook URL
4. Aktifkan workflow

### STEP 5: Konfigurasi (5 menit)
Di phpMyAdmin, edit tabel `webhook_config`:
```sql
UPDATE webhook_config SET
  enabled = 1,
  n8n_webhook_url = 'https://your-n8n.com/webhook/reminder-presensi',
  admin_phone = '081234567890'
WHERE id = 1;
```

---

## ✅ TESTING CEPAT

### Test Manual:
```
https://kelolasekolah.web.id/api/webhook_reminder.php
```

Expected: Guru terima WhatsApp dalam 1-2 menit

---

## 📋 CHECKLIST

- [ ] Database setup ✓
- [ ] Files uploaded ✓
- [ ] Cron jobs created ✓
- [ ] n8n workflow active ✓
- [ ] Config updated ✓
- [ ] Test manual success ✓

---

## 📚 DOKUMENTASI LENGKAP

1. **PANDUAN_WEBHOOK_REMINDER_LENGKAP.md** - Setup lengkap step-by-step
2. **PANDUAN_INTEGRASI_GOWA_API.md** - Integrasi WhatsApp Gateway
3. **TESTING_CHECKLIST_WEBHOOK.md** - Testing scenarios lengkap

---

## 🎯 JADWAL REMINDER

- **07:20 WIB** - KBM mulai
- **08:00 WIB** - Pengingat pertama 🔔
- **09:00 WIB** - Pengingat kedua ⚠️
- **10:00 WIB** - Pengingat terakhir + Admin alert 🚨

---

## 💰 ESTIMASI BIAYA

- **Rp 100-300** per pesan WhatsApp
- **~31 pesan/hari** (10 guru x 3 reminder + 1 admin)
- **~Rp 136,400/bulan** (22 hari kerja)

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek `api/webhook_error.log`
2. Cek tabel `webhook_logs`
3. Cek execution di n8n
4. Lihat troubleshooting di dokumentasi lengkap

---

**Status:** ✅ Siap digunakan!
