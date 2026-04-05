# 📋 Fitur Filter & Download Laporan Per Guru

## Update Tanggal: 13 Desember 2025

---

## 🎯 Ringkasan Update

Aplikasi GeoPresensi Sekolah telah ditambahkan **2 fitur baru** untuk memudahkan Admin dalam mengelola dan menganalisa data guru.

---

## ✨ Fitur Baru

### 1. 🔍 Filter & Pencarian Data Guru

**Lokasi:** Menu **Data Guru**

**Deskripsi:**
Admin dapat memfilter dan mencari data guru dengan mudah menggunakan berbagai kriteria.

**Fitur Filter:**

#### a. Pencarian Nama Guru
- **Field**: Input text "Cari Nama Guru"
- **Fungsi**: Mencari guru berdasarkan nama
- **Cara Kerja**: Real-time search (langsung filter saat mengetik)
- **Case Insensitive**: Tidak peduli huruf besar/kecil

**Contoh:**
```
Ketik: "budi" → Hasil: Budi Santoso
Ketik: "siti" → Hasil: Siti Nurhaliza
Ketik: "guru" → Hasil: Semua guru yang namanya mengandung "guru"
```

#### b. Filter Jenis Kelamin
- **Field**: Dropdown "Jenis Kelamin"
- **Pilihan**: 
  - Semua (default)
  - Laki-laki
  - Perempuan
- **Fungsi**: Filter guru berdasarkan jenis kelamin

#### c. Filter Jabatan
- **Field**: Dropdown "Jabatan"
- **Pilihan**: 
  - Semua (default)
  - Guru Matematika
  - Guru Bahasa Indonesia
  - Guru IPA
  - Wali Kelas 7A
  - Koordinator Lab
  - dll (semua jabatan yang ada)
- **Fungsi**: Filter guru berdasarkan jabatan
- **Multiple Jabatan**: Jika guru punya multiple jabatan, akan muncul jika salah satu jabatannya cocok

**Kombinasi Filter:**
- Semua filter bisa dikombinasikan
- Contoh: Cari "Budi" + Jenis Kelamin "Laki-laki" + Jabatan "Guru Matematika"

**Info Counter:**
- Menampilkan: "Menampilkan X dari Y guru"
- X = Jumlah guru yang sesuai filter
- Y = Total semua guru

**Reset Filter:**
- Tombol "Reset Filter" muncul saat ada filter aktif
- Klik untuk menghapus semua filter
- Kembali menampilkan semua guru

---

### 2. 📥 Download Laporan Guru

**Lokasi:** Menu **Download Laporan** (menu baru di sidebar)

**Deskripsi:**
Admin dapat mendownload laporan presensi dengan 2 pilihan: semua guru atau guru tertentu saja.

**Sistem Tab:**
- **Tab 1: Semua Guru** - Download laporan semua guru sekaligus
- **Tab 2: Guru Tertentu** - Download laporan 1 guru saja

---

#### Tab 1: Download Laporan Semua Guru

**Fitur:**
- Download laporan presensi semua guru dalam 1 file
- Pilih periode (dari tanggal - sampai tanggal)
- Preset buttons: 7 Hari, 30 Hari, 90 Hari
- Statistik: Total guru, jumlah hari, total presensi
- Format PDF: Laporan per guru dalam halaman terpisah
- Format Excel: 
  - Sheet "Ringkasan": Statistik semua guru
  - Sheet per guru: Detail presensi masing-masing guru

**Cara Menggunakan:**
1. Buka menu "Download Laporan"
2. Klik tab "Semua Guru"
3. Pilih periode (atau klik preset)
4. Lihat statistik ringkasan
5. Klik "Download PDF" atau "Download Excel"
6. File terdownload: `Laporan_Semua_Guru_Tanggal.pdf`

**Isi Laporan PDF:**
- Header: Laporan Presensi Semua Guru
- Per Guru:
  - Nama dan jabatan
  - Statistik (Total, Hadir, Izin, Sakit)
  - Tabel presensi (10 data terakhir)
- Setiap guru di halaman terpisah

**Isi Laporan Excel:**
- **Sheet "Ringkasan"**:
  - Nama guru
  - Jabatan
  - Total hari
  - Hadir, Izin, Sakit
  - Persentase kehadiran
- **Sheet per Guru**:
  - Detail presensi lengkap
  - Tanggal, Jam Masuk, Jam Pulang, Status, Keterangan

---

#### Tab 2: Download Laporan Guru Tertentu

**Fitur:**

