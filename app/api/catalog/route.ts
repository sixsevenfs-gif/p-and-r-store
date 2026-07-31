import { env } from "cloudflare:workers";
import { products as seedProducts } from "../../product-data";

async function seedCatalog() {
  const db = env.DB;
  const count = await db.prepare("SELECT count(*) AS count FROM products").first<{ count: number }>();
  if (Number(count?.count)) return;
  for (const product of seedProducts) {
    const result = await db.prepare("INSERT INTO products (slug,name,description,price,category,color,status,sku) VALUES (?,?,?,?,?,?,?,?)")
      .bind(product.slug, product.name, product.note, product.price * 100, product.category, product.color, "published", `PR-${String(product.id).padStart(4,"0")}`).run();
    const productId = Number(result.meta.last_row_id);
    await db.batch([
      ...product.gallery.map((image, index) => db.prepare("INSERT INTO product_images (product_id,url,alt_text,sort_order) VALUES (?,?,?,?)").bind(productId, image.src, `${product.name} ${image.label}`, index)),
      ...["XS","S","M","L","XL"].map((size) => db.prepare("INSERT INTO product_variants (product_id,size,color,sku,stock,low_stock_threshold) VALUES (?,?,?,?,?,?)").bind(productId, size, product.color, `PR-${String(product.id).padStart(4,"0")}-${size}`, 20, 5)),
    ]);
  }
}

export async function GET() {
  await seedCatalog();
  const products = await env.DB.prepare(`
    SELECT p.*, coalesce(sum(v.stock),0) AS stock,
      (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS image_url
    FROM products p LEFT JOIN product_variants v ON v.product_id=p.id
    WHERE p.status='published' GROUP BY p.id ORDER BY p.created_at DESC
  `).all();
  return Response.json({ products: products.results }, { headers: { "cache-control": "public, max-age=30" } });
}
