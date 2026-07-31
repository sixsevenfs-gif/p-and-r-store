import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, orderItems, orders } from "../../../db/schema";
import { products } from "../../product-data";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validSizes = new Set(["XS", "S", "M", "L", "XL"]);

type IncomingItem = { productSlug?: string; quantity?: number; size?: string };

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      email?: string;
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      pinCode?: string;
      items?: IncomingItem[];
    };
    const email = payload.email?.trim().toLowerCase() ?? "";
    const firstName = payload.firstName?.trim() ?? "";
    const lastName = payload.lastName?.trim() ?? "";
    const address = payload.address?.trim() ?? "";
    const city = payload.city?.trim() ?? "";
    const pinCode = payload.pinCode?.trim() ?? "";
    const items = payload.items ?? [];

    if (!emailPattern.test(email) || !firstName || !lastName || !address || !city || !/^\d{6}$/.test(pinCode)) {
      return Response.json({ error: "Complete all delivery details with a valid email and 6-digit PIN code." }, { status: 400 });
    }

    if (!items.length || items.some((item) => !item.productSlug || !Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 10 || !validSizes.has(item.size ?? ""))) {
      return Response.json({ error: "Your bag contains an invalid item." }, { status: 400 });
    }

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const selectedItems = items.map((item) => ({ ...item, product: productsBySlug.get(item.productSlug!) }));

    if (selectedItems.some((item) => !item.product)) {
      return Response.json({ error: "One or more products are no longer available." }, { status: 400 });
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.product!.price * item.quantity!, 0);
    const db = getDb();

    await db.insert(customers).values({ email, firstName, lastName, address, city, pinCode }).onConflictDoUpdate({
      target: customers.email,
      set: { firstName, lastName, address, city, pinCode, updatedAt: new Date() },
    });

    const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).get();
    if (!customer) throw new Error("Customer record was not created.");

    const [order] = await db.insert(orders).values({ customerId: customer.id, totalAmount }).returning({ id: orders.id });
    await db.insert(orderItems).values(selectedItems.map((item) => ({
      orderId: order.id,
      productSlug: item.product!.slug,
      productName: item.product!.name,
      unitPrice: item.product!.price,
      quantity: item.quantity!,
      size: item.size!,
    })));

    return Response.json({ orderId: order.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to place your order right now." }, { status: 500 });
  }
}
