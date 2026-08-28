CREATE TABLE `revoked_auth_sessions` (
	`jti` varchar(36) NOT NULL,
	`session_kind` enum('admin','client','reseller','kimi') NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revoked_auth_sessions_jti` PRIMARY KEY(`jti`)
);
--> statement-breakpoint
CREATE INDEX `revoked_auth_sessions_expires_idx` ON `revoked_auth_sessions` (`expires_at`);