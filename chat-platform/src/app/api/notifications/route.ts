import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(notifications);
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id, markAll } = await req.json();
    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: (session.user as any).id, isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      await prisma.notification.updateMany({ where: { id, userId: (session.user as any).id }, data: { isRead: true } });
    }
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
