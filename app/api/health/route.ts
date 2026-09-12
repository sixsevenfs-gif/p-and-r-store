import { env } from "@/db/runtime";

export async function GET() {
  try {
    await env.DB.prepare("SELECT 1 AS ready").first();
    return Response.json({ status: "ok", database: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
