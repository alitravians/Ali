import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js Middleware for centralized admin route protection.
 * Protects all /admin/* pages and /api/admin/* API routes,
 * requiring a valid session with role === "admin".
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
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.json(
      { error: "غير مصرح - يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (token.role !== "admin") {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.json(
      { error: "غير مصرح - صلاحيات الإدارة مطلوبة" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
