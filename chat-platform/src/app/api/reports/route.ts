import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: { select: { username: true } },
        targetUser: { select: { username: true } },
        message: { select: { content: true } },
        room: { select: { name: true } },
      },
    });
    return NextResponse.json(reports);
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { targetUserId, messageId, roomId, reason, details } = await req.json();
    if (!reason) return NextResponse.json({ error: 'السبب مطلوب' }, { status: 400 });

    const report = await prisma.report.create({
      data: {
        reporterId: (session.user as any).id,
        targetUserId,
        messageId,
        roomId,
        reason,
        details,
      },
    });
    return NextResponse.json(report, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { id, status, resolution } = await req.json();

    // Validate status against allowed enum values
    const VALID_STATUSES = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'ESCALATED'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'حالة البلاغ غير صالحة' }, { status: 400 });
    }

    await prisma.report.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedById: (session.user as any).id,
        resolvedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'RESOLVE_REPORT',
        performedBy: (session.user as any).id,
        details: { reportId: id, status, resolution },
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
