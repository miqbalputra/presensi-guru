-- Add new settings for Gender-based and Monday-based locations
USE geopresensi;

INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`, `description`) VALUES
('lokasi_laki_latitude', '-5.1477', 'Latitude Lokasi Khusus Laki-laki'),
('lokasi_laki_longitude', '119.4327', 'Longitude Lokasi Khusus Laki-laki'),
('lokasi_perempuan_latitude', '-5.1477', 'Latitude Lokasi Khusus Perempuan'),
('lokasi_perempuan_longitude', '119.4327', 'Longitude Lokasi Khusus Perempuan'),
('lokasi_apel_latitude', '-5.1477', 'Latitude Lokasi Apel Senin'),
('lokasi_apel_longitude', '119.4327', 'Longitude Lokasi Apel Senin'),
('apel_senin_enabled', '1', 'Aktifkan Validasi Lokasi Apel di Hari Senin (1=Aktif, 0=Nonaktif)');
