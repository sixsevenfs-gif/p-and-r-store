import { env } from "@/db/runtime";
import { requireApiCustomer } from "../../_lib/account";

export async function POST(request: Request) {
  try {
    const customer = await requireApiCustomer(request);
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const { productSlug: value } = await request.json().catch(() => ({})) as { productSlug?: string };
    const productSlug = String(value || "").trim();
    const product = await env.DB.prepare("SELECT id FROM products WHERE slug=? AND status='published'").bind(productSlug).first<{ id: number }>();
    if (!product) return Response.json({ error: "This product is not available to save." }, { status: 400 });
    await env.DB.prepare("INSERT INTO wishlists(customer_id,product_slug) VALUES (?,?) ON CONFLICT (customer_id,product_slug) DO NOTHING").bind(customer.id, productSlug).run();
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Wishlist save failed", error);
    return Response.json({ error: "Could not save this piece right now. Please try again." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const customer = await requireApiCustomer(request);
    if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
    const productSlug = new URL(request.url).searchParams.get("productSlug") ?? "";
    await env.DB.prepare("DELETE FROM wishlists WHERE customer_id=? AND product_slug=?").bind(customer.id, productSlug).run();
    return Response.json({ deleted: true });
  } catch (error) {
    console.error("Wishlist removal failed", error);
    return Response.json({ error: "Could not update your wishlist right now. Please try again." }, { status: 500 });
  }
}
