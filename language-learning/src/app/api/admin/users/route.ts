import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        _count: {
          select: { certificates: true, testResults: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// Whitelist of allowed roles to prevent privilege escalation
const ALLOWED_ROLES = ["user", "moderator", "admin"];

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const { userId, id, role } = await req.json();
    const targetId = userId || id;

    if (!targetId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    // Validate role against whitelist
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "الدور غير صالح. الأدوار المسموحة: user, moderator, admin" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