#### a. Pilih Guru
- **Dropdown**: Pilih guru yang ingin didownload laporannya
- **Format**: "Nama Guru - Jabatan"
- **Contoh**: "Budi Santoso - Guru Matematika, Wali Kelas 7A"

#### b. Pilih Periode
- **Dari Tanggal**: Tanggal mulai periode
- **Sampai Tanggal**: Tanggal akhir periode
- **Preset Buttons**:
  - 7 Hari: 7 hari terakhir
  - 30 Hari: 30 hari terakhir (default)
  - 90 Hari: 90 hari terakhir (3 bulan)

#### c. Preview Data
Sebelum download, Admin bisa melihat preview:
- **Info Guru**: Nama, Jabatan, Periode, Total Data
- **Statistik**:
  - Total Hari
  - Jumlah Hadir
  - Jumlah Izin
  - Jumlah Sakit
- **Tabel Preview**: Semua data presensi dalam periode

#### d. Download Format
**PDF:**
- Laporan formal dengan header
- Tabel presensi lengkap
- Statistik di bawah tabel
- Nama file: `Laporan_NamaGuru_Tanggal.pdf`

**Excel:**
- Tabel presensi dalam sheet
- Statistik di bawah tabel
- Mudah untuk analisa lebih lanjut
- Nama file: `Laporan_NamaGuru_Tanggal.xlsx`

---

## 📊 Use Cases

### Use Case 1: Cari Guru Tertentu

**Skenario:**
Admin ingin mencari data guru bernama "Budi"

**Langkah:**
1. Buka menu "Data Guru"
2. Di field "Cari Nama Guru", ketik: "budi"
3. Tabel otomatis filter, hanya menampilkan guru yang namanya mengandung "budi"
4. Info counter: "Menampilkan 1 dari 5 guru"

---

### Use Case 2: Filter Guru Perempuan

**Skenario:**
Admin ingin melihat semua guru perempuan

**Langkah:**
1. Buka menu "Data Guru"
2. Di dropdown "Jenis Kelamin", pilih: "Perempuan"
3. Tabel otomatis filter, hanya menampilkan guru perempuan
4. Info counter: "Menampilkan 2 dari 5 guru"

---

### Use Case 3: Filter Guru dengan Jabatan Tertentu

**Skenario:**
Admin ingin melihat semua Wali Kelas

**Langkah:**
1. Buka menu "Data Guru"
2. Di dropdown "Jabatan", pilih: "Wali Kelas 7A"
3. Tabel otomatis filter, menampilkan guru yang punya jabatan "Wali Kelas 7A"
4. Termasuk guru dengan multiple jabatan yang salah satunya "Wali Kelas 7A"

---

### Use Case 4: Kombinasi Filter

**Skenario:**
Admin ingin mencari guru laki-laki yang mengajar Matematika

**Langkah:**
1. Buka menu "Data Guru"
2. Di field "Cari Nama Guru", ketik: "matematika" (atau kosongkan)
3. Di dropdown "Jenis Kelamin", pilih: "Laki-laki"
4. Di dropdown "Jabatan", pilih: "Guru Matematika"
5. Tabel menampilkan hasil yang sesuai semua kriteria

---

### Use Case 5: Download Laporan Semua Guru

**Skenario:**
Kepala Sekolah ingin laporan presensi semua guru untuk bulan ini

**Langkah:**
1. Buka menu "Download Laporan"
2. Klik tab "Semua Guru"
3. Klik preset "30 Hari"
4. Lihat statistik: Total guru, jumlah hari, total presensi
5. Klik "Download Excel"
6. File terdownload: `Laporan_Semua_Guru_13-12-2025.xlsx`
7. Buka Excel:
   - Sheet "Ringkasan": Lihat persentase kehadiran semua guru
   - Sheet per guru: Detail presensi masing-masing

**Manfaat:**
- Satu file untuk semua guru
- Mudah bandingkan kehadiran antar guru
- Sheet ringkasan untuk overview cepat
- Sheet detail untuk analisa mendalam

---

### Use Case 6: Download Laporan 1 Guru

**Skenario:**
Admin ingin download laporan presensi Budi Santoso untuk bulan ini

**Langkah:**
1. Buka menu "Download Laporan"
2. Klik tab "Guru Tertentu"
3. Di dropdown "Pilih Guru", pilih: "Budi Santoso - Guru Matematika, Wali Kelas 7A"
4. Klik preset "30 Hari" (atau atur tanggal manual)
5. Lihat preview data dan statistik
6. Klik "Download PDF" atau "Download Excel"
7. File terdownload dengan nama: `Laporan_Budi Santoso_13-12-2025.pdf`

