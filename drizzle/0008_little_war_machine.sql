CREATE TABLE `email_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`emailType` enum('document_validated','document_needs_revision','status_update','requerimiento','resolution','expiry_warning','inactivity_nudge','milestone','welcome') NOT NULL,
	`status` enum('queued','sent','failed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_queue_id` PRIMARY KEY(`id`)
);
