-- Script Perbaikan Database (Kompatibel Semua Versi MySQL)
-- Jalankan di phpMyAdmin

-- 1. CEK STRUKTUR TABEL USERS
DESCRIBE users;

-- 2. CEK DATA GURU YANG ADA
SELECT id, id_guru, username, nama, no_hp, jenis_kelamin FROM users WHERE role = 'guru';

-- 3. PERBAIKI KOLOM id_guru dan no_hp
ALTER TABLE users MODIFY COLUMN id_guru VARCHAR(20) DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN no_hp VARCHAR(20) DEFAULT NULL;

-- 4. UPDATE PASSWORD UNTUK TESTING
-- Password: admin123
UPDATE users SET password = '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm' WHERE username = 'admin';

-- Password: kepsek123
UPDATE users SET password = '$2y$10$8K1p/a0dL3.2e7xvltwu.O92Uj1pcZKqBYS5/pm2kgEzcU0H3Aqda' WHERE username = 'kepsek';

-- Password: guru123 (untuk semua guru)
UPDATE users SET password = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhqa' WHERE role = 'guru';

-- 5. CEK APAKAH ADA DATA DUPLIKAT
SELECT id_guru, COUNT(*) as jumlah 
FROM users 
WHERE id_guru IS NOT NULL 
GROUP BY id_guru 
HAVING COUNT(*) > 1;

-- 6. VERIFIKASI HASIL
SELECT id, id_guru, username, nama, no_hp, role FROM users ORDER BY role, id;
