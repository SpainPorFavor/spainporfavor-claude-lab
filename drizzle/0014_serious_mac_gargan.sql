CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','admin','gestor','super_admin','management','case_manager','tech_compliance','marketing','finance','translator','read_only_advisor','ai_system') NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedById` int,
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`)
);
