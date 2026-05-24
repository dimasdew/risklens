import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("sb-access-token") || hasSupabaseAuthCookie(request);

  // Only redirect logged-in users away from auth pages.
  // Dashboard auth is handled client-side by AuthProvider for reliability
  // (Supabase browser auth stores session in localStorage, not cookies).
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
  matcher: ["/login", "/register", "/forgot-password", "/reset-password"]
};
