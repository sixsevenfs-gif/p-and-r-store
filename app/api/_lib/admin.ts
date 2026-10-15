import { getAdminPhoneSession } from "../../auth";
import { env } from "@/db/runtime";

export type AdminIdentity = { userId: string; email: string; role: "SUPER_ADMIN" | "ADMIN" };

/** Admin access uses only the phone numbers configured in ADMIN_PHONE_NUMBERS. */
export async function requireAdmin(request?: Request): Promise<AdminIdentity | null> {
  const session = await getAdminPhoneSession(request);
  if (!session) return null;

  // The store owner signs in through the fixed admin credentials and does not
  // depend on an optional admin_roles row being present in the database.
  if (session.phone === "+919164839374") {
    return { userId: session.userId, email: session.phone, role: "SUPER_ADMIN" };
  }

  const role = await env.DB.prepare("SELECT role,status FROM admin_roles WHERE auth_user_id=?").bind(session.userId).first<{role:string;status:string}>();
  if (role && (role.status !== "active" || !["SUPER_ADMIN", "ADMIN"].includes(role.role))) return null;
  return { userId: session.userId, email: session.phone, role: role?.role === "ADMIN" ? "ADMIN" : "SUPER_ADMIN" };
}
