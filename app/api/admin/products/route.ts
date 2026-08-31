import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type VariantInput = { id?: unknown; size?: unknown; color?: unknown; sku?: unknown; price?: unknown; stock?: unknown; lowStockThreshold?: unknown; active?: unknown };
type ImageInput = { url?: unknown; altText?: unknown; sortOrder?: unknown };
type ProductInput = Record<string, unknown> & { variants?: unknown; images?: unknown };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const paise = (value: unknown, nullable = false): number | null => { if (value === "" || value == null) return nullable ? null : NaN; const number = Math.round(Number(value) * 100); return Number.isSafeInteger(number) && number >= 0 ? number : NaN; };

function cleanProduct(raw: ProductInput) {
  const name = text(raw.name, 160), slug = text(raw.slug, 160).toLowerCase(), category = text(raw.category, 80), color = text(raw.color, 80) || "Mixed", sku = text(raw.sku, 80);
  const price = paise(raw.price), compareAtPrice = paise(raw.compareAtPrice, true), costPrice = paise(raw.costPrice, true);
  const status = text(raw.status || "draft", 20), audience = text(raw.audience || "unisex", 20), productType = text(raw.productType || "apparel", 80), taxStatus = text(raw.taxStatus || "taxable", 20);
  const variants = Array.isArray(raw.variants) ? raw.variants as VariantInput[] : [];
  const images = Array.isArray(raw.images) ? raw.images as ImageInput[] : [];
  if (!name || !slugPattern.test(slug) || !category || !sku || !Number.isFinite(price) || !["draft", "published", "archived"].includes(status) || !["men", "women", "unisex"].includes(audience)) throw new Error("Enter a title, valid slug, category, SKU, price, audience and status.");
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < Number(price))) throw new Error("Compare-at price must be greater than or equal to the selling price.");
  if (costPrice !== null && !Number.isFinite(costPrice)) throw new Error("Cost price is invalid.");
  if (!variants.length || variants.length > 100) throw new Error("Add between 1 and 100 variants.");
  const variantKeys = new Set<string>();
  const variantSkus = new Set<string>();
  const cleanVariants = variants.map((variant) => {
    const size = text(variant.size, 24), variantColor = text(variant.color, 80) || color, variantSku = text(variant.sku, 80);
    const stock = Math.floor(Number(variant.stock)), threshold = Math.floor(Number(variant.lowStockThreshold ?? 5)), variantPrice = paise(variant.price, true);
    if (!size || !variantSku || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(threshold) || threshold < 0 || (variantPrice !== null && !Number.isFinite(variantPrice))) throw new Error("Each variant needs a size, SKU and non-negative stock.");
    const key = `${size.toLowerCase()}|${variantColor.toLowerCase()}`;
    if (variantKeys.has(key)) throw new Error("Variant size and colour combinations must be unique.");
    if (variantSkus.has(variantSku.toLowerCase())) throw new Error("Variant SKUs must be unique.");
    variantKeys.add(key); variantSkus.add(variantSku.toLowerCase()); return { id: Number(variant.id) || null, size, color: variantColor, sku: variantSku, stock, threshold, price: variantPrice, active: variant.active !== false };
  });
  const cleanImages = images.map((image, index) => ({ url: text(image.url, 500), altText: text(image.altText, 180), sortOrder: Number.isInteger(Number(image.sortOrder)) ? Number(image.sortOrder) : index })).filter((image) => image.url.startsWith("/api/media/"));
  return { name, slug, category, color, sku, price, compareAtPrice, costPrice, status, audience, productType, taxStatus, description: text(raw.description, 7000), shortDescription: text(raw.shortDescription, 300), tags: Array.isArray(raw.tags) ? JSON.stringify(raw.tags.map((tag) => text(tag, 40)).filter(Boolean).slice(0, 30)) : "[]", seoTitle: text(raw.seoTitle, 160), seoDescription: text(raw.seoDescription, 320), featured: raw.featured === true, newArrival: raw.newArrival === true, variants: cleanVariants, images: cleanImages };
}
async function audit(email: string, action: string, id: number, detail: unknown) { await env.DB.prepare("INSERT INTO audit_logs(admin_email,action,resource,resource_id,detail) VALUES(?,?,?,?,?)").bind(email, action, "products", String(id), JSON.stringify(detail)).run(); }

