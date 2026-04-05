# Panduan Lengkap: Sistem Pengingat Presensi Otomatis

## 📋 OVERVIEW

Sistem ini akan mengirim pengingat WhatsApp otomatis kepada guru yang belum presensi pada jam:
- **08:00 WIB** - Pengingat pertama
- **09:00 WIB** - Pengingat kedua
- **10:00 WIB** - Pengingat terakhir + notifikasi ke admin

**KBM Mulai:** 07:20 WIB

---

## 🔧 INSTALASI

### STEP 1: Upload File Backend

Upload file-file ini ke cPanel:

```
api/webhook_reminder.php    → public_html/api/
api/webhook_config.php       → public_html/api/
```

**Cara Upload:**
1. Login ke cPanel → File Manager
2. Masuk ke folder `public_html/api/`
3. Upload kedua file tersebut

---

### STEP 2: Setup Database

1. Login ke phpMyAdmin
2. Pilih database `sobataja2_geopresence`
3. Klik tab **SQL**
4. Copy-paste isi file `database_webhook_v2.sql`
5. Klik **Go**

**Tabel yang dibuat:**
- `webhook_config` - Konfigurasi webhook (URL n8n, nomor admin, dll)
- `webhook_logs` - Log pengiriman reminder

---

### STEP 3: Setup Cron Job di cPanel

1. Login ke cPanel
2. Cari menu **Cron Jobs**
3. Tambahkan 3 cron job:

#### Cron Job 1: Reminder Jam 08:00 WIB
```
Minute: 0
Hour: 8
Day: *
Month: *
Weekday: *
Command: /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

#### Cron Job 2: Reminder Jam 09:00 WIB
```
Minute: 0
Hour: 9
Day: *
Month: *
Weekday: *
Command: /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

#### Cron Job 3: Reminder Jam 10:00 WIB
```
Minute: 0
Hour: 10
Day: *
Month: *
Weekday: *
Command: /usr/bin/php /home/sobataja2/public_html/api/webhook_reminder.php
```

**Catatan:** Sesuaikan path `/home/sobataja2/` dengan username cPanel Anda.

---

## 🤖 SETUP n8n WORKFLOW

### STEP 1: Buat Workflow Baru di n8n

1. Login ke n8n (self-hosted atau cloud)
2. Klik **New Workflow**
3. Beri nama: "Reminder Presensi Guru"

---

### STEP 2: Tambahkan Node-node

#### Node 1: Webhook Trigger
1. Tambah node **Webhook**
2. Setting:
   - **HTTP Method:** POST
   - **Path:** `reminder-presensi`
   - **Response Mode:** Last Node
3. Copy **Webhook URL** (contoh: `https://your-n8n.com/webhook/reminder-presensi`)
4. Simpan URL ini untuk dimasukkan ke config nanti

---

#### Node 2: Function - Parse Data
1. Tambah node **Function**
2. Code:
```javascript
// Parse data dari webhook
const data = $input.item.json;

return {
  json: {
    timestamp: data.timestamp,
    reminderType: data.reminder_type,
    totalGuru: data.total_belum_presensi,
    guruList: data.guru_list,
    adminAlert: data.admin_alert,
    adminPhone: data.admin_phone
  }
};
```

---

#### Node 3: Split In Batches - Loop Guru
1. Tambah node **Split In Batches**
2. Setting:
   - **Batch Size:** 1
   - **Options → Reset:** true

---

#### Node 4: Function - Format Pesan Guru
1. Tambah node **Function**
2. Code:
```javascript
const guru = $input.item.json.guruList[$itemIndex];
const reminderType = $input.item.json.reminderType;

// Template pesan berdasarkan jenis reminder
let message = '';

if (reminderType === 'first') {
  // Pengingat pertama (08:00)
  message = `🔔 *Pengingat Presensi*

Halo *${guru.nama}*,

Anda belum melakukan presensi hari ini.
Mohon segera isi presensi melalui:
👉 https://kelolasekolah.web.id

Terima kasih.
_Sistem GeoPresensi Sekolah_`;
  
} else if (reminderType === 'second') {
  // Pengingat kedua (09:00)
  message = `⚠️ *Pengingat Presensi (Kedua)*

Halo *${guru.nama}*,

Anda masih belum melakukan presensi hari ini.
Mohon segera isi presensi:
👉 https://kelolasekolah.web.id

