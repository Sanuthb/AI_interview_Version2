import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/api/auth"];

  // Protected routes that require authentication
  const protectedRoutes = ["/candidate", "/admin", "/interview"];

  // Check if the path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get the token from the request
  const token = (await getToken({ req: request })) as string | null;

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // If trying to access auth routes while logged in, redirect to appropriate dashboard
  if (
    (pathname.startsWith("/login") || 
     pathname.startsWith("/signup") || 
     pathname.startsWith("/admin-login")) &&
    token
  ) {
    // Decode token to get user role
    try {
      // Split token and decode the payload
      if (token && typeof token === "string") {
        const tokenParts = token.split(".");
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userRole = payload.role;

          // Redirect based on user role
          const dashboardUrl =
            userRole === "admin" || userRole === "super_admin" 
              ? "/admin" 
              : "/candidate/dashboard";
          const url = new URL(dashboardUrl, request.url);
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      // If token decoding fails, redirect to candidate dashboard by default
      const url = new URL("/candidate/dashboard", request.url);
      return NextResponse.redirect(url);
    }
  }

  // If authenticated user tries to access home page, redirect to appropriate dashboard
  if (pathname === "/" && token) {
    try {
      // Split token and decode the payload
      if (token && typeof token === "string") {
        const tokenParts = token.split(".");
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userRole = payload.role;

          // Redirect based on user role
          const dashboardUrl =
            userRole === "admin" || userRole === "super_admin" 
              ? "/admin" 
              : "/candidate/dashboard";
          const url = new URL(dashboardUrl, request.url);
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      // If token decoding fails, redirect to candidate dashboard by default
      const url = new URL("/candidate/dashboard", request.url);
      return NextResponse.redirect(url);
    }
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
