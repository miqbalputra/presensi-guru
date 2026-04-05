-- FIX: Data truncated for column 'status'
-- Masalah: Kolom status terlalu kecil atau ENUM tidak include 'hadir_terlambat'

-- 1. CEK STRUKTUR TABEL SAAT INI
DESC attendance_logs;

-- 2. CEK TIPE DATA KOLOM STATUS
SHOW COLUMNS FROM attendance_logs LIKE 'status';

-- 3. FIX: Ubah kolom status menjadi VARCHAR(20) atau ENUM yang lengkap

-- OPSI A: Jika kolom status adalah VARCHAR (tapi terlalu kecil)
ALTER TABLE attendance_logs 
MODIFY COLUMN status VARCHAR(20) NOT NULL;

-- OPSI B: Jika kolom status adalah ENUM (tidak include hadir_terlambat)
ALTER TABLE attendance_logs 
MODIFY COLUMN status ENUM('hadir', 'hadir_terlambat', 'izin', 'sakit') NOT NULL;

-- 4. VERIFIKASI PERUBAHAN
SHOW COLUMNS FROM attendance_logs LIKE 'status';

-- Expected result:
-- Field: status
-- Type: VARCHAR(20) atau ENUM('hadir','hadir_terlambat','izin','sakit')
-- Null: NO
-- Key: 
-- Default: NULL
-- Extra: 

-- 5. TEST INSERT (opsional)
-- INSERT INTO attendance_logs (user_id, nama, tanggal, status, jam_hadir, keterangan)
-- VALUES (3, 'Test', '2025-12-26', 'hadir_terlambat', '08:00:00', 'Test');

-- 6. HAPUS TEST DATA (jika berhasil)
-- DELETE FROM attendance_logs WHERE nama = 'Test' AND tanggal = '2025-12-26';