async function ensurePublishable(id: number) {
  const product = await env.DB.prepare("SELECT id,name,slug,sku,price,category FROM products WHERE id=?").bind(id).first<Record<string, unknown>>();
  if (!product || !product.name || !product.slug || !product.sku || !product.category || Number(product.price) <= 0) throw new Error("Product cannot be published until title, slug, SKU, category and price are valid.");
  const variantCount = await env.DB.prepare("SELECT count(*) count FROM product_variants WHERE product_id=? AND active=1 AND sku<>''").bind(id).first<{ count: number }>();
  if (Number(variantCount?.count ?? 0) < 1) throw new Error("Product cannot be published until it has at least one active variant with a SKU.");
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request); if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  try {
    const product = cleanProduct(await request.json() as ProductInput);
    const duplicate = await env.DB.prepare("SELECT id FROM products WHERE slug=? OR sku=?").bind(product.slug, product.sku).first();
    if (duplicate) return Response.json({ error: "Product slug or product SKU already exists." }, { status: 409 });
    const result = await env.DB.prepare(`INSERT INTO products(slug,name,description,short_description,price,compare_at_price,cost_price,category,color,status,sku,featured,new_arrival,audience,product_type,tags,seo_title,seo_description,tax_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(product.slug, product.name, product.description, product.shortDescription, product.price, product.compareAtPrice, product.costPrice, product.category, product.color, product.status, product.sku, Number(product.featured), Number(product.newArrival), product.audience, product.productType, product.tags, product.seoTitle, product.seoDescription, product.taxStatus).run();
    const id = Number(result.meta.last_row_id); if (!id) throw new Error("Product could not be saved.");
    await env.DB.batch([...product.variants.map((variant) => env.DB.prepare("INSERT INTO product_variants(product_id,size,color,sku,stock,low_stock_threshold,price,active) VALUES(?,?,?,?,?,?,?,?)").bind(id, variant.size, variant.color, variant.sku, variant.stock, variant.threshold, variant.price, Number(variant.active))), ...product.images.map((image) => env.DB.prepare("INSERT INTO product_images(product_id,url,alt_text,sort_order) VALUES(?,?,?,?)").bind(id, image.url, image.altText, image.sortOrder))]);
    await audit(admin.email, "create", id, { slug: product.slug, variants: product.variants.length, images: product.images.length });
    return Response.json({ id, slug: product.slug }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 400 }); }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(request); if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  try {
    const body = await request.json() as ProductInput & { id?: unknown };
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("A valid product is required.");
    const existingProduct = await env.DB.prepare("SELECT id,name FROM products WHERE id=?").bind(id).first<{ id: number; name: string }>();
    if (!existingProduct) return Response.json({ error: "Product not found." }, { status: 404 });
    const product = cleanProduct(body);
    const duplicateProduct = await env.DB.prepare("SELECT id FROM products WHERE (slug=? OR sku=?) AND id<>?").bind(product.slug, product.sku, id).first();
    if (duplicateProduct) return Response.json({ error: "Product slug or product SKU already exists." }, { status: 409 });
    const skuList = product.variants.map((variant) => variant.sku);
    if (skuList.length) {
      const placeholders = skuList.map(() => "?").join(",");
      const duplicateVariant = await env.DB.prepare(`SELECT sku FROM product_variants WHERE sku IN (${placeholders}) AND product_id<>? LIMIT 1`).bind(...skuList, id).first<{ sku: string }>();
      if (duplicateVariant) return Response.json({ error: `Variant SKU ${duplicateVariant.sku} already exists on another product.` }, { status: 409 });
    }
    const currentVariants = await env.DB.prepare("SELECT id,stock FROM product_variants WHERE product_id=?").bind(id).all<{ id: number; stock: number }>();
    const currentIds = new Set(currentVariants.results.map((variant) => Number(variant.id)));
    const currentStock = new Map(currentVariants.results.map((variant) => [Number(variant.id), Number(variant.stock)]));
    const keptVariantIds = product.variants.map((variant) => variant.id).filter((variantId): variantId is number => Boolean(variantId && currentIds.has(variantId)));
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(`UPDATE products SET slug=?,name=?,description=?,short_description=?,price=?,compare_at_price=?,cost_price=?,category=?,color=?,status=?,sku=?,featured=?,new_arrival=?,audience=?,product_type=?,tags=?,seo_title=?,seo_description=?,tax_status=?,updated_at=unixepoch() WHERE id=?`).bind(product.slug, product.name, product.description, product.shortDescription, product.price, product.compareAtPrice, product.costPrice, product.category, product.color, product.status, product.sku, Number(product.featured), Number(product.newArrival), product.audience, product.productType, product.tags, product.seoTitle, product.seoDescription, product.taxStatus, id),
      env.DB.prepare("DELETE FROM product_images WHERE product_id=?").bind(id),
      ...product.images.map((image) => env.DB.prepare("INSERT INTO product_images(product_id,url,alt_text,sort_order) VALUES(?,?,?,?)").bind(id, image.url, image.altText, image.sortOrder)),
    ];
    if (keptVariantIds.length) {
      statements.push(env.DB.prepare(`UPDATE product_variants SET active=0 WHERE product_id=? AND id NOT IN (${keptVariantIds.map(() => "?").join(",")})`).bind(id, ...keptVariantIds));
    } else {
      statements.push(env.DB.prepare("UPDATE product_variants SET active=0 WHERE product_id=?").bind(id));
    }
    for (const variant of product.variants) {
      if (variant.id && currentIds.has(variant.id)) {
        statements.push(env.DB.prepare("UPDATE product_variants SET size=?,color=?,sku=?,stock=?,low_stock_threshold=?,price=?,active=? WHERE id=? AND product_id=?").bind(variant.size, variant.color, variant.sku, variant.stock, variant.threshold, variant.price, Number(variant.active), variant.id, id));
        const delta = variant.stock - Number(currentStock.get(variant.id) ?? variant.stock);
        if (delta) statements.push(env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES(?,?,?,?)").bind(variant.id, delta, "Product editor stock update", admin.email));
      } else {
        statements.push(env.DB.prepare("INSERT INTO product_variants(product_id,size,color,sku,stock,low_stock_threshold,price,active) VALUES(?,?,?,?,?,?,?,?)").bind(id, variant.size, variant.color, variant.sku, variant.stock, variant.threshold, variant.price, Number(variant.active)));
      }
    }
    await env.DB.batch(statements);
    await audit(admin.email, "update", id, { slug: product.slug, variants: product.variants.length, images: product.images.length });
    return Response.json({ id, slug: product.slug });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 }); }
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id")); if (!Number.isInteger(id) || id < 1) return Response.json({ error: "A product ID is required." }, { status: 400 });
  const product = await env.DB.prepare("SELECT * FROM products WHERE id=?").bind(id).first<Record<string, unknown>>();
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
  const [variants, images] = await Promise.all([env.DB.prepare("SELECT * FROM product_variants WHERE product_id=? ORDER BY id").bind(id).all(), env.DB.prepare("SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order,id").bind(id).all()]);
  return Response.json({ product: { ...product, variants: variants.results, images: images.results } });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request); if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  try {
    const body = await request.json() as { id?: unknown; action?: unknown; reason?: unknown; restoreStock?: unknown; confirmationName?: unknown };
    const id = Number(body.id), action = text(body.action, 40), reason = text(body.reason, 280);
    if (!Number.isInteger(id) || id < 1) throw new Error("A valid product is required.");
    const product = await env.DB.prepare("SELECT id,name,status FROM products WHERE id=?").bind(id).first<{ id:number; name:string; status:string }>();
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });
    if (["hide", "archive", "trash", "out_of_stock"].includes(action) && !reason) throw new Error("Enter an internal reason before continuing.");
    if (action === "publish") { await ensurePublishable(id); await env.DB.prepare("UPDATE products SET status='published',hidden_at=NULL,hidden_reason=NULL,hidden_by=NULL,archived_at=NULL,archived_reason=NULL,archived_by=NULL,deleted_at=NULL,updated_at=unixepoch() WHERE id=?").bind(id).run(); }
    else if (action === "hide") await env.DB.prepare("UPDATE products SET status='hidden',hidden_at=unixepoch(),hidden_reason=?,hidden_by=?,updated_at=unixepoch() WHERE id=?").bind(reason,admin.email,id).run();
    else if (action === "archive") await env.DB.prepare("UPDATE products SET status='archived',archived_at=unixepoch(),archived_reason=?,archived_by=?,updated_at=unixepoch() WHERE id=?").bind(reason,admin.email,id).run();
    else if (action === "trash") await env.DB.prepare("UPDATE products SET status='trash',deleted_at=unixepoch(),updated_at=unixepoch() WHERE id=?").bind(id).run();
    else if (action === "out_of_stock") {
      const variants = await env.DB.prepare("SELECT id,stock FROM product_variants WHERE product_id=? AND active=1").bind(id).all<{id:number;stock:number}>();
      await env.DB.batch((variants.results as {id:number;stock:number}[]).flatMap((variant) => [env.DB.prepare("UPDATE product_variants SET stock=0 WHERE id=?").bind(variant.id), env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES(?,?,?,?)").bind(variant.id,-variant.stock,reason,admin.email)]));
    } else if (action === "delete") {
      if (admin.role !== "SUPER_ADMIN") return Response.json({ error: "Only a Super Admin can permanently delete products." }, { status: 403 });
      if (text(body.confirmationName, 160) !== product.name) throw new Error("Type the exact product name to confirm deletion.");
      const references = await env.DB.prepare("SELECT (SELECT count(*) FROM order_items WHERE product_slug=(SELECT slug FROM products WHERE id=?)) + (SELECT count(*) FROM reviews WHERE product_id=?) + (SELECT count(*) FROM cart_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id=?)) value").bind(id,id,id).first<{value:number}>();
      if (Number(references?.value ?? 0) > 0) return Response.json({ error: "This product has order, review or cart references and must be archived instead." }, { status: 409 });
      await env.DB.batch([env.DB.prepare("DELETE FROM product_images WHERE product_id=?").bind(id),env.DB.prepare("DELETE FROM product_variants WHERE product_id=?").bind(id),env.DB.prepare("DELETE FROM products WHERE id=?").bind(id)]);
    } else throw new Error("Unsupported product action.");
    await audit(admin.email, action, id, { reason });
    return Response.json({ updated: true, action });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 }); }
}
