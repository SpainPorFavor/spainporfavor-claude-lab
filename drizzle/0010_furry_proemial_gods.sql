CREATE TABLE `automation_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventLogId` int,
	`actionType` varchar(128) NOT NULL,
	`ruleName` varchar(255),
	`explanation` text,
	`ownerAssigned` int,
	`priorityAssigned` varchar(32),
	`taskId` int,
	`confidence` varchar(32),
	`humanOverrideReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`riskLevel` enum('green','amber','red','black') NOT NULL DEFAULT 'green',
	`riskReason` text NOT NULL,
	`ownerId` int,
	`dueAt` timestamp,
	`source` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `case_risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`sourceSystem` varchar(64) NOT NULL,
	`sourceId` varchar(255),
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `event_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationName` varchar(255) NOT NULL,
	`status` enum('ready','warning','blocked','not_configured') NOT NULL DEFAULT 'not_configured',
	`lastCheckedAt` timestamp,
	`notes` text,
	`requiredForLaunch` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_status_integrationName_unique` UNIQUE(`integrationName`)
);
--> statement-breakpoint
CREATE TABLE `management_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`ownerId` int,
	`createdById` int,
	`createdBy` enum('human','ai','system') NOT NULL DEFAULT 'human',
	`priority` enum('critical','high','normal','low') NOT NULL DEFAULT 'normal',
	`status` enum('new','todo','doing','blocked','waiting_client','waiting_vendor','needs_review','done') NOT NULL DEFAULT 'new',
	`queue` enum('general','case_rescue','security_compliance','approval_required','vendor_gestor','vendor_translator') NOT NULL DEFAULT 'general',
	`dueAt` timestamp,
	`linkedObjectiveId` int,
	`linkedCaseId` int,
	`linkedVendorId` int,
	`linkedMetric` varchar(255),
	`sourceEventId` int,
	`explanation` text,
	`evidenceRequired` int NOT NULL DEFAULT 0,
	`evidenceText` text,
	`evidenceUrl` varchar(1024),
	`evidenceFileId` varchar(512),
	`escalated` int NOT NULL DEFAULT 0,
	`escalatedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `management_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`ownerId` int,
	`status` enum('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
	`priority` enum('critical','high','normal','low') NOT NULL DEFAULT 'normal',
	`startDate` timestamp,
	`dueDate` timestamp,
	`metricName` varchar(255),
	`targetValue` varchar(128),
	`currentValue` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `objectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendor_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`caseId` int,
	`taskId` int,
	`assignmentType` enum('case_review','translation','submission','correction') NOT NULL,
	`status` enum('assigned','accepted','in_progress','completed','blocked','cancelled') NOT NULL DEFAULT 'assigned',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`dueAt` timestamp,
	`completedAt` timestamp,
	`blockerReason` text,
	`qualityFlag` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendor_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('gestor','translator') NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`languagePairs` varchar(500),
	`active` int NOT NULL DEFAULT 1,
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','gestor','super_admin','management','case_manager','tech_compliance','marketing','finance','translator','read_only_advisor','ai_system') NOT NULL DEFAULT 'user';