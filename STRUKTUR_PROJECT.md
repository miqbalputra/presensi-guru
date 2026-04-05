# 📁 Struktur Project GeoPresensi Sekolah

## Tree Structure

```
geopresensi-sekolah/
├── public/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── Sidebar.jsx              # Sidebar navigation admin
│   │   │   ├── DashboardHome.jsx        # Dashboard utama dengan stats & charts
│   │   │   ├── DataGuru.jsx             # CRUD data guru + export/import
│   │   │   ├── GuruModal.jsx            # Modal form tambah/edit guru
│   │   │   ├── EditPresensi.jsx         # Form input presensi manual
│   │   │   └── LogAktivitas.jsx         # Tabel log aktivitas sistem
│   │   └── guru/
│   │       ├── GuruHome.jsx             # Input presensi dengan geolocation
│   │       ├── GuruRiwayat.jsx          # Riwayat presensi + download
│   │       └── GuruStatus.jsx           # Status kehadiran guru lain
│   ├── pages/
│   │   ├── Login.jsx                    # Halaman login
│   │   ├── AdminDashboard.jsx           # Layout dashboard admin
│   │   └── GuruDashboard.jsx            # Layout dashboard guru (mobile)
│   ├── utils/
│   │   ├── dateUtils.js                 # Helper fungsi tanggal
│   │   └── geoLocation.js               # Haversine formula & GPS
│   ├── data/
│   │   └── dummyData.js                 # Data dummy & koordinat sekolah
│   ├── App.jsx                          # Main app dengan routing
│   ├── main.jsx                         # Entry point
│   └── index.css                        # Tailwind CSS
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── .env.example
├── README.md
├── INSTALASI.md
├── PENGGUNAAN.md
├── QUICKSTART.md
└── STRUKTUR_PROJECT.md
```

## 📂 Penjelasan Folder & File

### `/src/components/admin/`

Komponen untuk Admin & Kepala Sekolah:

| File | Fungsi |
|------|--------|
| `Sidebar.jsx` | Navigation sidebar dengan menu Dashboard, Data Guru, Edit Presensi, Log Aktivitas |
| `DashboardHome.jsx` | Halaman utama dengan statistik cards, line chart, pie chart, dan tabel realtime |
| `DataGuru.jsx` | Tabel CRUD data guru dengan fitur export/import Excel |
| `GuruModal.jsx` | Modal popup untuk form tambah/edit data guru |
| `EditPresensi.jsx` | Form untuk admin input presensi manual |
| `LogAktivitas.jsx` | Tabel monitoring semua aktivitas sistem |

### `/src/components/guru/`

Komponen untuk Guru (Mobile Friendly):

| File | Fungsi |
|------|--------|
| `GuruHome.jsx` | Input presensi dengan 3 tombol (Hadir/Izin/Sakit) + validasi GPS |
| `GuruRiwayat.jsx` | Tabel riwayat presensi dengan filter tanggal + download PDF/Excel |
| `GuruStatus.jsx` | List status kehadiran guru lain hari ini |

### `/src/pages/`

Halaman utama aplikasi:

| File | Fungsi |
|------|--------|
| `Login.jsx` | Halaman login dengan validasi user |
| `AdminDashboard.jsx` | Layout dashboard admin dengan sidebar + routing |
| `GuruDashboard.jsx` | Layout dashboard guru dengan bottom navigation |

### `/src/utils/`

Helper functions:

| File | Fungsi |
|------|--------|
| `dateUtils.js` | Format tanggal (dd-mm-yyyy), hitung lama bertugas, nama hari/bulan Indonesia |
| `geoLocation.js` | Haversine formula, get user location, validasi radius |

### `/src/data/`

Data & konfigurasi:

| File | Fungsi |
|------|--------|
| `dummyData.js` | Koordinat sekolah, data users, data guru, initial logs |

## 🔄 Flow Aplikasi

### Login Flow

```
Login.jsx
  ↓
Validasi username/password
  ↓
Set user ke localStorage
  ↓
Redirect berdasarkan role:
  - Admin/Kepala Sekolah → AdminDashboard
  - Guru → GuruDashboard
```

### Admin Flow

```
AdminDashboard.jsx
  ↓
Sidebar.jsx (Navigation)
  ↓
Routes:
  - / → DashboardHome.jsx
  - /data-guru → DataGuru.jsx → GuruModal.jsx
  - /edit-presensi → EditPresensi.jsx
  - /log-aktivitas → LogAktivitas.jsx
```

