CREATE INDEX `idx_proposals_task_id` ON `proposals` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_published_score` ON `tasks` (`published`,`score`);