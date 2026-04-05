-- Hapus kolom is_active dari tabel jadwal_piket
-- Jalankan di phpMyAdmin

ALTER TABLE jadwal_piket DROP COLUMN is_active;

-- Verifikasi struktur tabel setelah dihapus
DESC jadwal_piket;
