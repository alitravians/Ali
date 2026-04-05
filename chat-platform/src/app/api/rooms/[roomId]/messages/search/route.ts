import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rooms/[roomId]/messages/search?q=...
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
    const query = searchParams.get('q')?.trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.roomId,
        isDeleted: false,
        content: { contains: query, mode: 'insensitive' },
      },
      take: 30,
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
      },
    });

    const result = messages.map((msg) => {
      const highestRole = msg.user.userRoles[0]?.role;
      return {
        id: msg.id,
        content: msg.content,
        userId: msg.userId,
        roomId: msg.roomId,
        isEdited: msg.isEdited,
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
      };
    });

    return NextResponse.json({ messages: result });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ error: 'خطأ في البحث' }, { status: 500 });
  }
}