---

### Use Case 7: Analisa Kehadiran Guru

**Skenario:**
Kepala Sekolah ingin analisa kehadiran guru tertentu selama 3 bulan

**Langkah:**
1. Buka menu "Download Laporan"
2. Klik tab "Guru Tertentu"
3. Pilih guru yang ingin dianalisa
4. Klik preset "90 Hari"
5. Lihat statistik di preview:
   - Total Hari: 90
   - Hadir: 85 hari
   - Izin: 3 hari
   - Sakit: 2 hari
6. Download Excel untuk analisa lebih detail
7. Buka Excel, buat chart/grafik sesuai kebutuhan

---

### Use Case 8: Laporan Bulanan untuk Rapat

**Skenario:**
Admin perlu siapkan laporan bulanan semua guru untuk rapat

**Langkah:**
1. Buka menu "Download Laporan"
2. Klik tab "Semua Guru"
3. Klik preset "30 Hari"
4. Klik "Download PDF"
5. Print PDF untuk dibagikan di rapat
6. Atau klik "Download Excel" untuk presentasi dengan proyektor

---

## 🎨 UI/UX

### Data Guru - Filter Section

```
┌─────────────────────────────────────────────────────────┐
│ Filter & Search                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Cari Nama Guru                                          │
│ [_____________________]                                 │
│                                                         │
│ Jenis Kelamin        Jabatan                            │
│ [Semua ▼]           [Semua ▼]                          │
│                                                         │
│ Menampilkan 5 dari 5 guru          [Reset Filter]      │
└─────────────────────────────────────────────────────────┘
```

### Download Laporan - Tab Navigation

```
┌─────────────────────────────────────────────────────────┐
│ Download Laporan Guru                                   │
├─────────────────────────────────────────────────────────┤
│ [👥 Semua Guru] [👤 Guru Tertentu]                     │
└─────────────────────────────────────────────────────────┘
```

### Tab 1: Semua Guru

```
┌─────────────────────────────────────────────────────────┐
│ 👥 Download Laporan Semua Guru                          │
├─────────────────────────────────────────────────────────┤
│ ℹ️ Info: Laporan akan berisi data presensi semua guru  │
│   dalam periode yang dipilih. File Excel akan memiliki │
│   sheet ringkasan dan sheet detail per guru.           │
├─────────────────────────────────────────────────────────┤
│ Dari Tanggal        Sampai Tanggal                      │
│ [2025-11-13]       [2025-12-13]                        │
│                                                         │
│ [7 Hari] [30 Hari] [90 Hari]                          │
├─────────────────────────────────────────────────────────┤
│ [5]             [30]            [150]                   │
│ Total Guru      Hari            Total Presensi          │
├─────────────────────────────────────────────────────────┤
│ [Download PDF]     [Download Excel]                     │
└─────────────────────────────────────────────────────────┘
```

### Tab 2: Guru Tertentu

```
┌─────────────────────────────────────────────────────────┐
│ 👤 Download Laporan Guru Tertentu                       │
├─────────────────────────────────────────────────────────┤
│ Pilih Guru                                              │
│ [Budi Santoso - Guru Matematika, Wali Kelas 7A ▼]     │
│                                                         │
│ Dari Tanggal        Sampai Tanggal                      │
│ [2025-11-13]       [2025-12-13]                        │
│                                                         │
│ [7 Hari] [30 Hari] [90 Hari]                          │
│                                                         │
│ [Download PDF]     [Download Excel]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📄 Preview Data                                         │
├─────────────────────────────────────────────────────────┤
│ Nama: Budi Santoso                                      │
│ Jabatan: Guru Matematika, Wali Kelas 7A                │
│ Periode: 2025-11-13 s/d 2025-12-13                     │
│ Total Data: 30 hari                                     │
├─────────────────────────────────────────────────────────┤
│ [30]        [28]        [1]         [1]                │
│ Total Hari  Hadir       Izin        Sakit              │
└─────────────────────────────────────────────────────────┘

[Tabel Preview Data...]
```

---

## 🔧 Technical Details

### Filter Logic

**Search (Nama):**
```javascript
filtered = filtered.filter(guru => 
  guru.nama.toLowerCase().includes(searchTerm.toLowerCase())
)
```

