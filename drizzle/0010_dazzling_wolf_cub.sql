CREATE TABLE `conversationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`sender` enum('admin','customer') NOT NULL,
	`body` varchar(2000) NOT NULL,
	`readByAdmin` enum('no','yes') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(48) NOT NULL,
	`leadId` int,
	`orderId` int,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(32),
	`productTitle` varchar(255) NOT NULL,
	`closed` enum('no','yes') NOT NULL DEFAULT 'no',
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_token_unique` UNIQUE(`token`)
);
