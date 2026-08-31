import { redirect } from "next/navigation";
import { requireAdmin } from "../../api/_lib/admin";
import AdminConsole from "../admin-console";
import { getAuthSession } from "../../auth";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const session = await getAuthSession();
  const admin = await requireAdmin();
  if (!admin) {
    redirect(session?.user ? "/admin/login?error=forbidden" : "/admin/login");
  }
  const { section = ["dashboard"] } = await params;
  return <AdminConsole email={admin.email} role={admin.role} name={session?.user?.name} section={section.join("/")} />;
}
