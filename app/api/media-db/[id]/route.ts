import { env } from "@/db/runtime";

type MediaRow = { content_type: string; data: Uint8Array | null };

/** Public product image endpoint for images securely uploaded by an admin. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
  const media = await env.DB.prepare("SELECT content_type,data FROM media_assets WHERE id=? AND trashed_at IS NULL").bind(id).first<MediaRow>();
  if (!media?.data) return new Response("Not found", { status: 404 });
  const body = media.data.buffer.slice(media.data.byteOffset, media.data.byteOffset + media.data.byteLength) as ArrayBuffer;
  return new Response(body, { headers: { "content-type": media.content_type || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}
