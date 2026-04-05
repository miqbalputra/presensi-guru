-- Database Schema untuk Webhook System
-- Jalankan SQL ini di phpMyAdmin atau MySQL client

-- Tabel untuk konfigurasi webhook
CREATE TABLE IF NOT EXISTS `webhook_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `n8n_webhook_url` varchar(500) DEFAULT NULL,
  `reminder_enabled` tinyint(1) DEFAULT 0,
  `reminder_time` time DEFAULT '08:30:00',
  `reminder_days` varchar(100) DEFAULT 'monday,tuesday,wednesday,thursday,friday',
  `skip_holidays` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel untuk log webhook
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL,
  `webhook_url` varchar(500) NOT NULL,
  `payload` text,
  `response` text,
  `status` enum('success','failed') DEFAULT 'success',
  `http_code` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default config
INSERT INTO `webhook_config` 
(`id`, `n8n_webhook_url`, `reminder_enabled`, `reminder_time`, `reminder_days`, `skip_holidays`) 
VALUES 
(1, '', 0, '08:30:00', 'monday,tuesday,wednesday,thursday,friday', 1)
ON DUPLICATE KEY UPDATE id=id;
