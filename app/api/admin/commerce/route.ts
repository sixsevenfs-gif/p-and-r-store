import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";
import { products as seedProducts } from "../../../product-data";

const allowedResources = new Set(["products","product_variants","categories","collections","orders","customers","returns","discounts","coupons","reviews","referrals","wallet_ledger","payouts","content_sections","store_settings","audit_logs","admin_roles","inventory_movements"]);
const editable: Record<string,string[]> = {
  products:["slug","name","description","price","compare_at_price","category","color","status","sku","collection_ids"],
  product_variants:["product_id","size","color","sku","stock","low_stock_threshold"],
  categories:["name","slug","status","sort_order"], collections:["name","slug","description","status","image_url"],
  customers:["first_name","last_name","phone","status"], returns:["decision_status","pickup_status","refund_status","admin_note"],
  discounts:["code","type","value","starts_at","ends_at","usage_limit","minimum_order","target_type","target_ids","status"],
  coupons:["code","type","value","minimum_order","maximum_discount","starts_at","ends_at","usage_limit","per_customer_limit","status"],
  reviews:["rating","body","status"],
  referrals:["status","fraud_reason"], wallet_ledger:["status","note"], payouts:["status","bank_reference","note"],
  content_sections:["section_key","section_type","title","subtitle","body","image_url","cta_label","cta_url","sort_order","status","published_at"],
  store_settings:["key","value"], admin_roles:["email","role","permissions","status"],
};

async function audit(email:string, action:string, resource:string, id:unknown, detail:unknown={}) {
  await env.DB.prepare("INSERT INTO audit_logs (admin_email,action,resource,resource_id,detail) VALUES (?,?,?,?,?)")
    .bind(email, action, resource, id == null ? null : String(id), JSON.stringify(detail)).run();
}
async function ensureProducts() {
  const count = await env.DB.prepare("SELECT count(*) AS count FROM products").first<{count:number}>();
  if (Number(count?.count)) return;
  for (const p of seedProducts) {
    const result = await env.DB.prepare("INSERT INTO products (slug,name,description,price,category,color,status,sku) VALUES (?,?,?,?,?,?,?,?)")
      .bind(p.slug,p.name,p.note,p.price*100,p.category,p.color,"published",`PR-${String(p.id).padStart(4,"0")}`).run();
    const id=Number(result.meta.last_row_id);
    await env.DB.batch([
      ...p.gallery.map((image,i)=>env.DB.prepare("INSERT INTO product_images(product_id,url,alt_text,sort_order) VALUES(?,?,?,?)").bind(id,image.src,`${p.name} ${image.label}`,i)),
      ...["XS","S","M","L","XL"].map(size=>env.DB.prepare("INSERT INTO product_variants(product_id,size,color,sku,stock,low_stock_threshold) VALUES(?,?,?,?,?,?)").bind(id,size,p.color,`PR-${String(p.id).padStart(4,"0")}-${size}`,20,5)),
    ]);
  }
}

export async function GET(request:Request) {
  if(!(await requireAdmin(request)))return Response.json({error:"Admin access required"},{status:403});
  const url=new URL(request.url), resource=url.searchParams.get("resource")??"products";
  if(!allowedResources.has(resource))return Response.json({error:"Unknown resource"},{status:400});
  if(resource==="products") await ensureProducts();
  const page=Math.max(1,Number(url.searchParams.get("page")||1)), limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")||20)));
  const q=(url.searchParams.get("q")||"").slice(0,100), offset=(page-1)*limit;
  const searchColumns:Record<string,string>= {products:"name",orders:"id",customers:"email",discounts:"code",coupons:"code",reviews:"body",collections:"name",categories:"name",content_sections:"title",returns:"reason",referrals:"status",wallet_ledger:"note",payouts:"status",audit_logs:"action",admin_roles:"email",product_variants:"sku",inventory_movements:"reason",store_settings:"key"};
  const col=searchColumns[resource]||"id", where=q?` WHERE CAST(${col} AS TEXT) LIKE ?`:"";
  const params=q?[`%${q}%`,limit,offset]:[limit,offset];
  const [rows,total]=await Promise.all([
    env.DB.prepare(`SELECT * FROM ${resource}${where} ORDER BY ${resource==="store_settings"?"key":"rowid"} DESC LIMIT ? OFFSET ?`).bind(...params).all(),
    env.DB.prepare(`SELECT count(*) count FROM ${resource}${where}`).bind(...(q?[`%${q}%`]:[])).first<{count:number}>(),
  ]);
  if(resource==="products"){
    for(const row of rows.results as Record<string,unknown>[]){
      row.images=(await env.DB.prepare("SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order").bind(row.id).all()).results;
      const origin=new URL(request.url).origin;
      row.images=(row.images as Record<string,unknown>[]).map(image=>({...image,url:String(image.url).startsWith("http")?image.url:`${origin}${image.url}`}));
      row.variants=(await env.DB.prepare("SELECT * FROM product_variants WHERE product_id=? ORDER BY size").bind(row.id).all()).results;
    }
  }
  return Response.json({data:rows.results,total:Number(total?.count||0),page,limit});
}

export async function POST(request:Request) {
  const admin=await requireAdmin(request); if(!admin)return Response.json({error:"Admin access required"},{status:403}); const email=admin.email;
  const body=await request.json() as Record<string,unknown>; const resource=String(body.resource||"");
  if(!editable[resource])return Response.json({error:"Resource is not writable"},{status:400});
  const data=(body.data||{}) as Record<string,unknown>, keys=editable[resource].filter(k=>data[k]!==undefined);
  if(!keys.length)return Response.json({error:"No valid fields"},{status:400});
  const values=keys.map(k=>typeof data[k]==="object"?JSON.stringify(data[k]):data[k]);
  const result=await env.DB.prepare(`INSERT INTO ${resource} (${keys.join(",")}) VALUES (${keys.map(()=>"?").join(",")})`).bind(...values).run();
  await audit(email,"create",resource,result.meta.last_row_id,data);
  return Response.json({id:result.meta.last_row_id},{status:201});
}

