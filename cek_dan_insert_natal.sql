-- CEK apakah tanggal 25 Desember 2025 sudah ada
SELECT * FROM holidays WHERE tanggal = '2025-12-25';

-- Jika tidak ada, INSERT data hari Natal
-- (Jalankan query ini jika hasil SELECT di atas kosong)
INSERT INTO holidays (tanggal, nama, jenis, keterangan) 
VALUES ('2025-12-25', 'Hari Natal', 'nasional', 'Perayaan Hari Natal');

-- CEK lagi setelah insert
SELECT * FROM holidays WHERE tanggal = '2025-12-25';
