-- ============================================================
-- Migrasi: Tambah kolom tipe_guru untuk Guru Partime
-- Jalankan 1x di phpMyAdmin / MySQL
-- ============================================================

ALTER TABLE users
  ADD COLUMN tipe_guru ENUM('full_time', 'partime') NOT NULL DEFAULT 'full_time'
  AFTER jabatan;

-- Verifikasi
SELECT id, nama, tipe_guru FROM users WHERE role = 'guru';
