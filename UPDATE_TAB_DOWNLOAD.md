# 📋 Update: Tab Download Laporan

## Update Tanggal: 13 Desember 2025

---

## 🎯 Ringkasan Update

Menu **Download Laporan** sekarang memiliki **2 tab** untuk memberikan fleksibilitas lebih dalam mendownload laporan presensi guru.

---

## ✨ Fitur Baru: Sistem Tab

### Tab Navigation

Menu Download Laporan sekarang terbagi menjadi 2 tab:

```
┌─────────────────────────────────────────┐
│ [👥 Semua Guru] [👤 Guru Tertentu]     │
└─────────────────────────────────────────┘
```

---

## 📥 Tab 1: Semua Guru

### Deskripsi
Download laporan presensi **semua guru sekaligus** dalam 1 file.

### Fitur
- ✅ Pilih periode (dari tanggal - sampai tanggal)
- ✅ Preset buttons: 7 Hari, 30 Hari, 90 Hari
- ✅ Statistik ringkasan:
  - Total Guru
  - Jumlah Hari
  - Total Presensi
- ✅ Download PDF: Laporan per guru dalam halaman terpisah
- ✅ Download Excel: Sheet ringkasan + sheet detail per guru

### Format PDF
**Struktur:**
- Header: "Laporan Presensi Semua Guru"
- Periode: Tanggal mulai - Tanggal akhir
- Per Guru (halaman terpisah):
  - Nama dan Jabatan
  - Statistik: Total, Hadir, Izin, Sakit
  - Tabel presensi (10 data terakhir)

**Nama File:** `Laporan_Semua_Guru_13-12-2025.pdf`

### Format Excel
**Struktur:**

**Sheet 1: "Ringkasan"**
| Nama | Jabatan | Total Hari | Hadir | Izin | Sakit | Persentase Hadir |
|------|---------|------------|-------|------|-------|------------------|
| Budi Santoso | Guru Matematika | 30 | 28 | 1 | 1 | 93.3% |
| Siti Nurhaliza | Guru B. Indonesia | 30 | 30 | 0 | 0 | 100% |
| ... | ... | ... | ... | ... | ... | ... |

**Sheet 2-N: Per Guru**
- Sheet "Budi Santoso"
- Sheet "Siti Nurhaliza"
- dst...

Setiap sheet berisi:
| Tanggal | Jam Masuk | Jam Pulang | Status | Keterangan |
|---------|-----------|------------|--------|------------|
| 13-12-2025 | 07:15 | 16:00 | HADIR | - |
| ... | ... | ... | ... | ... |

**Nama File:** `Laporan_Semua_Guru_13-12-2025.xlsx`

### Cara Menggunakan
1. Buka menu "Download Laporan"
2. Klik tab **"Semua Guru"**
3. Pilih periode:
   - Atur tanggal manual, atau
   - Klik preset (7/30/90 Hari)
4. Lihat statistik ringkasan
5. Klik **"Download PDF"** atau **"Download Excel"**
6. File terdownload otomatis

### Use Case
**Skenario 1: Laporan Bulanan untuk Rapat**
- Kepala Sekolah perlu laporan bulanan semua guru
- Klik tab "Semua Guru" → Preset "30 Hari" → Download PDF
- Print untuk dibagikan di rapat

**Skenario 2: Analisa Perbandingan**
- Admin ingin bandingkan kehadiran antar guru
- Klik tab "Semua Guru" → Preset "90 Hari" → Download Excel
- Buka sheet "Ringkasan" → Lihat persentase kehadiran
- Sort by persentase untuk identifikasi guru dengan kehadiran rendah

**Skenario 3: Arsip Semester**
- Admin perlu arsip presensi semester
- Klik tab "Semua Guru" → Atur tanggal manual (6 bulan)
- Download PDF untuk arsip fisik
- Download Excel untuk backup digital

---

## 👤 Tab 2: Guru Tertentu

### Deskripsi
Download laporan presensi **1 guru saja** (tidak perlu download semua).

### Fitur
- ✅ Dropdown pilih guru
- ✅ Pilih periode
- ✅ Preset buttons: 7 Hari, 30 Hari, 90 Hari
- ✅ Preview data sebelum download:
  - Info guru (nama, jabatan, periode)
  - Statistik (total hari, hadir, izin, sakit)
  - Tabel preview lengkap
- ✅ Download PDF: Laporan formal
- ✅ Download Excel: Data untuk analisa

### Format PDF
**Struktur:**
- Header: "Laporan Presensi Guru"
- Info Guru: Nama, Jabatan, Periode
- Tabel presensi lengkap
- Statistik di bawah tabel

**Nama File:** `Laporan_Budi Santoso_13-12-2025.pdf`

### Format Excel
**Struktur:**
- Tabel presensi lengkap
- Statistik di bawah tabel

**Nama File:** `Laporan_Budi Santoso_13-12-2025.xlsx`

### Cara Menggunakan
1. Buka menu "Download Laporan"
2. Klik tab **"Guru Tertentu"**
3. Pilih guru dari dropdown
4. Pilih periode
5. Lihat preview data dan statistik
6. Klik **"Download PDF"** atau **"Download Excel"**

### Use Case
**Skenario 1: Evaluasi Individual**
- Kepala Sekolah ingin evaluasi kehadiran guru tertentu
- Klik tab "Guru Tertentu" → Pilih guru → Preset "90 Hari"
- Lihat preview statistik
- Download PDF untuk dokumentasi evaluasi

