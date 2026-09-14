import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** admin.tiptop.ca (ou tout hôte admin.*) sert le Command Center. */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isAdminHost = host.startsWith("admin.");
  if (!isAdminHost) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
