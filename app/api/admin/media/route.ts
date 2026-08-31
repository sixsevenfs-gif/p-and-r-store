import { requireAdmin } from "../../_lib/admin";
import { createSupabaseServerClient } from "../../../supabase/server";

const BUCKET = "product-images";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required" }, { status: 403 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").slice(0, 100);
  const filter = url.searchParams.get("filter") || "all";
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(100);
  query = filter === "trash" ? query.not("trashed_at", "is", null) : query.is("trashed_at", null);
  if (q) query = query.or(`filename.ilike.%${q.replaceAll(",", "")}%,display_name.ilike.%${q.replaceAll(",", "")}%,alt_text.ilike.%${q.replaceAll(",", "")}%`);
  const { data, error } = await query;
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ data: data?.map((row) => ({ ...row, usage_count: 0 })) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 8_000_000) {
    return Response.json({ error: "Upload a JPG, PNG, WebP or AVIF under 8 MB." }, { status: 400 });
  }
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const key = `products/${crypto.randomUUID()}.${ext}`;
  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(key, file, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 400 });
  const { error: recordError } = await supabase.from("media_assets").insert({
    object_key: key,
    filename: file.name.slice(0, 200),
    content_type: file.type,
    size_bytes: file.size,
    display_name: file.name.slice(0, 200),
    uploaded_by: admin.userId,
  });
  if (recordError) {
    await supabase.storage.from(BUCKET).remove([key]);
    return Response.json({ error: recordError.message }, { status: 400 });
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return Response.json({ url: data.publicUrl }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json() as { id?: unknown; action?: unknown; altText?: unknown; displayName?: unknown; category?: unknown };
  const id = Number(body.id);
  const action = String(body.action || "");
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid media item." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const changes = action === "trash" ? { trashed_at: new Date().toISOString() }
    : action === "restore" ? { trashed_at: null }
    : action === "metadata" ? { alt_text: String(body.altText || "").slice(0, 180), display_name: String(body.displayName || "").slice(0, 200), category: String(body.category || "product").slice(0, 50) }
    : null;
  if (!changes) return Response.json({ error: "Unsupported media action." }, { status: 400 });
  const { error } = await supabase.from("media_assets").update(changes).eq("id", id);
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ updated: true });
}
