CREATE TABLE `email_contacts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `first_source` text NOT NULL DEFAULT 'unknown',
  `last_source` text NOT NULL DEFAULT 'unknown',
  `first_seen_at` integer NOT NULL DEFAULT (unixepoch()),
  `last_seen_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_contacts_email_unique` ON `email_contacts` (`email`);
--> statement-breakpoint
CREATE INDEX `email_contacts_last_seen_idx` ON `email_contacts` (`last_seen_at`);
