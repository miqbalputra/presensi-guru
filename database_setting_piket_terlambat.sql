-- Tambah setting untuk terlambat piket dianggap hadir terlambat
-- Jalankan di phpMyAdmin

INSERT INTO settings (setting_key, setting_value, description) 
VALUES (
    'piket_terlambat_adalah_terlambat',
    '0',
    'Jika aktif (1), terlambat piket akan mengubah status menjadi hadir_terlambat. Jika nonaktif (0), hanya warning saja tanpa mengubah status.'
) ON DUPLICATE KEY UPDATE 
    setting_value = '0',
    description = 'Jika aktif (1), terlambat piket akan mengubah status menjadi hadir_terlambat. Jika nonaktif (0), hanya warning saja tanpa mengubah status.';

-- Verifikasi
SELECT * FROM settings WHERE setting_key = 'piket_terlambat_adalah_terlambat';
