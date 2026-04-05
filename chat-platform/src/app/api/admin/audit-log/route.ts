import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { performer: { select: { username: true } } },
    });
    return NextResponse.json(logs.map(l => ({
      ...l,
      performerName: l.performer.username,
    })));
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
