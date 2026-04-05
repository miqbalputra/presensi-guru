# Fitur: Hari Libur & Hari Kerja (Senin-Jumat)

## 🎯 FITUR BARU

### **1. Hari Kerja: Senin - Jumat**
- Presensi hanya bisa dilakukan Senin-Jumat
- Sabtu & Minggu otomatis libur (weekend)
- Tombol presensi disabled di hari libur

### **2. Hari Libur Nasional**
- Database untuk menyimpan hari libur nasional
- Cuti bersama
- Libur sekolah khusus
- Otomatis disable presensi di hari libur

### **3. Tampilan Informasi**
- Notifikasi jika hari libur/weekend
- Nama hari libur ditampilkan
- Warna berbeda untuk weekend vs libur nasional

---

## 📋 STRUKTUR DATABASE

### **Tabel: holidays**

```sql
CREATE TABLE `holidays` (
  `id` int(11) PRIMARY KEY AUTO_INCREMENT,
  `tanggal` date NOT NULL UNIQUE,
  `nama` varchar(255) NOT NULL,
  `jenis` enum('nasional','cuti_bersama','sekolah'),
  `keterangan` text,
  `created_at` timestamp DEFAULT current_timestamp()
);
```

**Field:**
- `tanggal`: Tanggal libur (format: yyyy-mm-dd)
- `nama`: Nama hari libur (contoh: "Hari Kemerdekaan RI")
- `jenis`: Jenis libur (nasional/cuti_bersama/sekolah)
- `keterangan`: Keterangan tambahan (opsional)

---

## 🔧 CARA INSTALASI

### **STEP 1: Buat Tabel Database**

1. Login ke **cPanel** → **phpMyAdmin**
2. Pilih database Anda
3. Klik tab **"SQL"**
4. Copy-paste isi file **`database_hari_libur.sql`**
5. Klik **"Go"**

Script ini akan:
- ✅ Membuat tabel `holidays`
- ✅ Insert data hari libur nasional 2025
- ✅ Insert data cuti bersama 2025

---

### **STEP 2: Upload File Backend**

Upload file ini ke server:

1. **`api/holidays.php`** → Upload ke `/home/username/api/`

---

### **STEP 3: Build & Upload Frontend**

```bash
cd "D:\Kiro\12 Des 2025"
npm run build
```

Upload ke server:
- Hapus `index.html` dan `assets` lama di `public_html`
- Upload `index.html` dan `assets` baru dari `dist`

---

### **STEP 4: Test**

1. Clear cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Login sebagai guru
4. Test di hari Sabtu/Minggu → Harus muncul pesan libur ✅
5. Test di hari libur nasional → Harus muncul pesan libur ✅
6. Test di hari kerja → Tombol presensi muncul ✅

---

## 🧪 TEST SKENARIO

### **Test 1: Hari Kerja (Senin-Jumat)**
1. Login di hari Senin-Jumat
2. **Hasil**: Tombol HADIR, IZIN, SAKIT muncul ✅

### **Test 2: Hari Weekend (Sabtu-Minggu)**
1. Login di hari Sabtu atau Minggu
2. **Hasil**: 
   - Muncul pesan "Hari Sabtu/Minggu adalah hari libur"
   - Tombol presensi tidak muncul ✅
   - Background biru

### **Test 3: Hari Libur Nasional**
1. Login di tanggal 17 Agustus (Hari Kemerdekaan)
2. **Hasil**:
   - Muncul pesan "Hari Libur: Hari Kemerdekaan RI"
   - Tombol presensi tidak muncul ✅
   - Background kuning

### **Test 4: Cuti Bersama**
1. Login di tanggal cuti bersama
2. **Hasil**:
   - Muncul pesan "Hari Libur: Cuti Bersama ..."
   - Tombol presensi tidak muncul ✅

---

## 📝 HARI LIBUR NASIONAL 2025

| Tanggal | Nama Libur | Jenis |
|---------|------------|-------|
| 01 Jan 2025 | Tahun Baru 2025 | Nasional |
| 29 Mar 2025 | Isra Miraj | Nasional |
| 31 Mar 2025 | Hari Raya Nyepi | Nasional |
| 18 Apr 2025 | Wafat Isa Almasih | Nasional |
| 01 Mei 2025 | Hari Buruh | Nasional |
| 12 Mei 2025 | Hari Raya Waisak | Nasional |
| 29 Mei 2025 | Kenaikan Isa Almasih | Nasional |
| 01 Jun 2025 | Hari Lahir Pancasila | Nasional |
| 17 Agu 2025 | Hari Kemerdekaan RI | Nasional |
| 25 Des 2025 | Hari Raya Natal | Nasional |

**Catatan**: Hari Raya Idul Fitri dan Idul Adha belum dimasukkan karena tanggalnya berdasarkan kalender Hijriah (perlu update setiap tahun).

---

## 🔧 CARA MENAMBAH HARI LIBUR

### **Opsi 1: Manual via phpMyAdmin**

```sql
INSERT INTO holidays (tanggal, nama, jenis, keterangan) 
VALUES ('2025-04-01', 'Idul Fitri 1446 H', 'nasional', 'Hari Raya Islam');
```

### **Opsi 2: Via API (untuk Admin)**

