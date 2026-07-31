import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { wishlists } from "../../../../db/schema";
import { products } from "../../../product-data";
import { requireApiCustomer } from "../../_lib/account";

export async function POST(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { productSlug } = await request.json() as { productSlug?: string };
  if (!products.some((product) => product.slug === productSlug)) return Response.json({ error: "Invalid product." }, { status: 400 });
  await getDb().insert(wishlists).values({ customerId: customer.id, productSlug: productSlug! }).onConflictDoNothing();
  return Response.json({ saved: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const customer = await requireApiCustomer();
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const productSlug = new URL(request.url).searchParams.get("productSlug") ?? "";
  await getDb().delete(wishlists).where(and(eq(wishlists.customerId, customer.id), eq(wishlists.productSlug, productSlug)));
  return Response.json({ deleted: true });
}
