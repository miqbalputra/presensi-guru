# Fitur Radial Progress Bar - Persentase Kehadiran

## Deskripsi
Komponen React modern dengan **Radial Progress Bar** (Gauge Chart) untuk menampilkan persentase kehadiran hari ini secara visual dan interaktif.

## Fitur Utama

### ✅ Radial Bar Chart (Ring/Donut Style)
- **RadialBarChart** dari Recharts dengan `innerRadius="70%"` dan `outerRadius="90%"`
- Membentuk cincin tebal (ring), bukan lingkaran penuh
- Bar utama berwarna **Emerald Green** (#10b981) untuk total yang sudah absen
- Background track abu-abu terang untuk sisa yang belum absen
- **Rounded corners** (`cornerRadius={10}`) untuk ujung bar yang tumpul

### ✅ Teks Tengah (Center Label)
Di tengah lubang donat menampilkan:
- **Angka persentase besar** (5xl, bold) - contoh: "43%"
- **Teks "Sudah Absen"** (kecil, abu-abu)
- **Detail jumlah** - "8 dari 10 guru"

### ✅ Legend Detail dengan Card
Grid 2x2 dengan card berwarna untuk setiap status:
- **Hadir** - Card hijau emerald dengan icon UserCheck
- **Izin** - Card kuning dengan icon FileText
- **Sakit** - Card merah dengan icon UserX
- **Belum Absen** - Card abu-abu dengan icon Users

### ✅ Progress Bar Linear (Bonus)
Di bawah legend, ada progress bar horizontal yang menunjukkan:
- Proporsi Hadir (hijau)
- Proporsi Izin (kuning)
- Proporsi Sakit (merah)
- Animasi smooth dengan `transition-all duration-500`

### ✅ Data Real-time
- Mengambil data dari API
- Filter otomatis untuk hari ini
- Auto-refresh saat data berubah

## Komponen yang Dibuat

### 1. PersentaseKehadiran.jsx
```
src/components/admin/PersentaseKehadiran.jsx
```

Komponen standalone dengan:
- RadialBarChart
- Center label dengan persentase
- Legend detail dengan 4 card
- Linear progress bar

### 2. Integrasi ke Dashboard
File yang diubah:
```
src/components/admin/DashboardHome.jsx
```

Mengganti Pie Chart lama dengan Radial Progress Bar baru.

## Teknologi yang Digunakan

### Recharts Components
- **RadialBarChart** - Chart utama
- **RadialBar** - Bar dengan background
- **PolarAngleAxis** - Axis untuk sudut (0-100)
- **ResponsiveContainer** - Container responsive

### Tailwind CSS
- Grid layout untuk legend
- Background colors (emerald, yellow, red, gray)
- Shadow dan rounded corners
- Transition animations

### Lucide React Icons
- Activity (header)
- UserCheck (hadir)
- FileText (izin)
- UserX (sakit)
- Users (belum absen)

## Konfigurasi RadialBarChart

### Chart Settings
```javascript
<RadialBarChart
  cx="50%"              // Center X
  cy="50%"              // Center Y
  innerRadius="70%"     // Radius dalam (lubang donat)
  outerRadius="90%"     // Radius luar
  barSize={32}          // Ketebalan bar
  startAngle={90}       // Mulai dari atas
  endAngle={-270}       // Putaran penuh (360°)
>
```

### Bar Configuration
```javascript
<RadialBar
  background={{ fill: '#e5e7eb' }}  // Track abu-abu
  dataKey="value"                    // Data persentase
  cornerRadius={10}                  // Ujung tumpul
  fill="#10b981"                     // Warna emerald
/>
```

### Axis Configuration
```javascript
<PolarAngleAxis
  type="number"
  domain={[0, 100]}     // Range 0-100%
  tick={false}          // Sembunyikan tick marks
/>
```

## Struktur Data

### Input dari API
```javascript
// Guru
{ id: 1, nama: "..." }

// Presensi hari ini
{ status: "hadir" | "izin" | "sakit", ... }
```

### Calculated Stats
```javascript
{
  hadir: 8,
  izin: 1,
  sakit: 1,
  belumAbsen: 0,
  total: 10,
  persentase: 100  // (8+1+1)/10 * 100
}
```

### Chart Data
```javascript
[
  {
    name: 'Sudah Absen',
    value: 100,        // Persentase
    fill: '#10b981'    // Emerald green
  }
]
```

## Visual Layout

### Header
```
┌─────────────────────────────────────────┐
│ 🔄 Persentase Kehadiran Hari Ini       │
│    Progress Presensi Real-time          │
└─────────────────────────────────────────┘
```

### Radial Chart
```
        ╭─────────────╮
       ╱               ╲
      │                 │
      │      100%       │  ← Persentase besar
      │   Sudah Absen   │  ← Label
      │  10 dari 10 guru│  ← Detail
      │                 │
       ╲               ╱
        ╰─────────────╯
```

### Legend Grid (2x2)
```
┌──────────────┬──────────────┐
│ ✓ Hadir: 8   │ 📄 Izin: 1   │
│ (Hijau)      │ (Kuning)     │
├──────────────┼──────────────┤
│ ✗ Sakit: 1   │ 👥 Belum: 0  │
│ (Merah)      │ (Abu-abu)    │
└──────────────┴──────────────┘
```

### Linear Progress Bar
```
Progress Hari Ini                    100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█████████████████ (Hadir - Hijau)
█ (Izin - Kuning)
█ (Sakit - Merah)
```

## Cara Upload ke cPanel

### 1. File yang Perlu Diupload
```
dist/
├── index.html
└── assets/
    ├── index-Eupqqvif.js  (file baru)
    ├── index-Cl01WIhv.css (file baru)
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

**Via ZIP (Lebih Cepat):**
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
3. Lihat grafik "Persentase Kehadiran Hari Ini" di sebelah kanan
4. Cek:
   - ✅ Radial bar berbentuk ring tebal
   - ✅ Persentase di tengah (besar dan bold)
   - ✅ Legend dengan 4 card berwarna
   - ✅ Progress bar linear di bawah

## Keunggulan vs Pie Chart Lama

| Aspek | Pie Chart Lama | Radial Progress Baru |
|-------|----------------|---------------------|
| Tipe | PieChart | RadialBarChart (Ring) ✅ |
| Visual | Lingkaran penuh | Ring/Donut dengan lubang ✅ |
| Center | Kosong | Persentase besar + label ✅ |
| Legend | Di bawah chart | Card grid 2x2 dengan icon ✅ |
| Progress | Tidak ada | Linear bar tambahan ✅ |
| Warna | 4 warna berbeda | 1 warna utama (emerald) ✅ |
| Focus | Detail per status | Total progress ✅ |
| Modern | Standar | SaaS style ✅ |

## Perhitungan Persentase

```javascript
// Total yang sudah absen
const sudahAbsen = hadir + izin + sakit

// Persentase
const persentase = (sudahAbsen / totalGuru) * 100

// Contoh:
// Hadir: 8, Izin: 1, Sakit: 1, Total: 10
// Sudah Absen: 8 + 1 + 1 = 10
// Persentase: (10 / 10) * 100 = 100%
```

## Warna yang Digunakan

### Radial Bar
- **Main Bar**: #10b981 (Emerald 500)
- **Background Track**: #e5e7eb (Gray 200)

### Legend Cards
- **Hadir**: Emerald (bg-emerald-50, text-emerald-700)
- **Izin**: Yellow (bg-yellow-50, text-yellow-700)
- **Sakit**: Red (bg-red-50, text-red-700)
- **Belum Absen**: Gray (bg-gray-50, text-gray-700)

### Linear Progress
- **Hadir**: bg-emerald-500
- **Izin**: bg-yellow-500
- **Sakit**: bg-red-500
- **Background**: bg-gray-200

## Responsive Design

- **Desktop**: Chart height 280px, legend grid 2x2
- **Mobile**: Tetap responsive dengan ResponsiveContainer
- **Tablet**: Layout menyesuaikan dengan grid system

## Loading State

Saat data loading:
```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                 │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────┘
```

Skeleton loading dengan animasi pulse.

## Troubleshooting

### Radial bar tidak muncul
- Cek console browser (F12)
- Pastikan API presensi berfungsi
- Cek apakah ada data guru di database

### Persentase salah
- Cek perhitungan: `(sudahAbsen / total) * 100`
- Pastikan filter tanggal hari ini benar
- Cek data di tabel presensi

### Legend tidak rapi
- Pastikan Tailwind CSS ter-load
- Cek class `grid grid-cols-2 gap-4`
- Clear cache browser

### Progress bar tidak proporsional
- Cek perhitungan width: `(count / total) * 100`
- Pastikan total guru > 0
- Cek style inline `width`

## Build Status
✅ Build berhasil tanpa error
✅ File size: 1.51 MB (gzip: 460 KB)
✅ Siap untuk production

## Preview

Saat 100% sudah absen:
- Ring penuh berwarna hijau emerald
- Center: "100%" dengan "Sudah Absen"
- Progress bar penuh dengan proporsi warna

Saat 50% sudah absen:
- Ring setengah penuh (180°)
- Center: "50%" dengan "5 dari 10 guru"
- Progress bar setengah dengan proporsi warna

Saat 0% (belum ada yang absen):
- Ring kosong (hanya track abu-abu)
- Center: "0%" dengan "0 dari 10 guru"
- Progress bar kosong
