-- ============================================
-- INFO: Status "Hadir - Izin Terlambat"
-- ============================================
-- File ini HANYA untuk informasi, TIDAK PERLU dijalankan
-- Tidak ada perubahan struktur database yang diperlukan

-- Status presensi yang tersedia di sistem:
-- 1. 'hadir' - Hadir tepat waktu
-- 2. 'hadir_terlambat' - Hadir terlambat tanpa izin
-- 3. 'hadir_izin_terlambat' - Hadir terlambat dengan izin (BARU)
-- 4. 'izin' - Tidak hadir dengan izin
-- 5. 'sakit' - Tidak hadir karena sakit

-- Kolom 'status' di tabel attendance_logs sudah mendukung VARCHAR
-- sehingga dapat menerima nilai 'hadir_izin_terlambat' tanpa perubahan struktur

-- ============================================
-- Contoh Query untuk Melihat Data
-- ============================================

-- Lihat semua presensi dengan status "Hadir - Izin Terlambat"
SELECT 
    id,
    nama,
    tanggal,
    jam_masuk,
    status,
    keterangan
FROM attendance_logs
WHERE status = 'hadir_izin_terlambat'
ORDER BY tanggal DESC;

-- Hitung jumlah per status
SELECT 
    status,
    COUNT(*) as jumlah
FROM attendance_logs
GROUP BY status
ORDER BY jumlah DESC;

-- Lihat guru yang paling sering izin terlambat
SELECT 
    nama,
    COUNT(*) as jumlah_izin_terlambat
FROM attendance_logs
WHERE status = 'hadir_izin_terlambat'
GROUP BY nama, user_id
ORDER BY jumlah_izin_terlambat DESC;

-- Statistik kehadiran (termasuk semua jenis hadir)
SELECT 
    nama,
    COUNT(CASE WHEN status IN ('hadir', 'hadir_terlambat', 'hadir_izin_terlambat') THEN 1 END) as total_hadir,
    COUNT(CASE WHEN status = 'hadir' THEN 1 END) as hadir_tepat_waktu,
    COUNT(CASE WHEN status = 'hadir_terlambat' THEN 1 END) as hadir_terlambat,
    COUNT(CASE WHEN status = 'hadir_izin_terlambat' THEN 1 END) as hadir_izin_terlambat,
    COUNT(CASE WHEN status = 'izin' THEN 1 END) as izin,
    COUNT(CASE WHEN status = 'sakit' THEN 1 END) as sakit,
    COUNT(*) as total_presensi
FROM attendance_logs
GROUP BY nama, user_id
ORDER BY nama;

-- ============================================
-- Contoh Update Manual (Jika Diperlukan)
-- ============================================

-- Jika ada data yang perlu diubah dari 'hadir_terlambat' ke 'hadir_izin_terlambat'
-- HATI-HATI: Pastikan data yang diubah sudah benar!

-- Contoh: Ubah presensi tertentu berdasarkan ID
-- UPDATE attendance_logs 
-- SET 
--     status = 'hadir_izin_terlambat',
--     keterangan = 'Izin ke rumah sakit - sudah konfirmasi kepala sekolah'
-- WHERE id = 123;

-- Contoh: Ubah semua presensi guru tertentu di tanggal tertentu
-- UPDATE attendance_logs 
-- SET 
--     status = 'hadir_izin_terlambat',
--     keterangan = 'Izin mengurus anak - sudah konfirmasi kepala sekolah'
-- WHERE user_id = 5 
--   AND tanggal = '2024-12-26'
--   AND status = 'hadir_terlambat';

-- ============================================
-- CATATAN PENTING
-- ============================================
-- 1. Tidak ada perubahan struktur database yang diperlukan
-- 2. Kolom 'status' sudah mendukung nilai string apapun
-- 3. Update status dilakukan melalui UI admin (Edit Presensi)
-- 4. Query di atas hanya untuk monitoring dan analisis
-- 5. Backup database sebelum melakukan UPDATE manual
