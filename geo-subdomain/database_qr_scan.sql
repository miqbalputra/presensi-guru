-- ============================================================
-- Database Migration: QR Code Scan Attendance System
-- Jalankan script ini di phpMyAdmin
-- ============================================================

-- 1. Tambah kolom metode presensi di attendance_logs
ALTER TABLE `attendance_logs` 
ADD COLUMN `metode` ENUM('button', 'qr_scan', 'manual') DEFAULT 'button' AFTER `longitude`,
ADD COLUMN `manual_reason` TEXT NULL AFTER `metode`,
ADD COLUMN `created_by` INT NULL AFTER `manual_reason`;

-- 2. Tambah settings untuk QR Code
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_description`, `updated_by`) VALUES
('qr_secret', 'GEOPRESENSI_2024_SECRET_KEY', 'Secret key untuk validasi QR Code', 'system'),
('qr_enabled', '1', 'Aktifkan fitur QR Code Scan (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- 3. Update existing records to have 'button' as default method
UPDATE `attendance_logs` SET `metode` = 'button' WHERE `metode` IS NULL;

-- ============================================================
-- Verifikasi: Cek struktur tabel setelah migration
-- ============================================================
-- DESCRIBE attendance_logs;
-- SELECT * FROM settings WHERE setting_key LIKE 'qr%';
