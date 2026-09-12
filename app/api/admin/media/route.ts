import { requireAdmin } from "../../_lib/admin";
import { createSupabaseServerClient } from "../../../supabase/server";
import { env } from "@/db/runtime";
import { imageMime } from "@/app/image-signature";

const BUCKET = "product-images";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required" }, { status: 403 });
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").slice(0, 100).toLowerCase();
    const filter = url.searchParams.get("filter") || "all";
    const where = [filter === "trash" ? "trashed_at IS NOT NULL" : "trashed_at IS NULL"];
    const params: unknown[] = [];
    if (q) { where.push("(lower(filename) LIKE ? OR lower(display_name) LIKE ? OR lower(alt_text) LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    const rows = await env.DB.prepare(`SELECT id,object_key,filename,content_type,size_bytes,alt_text,display_name,category,uploaded_by,trashed_at,created_at,data IS NOT NULL AS stored_in_database FROM media_assets WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 100`).bind(...params).all<Record<string, unknown>>();
    const supabase = await createSupabaseServerClient();
    const data = rows.results.map((row) => {
      const storedLocally = Boolean(row.stored_in_database);
      const publicUrl = storedLocally ? `/api/media-db/${row.id}` : supabase.storage.from(BUCKET).getPublicUrl(String(row.object_key)).data.publicUrl;
      return { ...row, url: publicUrl, usage_count: 0 };
    });
    return Response.json({ data });
  } catch (error) {
    console.error("Admin media load failed", error);
    return Response.json({ error: "Unable to load media. Please retry." }, { status: 500 });
  }
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
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length || imageMime(bytes) !== file.type) return Response.json({ error: "The file contents do not match a supported image." }, { status: 400 });
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type];
  const key = `database/${crypto.randomUUID()}.${ext}`;
  try {
    const result = await env.DB.prepare(`INSERT INTO media_assets(object_key,filename,content_type,size_bytes,display_name,uploaded_by,data)
      VALUES (?,?,?,?,?,?,?)`).bind(
      key,
      file.name.slice(0, 200),
      file.type,
      file.size,
      file.name.slice(0, 200),
      admin.userId,
      bytes,
    ).run();
    return Response.json({ url: `/api/media-db/${result.meta.last_row_id}` }, { status: 201 });
  } catch (error) {
    console.error("Admin media upload failed", error);
    return Response.json({ error: "Unable to save this image. Please retry." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await request.json() as { id?: unknown; action?: unknown; altText?: unknown; displayName?: unknown; category?: unknown };
  const id = Number(body.id);
  const action = String(body.action || "");
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid media item." }, { status: 400 });
  const changes = action === "trash" ? { trashed_at: new Date().toISOString() }
    : action === "restore" ? { trashed_at: null }
    : action === "metadata" ? { alt_text: String(body.altText || "").slice(0, 180), display_name: String(body.displayName || "").slice(0, 200), category: String(body.category || "product").slice(0, 50) }
    : null;
  if (!changes) return Response.json({ error: "Unsupported media action." }, { status: 400 });
  await env.DB.prepare(`UPDATE media_assets SET ${Object.keys(changes).map((key) => `${key}=?`).join(",")} WHERE id=?`).bind(...Object.values(changes), id).run();
  return Response.json({ updated: true });
}
