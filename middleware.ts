import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes (no authentication required)
  const publicRoutes = ["/", "/register", "/verify-email"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes (authentication required)
  const protectedRoutes = ["/welcome", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // API routes - let them handle their own authentication
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // If accessing protected route and not authenticated
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing public route and already authenticated
  if (isPublicRoute && token && pathname === "/") {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
