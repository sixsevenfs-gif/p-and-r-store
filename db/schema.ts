import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authUserId: text("auth_user_id"),
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
  shippingStatus: text("shipping_status").notNull().default("unfulfilled"),
  trackingId: text("tracking_id"),
  courier: text("courier"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  internalStatus: text("internal_status").notNull().default("open"),
  shippingAddress: text("shipping_address").notNull().default("{}"),
  paymentMethod: text("payment_method").notNull().default("cod"),
  couponCode: text("coupon_code"),
  paymentReference: text("payment_reference"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  refundedAt: integer("refunded_at", { mode: "timestamp" }),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  confirmedBy: text("confirmed_by"),
  shippedAt: integer("shipped_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  estimatedDeliveryAt: integer("estimated_delivery_at", { mode: "timestamp" }),
  trackingUrl: text("tracking_url"),
  customerMessage: text("customer_message"),
  cancellationReason: text("cancellation_reason"),
  inventoryRestoredAt: integer("inventory_restored_at", { mode: "timestamp" }),
  refundStatus: text("refund_status").notNull().default("none"),
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
  color: text("color").notNull().default(""),
  variantId: integer("variant_id"),
  editionNumber: integer("edition_number"),
  isUniqueFind: integer("is_unique_find", { mode: "boolean" }).notNull().default(false),
});

/**
 * The original storefront predates the D1 catalog and stores its products in
 * app/product-data.ts.  The tables below are the source of truth at runtime;
 * the static file is only used to seed a development catalog on first run.
 * Monetary amounts are stored in paise.
 */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  shortDescription: text("short_description").notNull().default(""),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  category: text("category").notNull(),
  color: text("color").notNull(),
  status: text("status").notNull().default("draft"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  newArrival: integer("new_arrival", { mode: "boolean" }).notNull().default(false),
  audience: text("audience").notNull().default("unisex"),
  productType: text("product_type").notNull().default("apparel"),
  tags: text("tags").notNull().default("[]"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  costPrice: integer("cost_price"),
  taxStatus: text("tax_status").notNull().default("taxable"),
  sku: text("sku").notNull().unique(),
  collectionIds: text("collection_ids").notNull().default("[]"),
  editionNumber: integer("edition_number"),
  isUniqueFind: integer("is_unique_find", { mode: "boolean" }).notNull().default(false),
  lifetimeProductionCap: integer("lifetime_production_cap"),
  totalUnitsCreated: integer("total_units_created").notNull().default(0),
  uniqueFindStatus: text("unique_find_status").notNull().default("available"),
  archiveDate: integer("archive_date", { mode: "timestamp" }),
  archiveNote: text("archive_note").notNull().default(""),
  keepVisibleAfterSellout: integer("keep_visible_after_sellout", { mode: "boolean" }).notNull().default(true),
  uniqueReleaseAt: integer("unique_release_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("products_catalog_idx").on(table.status, table.category)]);

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  size: text("size").notNull(),
  color: text("color").notNull(),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  price: integer("price"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
});

// These definitions reconcile the Drizzle model with the commerce-control
// migrations already applied to D1. They do not create or remove data.
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  url: text("url").notNull(),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  adminEmail: text("admin_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("inventory_movements_variant_idx").on(table.variantId)]);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull().unique(), slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("active"), sortOrder: integer("sort_order").notNull().default(0),
});

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""), status: text("status").notNull().default("draft"), imageUrl: text("image_url"),
  audience: text("audience").notNull().default("unisex"), featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }), orderId: integer("order_id").notNull().references(() => orders.id), customerId: integer("customer_id").notNull().references(() => customers.id),
  reason: text("reason").notNull(), imageUrls: text("image_urls").notNull().default("[]"), decisionStatus: text("decision_status").notNull().default("requested"), pickupStatus: text("pickup_status").notNull().default("pending"), refundStatus: text("refund_status").notNull().default("pending"), adminNote: text("admin_note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("returns_status_idx").on(table.decisionStatus)]);

export const discounts = sqliteTable("discounts", {
  id: integer("id").primaryKey({ autoIncrement: true }), code: text("code").notNull().unique(), type: text("type").notNull(), value: integer("value").notNull(),
  startsAt: integer("starts_at", { mode: "timestamp" }), endsAt: integer("ends_at", { mode: "timestamp" }), usageLimit: integer("usage_limit"), usageCount: integer("usage_count").notNull().default(0), minimumOrder: integer("minimum_order").notNull().default(0), targetType: text("target_type").notNull().default("all"), targetIds: text("target_ids").notNull().default("[]"), status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("discounts_code_idx").on(table.code)]);

export const payouts = sqliteTable("payouts", {
  id: integer("id").primaryKey({ autoIncrement: true }), customerId: integer("customer_id").notNull().references(() => customers.id), amount: integer("amount").notNull(), status: text("status").notNull().default("pending"), bankReference: text("bank_reference"), note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`), processedAt: integer("processed_at", { mode: "timestamp" }),
});

export const contentSections = sqliteTable("content_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }), sectionKey: text("section_key").notNull().unique(), sectionType: text("section_type").notNull(), title: text("title").notNull().default(""), subtitle: text("subtitle").notNull().default(""), body: text("body").notNull().default(""), imageUrl: text("image_url"), ctaLabel: text("cta_label"), ctaUrl: text("cta_url"), sortOrder: integer("sort_order").notNull().default(0), status: text("status").notNull().default("draft"), publishedAt: integer("published_at", { mode: "timestamp" }), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const storeSettings = sqliteTable("store_settings", { key: text("key").primaryKey(), value: text("value").notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) });
export const orderNotes = sqliteTable("order_notes", { id: integer("id").primaryKey({ autoIncrement: true }), orderId: integer("order_id").notNull().references(() => orders.id), note: text("note").notNull(), adminEmail: text("admin_email").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) });
export const auditLogs = sqliteTable("audit_logs", { id: integer("id").primaryKey({ autoIncrement: true }), adminEmail: text("admin_email").notNull(), action: text("action").notNull(), resource: text("resource").notNull(), resourceId: text("resource_id"), detail: text("detail").notNull().default("{}"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (table) => [index("audit_resource_idx").on(table.resource, table.createdAt)]);
export const mediaAssets = sqliteTable("media_assets", { id: integer("id").primaryKey({ autoIncrement: true }), objectKey: text("object_key").notNull().unique(), filename: text("filename").notNull(), contentType: text("content_type").notNull(), sizeBytes: integer("size_bytes").notNull(), altText: text("alt_text").notNull().default(""), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (table) => [index("media_assets_created_idx").on(table.createdAt)]);
export const customerNotes = sqliteTable("customer_notes", { id: integer("id").primaryKey({ autoIncrement: true }), customerId: integer("customer_id").notNull().references(() => customers.id), note: text("note").notNull(), adminEmail: text("admin_email").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (table) => [index("customer_notes_customer_idx").on(table.customerId, table.createdAt)]);

export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id).unique(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [uniqueIndex("cart_variant_idx").on(table.cartId, table.variantId)]);

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull(),
  gatewayOrderId: text("gateway_order_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("payments_order_idx").on(table.orderId)]);

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minimumOrder: integer("minimum_order").notNull().default(0),
  maximumDiscount: integer("maximum_discount"),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  usageLimit: integer("usage_limit"),
  perCustomerLimit: integer("per_customer_limit").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  status: text("status").notNull().default("draft"),
  description: text("description").notNull().default(""), firstOrderOnly: integer("first_order_only", { mode: "boolean" }).notNull().default(false), paymentMethods: text("payment_methods").notNull().default("[]"),
});

export const uniqueFindReservations = sqliteTable("unique_find_reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("active"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const couponUsages = sqliteTable("coupon_usages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  discountAmount: integer("discount_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("coupon_usage_customer_idx").on(table.couponId, table.customerId)]);

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  status: text("status").notNull(),
  note: text("note").notNull().default(""),
  actorEmail: text("actor_email"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("order_history_order_idx").on(table.orderId, table.createdAt)]);

/** Customer-safe and internal operational order events. Rows are append-only. */
export const orderTimeline = sqliteTable("order_timeline", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  eventType: text("event_type").notNull(),
  publicTitle: text("public_title").notNull(),
  publicDescription: text("public_description").notNull().default(""),
  internalDescription: text("internal_description").notNull().default(""),
  actorEmail: text("actor_email"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("order_timeline_order_idx").on(table.orderId, table.createdAt)]);

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("reviews_product_idx").on(table.productId, table.status)]);

export const adminRoles = sqliteTable("admin_roles", {
  email: text("email").primaryKey(),
  authUserId: text("auth_user_id"),
  role: text("role").notNull().default("ADMIN"),
  permissions: text("permissions").notNull().default("[]"),
  status: text("status").notNull().default("active"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Better Auth's D1 schema. Dates are stored using Better Auth's native
// SQLite/D1 date representation, not the storefront's integer timestamps.
export const authUsers = sqliteTable("auth_user", { id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(), emailVerified: integer("email_verified", { mode: "boolean" }).notNull(), image: text("image"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull() });
export const authSessions = sqliteTable("auth_session", { id: text("id").primaryKey(), expiresAt: text("expires_at").notNull(), token: text("token").notNull().unique(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(), ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => authUsers.id) }, (table) => [index("auth_session_user_id_idx").on(table.userId)]);
export const authAccounts = sqliteTable("auth_account", { id: text("id").primaryKey(), issuer: text("issuer").notNull(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(), userId: text("user_id").notNull().references(() => authUsers.id), accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: text("access_token_expires_at"), refreshTokenExpiresAt: text("refresh_token_expires_at"), scope: text("scope"), password: text("password"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull() }, (table) => [uniqueIndex("auth_account_issuer_account_id_idx").on(table.issuer, table.accountId), index("auth_account_user_id_idx").on(table.userId)]);
export const authVerifications = sqliteTable("auth_verification", { id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: text("expires_at").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull() }, (table) => [index("auth_verification_identifier_idx").on(table.identifier)]);
export const authRateLimits = sqliteTable("auth_rate_limit", { id: text("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(), lastRequest: integer("last_request", { mode: "number" }).notNull() });
