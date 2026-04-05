-- FIX: Error saat save presensi
-- Kemungkinan ada duplicate entry atau constraint error

-- 1. Cek apakah ada presensi hari ini untuk user
SELECT * FROM attendance_logs 
WHERE user_id = (SELECT id FROM users WHERE nama = 'Siti Nurhaliza')
AND tanggal = '2025-12-26';

-- 2. Jika ada, hapus dulu (untuk test)
DELETE FROM attendance_logs 
WHERE user_id = (SELECT id FROM users WHERE nama = 'Siti Nurhaliza')
AND tanggal = '2025-12-26';

-- 3. Cek struktur tabel
DESC attendance_logs;

-- 4. Cek apakah ada constraint yang bermasalah
SHOW CREATE TABLE attendance_logs;
