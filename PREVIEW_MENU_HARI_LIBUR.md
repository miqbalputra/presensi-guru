# 📸 PREVIEW MENU HARI LIBUR

Ini adalah preview tampilan menu baru yang akan muncul setelah upload.

---

## 🎨 TAMPILAN SIDEBAR ADMIN

### **Sebelum (Lama)**
```
┌─────────────────────────────┐
│ GeoPresensi                 │
│ Admin Sekolah               │
│ Admin                       │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 👥 Data Guru                │
│ ✏️  Edit Presensi            │
│ 📥 Download Laporan         │
│ 📋 Log Aktivitas            │
├─────────────────────────────┤
│ 🚪 Logout                   │
└─────────────────────────────┘
```

### **Sesudah (Baru)** ⭐
```
┌─────────────────────────────┐
│ GeoPresensi                 │
│ Admin Sekolah               │
│ Admin                       │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 👥 Data Guru                │
│ ✏️  Edit Presensi            │
│ 📥 Download Laporan         │
│ 📅 Hari Libur        ← BARU │ ⭐
│ 📋 Log Aktivitas            │
├─────────────────────────────┤
│ 🚪 Logout                   │
└─────────────────────────────┘
```

---

## 🎨 TAMPILAN HALAMAN HARI LIBUR

### **Header**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Pengaturan Hari Libur              [+ Tambah Hari Libur]   │
│  Kelola hari libur nasional, cuti bersama, dan libur sekolah │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### **Filter & Info**
```
┌──────────────────────────────────────────────────────────────┐
│  Filter Tahun: [2025 ▼]  Total: 15 hari libur               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ℹ️ Informasi:                                                │
│  • Hari Sabtu dan Minggu otomatis libur                      │
│  • Guru tidak bisa melakukan presensi di hari libur          │
│  • Hari libur akan ditampilkan dengan pesan khusus           │
└──────────────────────────────────────────────────────────────┘
```

### **Tabel Hari Libur**
```
┌────────────────────────────────────────────────────────────────────────┐
│ No │ Tanggal      │ Nama Libur              │ Jenis          │ Aksi   │
├────┼──────────────┼─────────────────────────┼────────────────┼────────┤
│ 1  │ 01-01-2025   │ Tahun Baru 2025         │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 2  │ 29-03-2025   │ Isra Miraj              │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 3  │ 31-03-2025   │ Hari Raya Nyepi         │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 4  │ 18-04-2025   │ Wafat Isa Almasih       │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 5  │ 01-05-2025   │ Hari Buruh              │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 6  │ 12-05-2025   │ Hari Raya Waisak        │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 7  │ 29-05-2025   │ Kenaikan Isa Almasih    │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 8  │ 01-06-2025   │ Hari Lahir Pancasila    │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 9  │ 17-08-2025   │ Hari Kemerdekaan RI     │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 10 │ 25-12-2025   │ Hari Raya Natal         │ 🔴 Nasional    │ ✏️ 🗑️  │
│ 11 │ 28-03-2025   │ Cuti Bersama Nyepi      │ 🟡 Cuti Bersama│ ✏️ 🗑️  │
│ 12 │ 17-04-2025   │ Cuti Bersama Wafat Isa  │ 🟡 Cuti Bersama│ ✏️ 🗑️  │
│ 13 │ 30-05-2025   │ Cuti Bersama Kenaikan   │ 🟡 Cuti Bersama│ ✏️ 🗑️  │
│ 14 │ 24-12-2025   │ Cuti Bersama Natal      │ 🟡 Cuti Bersama│ ✏️ 🗑️  │
│ 15 │ 26-12-2025   │ Cuti Bersama Natal      │ 🟡 Cuti Bersama│ ✏️ 🗑️  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 MODAL TAMBAH HARI LIBUR

### **Klik Tombol "Tambah Hari Libur"**
```
┌─────────────────────────────────────────┐
│  Tambah Hari Libur                      │
├─────────────────────────────────────────┤
│                                         │
│  Tanggal *                              │
│  ┌───────────────────────────────────┐  │
│  │ 2025-12-26                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Nama Libur *                           │
│  ┌───────────────────────────────────┐  │
│  │ Cuti Bersama Natal                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Jenis Libur *                          │
│  ┌───────────────────────────────────┐  │
│  │ Cuti Bersama              ▼       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Keterangan (Opsional)                  │
│  ┌───────────────────────────────────┐  │
│  │ Cuti bersama setelah Natal        │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────┐  ┌─────────┐              │
│  │  Batal  │  │ Simpan  │              │
│  └─────────┘  └─────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 BADGE WARNA JENIS LIBUR

### **Libur Nasional**
```
┌──────────────────────┐
│ 🔴 Libur Nasional    │  ← Background merah muda
└──────────────────────┘
```

### **Cuti Bersama**
```
┌──────────────────────┐
│ 🟡 Cuti Bersama      │  ← Background kuning muda
└──────────────────────┘
```

### **Libur Sekolah**
```
┌──────────────────────┐
│ 🔵 Libur Sekolah     │  ← Background biru muda
└──────────────────────┘
```

---

## 🎨 PESAN SUKSES/ERROR

### **Pesan Sukses**
```
┌──────────────────────────────────────────────────────┐
│ ✅ Hari libur berhasil ditambahkan                [X]│  ← Background hijau
└──────────────────────────────────────────────────────┘
```

