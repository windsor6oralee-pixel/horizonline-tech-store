CREATE TABLE `visitorSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`device` enum('mobile','tablet','desktop') NOT NULL,
	`lastView` varchar(64) NOT NULL,
	`furthestStage` int NOT NULL DEFAULT 0,
	`productTitle` varchar(255),
	`firstSeen` timestamp NOT NULL DEFAULT (now()),
	`lastSeen` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitorSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitorSessions_sessionId_unique` UNIQUE(`sessionId`)
);
