CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`team_id` text NOT NULL,
	`solution_idea` text NOT NULL,
	`plan` text NOT NULL,
	`estimated_time` text NOT NULL,
	`prototype_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`original_description` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`need` text DEFAULT '' NOT NULL,
	`users` text DEFAULT '' NOT NULL,
	`data_materials` text DEFAULT '' NOT NULL,
	`constraints` text DEFAULT '' NOT NULL,
	`expected_result` text DEFAULT '' NOT NULL,
	`success_criteria` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`interaction_format` text DEFAULT '' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`readiness_level` text DEFAULT 'Черновик' NOT NULL,
	`confirmed` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`interests` text DEFAULT '' NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`technologies` text DEFAULT '' NOT NULL
);
