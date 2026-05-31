ALTER TABLE `management_tasks` ADD `archived` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `management_tasks` ADD `archivedAt` timestamp;