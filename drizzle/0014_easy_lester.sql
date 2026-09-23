ALTER TABLE `customerPayments` ADD `fileHash` varchar(64);--> statement-breakpoint
ALTER TABLE `installmentOrders` ADD `paymentProofHash` varchar(64);