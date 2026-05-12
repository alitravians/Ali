// Public team page data. Returns visible departments with their visible
// members, ordered by the admin's manual ordering. No authentication.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const departments = await prisma.teamDepartment.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: {
        members: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                avatarSeed: true,
                role: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ departments });
  } catch {
    return NextResponse.json(
      { error: "فشل في جلب بيانات فريق العمل" },
      { status: 500 },
    );
  }
}
