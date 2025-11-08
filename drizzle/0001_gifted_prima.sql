CREATE TABLE `customer_service_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`status` enum('pending','answered') NOT NULL DEFAULT 'pending',
	`answeredBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`answeredAt` timestamp,
	CONSTRAINT `customer_service_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
