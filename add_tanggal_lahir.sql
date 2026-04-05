-- Tambah Kolom Tanggal Lahir ke Tabel Users
-- Jalankan di phpMyAdmin

-- 1. Tambah kolom tanggal_lahir
ALTER TABLE users ADD COLUMN tanggal_lahir DATE DEFAULT NULL AFTER jenis_kelamin;

-- 2. Update data sample (opsional)
UPDATE users SET tanggal_lahir = '1985-05-15' WHERE username = 'guru1';
UPDATE users SET tanggal_lahir = '1987-08-20' WHERE username = 'guru2';
UPDATE users SET tanggal_lahir = '1990-03-10' WHERE username = 'guru3';

-- 3. Verifikasi
SELECT id, id_guru, nama, tanggal_lahir, jenis_kelamin FROM users WHERE role = 'guru';
