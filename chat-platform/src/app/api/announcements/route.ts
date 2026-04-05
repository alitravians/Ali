import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true } } },
    });
    return NextResponse.json(announcements);
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { title, content, isPinned } = await req.json();
    if (!title || !content) return NextResponse.json({ error: 'العنوان والمحتوى مطلوبان' }, { status: 400 });

    const announcement = await prisma.announcement.create({
      data: { title, content, isPinned: isPinned || false, createdBy: (session.user as any).id },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE_ANNOUNCEMENT', performedBy: (session.user as any).id, details: { title } },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { id } = await req.json();
    await prisma.announcement.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
