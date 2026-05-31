CREATE TABLE `invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`email` varchar(320),
	`role` enum('user','admin','gestor','super_admin','management','case_manager','tech_compliance','marketing','finance','translator','read_only_advisor','ai_system') NOT NULL,
	`createdById` int NOT NULL,
	`usedById` int,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`status` enum('active','used','revoked','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);