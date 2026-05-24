import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("sb-access-token") || hasSupabaseAuthCookie(request);

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/scan", request.url));
    }
  }

  return NextResponse.next();
}

function hasSupabaseAuthCookie(request: NextRequest) {
  for (const [name] of request.cookies) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) return true;
  }
  return false;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password", "/reset-password"]
};
