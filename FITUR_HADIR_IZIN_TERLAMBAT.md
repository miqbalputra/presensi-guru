# Fitur: Hadir - Izin Terlambat

## Deskripsi
Fitur ini menambahkan status presensi baru **"Hadir - Izin Terlambat"** untuk menangani kasus guru yang datang terlambat tetapi sudah mendapat izin dari kepala sekolah karena keperluan penting (rumah sakit, mengurus anak, dll).

## Latar Belakang
Di sekolah, ada situasi dimana guru perlu datang terlambat karena keperluan mendesak seperti:
- Pergi ke rumah sakit
- Mengurus anak
- Keperluan keluarga mendesak lainnya

Guru-guru ini sudah mendapat izin dari kepala sekolah sebelumnya, sehingga keterlambatan mereka berbeda dengan guru yang terlambat tanpa izin.

## Solusi
Menambahkan status presensi baru: **"Hadir - Izin Terlambat"** yang:
- Tetap dihitung sebagai "Hadir" dalam statistik kehadiran
- Memiliki penanda visual yang berbeda (badge biru)
- Dapat dipilih oleh admin saat mengedit presensi
- Mencatat jam datang sebenarnya untuk transparansi
- Memungkinkan admin menambahkan keterangan alasan izin

## Cara Penggunaan

### Untuk Admin:

1. **Buka Menu Edit Presensi**
   - Login sebagai admin
   - Pilih menu "Edit Presensi" di sidebar

2. **Edit Presensi Guru yang Terlambat dengan Izin**
   - Cari presensi guru yang sudah tercatat sebagai "Terlambat"
   - Klik tombol "Edit" pada baris presensi tersebut
   - Ubah status dari "Hadir" atau "Hadir (Terlambat)" menjadi **"Hadir - Izin Terlambat"**
   - Tambahkan keterangan (opsional): "Izin ke rumah sakit", "Mengurus anak", dll
   - Klik "Update Presensi"

3. **Atau Tambah Presensi Manual**
   - Pilih guru dari dropdown
   - Pilih tanggal
   - Pilih status: **"Hadir - Izin Terlambat"**
   - Isi jam masuk (sesuai jam datang sebenarnya)
   - Tambahkan keterangan alasan izin
   - Klik "Tambah Presensi"

## Perbedaan Status

| Status | Warna Badge | Dihitung Hadir? | Keterangan |
|--------|-------------|-----------------|------------|
| **Hadir** | Hijau | ✅ Ya | Datang tepat waktu |
| **Hadir (Terlambat)** | Kuning | ✅ Ya | Terlambat tanpa izin |
| **Hadir - Izin Terlambat** | Biru | ✅ Ya | Terlambat dengan izin kepala sekolah |
| **Izin** | Kuning | ❌ Tidak | Tidak hadir dengan izin |
| **Sakit** | Merah | ❌ Tidak | Tidak hadir karena sakit |

## Dampak pada Laporan

### Dashboard
- Status "Hadir - Izin Terlambat" dihitung sebagai **Hadir** dalam statistik
- Ditampilkan dengan badge biru untuk membedakan dari status lain
- Jam masuk tetap tercatat sesuai waktu sebenarnya

### Download Laporan
- Dalam laporan PDF/Excel, status ditampilkan sebagai "HADIR - IZIN TERLAMBAT"
- Dihitung dalam kolom "Hadir" pada statistik
- Persentase kehadiran tetap menghitung status ini sebagai hadir

### Tren Kehadiran
- Grafik tren kehadiran menghitung status ini sebagai "Hadir"
- Tidak mempengaruhi rata-rata kehadiran secara negatif

## Keuntungan Fitur Ini

1. **Transparansi**: Data tetap akurat dengan mencatat jam datang sebenarnya
2. **Keadilan**: Membedakan guru yang terlambat dengan izin vs tanpa izin
3. **Fleksibilitas**: Admin dapat mengubah status kapan saja setelah verifikasi
4. **Laporan Akurat**: Laporan dapat membedakan berbagai jenis kehadiran
5. **Tidak Merugikan**: Guru yang sudah izin tidak dihitung sebagai terlambat tanpa alasan

## File yang Dimodifikasi

### Frontend (React):
1. `src/components/admin/EditPresensi.jsx` - Tambah opsi status baru
2. `src/components/admin/DashboardHome.jsx` - Update tampilan dan perhitungan
3. `src/components/admin/PersentaseKehadiran.jsx` - Update perhitungan statistik
4. `src/components/admin/TrenKehadiran.jsx` - Update grafik tren
5. `src/components/admin/DownloadLaporan.jsx` - Update laporan PDF/Excel

### Backend (PHP):
- Tidak ada perubahan di backend, karena kolom `status` di database sudah mendukung string bebas

## Catatan Penting

- Status ini **hanya bisa diatur oleh admin**, bukan oleh guru
- Guru tetap melakukan presensi normal saat datang
- Admin yang mengubah status setelah verifikasi dengan kepala sekolah
- Jam masuk tetap tercatat sesuai waktu sebenarnya untuk transparansi
- Keterangan sangat disarankan untuk dokumentasi alasan izin

## Contoh Workflow

1. Guru A izin ke kepala sekolah untuk datang jam 09:00 karena ke rumah sakit (biasanya masuk jam 07:00)
2. Guru A melakukan presensi normal saat tiba jam 09:00
3. Sistem mencatat sebagai "Hadir (Terlambat)" karena lewat jam masuk
4. Admin menerima konfirmasi dari kepala sekolah bahwa Guru A sudah izin
5. Admin membuka menu "Edit Presensi"
6. Admin mengubah status Guru A dari "Hadir (Terlambat)" menjadi "Hadir - Izin Terlambat"
7. Admin menambahkan keterangan: "Izin ke rumah sakit - sudah konfirmasi kepala sekolah"
8. Status tersimpan dan ditampilkan dengan badge biru
9. Dalam laporan, Guru A tetap dihitung hadir dengan catatan izin terlambat

## Update Selanjutnya (Opsional)

Fitur yang bisa ditambahkan di masa depan:
- Sistem pengajuan izin terlambat online oleh guru
- Approval workflow oleh kepala sekolah
- Notifikasi otomatis ke admin saat ada izin yang disetujui
- Riwayat izin terlambat per guru

---

**Tanggal Implementasi**: 26 Desember 2024
**Versi**: 1.0
**Status**: ✅ Selesai Diimplementasikan
