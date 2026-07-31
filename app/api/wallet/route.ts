import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { walletLedger } from "../../../db/schema";
import { requireApiCustomer } from "../_lib/account";

export async function GET() {
  try {
    const customer = await requireApiCustomer();
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const ledger = await getDb().select().from(walletLedger).where(eq(walletLedger.customerId, customer.id)).orderBy(desc(walletLedger.createdAt));
    const pending = ledger.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
    const available = ledger.filter((entry) => entry.status === "available" || entry.status === "used").reduce((sum, entry) => sum + entry.amount, 0);
    const used = Math.abs(ledger.filter((entry) => entry.type === "debit" && entry.status === "used").reduce((sum, entry) => sum + entry.amount, 0));
    return Response.json({ available: Math.max(0, available), pending, used, recentTransactions: ledger.slice(0, 5) });
  } catch {
    return Response.json({ error: "Unable to load wallet." }, { status: 500 });
  }
}
