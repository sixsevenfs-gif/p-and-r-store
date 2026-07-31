CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text DEFAULT '' NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pin_code` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `addresses_customer_idx` ON `addresses` (`customer_id`);--> statement-breakpoint
CREATE TABLE `referral_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`reward_amount` integer DEFAULT 10000 NOT NULL,
	`auto_approve` integer DEFAULT true NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrer_customer_id` integer NOT NULL,
	`referred_customer_id` integer NOT NULL,
	`qualifying_order_id` integer,
	`reward_amount` integer NOT NULL,
	`status` text DEFAULT 'registered' NOT NULL,
	`fraud_reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`approved_at` integer,
	`reversed_at` integer,
	FOREIGN KEY (`referrer_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_referred_customer_idx` ON `referrals` (`referred_customer_id`);--> statement-breakpoint
CREATE INDEX `referrals_referrer_idx` ON `referrals` (`referrer_customer_id`);--> statement-breakpoint
CREATE TABLE `wallet_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`referral_id` integer,
	`order_id` integer,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallet_ledger_idempotency_key_unique` ON `wallet_ledger` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `wallet_customer_idx` ON `wallet_ledger` (`customer_id`);--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`product_slug` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlist_customer_product_idx` ON `wishlists` (`customer_id`,`product_slug`);--> statement-breakpoint
ALTER TABLE `customers` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `auth_provider` text DEFAULT 'siwc' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `referral_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `referred_by_customer_id` integer;--> statement-breakpoint
ALTER TABLE `customers` ADD `first_paid_at` integer;--> statement-breakpoint
ALTER TABLE `customers` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE `customers` SET `referral_code` = 'PR' || upper(substr(hex(randomblob(8)), 1, 12)) WHERE `referral_code` = '';--> statement-breakpoint
CREATE UNIQUE INDEX `customers_referral_code_unique` ON `customers` (`referral_code`);--> statement-breakpoint
ALTER TABLE `orders` ADD `wallet_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payable_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `payable_amount` = `total_amount`;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_reference` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelled_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `refunded_at` integer;
