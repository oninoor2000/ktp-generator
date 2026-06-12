CREATE TABLE `districts` (
	`id` text PRIMARY KEY NOT NULL,
	`regency_id` text NOT NULL,
	`province_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`regency_id`) REFERENCES `regencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `districts_districts_province_id_idx` ON `districts` (`province_id`);--> statement-breakpoint
CREATE INDEX `districts_districts_regency_id_idx` ON `districts` (`regency_id`);--> statement-breakpoint
CREATE INDEX `districts_districts_regency_id_name_idx` ON `districts` (`regency_id`,`name`);--> statement-breakpoint
CREATE TABLE `generation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_hash` text,
	`ip_hash` text,
	`user_agent_hash` text,
	`region_scope` text NOT NULL,
	`province_id` text,
	`regency_id` text,
	`district_id` text,
	`village_id` text,
	`gender` text,
	`min_age` integer NOT NULL,
	`max_age` integer NOT NULL,
	`requested_count` integer NOT NULL,
	`generated_count` integer NOT NULL,
	`decision` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `provinces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `provinces_provinces_name_idx` ON `provinces` (`name`);--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`key` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`window_start` integer NOT NULL,
	`window_seconds` integer NOT NULL,
	`request_count` integer NOT NULL,
	`challenge_after` integer NOT NULL,
	`block_after` integer NOT NULL,
	`blocked_until` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limit_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_hash` text NOT NULL,
	`challenge_hash` text NOT NULL,
	`difficulty` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`solved_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `regencies` (
	`id` text PRIMARY KEY NOT NULL,
	`province_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `regencies_regencies_province_id_idx` ON `regencies` (`province_id`);--> statement-breakpoint
CREATE INDEX `regencies_regencies_province_id_name_idx` ON `regencies` (`province_id`,`name`);--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`visitor_hash` text,
	`ip_hash` text,
	`scope` text,
	`reason` text,
	`metadata_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_events_security_events_created_at_idx` ON `security_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `villages` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`regency_id` text NOT NULL,
	`province_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`regency_id`) REFERENCES `regencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `villages_villages_district_id_id_idx` ON `villages` (`district_id`,`id`);--> statement-breakpoint
CREATE INDEX `villages_villages_district_id_idx` ON `villages` (`district_id`);--> statement-breakpoint
CREATE INDEX `villages_villages_district_id_name_idx` ON `villages` (`district_id`,`name`);--> statement-breakpoint
CREATE INDEX `villages_villages_province_id_idx` ON `villages` (`province_id`);--> statement-breakpoint
CREATE INDEX `villages_villages_regency_id_id_idx` ON `villages` (`regency_id`,`id`);--> statement-breakpoint
CREATE INDEX `villages_villages_regency_id_idx` ON `villages` (`regency_id`);