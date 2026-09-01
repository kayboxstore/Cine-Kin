CREATE TABLE `rate_limit_counters` (
	`counter_key` varchar(64) NOT NULL,
	`hits` int unsigned NOT NULL,
	`reset_at` timestamp(3) NOT NULL,
	CONSTRAINT `rate_limit_counters_counter_key` PRIMARY KEY(`counter_key`)
);
--> statement-breakpoint
CREATE INDEX `rate_limit_reset_idx` ON `rate_limit_counters` (`reset_at`);