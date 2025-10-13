CREATE TABLE `daily_tracker` (
	`osu_id` integer PRIMARY KEY NOT NULL,
	`has_played_today` integer,
	`full_streaker` integer,
	`is_streaking` integer,
	`last_update` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`osu_id`) REFERENCES `players`(`osu_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`osu_id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`rank_standard` integer,
	`total_participation` integer,
	`current_daily_streak` integer,
	`best_daily_streak` integer,
	`last_update` text DEFAULT (current_timestamp) NOT NULL
);
