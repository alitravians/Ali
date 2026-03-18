import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/**
 * Server-side admin authentication check.
 * Returns the session if the user is an admin, or a 401/403 response if not.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "غير مصرح - يجب تسجيل الدخول" }, { status: 401 }),
    };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "غير مصرح - صلاحيات الإدارة مطلوبة" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    session,
  };
}
