CREATE TABLE `consent_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`consentType` enum('data_processing','ai_validation','third_party_sharing','marketing') NOT NULL,
	`consentText` text NOT NULL,
	`granted` int NOT NULL DEFAULT 1,
	`ipAddress` varchar(45),
	`userAgent` text,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `consent_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erasure_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`reason` text,
	`confirmedAt` timestamp,
	`completedAt` timestamp,
	`deletedResources` json,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `erasure_requests_id` PRIMARY KEY(`id`)
);
