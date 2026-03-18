import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const logs = await prisma.chatAdminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        admin: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "فشل في جلب السجلات" }, { status: 500 });
  }
}
