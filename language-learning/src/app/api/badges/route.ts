import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const assignments = await prisma.badgeAssignment.findMany({
      where: { userId: session.user.id },
      include: {
        badge: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const badges = assignments
      .filter((a) => a.badge.isActive)
      .map((a) => ({
        id: a.badge.id,
        name: a.badge.name,
        nameAr: a.badge.nameAr,
        description: a.badge.description,
        descriptionAr: a.badge.descriptionAr,
        icon: a.badge.icon,
        imageUrl: a.badge.imageUrl,
        color: a.badge.color,
        category: a.badge.category,
        earnedAt: a.createdAt.toISOString(),
      }));

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