Nanti bisa dibuat menu admin untuk manage hari libur:
- Tambah hari libur baru
- Edit hari libur
- Hapus hari libur

---

## 📊 API ENDPOINTS

### **1. GET All Holidays**
```
GET /api/holidays.php
GET /api/holidays.php?year=2025
GET /api/holidays.php?start_date=2025-01-01&end_date=2025-12-31
```

### **2. Check if Date is Holiday**
```
GET /api/holidays.php?check=2025-12-25
```

Response:
```json
{
  "success": true,
  "data": {
    "tanggal": "2025-12-25",
    "isHoliday": true,
    "isWeekend": false,
    "isWorkday": false,
    "holidayName": "Hari Raya Natal",
    "holidayType": "nasional",
    "dayName": "Kamis"
  }
}
```

### **3. Create Holiday (Admin)**
```
POST /api/holidays.php
Body: {
  "tanggal": "2025-04-01",
  "nama": "Idul Fitri",
  "jenis": "nasional",
  "keterangan": "Hari Raya Islam"
}
```

### **4. Update Holiday (Admin)**
```
PUT /api/holidays.php
Body: {
  "id": 1,
  "tanggal": "2025-04-01",
  "nama": "Idul Fitri 1446 H",
  "jenis": "nasional"
}
```

### **5. Delete Holiday (Admin)**
```
DELETE /api/holidays.php?id=1
```

---

## 🎨 TAMPILAN

### **Hari Kerja (Normal)**
```
┌─────────────────────────────────┐
│   Senin, 15 Desember 2025      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [✓] HADIR                      │
│  [📄] IZIN                       │
│  [⚠️] SAKIT                      │
└─────────────────────────────────┘
```

### **Hari Weekend (Sabtu/Minggu)**
```
┌─────────────────────────────────┐
│   Sabtu, 14 Desember 2025      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ℹ️ Hari Sabtu adalah hari libur │
│  Tidak perlu melakukan presensi │
│  (Background: Biru)             │
└─────────────────────────────────┘
```

### **Hari Libur Nasional**
```
┌─────────────────────────────────┐
│   Rabu, 17 Agustus 2025        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ⚠️ Hari Libur:                  │
│  Hari Kemerdekaan RI            │
│  Tidak perlu melakukan presensi │
│  (Background: Kuning)           │
└─────────────────────────────────┘
```

---

## 🔍 TROUBLESHOOTING

### Masalah: Masih bisa presensi di hari Sabtu/Minggu

**Kemungkinan 1**: File belum diupload
- **Solusi**: Build dan upload file baru

**Kemungkinan 2**: Tabel holidays belum dibuat
- **Solusi**: Jalankan `database_hari_libur.sql` di phpMyAdmin

**Kemungkinan 3**: API holidays error
- **Solusi**: Test endpoint `https://sistemflow.biz.id/api/holidays.php?check=2025-12-14`

---

### Masalah: Hari libur nasional tidak terdeteksi

**Penyebab**: Data belum ada di database

**Solusi**: Insert data hari libur
```sql
SELECT * FROM holidays WHERE tanggal = '2025-12-25';
-- Jika kosong, insert data
INSERT INTO holidays (tanggal, nama, jenis) 
VALUES ('2025-12-25', 'Hari Raya Natal', 'nasional');
```

---

## 📅 UPDATE HARI LIBUR SETIAP TAHUN

### **Untuk Tahun 2026:**

1. Buka phpMyAdmin
2. Jalankan query:
```sql
-- Hapus data tahun lama (opsional)
DELETE FROM holidays WHERE YEAR(tanggal) < 2026;

-- Insert data tahun 2026
INSERT INTO holidays (tanggal, nama, jenis) VALUES
('2026-01-01', 'Tahun Baru 2026', 'nasional'),
('2026-03-21', 'Idul Fitri 1447 H', 'nasional'),
-- dst...
```

---

## ✅ CHECKLIST

- [ ] Buat tabel `holidays` di database
- [ ] Insert data hari libur 2025
- [ ] Upload `api/holidays.php` ke server
- [ ] Build frontend: `npm run build`
- [ ] Upload `index.html` dan `assets` baru
- [ ] Clear cache browser
- [ ] Test di hari kerja (tombol muncul)
- [ ] Test di hari weekend (tombol tidak muncul)
- [ ] Test di hari libur nasional (tombol tidak muncul)

---

## 🎯 RINGKASAN

```
Fitur: Hari Libur & Hari Kerja
Hari Kerja: Senin - Jumat
Hari Libur: Sabtu, Minggu, Libur Nasional

Database: Tabel holidays
API: holidays.php
Frontend: GuruHome.jsx (auto-check)

Status: ✅ Ready to Use
```

---

## 📞 REKOMENDASI

### **Untuk Admin (Future Feature)**
Buat menu admin untuk manage hari libur:
- Lihat daftar hari libur
- Tambah hari libur baru
- Edit hari libur
- Hapus hari libur
- Import hari libur dari file Excel

### **Untuk Guru**
- Bisa lihat kalender hari libur
- Notifikasi jika besok libur
- Riwayat hari libur

---

Sekarang aplikasi sudah support hari kerja (Senin-Jumat) dan hari libur nasional! 🎉
