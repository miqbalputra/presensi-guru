-- =====================================================
-- DATABASE JADWAL PIKET GURU
-- =====================================================
-- File ini berisi SQL untuk membuat tabel jadwal_piket
-- dan mengisi data default untuk pengaturan jam piket
-- =====================================================

-- 1. CREATE TABLE JADWAL_PIKET
-- Tabel untuk menyimpan jadwal piket guru
CREATE TABLE IF NOT EXISTS jadwal_piket (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nama_guru VARCHAR(255) NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_piket TIME DEFAULT '07:00:00',
    keterangan TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_hari (user_id, hari)
);

-- 2. INSERT SETTING JAM PIKET DEFAULT
-- Tambah setting untuk jam piket default
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    ('jam_piket_default', '07:00', 'Jam piket default untuk semua hari (format HH:MM)', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- 3. CEK TABEL YANG SUDAH DIBUAT
-- Query ini untuk memastikan tabel sudah dibuat
SHOW TABLES LIKE 'jadwal_piket';

-- 4. CEK STRUKTUR TABEL
-- Query ini untuk melihat struktur tabel
DESC jadwal_piket;

-- 5. CEK SETTING JAM PIKET
-- Query ini untuk melihat setting jam piket
SELECT * FROM settings WHERE setting_key = 'jam_piket_default';

-- =====================================================
-- CONTOH DATA JADWAL PIKET (OPSIONAL)
-- =====================================================
-- Uncomment dan sesuaikan dengan data guru Anda
-- 
-- INSERT INTO jadwal_piket (user_id, nama_guru, hari, jam_piket, keterangan) VALUES
-- (2, 'Budi Santoso', 'Senin', '07:00:00', 'Piket pagi'),
-- (3, 'Siti Aminah', 'Selasa', '07:00:00', 'Piket pagi'),
-- (4, 'Ahmad Fauzi', 'Rabu', '07:00:00', 'Piket pagi'),
-- (5, 'Dewi Lestari', 'Kamis', '07:00:00', 'Piket pagi'),
-- (6, 'Eko Prasetyo', 'Jumat', '07:00:00', 'Piket pagi');

-- =====================================================
-- PENJELASAN KOLOM:
-- =====================================================
-- 
-- id: Primary key auto increment
-- user_id: ID guru (foreign key ke tabel users)
-- nama_guru: Nama guru (untuk kemudahan query)
-- hari: Hari piket (Senin-Minggu)
-- jam_piket: Jam maksimal hadir untuk piket (default 07:00)
-- keterangan: Keterangan tambahan (opsional)
-- is_active: Status aktif (1=aktif, 0=nonaktif)
-- created_at: Waktu dibuat
-- updated_at: Waktu diupdate
--
-- UNIQUE KEY: Satu guru hanya bisa piket 1x per hari
-- FOREIGN KEY: Jika guru dihapus, jadwal piket ikut terhapus
--
-- =====================================================

-- =====================================================
-- QUERY UNTUK CEK JADWAL PIKET:
-- =====================================================

-- Cek semua jadwal piket
-- SELECT * FROM jadwal_piket ORDER BY hari, jam_piket;

-- Cek jadwal piket hari ini
-- SELECT * FROM jadwal_piket WHERE hari = DAYNAME(CURDATE()) AND is_active = 1;

-- Cek jadwal piket guru tertentu
-- SELECT * FROM jadwal_piket WHERE user_id = 2;

-- Cek guru yang piket di hari tertentu
-- SELECT * FROM jadwal_piket WHERE hari = 'Senin' AND is_active = 1;

-- =====================================================
-- QUERY UNTUK UPDATE JAM PIKET:
-- =====================================================

-- Update jam piket untuk hari tertentu
-- UPDATE jadwal_piket SET jam_piket = '06:30:00' WHERE hari = 'Senin';

-- Update jam piket untuk guru tertentu
-- UPDATE jadwal_piket SET jam_piket = '06:45:00' WHERE user_id = 2 AND hari = 'Senin';

-- Update jam piket default (untuk semua hari baru)
-- UPDATE settings SET setting_value = '06:30' WHERE setting_key = 'jam_piket_default';

-- =====================================================
-- SELESAI!
-- =====================================================
-- Jika query berhasil, Anda akan melihat:
-- - Tabel jadwal_piket sudah dibuat
-- - Setting jam_piket_default sudah ditambahkan
-- - Sistem siap digunakan
-- =====================================================
