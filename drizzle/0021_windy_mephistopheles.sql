ALTER TABLE `cases` ADD `privacyAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `cases` ADD `privacyNoticeVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `cases` ADD `aiValidationEnabled` boolean DEFAULT false;