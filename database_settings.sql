-- =====================================================
-- DATABASE SETTINGS UNTUK GEOPRESENSI SEKOLAH
-- =====================================================
-- File ini berisi SQL untuk membuat tabel settings
-- dan mengisi data default untuk pengaturan sistem
-- =====================================================

-- 1. CREATE TABLE SETTINGS
-- Tabel untuk menyimpan pengaturan aplikasi
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- 2. INSERT DEFAULT SETTINGS
-- Mengisi data default untuk semua pengaturan sistem
INSERT INTO settings (setting_key, setting_value, description, updated_by) 
VALUES 
    -- Pengaturan Jam Masuk
    ('jam_masuk_normal', '07:20', 'Batas waktu masuk normal (format HH:MM)', 'system'),
    
    -- Pengaturan Toleransi Keterlambatan
    ('toleransi_terlambat', '15', 'Toleransi keterlambatan dalam menit', 'system'),
    
    -- Pengaturan Radius GPS
    ('radius_gps', '500', 'Radius validasi GPS dalam meter', 'system'),
    
    -- Pengaturan Koordinat Sekolah
    ('sekolah_latitude', '-5.1477', 'Koordinat Latitude sekolah', 'system'),
    ('sekolah_longitude', '119.4327', 'Koordinat Longitude sekolah', 'system'),
    ('sekolah_nama', 'Sekolah', 'Nama sekolah', 'system'),
    
    -- Pengaturan Mode Testing
    ('mode_testing', '1', 'Mode testing GPS (1=aktif, 0=nonaktif)', 'system')
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    description = VALUES(description);

-- 3. CEK DATA YANG SUDAH DIINSERT
-- Query ini untuk memastikan semua data sudah masuk
SELECT * FROM settings ORDER BY setting_key;

-- 4. CEK JUMLAH DATA
-- Harus ada 7 baris data
SELECT COUNT(*) as total_settings FROM settings;

-- =====================================================
-- PENJELASAN SETIAP SETTING:
-- =====================================================
-- 
-- 1. jam_masuk_normal (default: 07:20)
--    - Batas waktu masuk normal
--    - Guru yang presensi setelah jam ini = terlambat
--    - Format: HH:MM (24 jam)
--
-- 2. toleransi_terlambat (default: 15)
--    - Toleransi keterlambatan dalam menit
--    - Terlambat 1-15 menit = "Terlambat"
--    - Terlambat > 15 menit = "Terlambat Parah"
--
-- 3. radius_gps (default: 500)
--    - Radius validasi GPS dalam meter
--    - Guru harus dalam radius ini dari sekolah
--    - Bisa diubah sesuai luas area sekolah
--
-- 4. sekolah_latitude (default: -5.1477)
--    - Koordinat Latitude lokasi sekolah
--    - Range: -90 sampai 90
--    - Negatif = Belahan bumi selatan
--
-- 5. sekolah_longitude (default: 119.4327)
--    - Koordinat Longitude lokasi sekolah
--    - Range: -180 sampai 180
--    - Positif = Belahan bumi timur
--
-- 6. sekolah_nama (default: Sekolah)
--    - Nama sekolah
--    - Bisa diubah sesuai nama sekolah Anda
--
-- 7. mode_testing (default: 1)
--    - Mode testing GPS
--    - 1 = Aktif (GPS validation nonaktif)
--    - 0 = Nonaktif (GPS validation aktif)
--
-- =====================================================

-- =====================================================
-- CARA MENGUBAH KOORDINAT SEKOLAH:
-- =====================================================
-- 
-- 1. Buka Google Maps: https://www.google.com/maps
-- 2. Cari lokasi sekolah Anda
-- 3. Klik kanan pada titik lokasi sekolah
-- 4. Klik angka koordinat yang muncul (akan otomatis tercopy)
-- 5. Paste koordinat di query UPDATE di bawah ini
-- 6. Jalankan query UPDATE
--
-- Contoh UPDATE koordinat:
-- UPDATE settings SET setting_value = '-6.2088' WHERE setting_key = 'sekolah_latitude';
-- UPDATE settings SET setting_value = '106.8456' WHERE setting_key = 'sekolah_longitude';
-- UPDATE settings SET setting_value = 'SDN 1 Jakarta' WHERE setting_key = 'sekolah_nama';
--
-- =====================================================

-- =====================================================
-- CONTOH KOORDINAT KOTA-KOTA DI INDONESIA:
-- =====================================================
-- Jakarta:    -6.2088, 106.8456
-- Surabaya:   -7.2575, 112.7521
-- Bandung:    -6.9175, 107.6191
-- Medan:       3.5952, 98.6722
-- Makassar:   -5.1477, 119.4327
-- Yogyakarta: -7.7956, 110.3695
-- Semarang:   -6.9667, 110.4167
-- Palembang:  -2.9761, 104.7754
-- Denpasar:   -8.6705, 115.2126
-- Manado:      1.4748, 124.8421
-- =====================================================

-- =====================================================
-- QUERY UNTUK CEK SETTING TERTENTU:
-- =====================================================

-- Cek jam masuk normal
-- SELECT * FROM settings WHERE setting_key = 'jam_masuk_normal';

-- Cek mode testing
-- SELECT * FROM settings WHERE setting_key = 'mode_testing';

-- Cek koordinat sekolah
-- SELECT * FROM settings WHERE setting_key LIKE 'sekolah%';

-- Cek semua setting
-- SELECT * FROM settings ORDER BY setting_key;

-- =====================================================
-- SELESAI!
-- =====================================================
-- Jika query berhasil, Anda akan melihat:
-- - Tabel settings sudah dibuat
-- - 7 baris data settings sudah diinsert
-- - Sistem siap digunakan
-- =====================================================
