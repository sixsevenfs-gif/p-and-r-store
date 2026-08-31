-- App-owned authentication. Existing commerce data is preserved.
CREATE TABLE `auth_user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer NOT NULL,
  `image` text,
  `created_at` date NOT NULL,
  `updated_at` date NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);
--> statement-breakpoint
CREATE TABLE `auth_session` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` date NOT NULL,
  `token` text NOT NULL,
  `created_at` date NOT NULL,
  `updated_at` date NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);
--> statement-breakpoint
CREATE INDEX `auth_session_user_id_idx` ON `auth_session` (`user_id`);
--> statement-breakpoint
CREATE TABLE `auth_account` (
  `id` text PRIMARY KEY NOT NULL,
  `issuer` text NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `auth_user`(`id`) ON DELETE CASCADE,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` date,
  `refresh_token_expires_at` date,
  `scope` text,
  `password` text,
  `created_at` date NOT NULL,
  `updated_at` date NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_account_issuer_account_id_idx` ON `auth_account` (`issuer`,`account_id`);
--> statement-breakpoint
CREATE INDEX `auth_account_user_id_idx` ON `auth_account` (`user_id`);
--> statement-breakpoint
CREATE TABLE `auth_verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` date NOT NULL,
  `created_at` date NOT NULL,
  `updated_at` date NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verification_identifier_idx` ON `auth_verification` (`identifier`);
--> statement-breakpoint
CREATE TABLE `auth_rate_limit` (
  `id` text PRIMARY KEY NOT NULL,
  `key` text NOT NULL,
  `count` integer NOT NULL,
  `last_request` bigint NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limit_key_unique` ON `auth_rate_limit` (`key`);
--> statement-breakpoint
ALTER TABLE `customers` ADD COLUMN `auth_user_id` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_auth_user_id_unique` ON `customers` (`auth_user_id`) WHERE `auth_user_id` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `admin_roles` ADD COLUMN `auth_user_id` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_roles_auth_user_id_unique` ON `admin_roles` (`auth_user_id`) WHERE `auth_user_id` IS NOT NULL;
