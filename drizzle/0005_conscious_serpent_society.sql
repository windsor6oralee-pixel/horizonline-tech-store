CREATE TABLE `incompleteCheckoutLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productTitle` varchar(255) NOT NULL,
	`productHandle` varchar(255),
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`province` varchar(80) NOT NULL,
	`downPaymentUsd` decimal(10,2) NOT NULL,
	`months` int NOT NULL,
	`checkoutStep` enum('payment','delivery','eligibility') NOT NULL DEFAULT 'payment',
	`status` enum('new','contacted','converted','closed') NOT NULL DEFAULT 'new',
	`consentAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incompleteCheckoutLeads_id` PRIMARY KEY(`id`)
);