Terima kasih.
_Sistem GeoPresensi Sekolah_`;
  
} else if (reminderType === 'final') {
  // Pengingat terakhir (10:00)
  message = `🚨 *Pengingat Presensi (Terakhir)*

Halo *${guru.nama}*,

Ini adalah pengingat terakhir.
Anda belum melakukan presensi hari ini.

Mohon SEGERA isi presensi:
👉 https://kelolasekolah.web.id

Jika ada kendala, hubungi admin.
_Sistem GeoPresensi Sekolah_`;
}

return {
  json: {
    phone: guru.no_hp,
    message: message,
    nama: guru.nama
  }
};
```

---

#### Node 5: HTTP Request - Kirim WhatsApp via Gowa
1. Tambah node **HTTP Request**
2. Setting:
   - **Method:** POST
   - **URL:** `https://api.gowa.id/send` (sesuaikan dengan endpoint Gowa Anda)
   - **Authentication:** None (atau sesuai Gowa)
   - **Send Body:** true
   - **Body Content Type:** JSON
   - **Specify Body:** Using Fields Below
   - **Body Parameters:**
     ```
     target: {{ $json.phone }}
     message: {{ $json.message }}
     ```
   - **Headers:**
     ```
     Authorization: Bearer YOUR_GOWA_API_KEY
     Content-Type: application/json
     ```

**Catatan:** Sesuaikan endpoint dan API key dengan akun Gowa Anda.

---

#### Node 6: Function - Check Admin Alert
1. Tambah node **Function**
2. Code:
```javascript
// Cek apakah perlu kirim notifikasi ke admin (jam 10:00)
const adminAlert = $input.first().json.adminAlert;
const adminPhone = $input.first().json.adminPhone;

if (adminAlert && adminPhone) {
  return {
    json: {
      sendToAdmin: true,
      adminPhone: adminPhone,
      totalGuru: $input.first().json.totalGuru,
      guruList: $input.first().json.guruList
    }
  };
} else {
  return {
    json: {
      sendToAdmin: false
    }
  };
}
```

---

#### Node 7: IF - Conditional Admin Alert
1. Tambah node **IF**
2. Setting:
   - **Condition:** `{{ $json.sendToAdmin }}` equals `true`

---

#### Node 8: Function - Format Pesan Admin
1. Tambah node **Function** (connect dari IF → true)
2. Code:
```javascript
const totalGuru = $json.totalGuru;
const guruList = $json.guruList;

// Buat list nama guru
let namaGuru = guruList.map((g, i) => `${i+1}. ${g.nama}`).join('\n');

const message = `📊 *Laporan Presensi - 10:00 WIB*

⚠️ Total guru belum presensi: *${totalGuru} orang*

Daftar guru:
${namaGuru}

Pengingat terakhir telah dikirim.
Mohon tindak lanjut.

_Sistem GeoPresensi Sekolah_`;

return {
  json: {
    phone: $json.adminPhone,
    message: message
  }
};
```

---

#### Node 9: HTTP Request - Kirim WhatsApp ke Admin
1. Tambah node **HTTP Request**
2. Setting sama seperti Node 5 (kirim ke Gowa)
3. Connect dari Node 8

---

### STEP 3: Aktifkan Workflow

1. Klik **Save** di kanan atas
2. Toggle **Active** menjadi ON
3. Workflow siap berjalan!

---

## ⚙️ KONFIGURASI DI ADMIN PANEL

### STEP 1: Login sebagai Admin

1. Buka https://kelolasekolah.web.id
2. Login dengan username: `miputra`, password: `manduraga`

---

### STEP 2: Masuk ke Menu Webhook Config (Coming Soon)

**Catatan:** Menu ini akan ditambahkan di frontend nanti. Untuk sementara, setting manual via database.

---

### STEP 3: Setting Manual via phpMyAdmin

1. Login ke phpMyAdmin
2. Pilih database `sobataja2_geopresence`
3. Buka tabel `webhook_config`
4. Edit row dengan `id = 1`:
   - `enabled`: `1` (aktifkan webhook)
   - `n8n_webhook_url`: Paste URL webhook dari n8n (contoh: `https://your-n8n.com/webhook/reminder-presensi`)
   - `admin_phone`: Nomor HP admin (contoh: `081234567890`)