export async function PATCH(request:Request) {
  const admin=await requireAdmin(request); if(!admin)return Response.json({error:"Admin access required"},{status:403}); const email=admin.email;
  const body=await request.json() as Record<string,unknown>; const resource=String(body.resource||""), id=body.id;
  if(!editable[resource]||id==null)return Response.json({error:"Invalid update"},{status:400});
  const data=(body.data||{}) as Record<string,unknown>, keys=editable[resource].filter(k=>data[k]!==undefined);
  if(!keys.length)return Response.json({error:"No valid fields"},{status:400});
  if (resource === "orders" && data.status !== undefined) {
    const status = String(data.status).toLowerCase();
    const allowed = new Set(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "return_requested", "returned"]);
    if (!allowed.has(status)) return Response.json({ error: "Invalid order status." }, { status: 400 });
    const order = await env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(id).first<{ status:string }>();
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    const restoreStock = ["cancelled", "returned"].includes(status) && !["cancelled", "returned"].includes(order.status);
    const restoreRows = restoreStock ? await env.DB.prepare("SELECT variant_id,quantity FROM order_items WHERE order_id=? AND variant_id IS NOT NULL").bind(id).all<{ variant_id:number; quantity:number }>() : { results: [] as { variant_id:number; quantity:number }[] };
    await env.DB.batch([
      env.DB.prepare("UPDATE orders SET status=? WHERE id=?").bind(status, id),
      env.DB.prepare("INSERT INTO order_status_history(order_id,status,note,actor_email) VALUES (?,?,?,?)").bind(id, status.toUpperCase(), "Updated by admin", email),
      ...(restoreRows.results as { variant_id:number; quantity:number }[]).flatMap((item) => [
        env.DB.prepare("UPDATE product_variants SET stock=stock+? WHERE id=?").bind(item.quantity, item.variant_id),
        env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES (?,?,?,?)").bind(item.variant_id, item.quantity, `Order #${id} ${status} restoration`, email),
      ]),
    ]);
    await audit(email, "order_status", resource, id, { status, stockRestored: restoreStock });
    return Response.json({ updated: true });
  }
  if (resource === "product_variants" && data.stock !== undefined) {
    const stock = Math.max(0, Math.floor(Number(data.stock)));
    if (!Number.isFinite(stock)) return Response.json({ error: "Invalid stock quantity." }, { status: 400 });
    const variant = await env.DB.prepare("SELECT v.stock,v.product_id,p.is_unique_find,p.lifetime_production_cap FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=?").bind(id).first<{ stock:number;product_id:number;is_unique_find:number;lifetime_production_cap:number|null }>();
    if (!variant) return Response.json({ error: "Variant not found." }, { status: 404 });
    if (variant.is_unique_find) {
      const other=await env.DB.prepare("SELECT coalesce(sum(stock),0) AS stock FROM product_variants WHERE product_id=? AND id<>? AND active=1").bind(variant.product_id,id).first<{stock:number}>();
      if(stock+Number(other?.stock??0)>Number(variant.lifetime_production_cap)) return Response.json({error:`Unique Find inventory cannot exceed its permanent cap of ${variant.lifetime_production_cap}.`},{status:409});
    }
    await env.DB.batch([
      env.DB.prepare("UPDATE product_variants SET stock=? WHERE id=?").bind(stock, id),
      env.DB.prepare("INSERT INTO inventory_movements(variant_id,delta,reason,admin_email) VALUES (?,?,?,?)").bind(id, stock - variant.stock, "Admin stock adjustment", email),
    ]);
    await audit(email, "inventory_adjustment", resource, id, { from: variant.stock, to: stock });
    return Response.json({ updated: true });
  }
  const key=resource==="store_settings"?"key":resource==="admin_roles"?"email":"id";
  await env.DB.prepare(`UPDATE ${resource} SET ${keys.map(k=>`${k}=?`).join(",")} WHERE ${key}=?`).bind(...keys.map(k=>typeof data[k]==="object"?JSON.stringify(data[k]):data[k]),id).run();
  await audit(email,"update",resource,id,data); return Response.json({updated:true});
}

export async function DELETE(request:Request) {
  const admin=await requireAdmin(request); if(!admin)return Response.json({error:"Admin access required"},{status:403}); const email=admin.email;
  const body=await request.json() as {resource?:string,id?:unknown};
  if(!editable[body.resource||""]||body.id==null)return Response.json({error:"Invalid deletion"},{status:400});
  if (body.resource === "admin_roles") {
    const target = await env.DB.prepare("SELECT role,status FROM admin_roles WHERE email=?").bind(body.id).first<{ role:string; status:string }>();
    if (target?.role === "SUPER_ADMIN" && target.status === "active") {
      const count = await env.DB.prepare("SELECT count(*) count FROM admin_roles WHERE role='SUPER_ADMIN' AND status='active'").first<{ count:number }>();
      if (Number(count?.count ?? 0) <= 1) return Response.json({ error: "The last active Super Admin cannot be removed." }, { status: 409 });
    }
  }
  const key=body.resource==="store_settings"?"key":body.resource==="admin_roles"?"email":"id";
  await env.DB.prepare(`DELETE FROM ${body.resource} WHERE ${key}=?`).bind(body.id).run();
  await audit(email,"delete",body.resource!,body.id); return Response.json({deleted:true});
}
