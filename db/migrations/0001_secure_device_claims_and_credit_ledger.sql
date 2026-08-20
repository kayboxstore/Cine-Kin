CREATE TABLE `reseller_credit_ledger` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`reseller_id` bigint unsigned NOT NULL,
	`delta` int NOT NULL,
	`balance_after` int NOT NULL,
	`entry_type` enum('initial_grant','admin_grant','activation','refund','adjustment') NOT NULL,
	`activation_id` bigint unsigned,
	`actor_type` enum('admin','reseller','system') NOT NULL,
	`actor_user_id` bigint unsigned,
	`reason` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reseller_credit_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `app_clients` ADD `claim_code_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `app_clients` ADD `claim_code_expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `app_clients` ADD `claimed_at` timestamp;--> statement-breakpoint
CREATE INDEX `credit_ledger_reseller_created_idx` ON `reseller_credit_ledger` (`reseller_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_activation_unique` ON `reseller_credit_ledger` (`activation_id`);--> statement-breakpoint
-- Existing PIN hashes are intentionally NOT trusted automatically. Every
-- legacy device keeps claimed_at = NULL and must be re-verified with a new
-- one-time claim code before a client session can be created.
INSERT INTO `reseller_credit_ledger` (
	`reseller_id`,
	`delta`,
	`balance_after`,
	`entry_type`,
	`activation_id`,
	`actor_type`,
	`actor_user_id`,
	`reason`
)
SELECT
	`id`,
	`credits`,
	`credits`,
	'initial_grant',
	NULL,
	'system',
	NULL,
	'Solde historique repris lors de la migration'
FROM `resellers`;
