import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get all visible team departments with members (public)
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
                username: true,
                avatar: true,
                status: true,
                lastActive: true,
                userRoles: {
                  include: { role: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: "فشل في جلب بيانات فريق العمل" }, { status: 500 });
  }
}
