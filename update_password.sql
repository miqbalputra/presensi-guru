-- Update Password untuk Semua User
-- Jalankan di phpMyAdmin

-- Password: admin123
UPDATE `users` SET `password` = '$2y$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yH1Jb6/Lqm' WHERE `username` = 'admin';

-- Password: kepsek123
UPDATE `users` SET `password` = '$2y$10$8K1p/a0dL3.2e7xvltwu.O92Uj1pcZKqBYS5/pm2kgEzcU0H3Aqda' WHERE `username` = 'kepsek';

-- Password: guru123 (untuk semua guru)
UPDATE `users` SET `password` = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhqa' WHERE `role` = 'guru';
