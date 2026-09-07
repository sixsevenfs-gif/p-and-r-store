import { readFileSync } from "node:fs";
import postgres from "postgres";

// Explicit content-only update; default mode previews without writing.
const apply = process.argv.includes("--apply");
const copy = JSON.parse(readFileSync(new URL("../app/product-copy.json", import.meta.url), "utf8"));
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = postgres(process.env.DATABASE_URL, { prepare:false, ssl:"require", max:1 });
try {
  const rows = await sql`SELECT * FROM products WHERE slug IN ${sql(Object.keys(copy))} ORDER BY id`;
  console.log(`Matched ${rows.length} products; mode: ${apply ? "apply" : "preview"}`);
  if (rows.length !== Object.keys(copy).length) throw new Error("Catalog does not match all 21 reviewed designs; no changes applied.");
  if (apply) await sql.begin(async tx => {
    for (const row of rows) {
      const meta = JSON.parse(readFileSync(new URL(`../public/products/${row.slug}/metadata.json`, import.meta.url), "utf8"));
      if (row.description === meta.note && row.short_description === copy[row.slug]) continue;
      const variants = await tx`SELECT * FROM product_variants WHERE product_id=${row.id} ORDER BY id`;
      const images = await tx`SELECT * FROM product_images WHERE product_id=${row.id} ORDER BY sort_order,id`;
      const snapshot = {
        id:row.id, name:row.name, slug:row.slug, description:row.description, shortDescription:row.short_description,
        category:row.category, audience:row.audience, productType:row.product_type, taxStatus:row.tax_status,
        color:row.color, sku:row.sku, price:Number(row.price)/100,
        compareAtPrice:row.compare_at_price==null?"":Number(row.compare_at_price)/100,
        costPrice:row.cost_price==null?"":Number(row.cost_price)/100,
        status:row.status, featured:Boolean(Number(row.featured)), newArrival:Boolean(Number(row.new_arrival)),
        seoTitle:row.seo_title, seoDescription:row.seo_description, tags:typeof row.tags==="string"?JSON.parse(row.tags||"[]"):row.tags||[],
        editionNumber:row.edition_number, isUniqueFind:Boolean(Number(row.is_unique_find)),
        lifetimeProductionCap:row.lifetime_production_cap, uniqueFindStatus:row.unique_find_status,
        archiveNote:row.archive_note, keepVisibleAfterSellout:Boolean(Number(row.keep_visible_after_sellout)),
        uniqueReleaseAt:row.unique_release_at?new Date(Number(row.unique_release_at)*1000).toISOString():"",
        variants:variants.map(v=>({id:v.id,size:v.size,color:v.color,sku:v.sku,price:v.price==null?"":Number(v.price)/100,stock:v.stock,lowStockThreshold:v.low_stock_threshold,active:Boolean(Number(v.active))})),
        images:images.map(i=>({url:i.url,altText:i.alt_text,sortOrder:i.sort_order})),
      };
      await tx`INSERT INTO product_revisions(product_id,snapshot,admin_email) VALUES(${row.id},${JSON.stringify(snapshot)},'catalog-copy-update')`;
      await tx`UPDATE products SET description=${meta.note},short_description=${copy[row.slug]},updated_at=extract(epoch from now())::bigint WHERE id=${row.id}`;
      console.log(`Updated ${row.slug}`);
    }
  });
} finally { await sql.end(); }
