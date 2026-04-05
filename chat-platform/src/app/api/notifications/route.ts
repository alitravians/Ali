import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/notifications - List notifications with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userId = (session.user as any).id;
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const readFilter = url.searchParams.get('read'); // 'true', 'false', or null
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    const where: any = { userId, isArchived: false };
    if (category) where.category = category;
    if (readFilter === 'true') where.isRead = true;
    if (readFilter === 'false') where.isRead = false;

    const [notifications, unreadCount, categoryCounts] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false, isArchived: false } }),
      prisma.notification.groupBy({
        by: ['category'],
        where: { userId, isArchived: false },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      categoryCounts: categoryCounts.reduce((acc: any, c: any) => {
        acc[c.category] = c._count;
        return acc;
      }, {}),
    });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark as read / archive / delete
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userId = (session.user as any).id;
    const { id, ids, action } = await req.json();
    // action: 'read', 'readAll', 'archive', 'delete'

    if (action === 'readAll') {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (action === 'read' && id) {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else if (action === 'archive' && (id || ids)) {
      const targetIds = ids || [id];
      await prisma.notification.updateMany({
        where: { id: { in: targetIds }, userId },
        data: { isArchived: true, isRead: true },
      });
    } else if (action === 'delete' && (id || ids)) {
      const targetIds = ids || [id];
      await prisma.notification.deleteMany({
        where: { id: { in: targetIds }, userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
