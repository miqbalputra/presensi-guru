# Cara Import n8n Workflow

## 📥 IMPORT WORKFLOW

### STEP 1: Buka n8n Dashboard
1. Login ke n8n (self-hosted atau cloud)
2. Klik menu **Workflows** di sidebar kiri

---

### STEP 2: Import JSON
1. Klik tombol **Import from File** atau **Import from URL**
2. Pilih **Import from File**
3. Upload file: `n8n_workflow_reminder_presensi.json`
4. Klik **Import**

**Alternatif (Copy-Paste):**
1. Klik **Add workflow** → **Import from JSON**
2. Buka file `n8n_workflow_reminder_presensi.json`
3. Copy semua isi file (Ctrl+A, Ctrl+C)
4. Paste ke text area di n8n
5. Klik **Import**

---

### STEP 3: Workflow Berhasil Di-import
✅ Workflow "Reminder Presensi Guru" muncul di dashboard
✅ Ada 10 nodes yang ter-import

---

## ⚙️ KONFIGURASI WORKFLOW

### NODE 1: Webhook Trigger
**Tidak perlu diubah**, sudah otomatis.

**Yang perlu dicatat:**
1. Klik node "Webhook Trigger"
2. Copy **Webhook URL** (contoh: `https://your-n8n.com/webhook/reminder-presensi`)
3. Simpan URL ini untuk dimasukkan ke database nanti

---

### NODE 5: Kirim WhatsApp ke Guru
**WAJIB DIUBAH!**

1. Klik node "Kirim WhatsApp ke Guru"
2. Ubah **URL** sesuai endpoint Gowa Anda:
   ```
   https://api.gowa.id/send
   ```
   (Sesuaikan dengan dokumentasi Gowa Anda)

3. Ubah **Authorization Header**:
   - Klik tab **Headers**
   - Cari header "Authorization"
   - Ubah value dari `Bearer YOUR_GOWA_API_KEY` menjadi API key Gowa Anda yang sebenarnya
   - Contoh: `Bearer gowa_abc123xyz456`

4. Cek **Body Parameters**:
   - `target`: `={{ $json.phone }}` (sudah benar)
   - `message`: `={{ $json.message }}` (sudah benar)
   
   **Catatan:** Jika Gowa Anda menggunakan field name berbeda (misal `phone` bukan `target`), sesuaikan di sini.

---

### NODE 9: Kirim WhatsApp ke Admin
**WAJIB DIUBAH!**

1. Klik node "Kirim WhatsApp ke Admin"
2. Sama seperti Node 5, ubah:
   - **URL** → Endpoint Gowa Anda
   - **Authorization Header** → API key Gowa Anda
   - **Body Parameters** → Sesuaikan jika perlu

---

## 🧪 TEST WORKFLOW

### Test 1: Test Webhook URL
1. Klik node "Webhook Trigger"
2. Klik tombol **Listen for Test Event**
3. Copy webhook URL
4. Buka Postman atau browser
5. Kirim POST request ke webhook URL dengan body:
   ```json
   {
     "timestamp": "2025-12-15 08:00:00",
     "reminder_type": "first",
     "total_belum_presensi": 1,
     "guru_list": [
       {
         "id": 3,
         "nama": "Test Guru",
         "no_hp": "081234567890"
       }
     ],
     "admin_alert": false,
     "admin_phone": null
   }
   ```
6. ✅ n8n seharusnya menerima data dan menampilkan di node

---

### Test 2: Test Kirim WhatsApp
1. Pastikan test data sudah diterima (Test 1 berhasil)
2. Klik tombol **Execute Workflow**
3. Tunggu beberapa detik
4. ✅ Cek WhatsApp nomor `081234567890`, seharusnya terima pesan

---

### Test 3: Test Admin Alert
1. Kirim POST request dengan `admin_alert: true`:
   ```json
   {
     "timestamp": "2025-12-15 10:00:00",
     "reminder_type": "final",
     "total_belum_presensi": 2,
     "guru_list": [
       {
         "id": 3,
         "nama": "Test Guru 1",
         "no_hp": "081234567890"
       },
       {
         "id": 4,
         "nama": "Test Guru 2",
         "no_hp": "081234567891"
       }
     ],
     "admin_alert": true,
     "admin_phone": "081234567899"
   }
   ```
2. Execute workflow
3. ✅ Guru terima pesan pengingat
4. ✅ Admin terima laporan

---

## 🔧 TROUBLESHOOTING

### Error: "Invalid credentials"
**Solusi:**
- Cek API key Gowa sudah benar
- Cek format header: `Bearer YOUR_KEY` (ada spasi setelah Bearer)

---

### Error: "Invalid phone number"
**Solusi:**
- Cek format nomor HP di Function node "Format Pesan Guru"
- Pastikan konversi 08xxx ke 628xxx berjalan
- Atau sesuaikan dengan format yang diterima Gowa Anda

---

### Error: "URL not found" atau 404
**Solusi:**
- Cek endpoint URL Gowa sudah benar
- Cek dokumentasi Gowa untuk endpoint yang benar

---

### Pesan tidak terkirim (tidak ada error)
**Solusi:**
- Cek execution log di n8n (klik tab Executions)
- Cek response dari Gowa API (klik node "Kirim WhatsApp ke Guru" → lihat output)
- Cek saldo Gowa masih cukup
- Cek device WhatsApp di dashboard Gowa status online

---

## ✅ AKTIVASI WORKFLOW

Setelah semua test berhasil:

1. Klik tombol **Save** di kanan atas
2. Toggle **Active** menjadi ON (hijau)
3. ✅ Workflow siap menerima webhook dari PHP!

---

## 📋 CHECKLIST

- [ ] Workflow berhasil di-import
- [ ] Webhook URL sudah di-copy
- [ ] Node "Kirim WhatsApp ke Guru" sudah dikonfigurasi (URL + API key)
- [ ] Node "Kirim WhatsApp ke Admin" sudah dikonfigurasi (URL + API key)
- [ ] Test webhook berhasil (data diterima)
- [ ] Test kirim WhatsApp berhasil (pesan terkirim)
- [ ] Test admin alert berhasil (admin terima laporan)
- [ ] Workflow sudah di-save
- [ ] Workflow sudah di-aktifkan (toggle ON)

---

## 🔗 NEXT STEP

Setelah workflow aktif:

1. Copy webhook URL
2. Masukkan ke database `webhook_config`:
   ```sql
   UPDATE webhook_config SET
     n8n_webhook_url = 'https://your-n8n.com/webhook/reminder-presensi'
   WHERE id = 1;
   ```
3. Test dari PHP:
   ```
   https://kelolasekolah.web.id/api/webhook_reminder.php
   ```
4. ✅ Guru seharusnya terima WhatsApp!

---

## 📞 SUPPORT

Jika ada masalah:
- Cek execution log di n8n (tab Executions)
- Cek error message di setiap node
- Lihat troubleshooting di atas
- Baca dokumentasi n8n: https://docs.n8n.io

---

**Status:** ✅ Siap di-import dan dikonfigurasi!
