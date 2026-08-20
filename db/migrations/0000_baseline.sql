CREATE TABLE `activations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`app_client_id` bigint unsigned NOT NULL,
	`mac` varchar(64) NOT NULL,
	`license_type` enum('12_months','unlimited') NOT NULL,
	`credits_charged` int NOT NULL DEFAULT 0,
	`activated_by_type` enum('admin','reseller') NOT NULL,
	`activated_by_reseller_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_clients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`mac` varchar(64) NOT NULL,
	`pin_hash` varchar(255),
	`name` varchar(255),
	`email` varchar(320),
	`license_type` enum('12_months','unlimited'),
	`activated_by_type` enum('admin','reseller'),
	`activated_by_reseller_id` bigint unsigned,
	`activated_at` timestamp,
	`expires_at` timestamp,
	`parental_control_pin_hash` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_clients_mac_unique` UNIQUE(`mac`),
	CONSTRAINT `app_clients_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`device` varchar(100),
	`plan_id` varchar(50) NOT NULL,
	`plan_name` varchar(255) NOT NULL,
	`status` enum('active','expired','suspended') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_name` varchar(255) NOT NULL,
	`customer_email` varchar(320) NOT NULL,
	`customer_phone` varchar(50) NOT NULL,
	`plan_id` varchar(50) NOT NULL,
	`plan_name` varchar(255) NOT NULL,
	`plan_type` enum('client','reseller') NOT NULL DEFAULT 'client',
	`price` varchar(50) NOT NULL,
	`device` varchar(100),
	`status` enum('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
	`activation_code` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`app_client_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`format` enum('m3u','xtream') NOT NULL,
	`source` enum('cinekin','external') NOT NULL,
	`m3u_url` text,
	`xtream_server_url` text,
	`xtream_username` text,
	`xtream_password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resellers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact` varchar(255),
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`credits` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resellers_id` PRIMARY KEY(`id`),
	CONSTRAINT `resellers_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
