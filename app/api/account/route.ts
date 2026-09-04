import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { addresses, customers, orderItems, orders, walletLedger, wishlists } from "../../../db/schema";
import { products } from "../../product-data";
import { attachReferral, requireApiCustomer } from "../_lib/account";

export async function GET(request: Request) {
  try {
    const customer = await requireApiCustomer(request);
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const db = getDb();
    const [savedAddresses, customerOrders, ledger, savedWishlist] = await Promise.all([
      db.select().from(addresses).where(eq(addresses.customerId, customer.id)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt)),
      db.select().from(orders).where(eq(orders.customerId, customer.id)).orderBy(desc(orders.createdAt)),
      db.select().from(walletLedger).where(eq(walletLedger.customerId, customer.id)).orderBy(desc(walletLedger.createdAt)),
      db.select().from(wishlists).where(eq(wishlists.customerId, customer.id)).orderBy(desc(wishlists.createdAt)),
    ]);
    const items = customerOrders.length
      ? await db.select().from(orderItems).where(
          // D1 accepts this compact IN predicate through Drizzle's SQL builder.
          (await import("drizzle-orm")).inArray(orderItems.orderId, customerOrders.map((order) => order.id)),
        )
      : [];
    const pending = ledger.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
    const approved = ledger.filter((entry) => entry.status === "available" || entry.status === "used").reduce((sum, entry) => sum + entry.amount, 0);
    const used = Math.abs(ledger.filter((entry) => entry.type === "debit" && entry.status === "used").reduce((sum, entry) => sum + entry.amount, 0));
    const origin = new URL(request.url).origin;
    return Response.json({
      customer: { id: customer.id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone, referralCode: customer.referralCode },
      referralLink: `${origin}/?ref=${encodeURIComponent(customer.referralCode)}`,
      wallet: { pending, approved: Math.max(0, approved), used, ledger },
      addresses: savedAddresses,
      // Monetary values are stored as paise in the database. The customer UI
      // works in rupees, so convert once at this API boundary.
      orders: customerOrders.map((order) => ({
        ...order,
        totalAmount: Math.round(order.totalAmount / 100),
        walletAmount: Math.round(order.walletAmount / 100),
        items: items.filter((item) => item.orderId === order.id),
      })),
      wishlist: savedWishlist.map((entry) => ({ ...entry, product: products.find((product) => product.slug === entry.productSlug) ?? null })),
    });
  } catch {
    return Response.json({ error: "Unable to load your account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await requireApiCustomer();
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const payload = await request.json() as { firstName?: string; lastName?: string; phone?: string; referralCode?: string };
    const firstName = payload.firstName?.trim().slice(0, 60) || customer.firstName;
    const lastName = payload.lastName?.trim().slice(0, 60) || customer.lastName;
    const phone = payload.phone?.trim().replace(/[^\d+ -]/g, "").slice(0, 20) ?? customer.phone;
    await getDb().update(customers).set({ firstName, lastName, phone, updatedAt: new Date() }).where(eq(customers.id, customer.id));
    await attachReferral(customer.id, payload.referralCode);
    return Response.json({ updated: true });
  } catch {
    return Response.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
