import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

// Define public routes that don't require authentication
const publicRoutes = [
  "/", // Landing page
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/callback",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/csrf",
];

// Define admin-only routes
const adminRoutes = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (session.user.role !== "ADMIN") {
      // Redirect non-admin users to their dashboard
      const redirectUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  if (session.user.role === "ADMIN" && pathname === "/dashboard") {
    const redirectUrl = new URL("/admin", req.url);
    return NextResponse.redirect(redirectUrl);
  }
  if (session.user && pathname === "/") {
    const redirectUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next();
});

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
