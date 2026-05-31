CREATE TABLE `funnel_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadEmail` varchar(320) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`source` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_chat_messages_id` PRIMARY KEY(`id`)
);
