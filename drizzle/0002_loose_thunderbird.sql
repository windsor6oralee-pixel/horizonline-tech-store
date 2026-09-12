ALTER TABLE `installmentOrders` ADD `paymentProofKey` varchar(512);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofName` varchar(255);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofMimeType` varchar(120);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofReviewedAt` timestamp;