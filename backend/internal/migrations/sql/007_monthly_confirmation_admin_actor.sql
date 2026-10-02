ALTER TABLE `monthly_attendance_confirmations`
  ADD COLUMN `confirmed_by_admin_id` int NULL DEFAULT NULL AFTER `confirmed_at`,
  ADD KEY `idx_monthly_confirmation_admin_actor` (`confirmed_by_admin_id`),
  ADD CONSTRAINT `fk_monthly_confirmation_admin_actor` FOREIGN KEY (`confirmed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
