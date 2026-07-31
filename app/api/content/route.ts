import { env } from "cloudflare:workers";

export async function GET() {
  const rows = await env.DB.prepare("SELECT * FROM content_sections WHERE status='published' ORDER BY sort_order").all();
  return Response.json({ sections: rows.results }, { headers: { "cache-control": "public, max-age=30" } });
}
