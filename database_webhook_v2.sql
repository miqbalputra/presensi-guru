-- Database Schema untuk Webhook Reminder System
-- Jalankan script ini di phpMyAdmin

-- Tabel webhook_config (konfigurasi webhook)
CREATE TABLE IF NOT EXISTS `webhook_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Status aktif/nonaktif webhook',
  `n8n_webhook_url` varchar(500) DEFAULT NULL COMMENT 'URL webhook n8n',
  `admin_phone` varchar(20) DEFAULT NULL COMMENT 'Nomor HP admin untuk notifikasi',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default config
INSERT INTO `webhook_config` (`id`, `enabled`, `n8n_webhook_url`, `admin_phone`) 
VALUES (1, 0, '', '') 
ON DUPLICATE KEY UPDATE id=id;

-- Tabel webhook_logs (log pengiriman webhook)
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reminder_type` enum('first','second','final','manual') NOT NULL COMMENT 'Jenis reminder: first(08:00), second(09:00), final(10:00)',
  `total_guru` int(11) NOT NULL DEFAULT 0 COMMENT 'Jumlah guru yang belum presensi',
  `status` enum('success','failed') NOT NULL COMMENT 'Status pengiriman',
  `response` text DEFAULT NULL COMMENT 'Response dari n8n',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_at` (`created_at`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index untuk performa
CREATE INDEX idx_reminder_type ON webhook_logs(reminder_type);
CREATE INDEX idx_created_at_status ON webhook_logs(created_at, status);
