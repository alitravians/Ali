import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/notifications - Send notification (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const user = session.user as any;
  if ((user.roleLevel || 0) < 90) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, type, category, priority, link, targetType, targetUserId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });
  }

  const notifData: any = {
    type: type || 'ADMIN',
    category: category || 'ADMIN',
    priority: priority || 'NORMAL',
    title: title.trim(),
    content: content?.trim() || null,
    link: link?.trim() || null,
  };

  // targetType: 'all', 'user', 'role'
  if (targetType === 'user' && targetUserId) {
    // Send to specific user
    await prisma.notification.create({
      data: { ...notifData, userId: targetUserId },
    });
  } else {
    // Send to all users
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u: { id: string }) => ({ ...notifData, userId: u.id })),
      });
    }
  }

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: 'SEND_NOTIFICATION',
      performedBy: user.id,
      details: { title: notifData.title, targetType, targetUserId, recipientCount: targetType === 'user' ? 1 : 'all' },
    },
  });

  return NextResponse.json({ success: true });
}

// GET /api/admin/notifications - Get sent notification history
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const user = session.user as any;
  if ((user.roleLevel || 0) < 90) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  // Get admin-sent notifications (grouped by title+content+createdAt to show unique sends)
  const logs = await prisma.auditLog.findMany({
    where: { action: 'SEND_NOTIFICATION' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      performer: { select: { username: true, displayName: true } },
    },
  });

  return NextResponse.json(logs);
}
