import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rooms/[roomId]/messages
export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check private room access
    const room = await prisma.room.findUnique({ where: { id: params.roomId } });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }
    if (room.isPrivate || room.type === 'PRIVATE') {
      const userRoleLevel = (session.user as any).roleLevel || 0;
      if (userRoleLevel < 50) {
        const isMember = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId: (session.user as any).id, roomId: params.roomId } },
        });
        if (!isMember) {
          return NextResponse.json({ error: 'هذه الغرفة خاصة' }, { status: 403 });
        }
      }
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100);

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.roomId,
        isDeleted: false,
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            userRoles: {
              include: { role: true },
              orderBy: { role: { level: 'desc' } },
              take: 1,
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: { select: { username: true } },
          },
        },
      },
    });

    const result = messages.reverse().map((msg) => {
      const highestRole = msg.user.userRoles[0]?.role;
      return {
        id: msg.id,
        content: msg.content,
        userId: msg.userId,
        roomId: msg.roomId,
        replyToId: msg.replyToId,
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        isBold: msg.isBold,
        createdAt: msg.createdAt.toISOString(),
        user: {
          id: msg.user.id,
          username: msg.user.username,
          displayName: msg.user.displayName,
          avatar: msg.user.avatar,
          roleDisplayName: highestRole?.displayName || 'عضو',
          roleColor: highestRole?.color || '#808080',
          roleLevel: highestRole?.level || 10,
        },
        replyTo: msg.replyTo
          ? { id: msg.replyTo.id, content: msg.replyTo.content, user: { username: msg.replyTo.user.username } }
          : null,
      };
    });

    return NextResponse.json({
      messages: result,
      nextCursor: messages.length === limit ? messages[messages.length - 1]?.id : null,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'خطأ في جلب الرسائل' }, { status: 500 });
  }
}
