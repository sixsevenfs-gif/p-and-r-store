import { createSupabaseServerClient } from "../../../supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.join("/");
  if (objectKey.includes("..")) return new Response("Invalid key", { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data } = supabase.storage.from("product-images").getPublicUrl(objectKey);
  return Response.redirect(data.publicUrl, 307);
}