5. Klik **Go**

---

## 🧪 TESTING

### Test 1: Manual Trigger (Tanpa Cron)

1. Buka browser
2. Akses: `https://kelolasekolah.web.id/api/webhook_reminder.php`
3. ✅ Seharusnya muncul response JSON:
   ```json
   {
     "success": true,
     "message": "Reminder sent successfully",
     "data": { ... }
   }
   ```
4. Cek WhatsApp guru yang belum presensi
5. ✅ Seharusnya terima pesan pengingat

---

### Test 2: Cek Log di Database

1. Login ke phpMyAdmin
2. Buka tabel `webhook_logs`
3. ✅ Seharusnya ada entry baru dengan:
   - `reminder_type`: `manual`
   - `total_guru`: jumlah guru yang belum presensi
   - `status`: `success`

---

### Test 3: Cek n8n Execution

1. Login ke n8n
2. Klik workflow "Reminder Presensi Guru"
3. Tab **Executions**
4. ✅ Seharusnya ada execution baru dengan status success

---

### Test 4: Test Cron Job (Tunggu Jam 08:00)

1. Tunggu sampai jam 08:00 WIB
2. Cron job akan jalan otomatis
3. Cek WhatsApp guru yang belum presensi
4. ✅ Seharusnya terima pesan pengingat pertama

---

### Test 5: Test Admin Alert (Tunggu Jam 10:00)

1. Tunggu sampai jam 10:00 WIB
2. Cron job akan jalan otomatis
3. Guru yang belum presensi terima pengingat terakhir
4. Admin terima notifikasi dengan daftar guru yang belum presensi
5. ✅ Cek WhatsApp admin

---

## 📊 MONITORING

### Cek Log Success/Error

File log tersimpan di:
- `api/webhook_success.log` - Log berhasil
- `api/webhook_error.log` - Log error

**Cara Cek:**
1. Login ke cPanel → File Manager
2. Masuk ke `public_html/api/`
3. Klik kanan file log → View

---

### Cek Database Logs

```sql
-- Cek 10 log terakhir
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Cek log hari ini
SELECT * FROM webhook_logs 
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- Cek log yang failed
SELECT * FROM webhook_logs 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## 🔧 TROUBLESHOOTING

### Webhook Tidak Jalan

**Cek:**
1. Apakah `enabled = 1` di tabel `webhook_config`?
2. Apakah `n8n_webhook_url` sudah diisi?
3. Apakah cron job sudah di-setup?
4. Cek file `webhook_error.log`

---

### Pesan WhatsApp Tidak Terkirim

**Cek:**
1. Apakah n8n workflow sudah aktif?
2. Apakah API key Gowa masih valid?
3. Apakah nomor HP guru valid (format: 08xxx)?
4. Cek execution log di n8n

---

### Admin Tidak Terima Notifikasi

**Cek:**
1. Apakah sudah jam 10:00? (admin alert hanya jam 10:00)
2. Apakah `admin_phone` sudah diisi di config?
3. Apakah nomor HP admin valid?

---

## 📝 CATATAN PENTING

1. **Hari Libur:** Sistem otomatis skip reminder jika hari ini libur (cek tabel `holidays`)
2. **Weekend:** Sistem otomatis skip reminder jika Sabtu/Minggu
3. **Semua Sudah Presensi:** Jika semua guru sudah presensi, webhook tidak akan dikirim
4. **Biaya WhatsApp:** Setiap pesan WhatsApp akan mengurangi saldo Gowa Anda
5. **Rate Limit:** Pastikan Gowa tidak ada rate limit yang membatasi pengiriman massal

---

## 🎯 NEXT STEPS (Opsional)

1. **Frontend Admin Panel** - Buat halaman admin untuk setting webhook (toggle on/off, edit URL, dll)
2. **Dashboard Monitoring** - Tampilkan statistik pengiriman reminder
3. **Custom Template** - Buat template pesan yang bisa diedit admin
4. **Multi-Language** - Support bahasa lain selain Indonesia

---

## 📞 SUPPORT

Jika ada masalah atau pertanyaan, hubungi developer atau cek dokumentasi:
- n8n: https://docs.n8n.io
- Gowa API: (dokumentasi dari provider Gowa Anda)

---

**Status:** ✅ Siap digunakan setelah setup selesai
