CREATE TABLE `team_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(1024),
	`category` enum('finance','marketing','tech','legal','vendors','operations') NOT NULL DEFAULT 'operations',
	`notes` text,
	`hasBitwardenCreds` int NOT NULL DEFAULT 0,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_resources_id` PRIMARY KEY(`id`)
);
