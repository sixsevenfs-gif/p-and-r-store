import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  pinCode: text("pin_code").notNull().default(""),
  phone: text("phone").notNull().default(""),
  authProvider: text("auth_provider").notNull().default("siwc"),
  referralCode: text("referral_code").notNull().unique(),
  referredByCustomerId: integer("referred_by_customer_id"),
  firstPaidAt: integer("first_paid_at", { mode: "timestamp" }),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  subscribedAt: integer("subscribed_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [uniqueIndex("newsletter_subscribers_email_idx").on(table.email)]);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  checkoutKey: text("checkout_key").unique(),
  subtotalAmount: integer("subtotal_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  shippingAmount: integer("shipping_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  walletAmount: integer("wallet_amount").notNull().default(0),
  payableAmount: integer("payable_amount").notNull(),
  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  refundedAt: integer("refunded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  label: text("label").notNull().default("Home"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pinCode: text("pin_code").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("addresses_customer_idx").on(table.customerId)]);

export const wishlists = sqliteTable("wishlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  productSlug: text("product_slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [uniqueIndex("wishlist_customer_product_idx").on(table.customerId, table.productSlug)]);

export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerCustomerId: integer("referrer_customer_id").notNull().references(() => customers.id),
  referredCustomerId: integer("referred_customer_id").notNull().references(() => customers.id),
  qualifyingOrderId: integer("qualifying_order_id"),
  rewardAmount: integer("reward_amount").notNull(),
  status: text("status").notNull().default("registered"),
  fraudReason: text("fraud_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  reversedAt: integer("reversed_at", { mode: "timestamp" }),
}, (table) => [
  uniqueIndex("referrals_referred_customer_idx").on(table.referredCustomerId),
  index("referrals_referrer_idx").on(table.referrerCustomerId),
]);

export const walletLedger = sqliteTable("wallet_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  referralId: integer("referral_id").references(() => referrals.id),
  orderId: integer("order_id").references(() => orders.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  note: text("note").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("wallet_customer_idx").on(table.customerId)]);

export const referralConfig = sqliteTable("referral_config", {
  id: integer("id").primaryKey(),
  rewardAmount: integer("reward_amount").notNull().default(10000),
  autoApprove: integer("auto_approve", { mode: "boolean" }).notNull().default(true),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productSlug: text("product_slug").notNull(),
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  size: text("size").notNull(),
});
