CREATE TABLE `reseller_admin_audit_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`reseller_id` bigint unsigned NOT NULL,
	`actor_user_id` bigint unsigned NOT NULL,
	`action` enum('profile_update','password_reset','status_change') NOT NULL,
	`reason` varchar(255) NOT NULL,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reseller_admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resellers` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `resellers` ADD `session_epoch` int unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `reseller_admin_audit_reseller_created_idx` ON `reseller_admin_audit_log` (`reseller_id`,`created_at`);
