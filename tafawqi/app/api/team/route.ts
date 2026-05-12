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
                avatar: true, // selected only to compute hasAvatar; not returned
                avatarSeed: true,
                role: true,
              },
            },
          },
        },
      },
    });
    // S6/F8 — strip the heavy base64 avatar from the JSON payload. The team
    // page renders <img src="/api/avatar/<userId>"> instead.
    const shaped = departments.map((d) => ({
      ...d,
      members: d.members.map((m) => ({
        ...m,
        user: {
          id: m.user.id,
          name: m.user.name,
          avatarSeed: m.user.avatarSeed,
          role: m.user.role,
          avatarUrl: m.user.avatar ? `/api/avatar/${m.user.id}` : null,
        },
      })),
    }));
    return NextResponse.json({ departments: shaped });
  } catch {
    return NextResponse.json(
      { error: "فشل في جلب بيانات فريق العمل" },
      { status: 500 },
    );
  }
}
