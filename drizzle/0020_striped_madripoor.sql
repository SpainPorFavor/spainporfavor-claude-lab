CREATE TABLE `document_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`caseId` int NOT NULL,
	`staffUserId` int NOT NULL,
	`action` enum('view_metadata','download','preview','share_with_gestor','delete') NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `document_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`caseId` int NOT NULL,
	`eventType` enum('upload_initiated','upload_completed','quality_check_passed','quality_check_failed','extraction_started','extraction_completed','extraction_failed','manual_review_started','manual_review_completed','accepted','rejected','replacement_requested','deletion_scheduled','deleted') NOT NULL,
	`eventPayload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `document_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `secure_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`applicantId` int,
	`productType` varchar(64),
	`documentType` enum('passport','eu_national_id','criminal_record','proof_of_income','health_insurance','proof_of_address','employment_contract','remote_work_contract','university_degree','professional_qualification','bank_statement','tax_return','marriage_certificate','birth_certificate','other') NOT NULL,
	`documentSide` enum('single','front','back') NOT NULL DEFAULT 'single',
	`originalFileName` varchar(255),
	`fileMimeType` varchar(128),
	`fileSize` int,
	`storageProvider` varchar(32) NOT NULL DEFAULT 'aws_s3',
	`storageBucket` varchar(255),
	`storageKey` varchar(512),
	`uploadStatus` enum('requested','upload_started','uploaded','pending_manual_review','accepted','rejected','replacement_requested','deletion_scheduled','deleted') NOT NULL DEFAULT 'requested',
	`qualityStatus` enum('not_checked','passed','failed_blurry','failed_glare','failed_corners','failed_dark','failed_wrong_side') NOT NULL DEFAULT 'not_checked',
	`extractionStatus` enum('not_started','pending','completed','failed','skipped') NOT NULL DEFAULT 'not_started',
	`reviewStatus` enum('not_reviewed','pending_manual_review','approved','rejected','needs_resubmission') NOT NULL DEFAULT 'not_reviewed',
	`uploadedAt` timestamp,
	`uploadedBy` int,
	`retentionUntil` timestamp,
	`deletionStatus` enum('active','scheduled','deleted') NOT NULL DEFAULT 'active',
	`deletedAt` timestamp,
	`deletionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `secure_documents_id` PRIMARY KEY(`id`)
);
