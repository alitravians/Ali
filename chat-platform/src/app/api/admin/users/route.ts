import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const isAdmin = (session.user as any).roleLevel >= 90;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const requestedLimit = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const where = search
      ? { OR: [{ username: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userRoles: { include: { role: true }, orderBy: { role: { level: 'desc' } } },
          _count: { select: { messages: true, warnings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: isAdmin ? u.email : undefined,
        displayName: u.displayName,
        avatar: u.avatar,
        status: u.status,
        lastActive: u.lastActive,
        createdAt: u.createdAt,
        roles: u.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
          level: ur.role.level,
          color: ur.role.color,
        })),
        highestRole: u.userRoles[0]?.role
          ? { name: u.userRoles[0].role.name, displayName: u.userRoles[0].role.displayName, level: u.userRoles[0].role.level, color: u.userRoles[0].role.color }
          : { name: 'member', displayName: 'عضو', level: 10, color: '#808080' },
        messageCount: u._count.messages,
        warningCount: u._count.warnings,
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'خطأ في جلب المستخدمين' }, { status: 500 });
  }
}
