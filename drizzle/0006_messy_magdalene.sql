CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`eventType` enum('document_uploaded','document_validated','status_changed','requerimiento_created','resolution_logged','expiry_warning','inactivity_detected','milestone_reached') NOT NULL,
	`payload` json NOT NULL,
	`triggeredMessageId` int,
	`processed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalation_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`messageId` int,
	`question` text NOT NULL,
	`aiContext` text,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`adminResponse` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalation_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`role` enum('laura','client','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portal_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requerimientos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`gestorId` int NOT NULL,
	`description` text NOT NULL,
	`descriptionEn` text,
	`documentsNeeded` json,
	`deadline` timestamp,
	`status` enum('pending','responded','expired') NOT NULL DEFAULT 'pending',
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requerimientos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`gestorId` int NOT NULL,
	`type` enum('approved','denied','silencio_administrativo') NOT NULL,
	`resolutionFileKey` varchar(512),
	`reason` text,
	`visaValidFrom` timestamp,
	`visaValidTo` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`gestorId` int NOT NULL,
	`channel` varchar(128) NOT NULL,
	`referenceNumber` varchar(128),
	`receiptFileKey` varchar(512),
	`submittedAt` timestamp NOT NULL,
	`expectedResolutionAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','gestor') NOT NULL DEFAULT 'user';