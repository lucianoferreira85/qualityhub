import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/api/auth"];
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/images", "/fonts"];

function isPublicPath(pathname: string): boolean {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const { response, user } = await createMiddlewareClient(request);

  if (!user) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
