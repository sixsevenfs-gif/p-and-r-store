import { getAdminPhoneSession } from "../../auth";

export type AdminIdentity = { userId: string; email: string; role: "SUPER_ADMIN" | "ADMIN" };

/** Admin access uses only the phone numbers configured in ADMIN_PHONE_NUMBERS. */
export async function requireAdmin(request?: Request): Promise<AdminIdentity | null> {
  const session = await getAdminPhoneSession(request);
  return session ? { userId: `admin:${session.phone}`, email: session.phone, role: "SUPER_ADMIN" } : null;
}
