# Testing Checklist: Sistem Pengingat Presensi Otomatis

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Setup
- [ ] Tabel `webhook_config` sudah dibuat
- [ ] Tabel `webhook_logs` sudah dibuat
- [ ] Default config sudah di-insert (id=1)
- [ ] Test query: `SELECT * FROM webhook_config WHERE id = 1` → ada data

---

### 2. Backend Files
- [ ] File `api/webhook_reminder.php` sudah di-upload
- [ ] File `api/webhook_config.php` sudah di-upload
- [ ] File permission 644 (readable)
- [ ] Test akses: `https://kelolasekolah.web.id/api/webhook_reminder.php` → ada response

---

### 3. Cron Job Setup
- [ ] Cron job jam 08:00 sudah dibuat
- [ ] Cron job jam 09:00 sudah dibuat
- [ ] Cron job jam 10:00 sudah dibuat
- [ ] Path command sudah benar (sesuai username cPanel)
- [ ] Test manual run cron (jika ada fitur di cPanel)

---

### 4. n8n Workflow
- [ ] Workflow "Reminder Presensi Guru" sudah dibuat
- [ ] Semua node sudah dikonfigurasi (9 nodes total)
- [ ] Webhook URL sudah di-copy
- [ ] Workflow sudah di-save
- [ ] Workflow sudah di-aktifkan (toggle ON)

---

### 5. Gowa API
- [ ] API key sudah didapat
- [ ] Endpoint URL sudah dicatat
- [ ] Test kirim pesan manual berhasil (via Postman/cURL)
- [ ] Format nomor HP sudah sesuai
- [ ] Saldo Gowa mencukupi (minimal untuk 100 pesan)
- [ ] Device WhatsApp status online di dashboard Gowa

---

### 6. Configuration
- [ ] `webhook_config.enabled` = 1
- [ ] `webhook_config.n8n_webhook_url` sudah diisi
- [ ] `webhook_config.admin_phone` sudah diisi (format: 08xxx atau 628xxx)
- [ ] Test query: `SELECT * FROM webhook_config WHERE id = 1` → semua field terisi

---

## 🧪 TESTING SCENARIOS

### TEST 1: Manual Trigger (Tanpa Cron)

**Tujuan:** Test apakah webhook bisa jalan manual

**Steps:**
1. Pastikan ada guru yang belum presensi hari ini
2. Buka browser
3. Akses: `https://kelolasekolah.web.id/api/webhook_reminder.php`
4. Tunggu response (max 30 detik)

**Expected Result:**
```json
{
  "success": true,
  "message": "Reminder sent successfully",
  "data": {
    "timestamp": "2025-12-15 08:00:00",
    "reminder_type": "manual",
    "total_belum_presensi": 3,
    "guru_list": [...]
  }
}
```

**Checklist:**
- [ ] Response status 200 OK
- [ ] Response JSON valid
- [ ] `success` = true
- [ ] `total_belum_presensi` sesuai dengan jumlah guru yang belum presensi
- [ ] `guru_list` berisi data guru yang benar

---

### TEST 2: Cek Log Database

**Tujuan:** Pastikan log tersimpan di database

**Steps:**
1. Login ke phpMyAdmin
2. Buka tabel `webhook_logs`
3. Query: `SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1`

**Expected Result:**
- Ada entry baru
- `reminder_type` = `manual`
- `total_guru` = jumlah guru yang belum presensi
- `status` = `success`
- `response` berisi response dari n8n

**Checklist:**
- [ ] Entry baru ada di tabel
- [ ] Semua field terisi dengan benar
- [ ] `status` = `success`
- [ ] `created_at` = waktu sekarang

---

### TEST 3: Cek n8n Execution

**Tujuan:** Pastikan n8n menerima dan memproses webhook

**Steps:**
1. Login ke n8n
2. Buka workflow "Reminder Presensi Guru"
3. Klik tab **Executions**
4. Lihat execution terakhir

**Expected Result:**
- Ada execution baru
- Status: Success (hijau)
- Semua node berhasil dijalankan
- Node "HTTP Request - Kirim WhatsApp" ada response success dari Gowa

**Checklist:**
- [ ] Execution baru ada
- [ ] Status success
- [ ] Tidak ada node yang error (merah)
- [ ] Response dari Gowa API = success

---

### TEST 4: Cek WhatsApp Guru

**Tujuan:** Pastikan guru terima pesan WhatsApp

**Steps:**
1. Cek WhatsApp guru yang belum presensi
2. Lihat apakah ada pesan masuk dari nomor Gowa

