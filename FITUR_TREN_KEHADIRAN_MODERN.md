# Fitur Tren Kehadiran Modern

## Deskripsi
Komponen React modern untuk menampilkan grafik tren kehadiran guru menggunakan **AreaChart** dengan gradient fill yang terlihat seperti dashboard SaaS modern.

## Fitur Utama

### ✅ Visual Modern
- **AreaChart** dengan gradient fill (bukan LineChart biasa)
- Warna Emerald hijau lembut untuk "Hadir"
- Warna Rose merah untuk "Tidak Hadir"
- Shadow dan border yang halus
- Animasi smooth saat hover

### ✅ Sumbu Y Integer Only
- **allowDecimals={false}** - Tidak ada angka desimal
- Hanya menampilkan bilangan bulat (1, 2, 3, dst)
- Tidak akan muncul 0.5 atau 2.25 orang

### ✅ Custom Tooltip Interaktif
- Tooltip muncul saat hover
- Menampilkan tanggal lengkap
- Detail jumlah Hadir dan Tidak Hadir
- Total guru pada hari tersebut
- Design card putih dengan shadow

### ✅ Format Tanggal Mudah Dibaca
- Format: "Sen 14/12", "Sel 15/12", dst
- Singkatan hari dalam Bahasa Indonesia
- Tanggal dan bulan untuk konteks

### ✅ Statistik Summary
- Rata-rata Hadir (7 hari)
- Rata-rata Tidak Hadir (7 hari)
- Ditampilkan di header card

### ✅ Data Real-time
- Mengambil data dari API
- Menampilkan 7 hari terakhir
- Auto-refresh saat data berubah

## Komponen yang Dibuat

### 1. TrenKehadiran.jsx
```
src/components/admin/TrenKehadiran.jsx
```

Komponen standalone yang bisa digunakan di mana saja.

### 2. Integrasi ke Dashboard
File yang diubah:
```
src/components/admin/DashboardHome.jsx
```

Mengganti LineChart lama dengan komponen TrenKehadiran baru.

## Teknologi yang Digunakan

- **Recharts** - Library charting untuk React
  - AreaChart
  - LinearGradient untuk fill
  - Custom Tooltip
  - ResponsiveContainer
  
- **Tailwind CSS** - Styling modern
  - Gradient colors (emerald, rose)
  - Shadow dan border
  - Responsive design

- **Lucide React** - Icon TrendingUp

## Struktur Data

### Input dari API
```javascript
{
  tanggal: "2025-12-14",
  status: "hadir" | "izin" | "sakit",
  // ... field lainnya
}
```

### Output untuk Chart
```javascript
[
  {
    tanggal: "Sen 14/12",
    hadir: 8,
    tidakHadir: 2
  },
  // ... 6 hari lainnya
]
```

## Gradient Configuration

### Gradient Hadir (Emerald)
```javascript
<linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
</linearGradient>
```

### Gradient Tidak Hadir (Rose)
```javascript
<linearGradient id="colorTidakHadir" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
</linearGradient>
```

## Custom Tooltip

Menampilkan:
- Tanggal lengkap
- Jumlah Hadir dengan icon hijau
- Jumlah Tidak Hadir dengan icon merah
- Total guru pada hari tersebut
- Border dan shadow untuk depth

## Cara Upload ke cPanel

### 1. File yang Perlu Diupload
```
dist/
├── index.html
└── assets/
    ├── index-BzIwMf2o.js  (file baru)
    ├── index-DTyc8RKx.css (file baru)
    └── ... (file lainnya)
```

### 2. Langkah Upload

**Via File Manager:**
1. Login cPanel: https://kelolasekolah.web.id/cpanel
2. Buka File Manager → public_html
3. Upload file dari folder `dist/`:
   - `index.html` (overwrite)
   - Folder `assets/` (overwrite)
4. Selesai!

**Via ZIP:**
1. Compress folder `dist/` → `dist.zip`
2. Upload ke `public_html`
3. Extract di cPanel
4. Pindahkan isi folder `dist/` ke `public_html`
5. Hapus `dist.zip` dan folder kosong

### 3. Clear Cache
- Chrome/Edge: Ctrl + Shift + Delete
- Atau gunakan mode Incognito

### 4. Test Fitur
1. Login sebagai admin
2. Buka Dashboard
3. Lihat grafik "Tren Kehadiran" di sebelah kiri
4. Hover mouse ke grafik → tooltip muncul
5. Cek sumbu Y → hanya angka bulat (1, 2, 3, dst)

## Preview Fitur

### Header Card
```
┌─────────────────────────────────────────────┐
│ 📈 Tren Kehadiran        Rata-rata Hadir: 8 │
│    7 Hari Terakhir    Rata-rata Tidak: 2    │
└─────────────────────────────────────────────┘
```

### Grafik
- Area hijau emerald dengan gradient untuk "Hadir"
- Area merah rose dengan gradient untuk "Tidak Hadir"
- Grid lines abu-abu tipis
- Sumbu X: Sen 14/12, Sel 15/12, dst
- Sumbu Y: 0, 2, 4, 6, 8, 10 (integer only)

### Legend
```
🟢 Hadir    🔴 Tidak Hadir (Izin/Sakit)
```

## Keunggulan vs Chart Lama

| Aspek | Chart Lama | Chart Baru |
|-------|-----------|-----------|
| Tipe | LineChart | AreaChart dengan gradient |
| Visual | Garis biasa | Area dengan fill gradient |
| Sumbu Y | Bisa desimal | Integer only ✅ |
| Tooltip | Default | Custom dengan detail ✅ |
| Tanggal | yyyy-mm-dd | "Sen 14/12" ✅ |
| Stats | Tidak ada | Ada rata-rata ✅ |
| Design | Basic | Modern SaaS style ✅ |

## Troubleshooting

### Grafik tidak muncul
- Cek console browser (F12)
- Pastikan API presensi berfungsi
- Cek apakah ada data 7 hari terakhir

### Sumbu Y masih desimal
- Pastikan `allowDecimals={false}` ada di YAxis
- Clear cache browser

### Tooltip tidak muncul
- Pastikan mouse hover di area grafik
- Cek apakah CustomTooltip ter-import dengan benar

## Build Status
✅ Build berhasil tanpa error
✅ File size: 1.5 MB (gzip: 461 KB)
✅ Siap untuk production
