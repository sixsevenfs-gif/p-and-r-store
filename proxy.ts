import { NextRequest, NextResponse } from "next/server";

const within = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export function proxy(request: NextRequest) {
  // Publishing customer pages requires an explicit production mode.
  const mode = process.env.APP_MODE || (process.env.NODE_ENV === "production" ? "admin" : "all");
  const path = request.nextUrl.pathname;
  const unavailable = () => new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
  if (!["admin", "storefront", "all"].includes(mode)) return unavailable();
  if (mode === "storefront" && ["/admin", "/admin-panel", "/api/admin", "/api/auth/admin"].some(prefix => within(path, prefix))) {
    return unavailable();
  }
  if (mode === "admin") {
    if (path === "/") return NextResponse.redirect(new URL("/admin", request.url));
    const allowed = ["/admin", "/api", "/_next", "/images", "/products"].some(prefix => within(path, prefix))
      || ["/favicon.ico", "/favicon.svg", "/og.png"].includes(path);
    if (!allowed) return unavailable();
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
