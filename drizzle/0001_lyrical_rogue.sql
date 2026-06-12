CREATE TABLE `d1_migrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`applied_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limit_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_hash` text,
	`ip_hash` text,
	`user_agent_hash` text,
	`scope` text NOT NULL,
	`decision` text NOT NULL,
	`risk_score` integer NOT NULL,
	`reasons_json` text NOT NULL,
	`request_cost` integer NOT NULL,
	`country` text,
	`colo` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limit_decisions_created_at_idx` ON `rate_limit_decisions` (`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_decisions_visitor_created_at_idx` ON `rate_limit_decisions` (`visitor_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_decisions_ip_created_at_idx` ON `rate_limit_decisions` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `visitor_reputations` (
	`visitor_hash` text PRIMARY KEY NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`successful_requests` integer DEFAULT 0 NOT NULL,
	`challenged_requests` integer DEFAULT 0 NOT NULL,
	`blocked_requests` integer DEFAULT 0 NOT NULL,
	`failed_challenges` integer DEFAULT 0 NOT NULL,
	`last_country` text,
	`last_colo` text,
	`last_latitude` numeric,
	`last_longitude` numeric,
	`last_seen_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitor_reputations_updated_at_idx` ON `visitor_reputations` (`updated_at`);--> statement-breakpoint
DROP INDEX `districts_districts_province_id_idx`;--> statement-breakpoint
DROP INDEX `districts_districts_regency_id_idx`;--> statement-breakpoint
DROP INDEX `districts_districts_regency_id_name_idx`;--> statement-breakpoint
CREATE INDEX `districts_regency_id_name_idx` ON `districts` (`regency_id`,`name`);--> statement-breakpoint
CREATE INDEX `districts_province_id_idx` ON `districts` (`province_id`);--> statement-breakpoint
CREATE INDEX `districts_regency_id_idx` ON `districts` (`regency_id`);--> statement-breakpoint
DROP INDEX `provinces_provinces_name_idx`;--> statement-breakpoint
CREATE INDEX `provinces_name_idx` ON `provinces` (`name`);--> statement-breakpoint
DROP INDEX `regencies_regencies_province_id_idx`;--> statement-breakpoint
DROP INDEX `regencies_regencies_province_id_name_idx`;--> statement-breakpoint
CREATE INDEX `regencies_province_id_name_idx` ON `regencies` (`province_id`,`name`);--> statement-breakpoint
CREATE INDEX `regencies_province_id_idx` ON `regencies` (`province_id`);--> statement-breakpoint
DROP INDEX `security_events_security_events_created_at_idx`;--> statement-breakpoint
CREATE INDEX `security_events_created_at_idx` ON `security_events` (`created_at`);--> statement-breakpoint
DROP INDEX `villages_villages_district_id_id_idx`;--> statement-breakpoint
DROP INDEX `villages_villages_district_id_idx`;--> statement-breakpoint
DROP INDEX `villages_villages_district_id_name_idx`;--> statement-breakpoint
DROP INDEX `villages_villages_province_id_idx`;--> statement-breakpoint
DROP INDEX `villages_villages_regency_id_id_idx`;--> statement-breakpoint
DROP INDEX `villages_villages_regency_id_idx`;--> statement-breakpoint
CREATE INDEX `villages_district_id_id_idx` ON `villages` (`district_id`,`id`);--> statement-breakpoint
CREATE INDEX `villages_regency_id_id_idx` ON `villages` (`regency_id`,`id`);--> statement-breakpoint
CREATE INDEX `villages_district_id_name_idx` ON `villages` (`district_id`,`name`);--> statement-breakpoint
CREATE INDEX `villages_province_id_idx` ON `villages` (`province_id`);--> statement-breakpoint
CREATE INDEX `villages_regency_id_idx` ON `villages` (`regency_id`);--> statement-breakpoint
CREATE INDEX `villages_district_id_idx` ON `villages` (`district_id`);--> statement-breakpoint
CREATE INDEX `generation_requests_visitor_created_at_idx` ON `generation_requests` (`visitor_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `generation_requests_ip_created_at_idx` ON `generation_requests` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_buckets_scope_updated_at_idx` ON `rate_limit_buckets` (`scope`,`updated_at`);