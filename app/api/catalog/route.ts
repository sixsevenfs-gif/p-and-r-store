import { getCatalogProduct, listCatalog } from "../_lib/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (slug) {
    const product = await getCatalogProduct(slug);
    return product ? Response.json({ product }, { headers: { "cache-control": "public, max-age=30" } }) : Response.json({ error: "Product not found." }, { status: 404 });
  }
  const result = await listCatalog({
    query: url.searchParams.get("q"), category: url.searchParams.get("category"), color: url.searchParams.get("color"),
    size: url.searchParams.get("size"), available: url.searchParams.get("available") === "true", sort: url.searchParams.get("sort"),
    limit: Number(url.searchParams.get("limit") ?? 24), offset: Number(url.searchParams.get("offset") ?? 0),
  });
  return Response.json(result, { headers: { "cache-control": "public, max-age=30" } });
}