**Filter Jenis Kelamin:**
```javascript
if (filterJK !== 'all') {
  filtered = filtered.filter(guru => guru.jenisKelamin === filterJK)
}
```

**Filter Jabatan:**
```javascript
if (filterJabatan !== 'all') {
  filtered = filtered.filter(guru => {
    const jabatanArray = Array.isArray(guru.jabatan) ? guru.jabatan : [guru.jabatan]
    return jabatanArray.some(j => j.toLowerCase().includes(filterJabatan.toLowerCase()))
  })
}
```

### Download Logic

**Get Filtered Logs:**
```javascript
const logs = attendanceLogs.filter(log => {
  if (log.userId !== selectedGuruId) return false
  const logDate = new Date(log.tanggal.split('-').reverse().join('-'))
  return logDate >= startDate && logDate <= endDate
})
```

**Generate PDF:**
- Header dengan info guru
- Tabel dengan jsPDF autoTable
- Statistik di bawah tabel

**Generate Excel:**
- Sheet dengan data presensi
- Statistik di bawah data
- Format yang rapi

---

## 📈 Benefits

### Untuk Admin:

1. **Efisiensi Pencarian**
   - Tidak perlu scroll panjang
   - Langsung ketik nama guru
   - Filter cepat berdasarkan kriteria

2. **Analisa Lebih Mudah**
   - Filter berdasarkan jabatan
   - Lihat guru dengan kriteria tertentu
   - Kombinasi multiple filter

3. **Download Selektif**
   - Tidak perlu download semua data
   - Fokus pada guru tertentu
   - Hemat waktu dan storage

4. **Preview Sebelum Download**
   - Lihat data dulu sebelum download
   - Cek statistik
   - Pastikan data sudah benar

### Untuk Kepala Sekolah:

1. **Monitoring Individual**
   - Fokus pada guru tertentu
   - Analisa kehadiran per guru
   - Identifikasi masalah

2. **Laporan Formal**
   - PDF untuk arsip
   - Excel untuk analisa
   - Statistik lengkap

3. **Evaluasi Kinerja**
   - Data kehadiran lengkap
   - Persentase kehadiran
   - Pola ketidakhadiran

---

## 💡 Tips & Best Practices

### Filter Data Guru:

1. **Gunakan Search untuk Nama Spesifik**
   - Lebih cepat dari scroll
   - Ketik sebagian nama saja

2. **Kombinasikan Filter**
   - Gunakan multiple filter untuk hasil lebih spesifik
   - Contoh: Perempuan + Wali Kelas

3. **Reset Filter Setelah Selesai**
   - Klik "Reset Filter" untuk kembali ke view semua
   - Atau refresh halaman

### Download Laporan:

1. **Pilih Periode yang Tepat**
   - 7 hari: Untuk review mingguan
   - 30 hari: Untuk laporan bulanan
   - 90 hari: Untuk evaluasi triwulan

2. **Cek Preview Dulu**
   - Pastikan data sudah benar
   - Lihat statistik
   - Cek jumlah data

3. **Pilih Format Sesuai Kebutuhan**
   - PDF: Untuk arsip/print
   - Excel: Untuk analisa lebih lanjut

4. **Naming Convention**
   - File otomatis diberi nama dengan format:
   - `Laporan_NamaGuru_Tanggal.pdf`
   - Mudah untuk organize

---

## 🚀 Future Enhancements

### Planned Features:

1. ~~**Export Multiple Guru**~~ ✅ DONE
   - ~~Pilih beberapa guru sekaligus~~
   - ~~Download dalam 1 file~~
   - Sudah tersedia di Tab "Semua Guru"

2. **Advanced Filter**
   - Filter berdasarkan lama bertugas
   - Filter berdasarkan persentase kehadiran
   - Filter berdasarkan tanggal bertugas

3. **Scheduled Reports**
   - Auto-generate laporan bulanan
   - Email otomatis ke kepala sekolah
   - Reminder untuk guru dengan kehadiran rendah

4. **Comparison Report**
   - Bandingkan kehadiran antar guru
   - Ranking kehadiran
   - Trend analysis

5. **Custom Date Range**
   - Pilih tanggal spesifik
   - Preset untuk semester
   - Preset untuk tahun ajaran

---

## 📞 Support

Butuh bantuan?

1. Baca dokumentasi lengkap
2. Cek FAQ.md
3. Buat issue di GitHub
4. Hubungi admin sekolah

---

**Version:** 1.3.0
**Release Date:** 13 Desember 2025
**Status:** Stable

---

**Happy Filtering & Downloading! 🎉**
