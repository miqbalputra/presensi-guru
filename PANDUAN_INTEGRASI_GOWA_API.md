# Panduan Integrasi Gowa WhatsApp Gateway

## 📱 TENTANG GOWA

Gowa adalah WhatsApp Gateway yang memungkinkan pengiriman pesan WhatsApp via API.

---

## 🔑 PERSIAPAN

### Yang Anda Butuhkan:
1. **API Key** - Token autentikasi dari Gowa
2. **Endpoint URL** - URL API Gowa untuk kirim pesan
3. **Nomor WhatsApp** - Nomor yang sudah terdaftar di Gowa

---

## 📋 INFORMASI YANG PERLU DIKUMPULKAN

Sebelum setup, siapkan informasi ini dari akun Gowa Anda:

### 1. API Endpoint
Biasanya berbentuk:
```
https://api.gowa.id/send
```
atau
```
https://api.gowa.id/v1/messages/send
```

**Cara Cek:**
- Login ke dashboard Gowa
- Cari menu "API Documentation" atau "Developer"
- Copy endpoint URL untuk "Send Message"

---

### 2. API Key / Token
Biasanya berbentuk:
```
gowa_xxxxxxxxxxxxxxxxxxxxx
```
atau
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cara Cek:**
- Login ke dashboard Gowa
- Cari menu "API Key" atau "Settings"
- Copy API key Anda

---

### 3. Format Request Body

Gowa biasanya menggunakan salah satu format ini:

#### Format 1 (JSON):
```json
{
  "target": "081234567890",
  "message": "Halo, ini pesan test"
}
```

#### Format 2 (JSON dengan device):
```json
{
  "phone": "081234567890",
  "message": "Halo, ini pesan test",
  "device": "primary"
}
```

#### Format 3 (Form Data):
```
target=081234567890&message=Halo, ini pesan test
```

**Cara Cek:**
- Lihat dokumentasi API Gowa
- Atau test dengan Postman/cURL

---

## 🧪 TEST API GOWA (Manual)

### Test dengan cURL (Terminal/CMD):

```bash
curl -X POST https://api.gowa.id/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "081234567890",
    "message": "Test pesan dari cURL"
  }'
```

**Ganti:**
- `https://api.gowa.id/send` → Endpoint Gowa Anda
- `YOUR_API_KEY` → API key Anda
- `081234567890` → Nomor HP Anda untuk test

**Expected Response:**
```json
{
  "status": "success",
  "message": "Message sent successfully"
}
```

---

### Test dengan Postman:

1. Buka Postman
2. Buat request baru:
   - **Method:** POST
   - **URL:** `https://api.gowa.id/send`
3. Tab **Headers:**
   ```
   Authorization: Bearer YOUR_API_KEY
   Content-Type: application/json
   ```
4. Tab **Body** → raw → JSON:
   ```json
   {
     "target": "081234567890",
     "message": "Test pesan dari Postman"
   }
   ```
5. Klik **Send**
6. ✅ Cek WhatsApp Anda, seharusnya terima pesan

---

## ⚙️ KONFIGURASI DI n8n

### Node: HTTP Request (Kirim WhatsApp)

**Setting:**
- **Method:** POST
- **URL:** `https://api.gowa.id/send` (sesuaikan)
- **Authentication:** None
- **Send Headers:** Yes
- **Headers:**
  ```
  Name: Authorization
  Value: Bearer YOUR_API_KEY
  
  Name: Content-Type
  Value: application/json
  ```
- **Send Body:** Yes
- **Body Content Type:** JSON
- **Specify Body:** Using Fields Below
- **Body Parameters:**
  ```
  Name: target
  Value: {{ $json.phone }}
  
  Name: message
  Value: {{ $json.message }}
  ```

---

## 🔍 FORMAT NOMOR HP

Gowa biasanya menerima format:

### Format 1: Dengan kode negara (Rekomendasi)
```
62812345678  (tanpa +)
+62812345678 (dengan +)
```

### Format 2: Tanpa kode negara
```
0812345678
```

**Cara Konversi di n8n:**

Jika nomor di database format `08xxx`, konversi ke `628xxx`:

```javascript
// Di Function node
let phone = $json.phone;

// Hapus leading 0, tambah 62
if (phone.startsWith('0')) {
  phone = '62' + phone.substring(1);
}

return {
  json: {
    phone: phone,
    message: $json.message
  }
};
```

---

## 📊 RESPONSE HANDLING

### Success Response (Biasanya):
```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "id": "msg_123456",
    "phone": "62812345678",
    "timestamp": "2025-12-15 08:00:00"
  }
}
```

### Error Response (Biasanya):
```json
{
  "status": "error",
  "message": "Invalid phone number",
  "code": 400
}
```

---

## 🚨 TROUBLESHOOTING

### Error: "Unauthorized" atau "Invalid API Key"
**Solusi:**
- Cek API key sudah benar
- Cek format header: `Authorization: Bearer YOUR_KEY`
- Pastikan API key masih aktif (tidak expired)

---

### Error: "Invalid phone number"
**Solusi:**
- Cek format nomor HP (08xxx atau 628xxx?)
- Pastikan nomor valid (10-15 digit)
- Coba tambah/hapus kode negara

---

### Error: "Insufficient balance"
**Solusi:**
- Top up saldo Gowa Anda
- Cek dashboard Gowa untuk sisa saldo

---

### Error: "Rate limit exceeded"
**Solusi:**
- Tunggu beberapa menit
- Kurangi frekuensi pengiriman
- Upgrade paket Gowa jika perlu

---

### Pesan Tidak Terkirim (Tidak Ada Error)
**Solusi:**
- Cek nomor HP penerima sudah terdaftar WhatsApp?
- Cek nomor HP tidak diblokir
- Cek status device di dashboard Gowa (online/offline?)

---

## 💰 ESTIMASI BIAYA

Biaya per pesan WhatsApp via Gowa (estimasi):
- **Rp 100-300** per pesan (tergantung paket)

**Contoh Perhitungan:**
- 10 guru belum presensi
- 3x reminder per hari (08:00, 09:00, 10:00)
- 1x notifikasi admin
- Total: (10 x 3) + 1 = **31 pesan/hari**
- Biaya: 31 x Rp 200 = **Rp 6,200/hari**
- Biaya bulanan: Rp 6,200 x 22 hari kerja = **Rp 136,400/bulan**

**Tips Hemat:**
- Hanya kirim 2x reminder (08:00 dan 10:00)
- Atau hanya 1x reminder (08:00 saja)

---

## 📞 KONTAK SUPPORT GOWA

Jika ada masalah teknis dengan Gowa:
- **Website:** (sesuaikan dengan provider Gowa Anda)
- **Email:** support@gowa.id (contoh)
- **WhatsApp:** (nomor support Gowa)
- **Dokumentasi:** (link dokumentasi API Gowa)

---

## ✅ CHECKLIST SETUP

Sebelum go-live, pastikan:

- [ ] API key Gowa sudah didapat
- [ ] Endpoint URL sudah dicatat
- [ ] Test kirim pesan manual berhasil (via cURL/Postman)
- [ ] Format nomor HP sudah sesuai
- [ ] Saldo Gowa mencukupi
- [ ] Device WhatsApp di dashboard Gowa status online
- [ ] n8n workflow sudah dikonfigurasi dengan benar
- [ ] Test end-to-end berhasil (dari cron job sampai terima WhatsApp)

---

**Status:** ✅ Siap integrasi setelah informasi Gowa lengkap
