ALTER TABLE `customerPayments` ADD `transactionRef` varchar(64);--> statement-breakpoint
ALTER TABLE `customerPayments` ADD `receiptAt` timestamp;--> statement-breakpoint
ALTER TABLE `customerPayments` ADD `recipientName` varchar(160);--> statement-breakpoint
ALTER TABLE `customerPayments` ADD `receiptAmountUsd` decimal(10,2);--> statement-breakpoint
ALTER TABLE `customerPayments` ADD `verifiedBy` enum('auto','admin');