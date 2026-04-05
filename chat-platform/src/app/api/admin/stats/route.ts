import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const [userCount, roomCount, messageCount, reportCount, activebanCount, activeMuteCount, warningCount] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.ban.count({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
      prisma.mute.count({ where: { isActive: true, expiresAt: { gt: new Date() } } }),
      prisma.warning.count(),
    ]);

    // Recent activity
    const recentLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { performer: { select: { username: true } } },
    });

    return NextResponse.json({
      stats: {
        users: userCount,
        rooms: roomCount,
        messages: messageCount,
        pendingReports: reportCount,
        activeBans: activebanCount,
        activeMutes: activeMuteCount,
        warnings: warningCount,
      },
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        performedBy: log.performer.username,
        details: log.details,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'خطأ في جلب الإحصائيات' }, { status: 500 });
  }
}