**Skenario 2: Laporan untuk Guru**
- Guru minta laporan kehadirannya
- Admin: Tab "Guru Tertentu" → Pilih guru → Download PDF
- Berikan PDF ke guru

**Skenario 3: Analisa Mendalam**
- Admin ingin analisa pola kehadiran guru tertentu
- Tab "Guru Tertentu" → Pilih guru → Download Excel
- Buka Excel → Buat pivot table/chart

---

## 🎨 UI/UX

### Tab Navigation
```css
Active Tab:
- Border biru di bawah
- Text biru
- Icon biru

Inactive Tab:
- Border transparan
- Text abu-abu
- Hover: Border abu-abu
```

### Tab 1: Semua Guru
```
┌─────────────────────────────────────────┐
│ 👥 Download Laporan Semua Guru          │
├─────────────────────────────────────────┤
│ ℹ️ Info: Laporan akan berisi data      │
│   presensi semua guru...                │
├─────────────────────────────────────────┤
│ Periode: [____] - [____]                │
│ [7 Hari] [30 Hari] [90 Hari]          │
├─────────────────────────────────────────┤
│ [5]        [30]         [150]           │
│ Total Guru  Hari        Total Presensi  │
├─────────────────────────────────────────┤
│ [Download PDF] [Download Excel]         │
└─────────────────────────────────────────┘
```

### Tab 2: Guru Tertentu
```
┌─────────────────────────────────────────┐
│ 👤 Download Laporan Guru Tertentu       │
├─────────────────────────────────────────┤
│ Pilih Guru: [Budi Santoso ▼]           │
│ Periode: [____] - [____]                │
│ [7 Hari] [30 Hari] [90 Hari]          │
├─────────────────────────────────────────┤
│ Preview Data:                           │
│ - Nama: Budi Santoso                    │
│ - Statistik: 30 hari (28 hadir)        │
│ - Tabel preview...                      │
├─────────────────────────────────────────┤
│ [Download PDF] [Download Excel]         │
└─────────────────────────────────────────┘
```

---

## 📊 Perbandingan

| Aspek | Tab Semua Guru | Tab Guru Tertentu |
|-------|----------------|-------------------|
| **Target** | Semua guru | 1 guru saja |
| **Pilih Guru** | Tidak perlu | Dropdown |
| **Preview** | Statistik ringkasan | Preview lengkap + tabel |
| **PDF** | Multi-halaman (per guru) | Single guru |
| **Excel** | Multi-sheet (ringkasan + detail) | Single sheet |
| **Use Case** | Laporan rapat, perbandingan | Evaluasi individual |
| **File Size** | Lebih besar | Lebih kecil |

---

## 💡 Tips & Best Practices

### Kapan Gunakan Tab "Semua Guru"?

✅ **Gunakan untuk:**
- Laporan bulanan/semester untuk rapat
- Perbandingan kehadiran antar guru
- Arsip lengkap periode tertentu
- Identifikasi guru dengan kehadiran rendah
- Laporan untuk atasan/dinas pendidikan

❌ **Jangan gunakan untuk:**
- Evaluasi 1 guru saja (gunakan Tab "Guru Tertentu")
- Laporan untuk guru individual

### Kapan Gunakan Tab "Guru Tertentu"?

✅ **Gunakan untuk:**
- Evaluasi kehadiran guru tertentu
- Laporan untuk guru individual
- Analisa mendalam 1 guru
- Dokumentasi evaluasi kinerja
- Investigasi pola ketidakhadiran

❌ **Jangan gunakan untuk:**
- Perbandingan antar guru (gunakan Tab "Semua Guru")
- Laporan rapat (gunakan Tab "Semua Guru")

---

## 🔧 Technical Details

### Tab State Management
```javascript
const [activeTab, setActiveTab] = useState('semua')
// 'semua' or 'individu'
```

### Download Semua Guru - PDF
```javascript
// Loop through all guru
dataGuru.forEach((guru, index) => {
  // Add new page for each guru (except first)
  if (index > 0) doc.addPage()
  
  // Add guru info and table
  // ...
})
```

### Download Semua Guru - Excel
```javascript
// Create workbook
const wb = XLSX.utils.book_new()

// Add summary sheet
const wsSummary = XLSX.utils.json_to_sheet(summaryData)
XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

// Add detail sheet for each guru
dataGuru.forEach(guru => {
  const wsDetail = XLSX.utils.json_to_sheet(detailData)
  XLSX.utils.book_append_sheet(wb, wsDetail, guru.nama)
})
```

---

## 🎯 Benefits

### Untuk Admin:
1. **Fleksibilitas**
   - Pilih download semua atau 1 guru
   - Sesuai kebutuhan

2. **Efisiensi**
   - Tidak perlu download 1-1 untuk semua guru
   - Satu klik untuk semua data

3. **Organisasi**
   - File terpisah untuk kebutuhan berbeda
   - Naming convention yang jelas

### Untuk Kepala Sekolah:
1. **Laporan Lengkap**
   - Semua guru dalam 1 file
   - Mudah untuk presentasi

2. **Perbandingan Mudah**
   - Sheet ringkasan untuk overview
   - Identifikasi cepat masalah kehadiran

3. **Dokumentasi**
   - Arsip lengkap per periode
   - Format profesional

---

## 📞 Support

Butuh bantuan?
1. Baca dokumentasi lengkap
2. Cek FITUR_FILTER_DOWNLOAD.md
3. Buat issue di GitHub

---

**Version:** 1.3.1
**Release Date:** 13 Desember 2025
**Status:** Stable

---

**Happy Downloading! 🎉**
