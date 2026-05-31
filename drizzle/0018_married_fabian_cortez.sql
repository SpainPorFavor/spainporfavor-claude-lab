ALTER TABLE `leads` ADD `status` enum('new','contacted','engaged','qualified','converted','lost') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `linkedCaseId` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;