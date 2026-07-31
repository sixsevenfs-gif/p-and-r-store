import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { isAdmin } from "../../_lib/account";

async function authorized(request:Request) {
  const user=await getChatGPTUser();
  if(user&&isAdmin(user.email))return true;
  const expected=process.env.P_AND_R_ADMIN_API_KEY;
  const supplied=request.headers.get("x-pandr-admin-key")??request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  return Boolean(expected&&supplied===expected&&request.headers.get("x-admin-email"));
}
export async function POST(request:Request) {
  if(!(await authorized(request)))return Response.json({error:"Admin access required"},{status:403});
  const form=await request.formData(), file=form.get("file");
  if(!(file instanceof File)||!file.type.startsWith("image/")||file.size>8_000_000)return Response.json({error:"Upload a JPG, PNG, WebP or AVIF under 8 MB."},{status:400});
  const ext=file.name.split(".").pop()?.replace(/[^a-z0-9]/gi,"").toLowerCase()||"jpg";
  const key=`products/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  return Response.json({url:`/api/media/${key}`},{status:201});
}
