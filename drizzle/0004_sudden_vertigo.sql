ALTER TABLE `installmentOrders` ADD `hasExistingInstallments` enum('yes','no') NOT NULL DEFAULT 'no';--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `identityDocumentType` enum('syrian_id','passport','residence_permit','driving_license');--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `identityDocumentKey` varchar(512);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `identityDocumentName` varchar(255);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `identityDocumentMimeType` varchar(120);
