import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Adds security headers to all responses.
 * Prevents clickjacking, XSS, MIME sniffing, and other common attacks.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Restrict permissions/features
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Strict Transport Security (HTTPS only)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

/**
 * Next.js Middleware for centralized security.
 * - Adds security headers to all responses
 * - Protects all /admin/* pages and /api/admin/* API routes,
 *   requiring a valid session with role === "admin".
 * 
 * /admin/login is excluded so admins can access the login page.
 * 
 * Maintenance mode is enforced client-side in page.tsx
 * to avoid circular fetch issues in middleware.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isAdminPage) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }
    return addSecurityHeaders(NextResponse.json(
      { error: "غير مصرح - يجب تسجيل الدخول" },
      { status: 401 }
    ));
  }

  if (token.role !== "admin") {
    if (isAdminPage) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }
    return addSecurityHeaders(NextResponse.json(
      { error: "غير مصرح - صلاحيات الإدارة مطلوبة" },
      { status: 403 }
    ));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // Match all routes for security headers
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
