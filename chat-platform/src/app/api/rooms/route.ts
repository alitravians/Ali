import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rooms - list rooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const roleLevel = (session.user as any).roleLevel || 0;

    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { members: true, messages: true } },
        members: {
          where: { userId },
          select: { userId: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { username: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = rooms.map((room) => {
      const isPrivateRoom = room.isPrivate || room.type === 'PRIVATE';
      const isMember = room.members.length > 0;
      const hasAccess = !isPrivateRoom || isMember || roleLevel >= 50;

      return {
        id: room.id,
        name: room.name,
        description: hasAccess ? room.description : null,
        type: room.type,
        isPrivate: room.isPrivate,
        isFrozen: room.isFrozen,
        maxMembers: room.maxMembers,
        sortOrder: room.sortOrder,
        memberCount: room._count.members,
        messageCount: hasAccess ? room._count.messages : 0,
        lastMessage: hasAccess && room.messages[0]
          ? {
              content: room.messages[0].content,
              username: room.messages[0].user.username,
              createdAt: room.messages[0].createdAt,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'خطأ في جلب الغرف' }, { status: 500 });
  }
}

// POST /api/rooms - create room
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const roleLevel = (session.user as any).roleLevel || 0;
    if (roleLevel < 90) {
      return NextResponse.json({ error: 'لا تملك صلاحية إنشاء غرفة' }, { status: 403 });
    }

    const { name, description, type, isPrivate, maxMembers } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'اسم الغرفة مطلوب' }, { status: 400 });
    }

    const maxOrder = await prisma.room.aggregate({ _max: { sortOrder: true } });

    const room = await prisma.room.create({
      data: {
        name,
        description,
        type: type || 'PUBLIC',
        isPrivate: isPrivate || false,
        maxMembers,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        createdById: (session.user as any).id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ROOM',
        performedBy: (session.user as any).id,
        details: { roomId: room.id, name: room.name },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الغرفة' }, { status: 500 });
  }
}
