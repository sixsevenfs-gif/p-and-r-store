import { env } from "@/db/runtime";
import { requireAdmin } from "../../_lib/admin";

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const like = `%${query.slice(0, 120)}%`;
  const rows = await env.DB.prepare(`SELECT id,email,first_source,last_source,first_seen_at,last_seen_at
    FROM email_contacts WHERE email LIKE ? ORDER BY last_seen_at DESC LIMIT 500`).bind(like).all<Row>();
  return Response.json({ emails: rows.results });
}
