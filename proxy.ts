import { NextRequest, NextResponse } from "next/server";

const within = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

function requestOrigins(request: NextRequest) {
  const origins = new Set([request.nextUrl.origin]);
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
  const protocol = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  if (host && /^(https?|http)$/.test(protocol)) origins.add(`${protocol}://${host}`);
  return origins;
}

export function proxy(request: NextRequest) {
  // A single deployment serves the complete store unless a split mode is explicit.
  const mode = process.env.APP_MODE || "all";
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)
    && path !== "/api/payments/webhook") {
    const origin = request.headers.get("origin");
    if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && !requestOrigins(request).has(origin))) {
      return NextResponse.json({ error: "Cross-origin mutations are not allowed." }, { status: 403 });
    }
  }
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
