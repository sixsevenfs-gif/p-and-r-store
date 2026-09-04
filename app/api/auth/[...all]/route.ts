import { clearAuthCookies } from "../../../auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ all: string[] }> }) {
  const action = (await params).all.join("/");
  if (action !== "sign-out") return Response.json({ message: "Unknown authentication action." }, { status: 404 });
  const response = Response.json({ ok: true });
  clearAuthCookies().forEach((value) => response.headers.append("Set-Cookie", value));
  return response;
}
