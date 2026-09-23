import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const apply = process.argv.includes("--apply");
const productSlugs = [
  "a-diva-has-distractions-baby-tee",
  "i-heart-hot-moms-baby-tee",
  "dont-bother-me-baby-tee",
  "three-kisses-baby-tee",
  "good-grammar-is-sexy-tee",
];

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const root = process.cwd();
const products = productSlugs.map((slug) => {
  const metadata = JSON.parse(
    readFileSync(join(root, "public", "products", slug, "metadata.json"), "utf8"),
  );
  return {
    ...metadata,
    slug,
    sku: `PR-${String(metadata.id).padStart(4, "0")}`,
    images: metadata.images.map((image, sortOrder) => ({
      url: `/products/${slug}/${image.file}`,
      altText: `${metadata.name} ${image.label}`,
      sortOrder,
    })),
  };
});

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: "require",
  max: 1,
});

try {
  const existing = await sql`
    SELECT slug, sku, edition_number
    FROM products
    WHERE slug IN ${sql(productSlugs)}
       OR sku IN ${sql(products.map((product) => product.sku))}
       OR edition_number IN ${sql(products.map((product) => product.editionNumber))}
  `;
  const conflicts = existing.filter(
    (row) => !products.some((product) => product.slug === row.slug),
  );
  if (conflicts.length) {
    throw new Error(`Existing SKU or edition conflict: ${JSON.stringify(conflicts)}`);
  }

  console.log(`${products.length} products checked; mode: ${apply ? "apply" : "preview"}`);
  for (const product of products) {
    console.log(`${product.slug} · ₹${product.price} · edition ${product.editionNumber}`);
  }
  if (!apply) process.exitCode = 0;
  else {
    await sql.begin(async (tx) => {
      for (const product of products) {
        const existingProduct = await tx`
          SELECT id FROM products WHERE slug=${product.slug} LIMIT 1
        `;
        if (existingProduct.length) {
          console.log(`Skipped existing ${product.slug}`);
          continue;
        }
        const [created] = await tx`
          INSERT INTO products
            (slug, name, description, short_description, price, category, color, status, sku,
             featured, new_arrival, audience, product_type, tags, seo_title, seo_description,
             tax_status, edition_number)
          VALUES
            (${product.slug}, ${product.name}, ${product.note}, ${product.note.slice(0, 180)},
             ${product.price * 100}, ${product.category}, ${product.color}, 'published', ${product.sku},
             1, 1, 'women', 'baby-tee', ${JSON.stringify(["women", "new-drop", "baby-tee"])},
             ${product.name}, ${product.note.slice(0, 320)}, 'taxable', ${product.editionNumber})
          RETURNING id
        `;
        const productId = created.id;
        for (const image of product.images) {
          await tx`
            INSERT INTO product_images(product_id, url, alt_text, sort_order)
            VALUES (${productId}, ${image.url}, ${image.altText}, ${image.sortOrder})
          `;
        }
        for (const size of ["XS", "S", "M", "L", "XL"]) {
          await tx`
            INSERT INTO product_variants(product_id, size, color, sku, stock, low_stock_threshold, active)
            VALUES (${productId}, ${size}, ${product.color}, ${`${product.sku}-${size}`}, 20, 5, 1)
          `;
        }
        console.log(`Imported ${product.slug}`);
      }
    });
  }
} finally {
  await sql.end();
}
