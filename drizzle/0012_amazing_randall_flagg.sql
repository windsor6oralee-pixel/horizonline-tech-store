CREATE TABLE `customerPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`amountUsd` decimal(10,2) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`note` varchar(255),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerPayments_id` PRIMARY KEY(`id`)
);
