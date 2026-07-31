import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { isAdmin } from "../../_lib/account";
import { products as seedProducts } from "../../../product-data";

const allowedResources = new Set(["products","product_variants","categories","collections","orders","customers","returns","discounts","referrals","wallet_ledger","payouts","content_sections","store_settings","audit_logs","admin_roles","inventory_movements"]);
const editable: Record<string,string[]> = {
  products:["slug","name","description","price","compare_at_price","category","color","status","sku","collection_ids"],
  product_variants:["product_id","size","color","sku","stock","low_stock_threshold"],
  categories:["name","slug","status","sort_order"], collections:["name","slug","description","status","image_url"],
  orders:["status","payment_status","shipping_status","tracking_id","internal_status","payment_reference"],
  customers:["first_name","last_name","phone","status"], returns:["decision_status","pickup_status","refund_status","admin_note"],
  discounts:["code","type","value","starts_at","ends_at","usage_limit","minimum_order","target_type","target_ids","status"],
  referrals:["status","fraud_reason"], wallet_ledger:["status","note"], payouts:["status","bank_reference","note"],
  content_sections:["section_key","section_type","title","subtitle","body","image_url","cta_label","cta_url","sort_order","status","published_at"],
  store_settings:["key","value"], admin_roles:["email","role","permissions","status"],
};

async function requireAdmin(request: Request) {
  const user = await getChatGPTUser();
  if (user && isAdmin(user.email)) return user.email;
  const expected = process.env.P_AND_R_ADMIN_API_KEY;
  const supplied = request.headers.get("x-pandr-admin-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const email = request.headers.get("x-admin-email");
  return expected && supplied === expected && email ? email : null;
}
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
  const email=await requireAdmin(request); if(!email)return Response.json({error:"Admin access required"},{status:403});
  const url=new URL(request.url), resource=url.searchParams.get("resource")??"products";
  if(!allowedResources.has(resource))return Response.json({error:"Unknown resource"},{status:400});
  if(resource==="products") await ensureProducts();
  const page=Math.max(1,Number(url.searchParams.get("page")||1)), limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")||20)));
  const q=(url.searchParams.get("q")||"").slice(0,100), offset=(page-1)*limit;
  const searchColumns:Record<string,string>= {products:"name",orders:"id",customers:"email",discounts:"code",collections:"name",categories:"name",content_sections:"title",returns:"reason",referrals:"status",wallet_ledger:"note",payouts:"status",audit_logs:"action",admin_roles:"email",product_variants:"sku",inventory_movements:"reason",store_settings:"key"};
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
  const email=await requireAdmin(request); if(!email)return Response.json({error:"Admin access required"},{status:403});
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
  const email=await requireAdmin(request); if(!email)return Response.json({error:"Admin access required"},{status:403});
  const body=await request.json() as Record<string,unknown>; const resource=String(body.resource||""), id=body.id;
  if(!editable[resource]||id==null)return Response.json({error:"Invalid update"},{status:400});
  const data=(body.data||{}) as Record<string,unknown>, keys=editable[resource].filter(k=>data[k]!==undefined);
  if(!keys.length)return Response.json({error:"No valid fields"},{status:400});
  const key=resource==="store_settings"?"key":resource==="admin_roles"?"email":"id";
  await env.DB.prepare(`UPDATE ${resource} SET ${keys.map(k=>`${k}=?`).join(",")} WHERE ${key}=?`).bind(...keys.map(k=>typeof data[k]==="object"?JSON.stringify(data[k]):data[k]),id).run();
  await audit(email,"update",resource,id,data); return Response.json({updated:true});
}

export async function DELETE(request:Request) {
  const email=await requireAdmin(request); if(!email)return Response.json({error:"Admin access required"},{status:403});
  const body=await request.json() as {resource?:string,id?:unknown};
  if(!editable[body.resource||""]||body.id==null)return Response.json({error:"Invalid deletion"},{status:400});
  const key=body.resource==="store_settings"?"key":body.resource==="admin_roles"?"email":"id";
  await env.DB.prepare(`DELETE FROM ${body.resource} WHERE ${key}=?`).bind(body.id).run();
  await audit(email,"delete",body.resource!,body.id); return Response.json({deleted:true});
}
