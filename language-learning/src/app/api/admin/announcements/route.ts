import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { reads: true } } },
    });
    return NextResponse.json(announcements);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { title, content, importance, placement, targetType, targetUsers, isPinned, showOnce, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        importance: importance || "normal",
        placement: placement || "banner",
        targetType: targetType || "all",
        targetUsers: targetUsers || "",
        isPinned: isPinned || false,
        showOnce: showOnce || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: (session.user as { id: string }).id,
      },
    });

    // Send notifications to all users
    if (targetType === "all") {
      const users = await prisma.user.findMany({ select: { id: true } });
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: "📢 إعلان جديد",
          titleAr: "📢 إعلان جديد",
          message: title,
          messageAr: title,
          type: importance === "urgent" ? "warning" : "info",
          category: "admin",
          icon: "megaphone",
          priority: importance === "urgent" ? "urgent" : importance === "important" ? "important" : "normal",
        })),
      });
    }

    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { id, title, content, importance, placement, targetType, targetUsers, isPinned, showOnce, expiresAt } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (importance !== undefined) updateData.importance = importance;
    if (placement !== undefined) updateData.placement = placement;
    if (targetType !== undefined) updateData.targetType = targetType;
    if (targetUsers !== undefined) updateData.targetUsers = targetUsers;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (showOnce !== undefined) updateData.showOnce = showOnce;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const announcement = await prisma.announcement.update({ where: { id }, data: updateData });
    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
