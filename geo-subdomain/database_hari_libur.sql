-- Tabel untuk Hari Libur Nasional & Cuti Bersama
-- Jalankan di phpMyAdmin

CREATE TABLE IF NOT EXISTS `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `nama` varchar(255) NOT NULL,
  `jenis` enum('nasional','cuti_bersama','sekolah') NOT NULL DEFAULT 'nasional',
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Data Hari Libur Nasional 2025
INSERT INTO `holidays` (`tanggal`, `nama`, `jenis`, `keterangan`) VALUES
-- Januari 2025
('2025-01-01', 'Tahun Baru 2025', 'nasional', 'Tahun Baru Masehi'),

-- Maret 2025
('2025-03-29', 'Isra Miraj Nabi Muhammad SAW', 'nasional', 'Hari Raya Islam'),
('2025-03-31', 'Hari Raya Nyepi', 'nasional', 'Tahun Baru Saka 1947'),

-- April 2025
('2025-04-18', 'Wafat Isa Almasih', 'nasional', 'Hari Raya Kristen'),

-- Mei 2025
('2025-05-01', 'Hari Buruh Internasional', 'nasional', 'May Day'),
('2025-05-12', 'Hari Raya Waisak', 'nasional', 'Hari Raya Buddha'),
('2025-05-29', 'Kenaikan Isa Almasih', 'nasional', 'Hari Raya Kristen'),

-- Juni 2025
('2025-06-01', 'Hari Lahir Pancasila', 'nasional', 'Hari Bersejarah'),

-- Agustus 2025
('2025-08-17', 'Hari Kemerdekaan RI', 'nasional', 'HUT RI ke-80'),

-- Desember 2025
('2025-12-25', 'Hari Raya Natal', 'nasional', 'Hari Raya Kristen'),

-- Cuti Bersama 2025 (contoh, sesuaikan dengan SKB)
('2025-03-28', 'Cuti Bersama Nyepi', 'cuti_bersama', 'Cuti Bersama'),
('2025-04-17', 'Cuti Bersama Wafat Isa Almasih', 'cuti_bersama', 'Cuti Bersama'),
('2025-05-30', 'Cuti Bersama Kenaikan Isa Almasih', 'cuti_bersama', 'Cuti Bersama'),
('2025-12-24', 'Cuti Bersama Natal', 'cuti_bersama', 'Cuti Bersama'),
('2025-12-26', 'Cuti Bersama Natal', 'cuti_bersama', 'Cuti Bersama');

-- Verifikasi
SELECT * FROM holidays ORDER BY tanggal;
