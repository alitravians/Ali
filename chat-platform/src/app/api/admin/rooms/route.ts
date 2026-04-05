import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/rooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { members: true, messages: true, moderators: true } },
        moderators: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ في جلب الغرف' }, { status: 500 });
  }
}

// PUT /api/admin/rooms
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id, name, description, type, isPrivate, isFrozen, maxMembers } = await req.json();

    const room = await prisma.room.update({
      where: { id },
      data: { name, description, type, isPrivate, isFrozen, maxMembers },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_ROOM',
        performedBy: (session.user as any).id,
        details: { roomId: id, changes: { name, description, type, isPrivate, isFrozen } },
      },
    });

    return NextResponse.json(room);
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ في تحديث الغرفة' }, { status: 500 });
  }
}

// DELETE /api/admin/rooms
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await req.json();

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });

    await prisma.room.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_ROOM',
        performedBy: (session.user as any).id,
        details: { roomId: id, roomName: room.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ في حذف الغرفة' }, { status: 500 });
  }
}
