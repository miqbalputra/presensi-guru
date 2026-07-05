# 📋 Rancangan Fitur: Jam Kerja Guru

> **Permintaan:** Kepala Sekolah ingin jam bekerja guru dihitung di aplikasi — durasi antara presensi masuk sampai presensi pulang.

---

## Konsep

Menghitung durasi kerja = `jam_pulang − jam_masuk` untuk setiap hari guru hadir. Durasi ditampilkan di multiple tempat: dashboard guru, riwayat, statistik, dan laporan.

## Data yang Sudah Ada

Database `attendance_logs` sudah punya:

| Field | Tipe | Isi |
|-------|------|-----|
| `jam_masuk` | `time` | Jam presensi masuk (mis. `07:15:30`) |
| `jam_pulang` | `time` | Jam presensi pulang (mis. `13:05:00`), atau `NULL` |

**Tidak perlu kolom baru** — durasi bisa dihitung dari dua field yang sudah ada.

---

## 1. Backend — Perhitungan Durasi

**Tempat:** `api/attendance_service.php` — fungsi `gp_map_attendance_record()`

Saat ini fungsi ini hanya memetakan nama field (snake_case → camelCase). Ditambahkan logika:

```
Jika jam_masuk DAN jam_pulang keduanya ada (tidak null/-'/'00:00:00'):
    durasi_menit = (jam_pulang dalam menit) - (jam_masuk dalam menit)

    Jika durasi_menit < 0:
        → lewati (jarang terjadi, data anomali)

    durasi_jam = floor(durasi_menit / 60)
    durasi_sisa_menit = durasi_menit % 60

    Hasil: "5j 45m"  (format singkat)
    Atau: "5.75"     (format desimal untuk Excel)
```

Field baru yang ditambahkan ke setiap record:

- `durasiKerja` → string "5j 45m" (untuk tampilan)
- `durasiMenit` → integer 345 (untuk kalkulasi/summary)
- `durasiJam` → float 5.75 (untuk export Excel)

**Keuntungan:** perhitungan terpusat di backend, semua endpoint yang mengembalikan record presensi (presensi.php, hermes_presensi.php, guru_home.php, admin_summary.php) otomatis dapat field durasi tanpa duplikasi logika.

---

## 2. Edge Cases (Kasus Khusus)

| Skenario | Penanganan |
|----------|------------|
| `jam_pulang` = NULL (lupa pulang) | `durasiKerja` = "Belum pulang" |
| Status izin / sakit | `durasiKerja` = "-" (tidak ada jam kerja) |
| Status alfa / libur | `durasiKerja` = "-" |
| Izin pulang awal piket | Durasi dihitung dari jam_masuk sampai jam_pulang yang sebenarnya (durasi aktual) |
| Durasi < 0 (anomali data) | Tidak dihitung, tampilkan "-" |
| Guru partime | Sama — durasi aktual tetap dihitung |

---

## 3. Frontend — Tampilan

### A. Dashboard Guru (`GuruHome.jsx`)

Kartu presensi hari ini saat ini menampilkan:

```
Jam Masuk:  07:15
Jam Pulang: 13:05
```

Ditambahkan baris baru:

```
Jam Masuk:   07:15
Jam Pulang:  13:05
Jam Kerja:   5j 50m  ← BARU (hanya muncul setelah pulang)
```

Jika belum pulang → "Jam Kerja: Belum pulang".

### B. Riwayat Presensi Guru (`GuruRiwayat.jsx`)

Tabel saat ini:

```
| Tanggal  | Jam Masuk | Jam Pulang | Status | Keterangan |
```

Ditambah kolom:

```
| Tanggal  | Jam Masuk | Jam Pulang | Jam Kerja | Status | Keterangan |
```

Kolom "Jam Kerja" menampilkan "5j 50m", "-", atau "Belum pulang".

### C. Statistik Guru (`GuruStatistik.jsx`)

Saat ini ada 5 kartu: Total Hadir, Terlambat, Izin, Sakit, Alfa.

**Ditambah 1 kartu baru:**

```
┌─────────────────────┐
│  ⏱ Total Jam Kerja   │
│  127j 30m             │
│  Rata-rata: 6j 23m/h  │
└─────────────────────┘
```

- **Total Jam Kerja** = jumlah semua `durasiMenit` dalam periode
- **Rata-rata per hari** = total ÷ jumlah hari hadir

### D. Download Laporan (`DownloadLaporan.jsx`)

**PDF** — tabel detail ditambah kolom "Jam Kerja", dan summary ditambah:

```
Total Hari Kerja: 22
Hadir: 20 hari
Total Jam Kerja: 127j 30m   ← BARU
Rata-rata/hari: 6j 23m      ← BARU
Izin: 1 hari
Sakit: 1 hari
Alfa: 0 hari
```

