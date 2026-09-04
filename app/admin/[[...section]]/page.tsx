import { redirect } from "next/navigation";
import { requireAdmin } from "../../api/_lib/admin";
import AdminConsole from "../admin-console";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const { section = ["dashboard"] } = await params;
  return <AdminConsole email={admin.email} role={admin.role} name="Store admin" section={section.join("/")} />;
}
