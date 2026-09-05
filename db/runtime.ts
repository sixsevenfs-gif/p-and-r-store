import postgres, { type Row } from "postgres";

type BoundValue = unknown;

let client: ReturnType<typeof postgres> | undefined;

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for Supabase PostgreSQL.");
  client ??= postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
    ssl: "require",
  });
  return client;
}

function replacePlaceholders(input: string) {
  let output = "";
  let index = 0;
  let quote: "'" | '"' | "`" | null = null;
  for (let cursor = 0; cursor < input.length; cursor++) {
    const char = input[cursor];
    if (quote) {
      output += char;
      if (char === quote) {
        if (input[cursor + 1] === quote) output += input[++cursor];
        else quote = null;
      }
    } else if (char === "'" || char === '"' || char === "`") {
      quote = char;
      output += char === "`" ? '"' : char;
    } else if (char === "?") {
      output += `$${++index}`;
    } else output += char;
  }
  return output;
}

const identityTables = new Set([
  "customers", "newsletter_subscribers", "orders", "order_items", "addresses", "wishlists",
  "referrals", "wallet_ledger", "products", "product_variants", "product_images", "inventory_movements",
  "categories", "collections", "returns", "discounts", "payouts", "content_sections", "order_notes",
  "audit_logs", "media_assets", "customer_notes", "carts", "cart_items", "payments", "reviews",
  "review_images", "shipping_rules", "coupons", "coupon_usages", "admin_roles", "order_status_history",
  "order_timeline", "unique_find_reservations",
]);

function translate(input: string) {
  let statement = input.trim()
    .replaceAll(/unixepoch\(\)/gi, "extract(epoch from now())::bigint")
    .replaceAll(/\browid\b/gi, "id")
    .replace(/group_concat\(([^,]+),\s*([^\)]+)\)/gi, "string_agg(($1)::text, $2)")
    .replaceAll(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
  const ignoredInsert = /INSERT\s+OR\s+IGNORE\s+INTO/i.test(input);
  if (ignoredInsert && !/\bON\s+CONFLICT\b/i.test(statement)) statement += " ON CONFLICT DO NOTHING";
  statement = replacePlaceholders(statement);
  const insert = statement.match(/^INSERT\s+INTO\s+["`]?([a-z_]+)["`]?/i);
  if (insert && identityTables.has(insert[1]) && !/\bRETURNING\b/i.test(statement)) statement += " RETURNING id";
  return statement;
}

function normalizeRows(rows: Row[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    typeof value === "bigint" ? Number(value) : value,
  ])));
}

export class PostgresStatement {
  private values: BoundValue[] = [];
  constructor(private statement: string, public scopedClient?: ReturnType<typeof postgres>) {}
  bind(...values: BoundValue[]) { this.values = values; return this; }
  private async execute() {
    const sql = this.scopedClient ?? getClient();
    const rows = await sql.unsafe(translate(this.statement), this.values as never[]);
    return { rows: normalizeRows(rows), count: rows.count };
  }
  async first<T>() { return ((await this.execute()).rows[0] as T | undefined) ?? null; }
  async all<T>() {
    const { rows } = await this.execute();
    return { results: rows as T[], success: true, meta: {} };
  }
  async run() {
    const { rows, count } = await this.execute();
    return { success: true, results: rows, meta: { changes: count, last_row_id: Number((rows[0] as { id?: unknown } | undefined)?.id ?? 0) } };
  }
  async raw<T>() { return (await this.execute()).rows.map((row) => Object.values(row)) as T; }
}

class PostgresD1Database {
  prepare(statement: string) { return new PostgresStatement(statement); }
  async batch(statements: PostgresStatement[]) {
    const sql = getClient();
    return sql.begin(async (transaction) => Promise.all(statements.map(async (statement) => {
      // D1 statements retain their SQL and bound values; execute them through
      // the transaction-scoped postgres client.
      const copy = Object.assign(Object.create(Object.getPrototypeOf(statement)), statement) as PostgresStatement;
      copy.scopedClient = transaction as unknown as ReturnType<typeof postgres>;
      return copy.run();
    })));
  }
}

export const env = { DB: new PostgresD1Database() };
