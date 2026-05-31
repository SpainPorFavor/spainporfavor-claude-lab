ALTER TABLE `email_queue` MODIFY COLUMN `emailType` enum('document_validated','document_needs_revision','status_update','requerimiento','resolution','expiry_warning','inactivity_nudge','milestone','welcome','prospect_nurture','prospect_followup','assessment_response') NOT NULL;--> statement-breakpoint
ALTER TABLE `email_queue` ADD `category` enum('prospect','client') DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE `email_queue` ADD `gmailMessageId` varchar(255);--> statement-breakpoint
ALTER TABLE `email_queue` ADD `gmailThreadId` varchar(255);