### Guru Flow

```
GuruDashboard.jsx
  ↓
Bottom Navigation (3 tabs)
  ↓
Tabs:
  - Home → GuruHome.jsx
  - Riwayat → GuruRiwayat.jsx
  - Status → GuruStatus.jsx
```

### Geolocation Flow (Guru Absen Hadir)

```
GuruHome.jsx
  ↓
Klik tombol "HADIR"
  ↓
getUserLocation() - Request GPS
  ↓
Browser minta izin akses lokasi
  ↓
Get latitude & longitude user
  ↓
calculateDistance() - Haversine Formula
  ↓
Hitung jarak user ke sekolah
  ↓
validateLocation() - Cek radius
  ↓
Jika <= 100m: Simpan presensi ✅
Jika > 100m: Tolak dengan error ❌
```

## 💾 Data Storage (localStorage)

| Key | Data | Digunakan Oleh |
|-----|------|----------------|
| `user` | Session user login | App.jsx |
| `dataGuru` | Array data semua guru | DataGuru.jsx |
| `attendanceLogs` | Array log presensi | Semua komponen |
| `activityLogs` | Array log aktivitas | LogAktivitas.jsx |

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Responsive**: Mobile First Design

### Color Scheme

```css
Primary (Admin): bg-blue-600
Success (Hadir): bg-green-600
Warning (Izin): bg-yellow-500
Danger (Sakit): bg-red-600
Neutral: bg-gray-100
```

## 📦 Dependencies

### Production

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "lucide-react": "^0.294.0",
  "recharts": "^2.10.3",
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.2"
}
```

### Development

```json
{
  "@vitejs/plugin-react": "^4.2.1",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "tailwindcss": "^3.3.6",
  "vite": "^5.0.8"
}
```

## 🔧 Configuration Files

| File | Fungsi |
|------|--------|
| `vite.config.js` | Konfigurasi Vite bundler |
| `tailwind.config.js` | Konfigurasi Tailwind CSS |
| `postcss.config.js` | Konfigurasi PostCSS |
| `package.json` | Dependencies & scripts |
| `.gitignore` | File yang diabaikan Git |
| `.env.example` | Template environment variables |

## 📝 Documentation Files

| File | Isi |
|------|-----|
| `README.md` | Overview, fitur, tech stack |
| `INSTALASI.md` | Panduan instalasi lengkap |
| `PENGGUNAAN.md` | Panduan penggunaan per role |
| `QUICKSTART.md` | Quick start guide |
| `STRUKTUR_PROJECT.md` | Dokumentasi struktur (file ini) |

## 🚀 Scripts

```bash
npm run dev      # Development server
npm run build    # Build production
npm run preview  # Preview production build
```

## 📱 Responsive Breakpoints

```css
sm: 640px   # Small devices
md: 768px   # Medium devices
lg: 1024px  # Large devices (sidebar muncul)
xl: 1280px  # Extra large devices
```

## 🔐 Role-Based Access

| Role | Access |
|------|--------|
| Admin | Full access ke semua fitur admin |
| Kepala Sekolah | Full access ke semua fitur admin (sama dengan admin) |
| Guru | Hanya akses dashboard guru (input presensi, riwayat, status) |

## 🎯 Key Features per Component

### DashboardHome.jsx
- ✅ 4 Statistik cards
- ✅ Filter waktu (Hari ini, Kemarin, 7 hari, 14 hari)
- ✅ Line chart (Recharts)
- ✅ Pie chart (Recharts)
- ✅ Tabel realtime presensi hari ini

### DataGuru.jsx
- ✅ Tabel CRUD
- ✅ Export Excel (SheetJS)
- ✅ Import Excel (SheetJS)
- ✅ Hitung lama bertugas otomatis

### GuruHome.jsx
- ✅ Validasi geolocation (Haversine)
- ✅ 3 tombol aksi (Hadir/Izin/Sakit)
- ✅ Modal input keterangan
- ✅ Disable tombol setelah absen

### GuruRiwayat.jsx
- ✅ Filter date range
- ✅ Preset 7/30 hari
- ✅ Download PDF (jsPDF)
- ✅ Download Excel (SheetJS)

---

**Dokumentasi ini membantu developer memahami struktur dan flow aplikasi.**
