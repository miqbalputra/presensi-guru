# Cara Pakai: Kirim WhatsApp Langsung ke Gowa (Tanpa n8n)

## 📋 OVERVIEW

Karena ada masalah koneksi server → n8n, kita pakai solusi alternatif:
**Kirim WhatsApp langsung dari PHP ke Gowa**, tanpa perlu n8n.

---

## 🚀 SETUP (10 Menit)

### STEP 1: Upload File Baru

Upload file ini ke cPanel:
```
api/webhook_reminder_direct.php → public_html/api/
```

---

### STEP 2: Edit File - Ganti Config Gowa

1. Buka file `api/webhook_reminder_direct.php` di cPanel File Manager
2. Cari baris ini (sekitar line 60):
   ```php
   $gowaUrl = 'https://api.gowa.id/send'; // GANTI
   $gowaApiKey = 'YOUR_GOWA_API_KEY'; // GANTI
   ```
3. Ganti dengan data Gowa Anda:
   ```php
   $gowaUrl = 'https://api.gowa.id/send'; // Endpoint Gowa Anda
   $gowaApiKey = 'gowa_abc123xyz456'; // API Key Gowa Anda
   ```

**Cara Dapat Info Gowa:**
- Login ke dashboard Gowa
- Cari menu "API" atau "Developer"
- Copy endpoint URL dan API key

---

### STEP 3: Test Manual

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
    "reminder_type": "manual",
    "total_guru": 2,
    "success_count": 2,
    "failed_count": 0
  }
}
```

✅ **Guru "Pandu" dan "Tes" seharusnya terima WhatsApp!**

---

### STEP 4: Update Cron Job

Ganti cron job dari `webhook_reminder.php` ke `webhook_reminder_direct.php`:

**Cron Job Lama (HAPUS):**
```
0 8 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
0 9 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
0 10 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

**Cron Job Baru (TAMBAH):**
```
0 8 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder_direct.php
0 9 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder_direct.php
0 10 * * * /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder_direct.php
```

---

## ✅ KEUNTUNGAN SOLUSI INI:

1. ✅ **Tidak perlu n8n** - Langsung dari PHP ke Gowa
2. ✅ **Lebih cepat** - Tidak ada delay dari n8n
3. ✅ **Lebih simple** - Hanya 1 file PHP
4. ✅ **Lebih murah** - Tidak perlu bayar n8n cloud ($20/bulan)
5. ✅ **Lebih reliable** - Tidak tergantung koneksi ke n8n

---

## 🎯 FITUR YANG SAMA:

- ✅ 3x Reminder (08:00, 09:00, 10:00)
- ✅ Pesan personal (nama guru)
- ✅ Admin alert jam 10:00
- ✅ Auto-skip libur & weekend
- ✅ Logging lengkap

---

## 🔧 TROUBLESHOOTING

### Error: "Failed to send WhatsApp"

**Cek:**
1. Apakah `$gowaUrl` sudah benar?
2. Apakah `$gowaApiKey` sudah benar?
3. Apakah saldo Gowa masih cukup?
4. Apakah device WhatsApp di dashboard Gowa status online?

**Test:**
```
https://kelolasekolah.web.id/api/test_direct_gowa.php
```

---

### Error: "Webhook disabled"

**Solusi:**
```sql
UPDATE webhook_config SET enabled = 1 WHERE id = 1;
```

---

### Pesan tidak terkirim (tidak ada error)

**Cek:**
- Format nomor HP guru (08xxx atau 628xxx?)
- Nomor HP valid dan terdaftar WhatsApp?
- Cek log: `api/webhook_error.log` dan `api/webhook_success.log`

---

## 📊 MONITORING

### Cek Log Success:
```
api/webhook_success.log
```

### Cek Log Error:
```
api/webhook_error.log
```

### Cek Database:
```sql
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 💰 BIAYA

**Sebelum (dengan n8n):**
- WhatsApp: ~Rp 136,400/bulan
- n8n cloud: $20/bulan (~Rp 320,000)
- **Total: ~Rp 456,400/bulan**

**Sesudah (tanpa n8n):**
- WhatsApp: ~Rp 136,400/bulan
- n8n: Rp 0 (tidak perlu)
- **Total: ~Rp 136,400/bulan**

**Hemat: ~Rp 320,000/bulan!** 🎉

---

## 📋 CHECKLIST

- [ ] File `webhook_reminder_direct.php` uploaded
- [ ] Config Gowa sudah diganti (URL + API key)
- [ ] Test manual berhasil
- [ ] Guru terima WhatsApp
- [ ] Cron job sudah diupdate
- [ ] Test cron job (tunggu jam 08:00)

---

## 🎯 NEXT STEPS

Setelah semua berjalan:
1. Monitor log 1 minggu
2. Cek feedback guru (apakah reminder membantu?)
3. Evaluasi biaya WhatsApp
4. Optimize jika perlu (misal: cukup 2x reminder, bukan 3x)

---

**Status:** ✅ Siap digunakan!

**Estimasi Setup:** 10 menit

**Tingkat Kesulitan:** Easy (hanya edit 2 baris code)