**Expected Result:**
Pesan berbentuk:
```
🔔 *Pengingat Presensi*

Halo *[Nama Guru]*,

Anda belum melakukan presensi hari ini.
Mohon segera isi presensi melalui:
👉 https://kelolasekolah.web.id

Terima kasih.
_Sistem GeoPresensi Sekolah_
```

**Checklist:**
- [ ] Pesan terkirim ke WhatsApp guru
- [ ] Nama guru sesuai (tidak salah orang)
- [ ] Format pesan rapi (bold, emoji, link)
- [ ] Link bisa diklik dan menuju ke website

---

### TEST 5: Test Hari Libur (Skip Reminder)

**Tujuan:** Pastikan sistem tidak kirim reminder saat hari libur

**Steps:**
1. Tambah hari libur hari ini di tabel `holidays`
   ```sql
   INSERT INTO holidays (tanggal, nama_hari_libur, keterangan)
   VALUES (CURDATE(), 'Test Libur', 'Testing skip reminder');
   ```
2. Akses: `https://kelolasekolah.web.id/api/webhook_reminder.php`

**Expected Result:**
```
Hari libur, skip reminder
```

**Checklist:**
- [ ] Response = "Hari libur, skip reminder"
- [ ] Tidak ada log baru di `webhook_logs`
- [ ] Tidak ada execution baru di n8n
- [ ] Guru tidak terima WhatsApp

**Cleanup:**
```sql
DELETE FROM holidays WHERE tanggal = CURDATE() AND nama_hari_libur = 'Test Libur';
```

---

### TEST 6: Test Weekend (Skip Reminder)

**Tujuan:** Pastikan sistem tidak kirim reminder saat Sabtu/Minggu

**Steps:**
1. Tunggu sampai hari Sabtu atau Minggu
2. Akses: `https://kelolasekolah.web.id/api/webhook_reminder.php`

**Expected Result:**
```
Weekend, skip reminder
```

**Checklist:**
- [ ] Response = "Weekend, skip reminder"
- [ ] Tidak ada log baru di `webhook_logs`
- [ ] Tidak ada execution baru di n8n
- [ ] Guru tidak terima WhatsApp

---

### TEST 7: Test Semua Guru Sudah Presensi

**Tujuan:** Pastikan sistem tidak kirim reminder jika semua sudah presensi

**Steps:**
1. Pastikan semua guru sudah presensi hari ini
2. Akses: `https://kelolasekolah.web.id/api/webhook_reminder.php`

**Expected Result:**
```
Semua guru sudah presensi
```

**Checklist:**
- [ ] Response = "Semua guru sudah presensi"
- [ ] Tidak ada log baru di `webhook_logs`
- [ ] Tidak ada execution baru di n8n
- [ ] Tidak ada WhatsApp terkirim

---

### TEST 8: Test Cron Job Jam 08:00

**Tujuan:** Pastikan cron job jalan otomatis jam 08:00

**Steps:**
1. Pastikan ada guru yang belum presensi
2. Tunggu sampai jam 08:00 WIB
3. Tunggu 1-2 menit (cron job butuh waktu)
4. Cek WhatsApp guru

**Expected Result:**
- Guru terima pesan pengingat pertama
- Pesan berisi: "🔔 *Pengingat Presensi*"

**Checklist:**
- [ ] Cron job jalan otomatis (tidak perlu trigger manual)
- [ ] Guru terima WhatsApp jam 08:00-08:02
- [ ] Log di database: `reminder_type` = `first`
- [ ] Execution di n8n ada dan success

---

### TEST 9: Test Cron Job Jam 09:00

**Tujuan:** Pastikan cron job jalan otomatis jam 09:00

**Steps:**
1. Pastikan masih ada guru yang belum presensi (dari jam 08:00)
2. Tunggu sampai jam 09:00 WIB
3. Tunggu 1-2 menit
4. Cek WhatsApp guru

**Expected Result:**
- Guru terima pesan pengingat kedua
- Pesan berisi: "⚠️ *Pengingat Presensi (Kedua)*"

**Checklist:**
- [ ] Cron job jalan otomatis
- [ ] Guru terima WhatsApp jam 09:00-09:02
- [ ] Log di database: `reminder_type` = `second`
- [ ] Execution di n8n ada dan success

---

### TEST 10: Test Cron Job Jam 10:00 + Admin Alert

**Tujuan:** Pastikan cron job jalan otomatis jam 10:00 dan admin terima notifikasi

**Steps:**
1. Pastikan masih ada guru yang belum presensi (dari jam 09:00)
2. Tunggu sampai jam 10:00 WIB
3. Tunggu 1-2 menit
4. Cek WhatsApp guru
5. Cek WhatsApp admin

**Expected Result:**

