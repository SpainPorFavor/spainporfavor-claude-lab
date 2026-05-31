CREATE TABLE `case_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`fromStatus` varchar(64) NOT NULL,
	`toStatus` varchar(64) NOT NULL,
	`changedBy` int,
	`note` text,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`visaType` varchar(64) NOT NULL,
	`status` enum('onboarding','collecting_documents','ready_for_gestor','with_gestor','submitted','approved','rejected') NOT NULL DEFAULT 'onboarding',
	`nationality` varchar(64),
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientPhone` varchar(32),
	`familyComposition` varchar(255),
	`dependents` int NOT NULL DEFAULT 0,
	`stripeSessionId` varchar(255),
	`gestorId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`documentType` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`requirementsText` text,
	`isRequired` int NOT NULL DEFAULT 1,
	`apostilleRequired` int NOT NULL DEFAULT 0,
	`translationRequired` int NOT NULL DEFAULT 0,
	`validityDays` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slotId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`validationStatus` enum('pending','pass','needs_revision','unclear','manual_override') NOT NULL DEFAULT 'pending',
	`aiFeedback` json,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_uploads_id` PRIMARY KEY(`id`)
);
