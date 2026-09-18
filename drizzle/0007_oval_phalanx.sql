CREATE TABLE `storedFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(512) NOT NULL,
	`name` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`size` int NOT NULL,
	`data` longblob NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storedFiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `storedFiles_key_unique` UNIQUE(`key`)
);
