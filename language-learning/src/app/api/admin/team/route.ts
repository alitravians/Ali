import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get all departments with members (admin view - includes hidden)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const departments = await prisma.teamDepartment.findMany({
      orderBy: { order: "asc" },
      include: {
        members: {
          orderBy: { order: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                chatRank: true,
              },
            },
          },
        },
      },
    });

    // Get all users for the "add member" dropdown
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments, users });
  } catch {
    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 });
  }
}

// POST - Create department, add member, or update
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_department") {
      const { name, nameAr } = body;
      if (!name || !nameAr) {
        return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
      }
      const maxOrder = await prisma.teamDepartment.aggregate({ _max: { order: true } });
      const department = await prisma.teamDepartment.create({
        data: {
          name,
          nameAr,
          order: (maxOrder._max.order || 0) + 1,
        },
      });
      return NextResponse.json(department);
    }

    if (action === "update_department") {
      const { id, name, nameAr, isVisible, order } = body;
      if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
      const department = await prisma.teamDepartment.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(nameAr !== undefined && { nameAr }),
          ...(isVisible !== undefined && { isVisible }),
          ...(order !== undefined && { order }),
        },
      });
      return NextResponse.json(department);
    }

    if (action === "delete_department") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
      await prisma.teamDepartment.delete({ where: { id } });
      return NextResponse.json({ message: "تم حذف القسم" });
    }

    if (action === "add_member") {
      const { userId, departmentId, role, roleAr } = body;
      if (!userId || !departmentId) {
        return NextResponse.json({ error: "المستخدم والقسم مطلوبان" }, { status: 400 });
      }
      // Check if already in this department
      const existing = await prisma.teamMember.findUnique({
        where: { userId_departmentId: { userId, departmentId } },
      });
      if (existing) {
        return NextResponse.json({ error: "المستخدم موجود بالفعل في هذا القسم" }, { status: 400 });
      }
      const maxOrder = await prisma.teamMember.aggregate({
        where: { departmentId },
        _max: { order: true },
      });
      const member = await prisma.teamMember.create({
        data: {
          userId,
          departmentId,
          role: role || "",
          roleAr: roleAr || "",
          order: (maxOrder._max.order || 0) + 1,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      });
      return NextResponse.json(member);
    }

    if (action === "update_member") {
      const { id, role, roleAr, isVisible, order } = body;
      if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
      const member = await prisma.teamMember.update({
        where: { id },
        data: {
          ...(role !== undefined && { role }),
          ...(roleAr !== undefined && { roleAr }),
          ...(isVisible !== undefined && { isVisible }),
          ...(order !== undefined && { order }),
        },
      });
      return NextResponse.json(member);
    }

    if (action === "remove_member") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });
      await prisma.teamMember.delete({ where: { id } });
      return NextResponse.json({ message: "تم إزالة العضو" });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "فشل في تنفيذ العملية" }, { status: 500 });
  }
}
