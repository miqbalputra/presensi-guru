ALTER TABLE `attendance_logs`
  ADD COLUMN IF NOT EXISTS `qr_nonce` varchar(64) DEFAULT NULL;
