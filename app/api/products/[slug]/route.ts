import { getCatalogProduct } from "../../_lib/catalog";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getCatalogProduct(slug);
  return product ? Response.json({ product }) : Response.json({ error: "Product not found." }, { status: 404 });
}