**Guru terima:**
```
🚨 *Pengingat Presensi (Terakhir)*

Halo *[Nama Guru]*,

Ini adalah pengingat terakhir.
Anda belum melakukan presensi hari ini.
...
```

**Admin terima:**
```
📊 *Laporan Presensi - 10:00 WIB*

⚠️ Total guru belum presensi: *3 orang*

Daftar guru:
1. Ahmad Fauzi
2. Dewi Lestari
3. Rudi Hartono

Pengingat terakhir telah dikirim.
Mohon tindak lanjut.
```

**Checklist:**
- [ ] Cron job jalan otomatis
- [ ] Guru terima WhatsApp pengingat terakhir
- [ ] Admin terima WhatsApp laporan
- [ ] Laporan admin berisi daftar guru yang benar
- [ ] Log di database: `reminder_type` = `final`
- [ ] Execution di n8n ada dan success

---

### TEST 11: Test Multiple Guru

**Tujuan:** Pastikan sistem bisa handle banyak guru sekaligus

**Steps:**
1. Pastikan ada 5-10 guru yang belum presensi
2. Trigger webhook manual atau tunggu cron job
3. Cek WhatsApp semua guru

**Expected Result:**
- Semua guru terima pesan WhatsApp
- Tidak ada guru yang terlewat
- Pesan personal (nama masing-masing)

**Checklist:**
- [ ] Semua guru terima WhatsApp
- [ ] Nama di pesan sesuai dengan penerima
- [ ] Tidak ada duplikasi pesan
- [ ] Tidak ada guru yang terlewat

---

### TEST 12: Test Error Handling (n8n Offline)

**Tujuan:** Pastikan sistem handle error dengan baik

**Steps:**
1. Matikan workflow n8n (toggle OFF)
2. Trigger webhook manual
3. Cek response dan log

**Expected Result:**
```json
{
  "success": false,
  "message": "Failed to send reminder",
  "error": "HTTP 404" atau "Connection timeout"
}
```

**Checklist:**
- [ ] Response `success` = false
- [ ] Ada error message yang jelas
- [ ] Log di database: `status` = `failed`
- [ ] Log di `webhook_error.log` ada entry baru

**Cleanup:**
- Aktifkan kembali workflow n8n (toggle ON)

---

### TEST 13: Test Error Handling (Gowa API Error)

**Tujuan:** Pastikan sistem handle error dari Gowa

**Steps:**
1. Di n8n, ubah API key Gowa jadi salah (temporary)
2. Trigger webhook manual
3. Cek execution di n8n

**Expected Result:**
- Execution di n8n status error (merah)
- Node "HTTP Request - Kirim WhatsApp" error
- Error message: "Unauthorized" atau "Invalid API key"

**Checklist:**
- [ ] Execution di n8n status error
- [ ] Error message jelas
- [ ] Guru tidak terima WhatsApp (karena error)

**Cleanup:**
- Kembalikan API key Gowa yang benar

---

## 📊 MONITORING CHECKLIST (Setelah Go-Live)

### Daily Monitoring (Setiap Hari)

- [ ] Cek `webhook_logs` → ada entry baru setiap hari?
- [ ] Cek status → semua `success`?
- [ ] Cek `webhook_error.log` → ada error baru?
- [ ] Cek saldo Gowa → masih cukup?
- [ ] Cek device Gowa → status online?

---

### Weekly Monitoring (Setiap Minggu)

- [ ] Cek total pengiriman pesan → sesuai ekspektasi?
- [ ] Cek biaya WhatsApp → sesuai budget?
- [ ] Cek feedback guru → apakah reminder membantu?
- [ ] Cek tingkat kepatuhan presensi → meningkat?

---

### Monthly Monitoring (Setiap Bulan)

- [ ] Review log 1 bulan terakhir
- [ ] Hitung total biaya WhatsApp
- [ ] Evaluasi efektivitas reminder (apakah perlu 3x atau cukup 2x?)
- [ ] Backup database (termasuk `webhook_logs`)

---

## 🚨 TROUBLESHOOTING QUICK REFERENCE

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| Webhook tidak jalan | Config disabled | Set `enabled = 1` |
| Guru tidak terima WA | Nomor HP salah | Cek format nomor (08xxx atau 628xxx) |
| Admin tidak terima WA | Bukan jam 10:00 | Admin alert hanya jam 10:00 |
| Error "Unauthorized" | API key salah | Cek API key Gowa |
| Error "Insufficient balance" | Saldo habis | Top up saldo Gowa |
| Cron job tidak jalan | Path salah | Cek path di cron job command |
| n8n tidak terima data | URL webhook salah | Cek URL di `webhook_config` |

---

**Status:** ✅ Siap untuk testing setelah deployment
