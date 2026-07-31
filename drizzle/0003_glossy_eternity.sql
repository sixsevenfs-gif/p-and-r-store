ALTER TABLE `orders` ADD `checkout_key` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotal_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `subtotal_amount` = `total_amount` WHERE `subtotal_amount` = 0;--> statement-breakpoint
UPDATE `wallet_ledger`
SET `amount` = `amount` * 100
WHERE `order_id` IS NOT NULL
  AND `type` IN ('debit', 'refund')
  AND abs(`amount`) = (
    SELECT `wallet_amount` FROM `orders` WHERE `orders`.`id` = `wallet_ledger`.`order_id`
  );--> statement-breakpoint
CREATE UNIQUE INDEX `orders_checkout_key_unique` ON `orders` (`checkout_key`);