**Excel** — kolom "Jam Kerja" (format desimal: 5.75) dan "Jam Kerja (Text)" (format "5j 45m"). Sheet summary ditambah baris Total Jam Kerja dan Rata-rata.

### E. Admin Statistik Lengkap (`StatistikLengkap.jsx`)

Tabel detail admin ditambah kolom "Jam Kerja".

### F. Admin Dashboard Home (`DashboardHome.jsx`)

Opsional: di kartu presensi terkini admin, tampilkan durasi kerja.

---

## 4. Perhitungan Summary (Total & Rata-rata)

Di hook `useGuruReport.js` — fungsi `getGuruSummary()` ditambahkan:

```js
// Hanya hitung record dengan jam_masuk & jam_pulang valid
const recordsWithDuration = guruLogs.filter((l) =>
  l.durasiMenit && l.durasiMenit > 0
)

const totalMenitKerja = recordsWithDuration.reduce(
  (sum, l) => sum + l.durasiMenit,
  0
)

const rataRataMenit =
  recordsWithDuration.length > 0
    ? totalMenitKerja / recordsWithDuration.length
    : 0

// Format: "127j 30m" dan "6j 23m"
```

Field baru di return `getGuruSummary()`:

- `totalJamKerja` → "127j 30m"
- `totalMenitKerja` → 7650
- `rataRataJamKerja` → "6j 23m"

---

## 5. Utilitas Format (Shared Helper)

Dibuat fungsi helper di `src/utils/` untuk format durasi:

```js
// utils/duration.js
formatDuration(menit)        → "5j 45m"
formatDurationDecimal(menit) → 5.75
formatTotalDuration(menit)   → "127j 30m"
```

Dipakai di semua komponen agar konsisten.

---

## 6. File yang Perlu Diubah

| File | Perubahan |
|------|-----------|
| `api/attendance_service.php` | Hitung `durasiMenit`/`durasiKerja`/`durasiJam` di `gp_map_attendance_record()` |
| `src/utils/duration.js` | **Baru** — helper format durasi |
| `src/hooks/useGuruReport.js` | Tambah `totalJamKerja`, `rataRataJamKerja` di `getGuruSummary()` |
| `src/components/guru/GuruHome.jsx` | Tampilkan "Jam Kerja" di kartu presensi hari ini |
| `src/components/guru/GuruRiwayat.jsx` | Tambah kolom "Jam Kerja" di tabel |
| `src/components/guru/GuruStatistik.jsx` | Tambah kartu "Total Jam Kerja" + rata-rata |
| `src/components/admin/DownloadLaporan.jsx` | Tambah kolom & summary jam kerja di PDF + Excel |
| `src/components/admin/StatistikLengkap.jsx` | Tambah kolom "Jam Kerja" di tabel detail |

**Tidak perlu:**

- Kolom database baru
- Migration
- Endpoint API baru
- Perubahan di proses presensi (jam_masuk/jam_pulang sudah tersimpan)

---

## 7. Ilustrasi Tampilan Akhir

**Dashboard Guru — Hari Ini:**

```
┌─────────────────────────────┐
│  📋 Presensi Hari Ini        │
│                             │
│  Jam Masuk    : 07:15       │
│  Jam Pulang   : 13:05       │
│  Jam Kerja    : 5j 50m  ✨  │
│  Status       : Hadir       │
│  Keterangan   : -           │
└─────────────────────────────┘
```

**Statistik Guru:**

```
┌───────┬───────┬───────┬───────┬───────┬──────────┐
│ Hadir │ Telat │ Izin  │ Sakit │ Alfa  │Jam Kerja │
│  20   │   3   │   1   │   1   │   0   │ 127j 30m │
│ 95.2% │ 15%   │ 4.8%  │ 4.8%  │ 0%    │ Avg 6j23m│
└───────┴───────┴───────┴───────┴───────┴──────────┘
```

**Laporan Excel:**

```
| Tanggal   | Jam Masuk | Jam Pulang | Jam Kerja | Jam Kerja (Text) | Status | Keterangan |
| 2026-07-14| 07:15     | 13:05      | 5.83      | 5j 50m            | HADIR  | -          |
| 2026-07-15| 07:20     | -          | -         | Belum pulang      | HADIR  | -          |
```

---

## Ringkasan

- **Tidak ada perubahan database** — jam_masuk dan jam_pulang sudah ada
- **Perhitungan terpusat** di backend `gp_map_attendance_record()` — semua endpoint otomatis dapat field durasi
- **Edge cases ditangani**: lupa pulang, izin/sakit, anomali data
- **Tampilan di 6 tempat**: dashboard guru, riwayat, statistik, laporan PDF/Excel, statistik admin
- **Summary**: total jam kerja + rata-rata per hari per periode