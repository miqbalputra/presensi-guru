-- Script untuk Cek dan Perbaiki Database
-- Jalankan di phpMyAdmin

-- 1. CEK STRUKTUR TABEL USERS
DESCRIBE users;

-- 2. CEK DATA GURU YANG ADA
SELECT id, id_guru, username, nama, no_hp, jenis_kelamin FROM users WHERE role = 'guru';

-- 3. PERBAIKI JIKA ADA KOLOM YANG SALAH
-- Pastikan kolom id_guru dan no_hp ada dan tipe datanya benar
ALTER TABLE users MODIFY COLUMN id_guru VARCHAR(20) DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN no_hp VARCHAR(20) DEFAULT NULL;

-- 4. PASTIKAN UNIQUE KEY ADA
-- Hapus dulu jika ada
ALTER TABLE users DROP INDEX IF EXISTS id_guru;
ALTER TABLE users DROP INDEX IF EXISTS username;

-- Tambah lagi dengan benar
ALTER TABLE users ADD UNIQUE KEY id_guru (id_guru);
ALTER TABLE users ADD UNIQUE KEY username (username);

-- 5. CEK APAKAH ADA DATA DUPLIKAT
-- Cek duplikat id_guru
SELECT id_guru, COUNT(*) as jumlah 
FROM users 
WHERE id_guru IS NOT NULL 
GROUP BY id_guru 
HAVING COUNT(*) > 1;

-- Cek duplikat username
SELECT username, COUNT(*) as jumlah 
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 6. JIKA ADA DUPLIKAT, HAPUS YANG DUPLIKAT
-- (Sesuaikan ID yang mau dihapus)
-- DELETE FROM users WHERE id = [ID_YANG_DUPLIKAT];

-- 7. UPDATE PASSWORD UNTUK TESTING
-- Password: admin123
UPDATE users SET password = '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm' WHERE username = 'admin';

-- Password: kepsek123
UPDATE users SET password = '$2y$10$8K1p/a0dL3.2e7xvltwu.O92Uj1pcZKqBYS5/pm2kgEzcU0H3Aqda' WHERE username = 'kepsek';

-- Password: guru123 (untuk semua guru)
UPDATE users SET password = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhqa' WHERE role = 'guru';

-- 8. VERIFIKASI HASIL
SELECT id, id_guru, username, nama, no_hp, role FROM users ORDER BY role, id;
