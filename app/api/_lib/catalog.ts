import { env } from "@/db/runtime";
import { products as seedProducts } from "../../product-data";

export type CatalogFilters = {
  query?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  available?: boolean;
  uniqueFinds?: boolean;
  sort?: string | null;
  limit?: number;
  offset?: number;
};

/** Seed only when a local/development D1 database is empty. Production data is
 * managed through the admin API and therefore never overwritten by this code. */
export async function ensureCatalog() {
  const count = await env.DB.prepare("SELECT count(*) AS count FROM products").first<{ count: number }>();
  if (Number(count?.count)) return;

  for (const product of seedProducts) {
    await env.DB.prepare(`INSERT OR IGNORE INTO products
      (slug,name,description,short_description,price,compare_at_price,category,color,status,sku,featured,new_arrival,edition_number)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(product.slug, product.name, product.note, product.note.slice(0, 180), product.price * 100, product.compareAtPrice ? product.compareAtPrice * 100 : null,
        product.category, product.color, "published", `PR-${String(product.id).padStart(4, "0")}`,
        product.id <= 5 ? 1 : 0, product.id <= 5 ? 1 : 0, product.id).run();
    const stored = await env.DB.prepare("SELECT id FROM products WHERE slug=?").bind(product.slug).first<{ id: number }>();
    if (!stored) continue;
    await env.DB.batch([
      ...product.gallery.map((image, index) => env.DB.prepare(
        "INSERT OR IGNORE INTO product_images(product_id,url,alt_text,sort_order) VALUES (?,?,?,?)",
      ).bind(stored.id, image.src, `${product.name} ${image.label}`, index)),
      ...["XS", "S", "M", "L", "XL"].map((size) => env.DB.prepare(
        "INSERT OR IGNORE INTO product_variants(product_id,size,color,sku,stock,low_stock_threshold,active) VALUES (?,?,?,?,?,?,1)",
      ).bind(stored.id, size, product.color, `PR-${String(product.id).padStart(4, "0")}-${size}`, 20, 5)),
    ]);
  }
}

export async function listCatalog(filters: CatalogFilters = {}) {
  await ensureCatalog();
  const where = ["p.status='published'"];
  const args: (string | number)[] = [];
  const query = filters.query?.trim().slice(0, 100);
  if (query) {
    where.push("(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR p.sku LIKE ?)");
    const value = `%${query}%`;
    args.push(value, value, value, value);
  }
  if (filters.category) { where.push("p.category=?"); args.push(filters.category.slice(0, 80)); }
  if (filters.color) { where.push("p.color=?"); args.push(filters.color.slice(0, 100)); }
  if (filters.size) {
    where.push("EXISTS (SELECT 1 FROM product_variants vs WHERE vs.product_id=p.id AND vs.size=? AND vs.active=1)");
    args.push(filters.size.slice(0, 16));
  }
  if (filters.available) where.push("EXISTS (SELECT 1 FROM product_variants va WHERE va.product_id=p.id AND va.active=1 AND va.stock-va.reserved_stock > 0)");
  if (filters.uniqueFinds) where.push("p.is_unique_find=1");

  const orderBy: Record<string, string> = {
    "price-asc": "coalesce(min(v.price),p.price) ASC, p.id DESC",
    "price-desc": "coalesce(min(v.price),p.price) DESC, p.id DESC",
    featured: "p.featured DESC, p.created_at DESC",
    newest: "p.created_at DESC",
  };
  const limit = Math.min(48, Math.max(1, Number(filters.limit ?? 24)));
  const offset = Math.max(0, Number(filters.offset ?? 0));
  const sql = `SELECT p.id,p.slug,p.name,p.description,p.short_description,p.price,p.compare_at_price,p.category,p.color,
      p.featured,p.new_arrival,p.created_at,p.edition_number,p.is_unique_find,p.lifetime_production_cap,p.total_units_created,p.unique_find_status,p.archive_note,p.keep_visible_after_sellout,p.unique_release_at,
      coalesce(sum(case when v.active=1 then v.stock-v.reserved_stock else 0 end),0) AS available_stock,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image_url,
      (SELECT id FROM product_variants WHERE product_id=p.id AND active=1 AND size='M' ORDER BY id LIMIT 1) AS default_variant_id
    FROM products p LEFT JOIN product_variants v ON v.product_id=p.id
    WHERE ${where.join(" AND ")} GROUP BY p.id ORDER BY ${orderBy[filters.sort ?? ""] ?? orderBy.newest} LIMIT ? OFFSET ?`;
  const [rows, total] = await Promise.all([
    env.DB.prepare(sql).bind(...args, limit, offset).all(),
    env.DB.prepare(`SELECT count(*) AS count FROM products p WHERE ${where.join(" AND ")}`).bind(...args).first<{ count: number }>(),
  ]);
  const productRows = rows.results as Record<string, unknown>[];
  const productIds = productRows.map((product) => Number(product.id)).filter(Number.isInteger);
  const images = productIds.length
    ? await env.DB.prepare(`SELECT product_id,id,url,alt_text,sort_order FROM product_images
      WHERE product_id IN (${productIds.map(() => "?").join(",")}) ORDER BY product_id,sort_order,id`).bind(...productIds).all()
    : { results: [] as unknown[] };
  const imagesByProduct = new Map<number, unknown[]>();
  for (const image of images.results as Record<string, unknown>[]) {
    const id = Number(image.product_id);
    imagesByProduct.set(id, [...(imagesByProduct.get(id) ?? []), image]);
  }
  const variants = productIds.length
    ? await env.DB.prepare(`SELECT id,product_id,size,stock,reserved_stock,price FROM product_variants
      WHERE product_id IN (${productIds.map(() => "?").join(",")}) AND active=1 ORDER BY product_id,size,id`).bind(...productIds).all()
    : { results: [] as unknown[] };
  const variantsByProduct = new Map<number, unknown[]>();
  for (const variant of variants.results as Record<string, unknown>[]) {
    const id = Number(variant.product_id);
    variantsByProduct.set(id, [...(variantsByProduct.get(id) ?? []), variant]);
  }
  return {
    products: productRows.map((product) => ({ ...product, images: imagesByProduct.get(Number(product.id)) ?? [], variants: variantsByProduct.get(Number(product.id)) ?? [] })),
    total: Number(total?.count ?? 0), limit, offset,
  };
}

export async function getCatalogProduct(slug: string) {
  await ensureCatalog();
  const product = await env.DB.prepare(`SELECT p.*, (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image_url
    FROM products p WHERE p.slug=? AND p.status='published'`).bind(slug).first<Record<string, unknown>>();
  if (!product) return null;
  const [images, variants, reviews] = await Promise.all([
    env.DB.prepare("SELECT id,url,alt_text,sort_order FROM product_images WHERE product_id=? ORDER BY sort_order,id").bind(product.id).all(),
    env.DB.prepare("SELECT id,size,color,sku,stock,reserved_stock,price,active FROM product_variants WHERE product_id=? AND active=1 ORDER BY color,size").bind(product.id).all(),
    env.DB.prepare("SELECT rating,body,created_at FROM reviews WHERE product_id=? AND status='approved' ORDER BY created_at DESC LIMIT 20").bind(product.id).all(),
  ]);
  return { ...product, images: images.results, variants: variants.results, reviews: reviews.results };
}
