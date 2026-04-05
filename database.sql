-- Database Schema untuk GeoPresensi Sekolah
-- Jalankan script ini di phpMyAdmin setelah membuat database

-- Tabel Users (Admin, Kepala Sekolah, Guru)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_guru` varchar(20) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kepala_sekolah','guru') NOT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `jabatan` text DEFAULT NULL,
  `tanggal_bertugas` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `id_guru` (`id_guru`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Attendance Logs (Presensi)
CREATE TABLE IF NOT EXISTS `attendance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('hadir','izin','sakit') NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_pulang` time DEFAULT NULL,
  `jam_hadir` time DEFAULT NULL,
  `jam_izin` time DEFAULT NULL,
  `jam_sakit` time DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `tanggal` (`tanggal`),
  UNIQUE KEY `user_date` (`user_id`, `tanggal`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Activity Logs (Log Aktivitas)
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `waktu` timestamp NOT NULL DEFAULT current_timestamp(),
  `user` varchar(100) NOT NULL,
  `aktivitas` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `waktu` (`waktu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Data Default
-- Password default: admin123, kepsek123, guru123 (sudah di-hash dengan password_hash)

-- Admin
INSERT INTO `users` (`id`, `id_guru`, `username`, `password`, `role`, `nama`, `jenis_kelamin`, `alamat`, `no_hp`, `jabatan`, `tanggal_bertugas`) VALUES
(1, NULL, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin Sekolah', NULL, NULL, NULL, NULL, NULL);

-- Kepala Sekolah
INSERT INTO `users` (`id`, `id_guru`, `username`, `password`, `role`, `nama`, `jenis_kelamin`, `alamat`, `no_hp`, `jabatan`, `tanggal_bertugas`) VALUES
(2, NULL, 'kepsek', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kepala_sekolah', 'Kepala Sekolah', NULL, NULL, NULL, NULL, NULL);

-- Guru
INSERT INTO `users` (`id`, `id_guru`, `username`, `password`, `role`, `nama`, `jenis_kelamin`, `alamat`, `no_hp`, `jabatan`, `tanggal_bertugas`) VALUES
(3, 'G2020001', 'guru1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'guru', 'Budi Santoso', 'Laki-laki', 'Jl. Merdeka No. 10', '081234567890', '["Guru Matematika","Wali Kelas 7A"]', '2020-01-15'),
(4, 'G2019001', 'guru2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'guru', 'Siti Nurhaliza', 'Perempuan', 'Jl. Sudirman No. 25', '081234567891', '["Guru Bahasa Indonesia"]', '2019-08-20'),
(5, 'G2021001', 'guru3', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'guru', 'Ahmad Fauzi', 'Laki-laki', 'Jl. Gatot Subroto No. 5', '081234567892', '["Guru IPA","Koordinator Lab"]', '2021-03-10'),
(6, 'G2018001', 'guru4', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'guru', 'Dewi Lestari', 'Perempuan', 'Jl. Ahmad Yani No. 15', '081234567893', '["Guru Bahasa Inggris","Pembina Ekstrakurikuler"]', '2018-06-01'),
(7, 'G2022001', 'guru5', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'guru', 'Rudi Hartono', 'Laki-laki', 'Jl. Diponegoro No. 30', '081234567894', '["Guru Olahraga"]', '2022-01-05');

-- Sample Attendance Logs
INSERT INTO `attendance_logs` (`user_id`, `nama`, `tanggal`, `status`, `jam_masuk`, `jam_pulang`, `jam_hadir`, `jam_izin`, `jam_sakit`, `keterangan`, `latitude`, `longitude`) VALUES
(3, 'Budi Santoso', CURDATE(), 'hadir', '07:15:00', NULL, '07:15:00', NULL, NULL, '', -6.20880000, 106.84560000),
(4, 'Siti Nurhaliza', CURDATE(), 'hadir', '07:20:00', NULL, '07:20:00', NULL, NULL, '', -6.20880000, 106.84560000),
(5, 'Ahmad Fauzi', CURDATE(), 'izin', NULL, NULL, NULL, '07:00:00', NULL, 'Ada keperluan keluarga', NULL, NULL);

-- Sample Activity Logs
INSERT INTO `activity_logs` (`user`, `aktivitas`, `status`) VALUES
('Admin Sekolah', 'Login', 'Sukses'),
('Budi Santoso', 'Input Presensi', 'Hadir'),
('Siti Nurhaliza', 'Input Presensi', 'Hadir');
