ALTER TABLE `incompleteCheckoutLeads` MODIFY COLUMN `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `incompleteCheckoutLeads` MODIFY COLUMN `province` varchar(80);--> statement-breakpoint
ALTER TABLE `incompleteCheckoutLeads` MODIFY COLUMN `consentAt` timestamp;--> statement-breakpoint
ALTER TABLE `incompleteCheckoutLeads` ADD `source` enum('form','whatsapp') DEFAULT 'form' NOT NULL;--> statement-breakpoint
ALTER TABLE `incompleteCheckoutLeads` ADD `sessionId` varchar(64);