### **Pesan Error**
```
┌──────────────────────────────────────────────────────┐
│ ❌ Tanggal dan nama harus diisi                   [X]│  ← Background merah
└──────────────────────────────────────────────────────┘
```

---

## 🎨 KONFIRMASI HAPUS

### **Klik Icon Hapus (🗑️)**
```
┌─────────────────────────────────────────┐
│  Konfirmasi                             │
├─────────────────────────────────────────┤
│                                         │
│  Hapus hari libur "Cuti Bersama Natal"?│
│                                         │
│  ┌─────────┐  ┌─────────┐              │
│  │  Batal  │  │   OK    │              │
│  └─────────┘  └─────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 FILTER TAHUN

### **Dropdown Tahun**
```
┌──────────────────────────────────────────┐
│ Filter Tahun: [2025 ▼]                   │
└──────────────────────────────────────────┘

Klik dropdown:
┌──────────┐
│ 2024     │
│ 2025  ✓  │  ← Tahun aktif
│ 2026     │
│ 2027     │
│ 2028     │
│ 2029     │
│ 2030     │
└──────────┘
```

---

## 🎨 TABEL KOSONG (Tahun Belum Ada Data)

### **Pilih Tahun 2026**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              📅                                      │
│                                                      │
│     Belum ada hari libur untuk tahun 2026           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 INTEGRASI DENGAN APLIKASI GURU

### **Hari Libur Nasional (Kuning)**
```
┌──────────────────────────────────────────┐
│  Kamis, 25 Desember 2025                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ⚠️ Hari Libur:                           │  ← Background kuning
│  Hari Raya Natal                         │
│                                          │
│  Tidak perlu melakukan presensi hari ini │
└──────────────────────────────────────────┘
```

### **Hari Weekend (Biru)**
```
┌──────────────────────────────────────────┐
│  Sabtu, 14 Desember 2025                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ℹ️ Hari Sabtu adalah hari libur          │  ← Background biru
│                                          │
│  Tidak perlu melakukan presensi hari ini │
└──────────────────────────────────────────┘
```

---

## 🎨 RESPONSIVE DESIGN

### **Desktop (Lebar)**
```
┌────────────────────────────────────────────────────────────────────────┐
│ No │ Tanggal      │ Nama Libur              │ Jenis          │ Aksi   │
├────┼──────────────┼─────────────────────────┼────────────────┼────────┤
│ 1  │ 01-01-2025   │ Tahun Baru 2025         │ 🔴 Nasional    │ ✏️ 🗑️  │
└────────────────────────────────────────────────────────────────────────┘
```

### **Mobile (Sempit)**
```
┌─────────────────────────────────┐
│ 1. Tahun Baru 2025              │
│ 📅 01-01-2025                   │
│ 🔴 Libur Nasional               │
│ [✏️ Edit] [🗑️ Hapus]            │
├─────────────────────────────────┤
│ 2. Isra Miraj                   │
│ 📅 29-03-2025                   │
│ 🔴 Libur Nasional               │
│ [✏️ Edit] [🗑️ Hapus]            │
└─────────────────────────────────┘
```

---

## 🎨 WARNA TEMA

### **Warna Utama**
- **Primary**: Biru (#2563EB)
- **Success**: Hijau (#10B981)
- **Warning**: Kuning (#F59E0B)
- **Danger**: Merah (#EF4444)
- **Info**: Biru Muda (#3B82F6)

### **Badge Jenis Libur**
- **Nasional**: Background #FEE2E2, Text #991B1B
- **Cuti Bersama**: Background #FEF3C7, Text #92400E
- **Libur Sekolah**: Background #DBEAFE, Text #1E40AF

---

## 🎯 INTERAKSI

### **Hover Effect**
```
Normal:
┌──────────────┐
│ ✏️ Edit       │
└──────────────┘

Hover:
┌──────────────┐
│ ✏️ Edit       │  ← Warna lebih gelap
└──────────────┘
```

### **Loading State**
```
┌──────────────┐
│ Menyimpan... │  ← Button disabled, cursor wait
└──────────────┘
```

### **Active Menu**
```
Normal:
│ 📅 Hari Libur │  ← Text biru muda

Active:
│ 📅 Hari Libur │  ← Background biru gelap, text putih
```

---

## 📱 MOBILE VIEW

### **Sidebar Mobile (Slide dari Kiri)**
```
┌─────────────────────────────┐
│ GeoPresensi            [X]  │
│ Admin Sekolah               │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 👥 Data Guru                │
│ ✏️  Edit Presensi            │
│ 📥 Download Laporan         │
│ 📅 Hari Libur        ← BARU │
│ 📋 Log Aktivitas            │
├─────────────────────────────┤
│ 🚪 Logout                   │
└─────────────────────────────┘
```

### **Modal Mobile (Full Screen)**
```
┌─────────────────────────────┐
│ Tambah Hari Libur      [X]  │
├─────────────────────────────┤
│                             │
│ Tanggal *                   │
│ [2025-12-26]                │
│                             │
│ Nama Libur *                │
│ [Cuti Bersama Natal]        │
│                             │
│ Jenis Libur *               │
│ [Cuti Bersama ▼]            │
│                             │
│ Keterangan                  │
│ [........................]  │
│                             │
├─────────────────────────────┤
│ [Batal]  [Simpan]           │
└─────────────────────────────┘
```

---

Ini adalah preview tampilan yang akan muncul setelah upload! 🎨
