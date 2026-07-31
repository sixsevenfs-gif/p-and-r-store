import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { addresses } from "../../../../db/schema";
import { requireApiCustomer } from "../../_lib/account";

const pinPattern = /^\d{6}$/;

export async function POST(request: Request) {
  try {
    const customer = await requireApiCustomer();
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const payload = await request.json() as Record<string, unknown>;
    const value = (key: string, max = 100) => String(payload[key] ?? "").trim().slice(0, max);
    const record = {
      customerId: customer.id,
      label: value("label", 30) || "Home",
      firstName: value("firstName", 60),
      lastName: value("lastName", 60),
      phone: value("phone", 20),
      line1: value("line1", 160),
      line2: value("line2", 160),
      city: value("city", 80),
      state: value("state", 80),
      pinCode: value("pinCode", 6),
      isDefault: Boolean(payload.isDefault),
    };
    if (!record.firstName || !record.lastName || !record.phone || !record.line1 || !record.city || !record.state || !pinPattern.test(record.pinCode)) {
      return Response.json({ error: "Complete all required address fields." }, { status: 400 });
    }
    const db = getDb();
    if (record.isDefault) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customer.id));
    const [created] = await db.insert(addresses).values(record).returning();
    return Response.json(created, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save this address." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid address." }, { status: 400 });
  await getDb().delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, customer.id)));
  return Response.json({ deleted: true });
}
