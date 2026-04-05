import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/punishments - issue mute/ban/warning
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { type, targetUserId, reason, duration, roomId } = await req.json();
    const performerId = (session.user as any).id;
    const performerLevel = (session.user as any).roleLevel;

    if (!targetUserId || !reason || !type) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Check target user level
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userRoles: { include: { role: true }, orderBy: { role: { level: 'desc' } } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const targetLevel = targetUser.userRoles[0]?.role.level || 10;
    if (targetLevel >= performerLevel) {
      return NextResponse.json({ error: 'لا يمكنك تطبيق عقوبة على مستخدم بنفس رتبتك أو أعلى' }, { status: 403 });
    }

    let result;

    if (type === 'warning') {
      result = await prisma.warning.create({
        data: { userId: targetUserId, issuedBy: performerId, reason, roomId },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'WARNING',
          title: 'تحذير جديد',
          content: `سبب التحذير: ${reason}`,
        },
      });
    } else if (type === 'mute') {
      if (!duration || duration < 1) {
        return NextResponse.json({ error: 'مدة الكتم مطلوبة (بالدقائق)' }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      result = await prisma.mute.create({
        data: { userId: targetUserId, issuedBy: performerId, reason, duration, expiresAt, roomId },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'MUTE',
          title: 'تم كتمك',
          content: `السبب: ${reason}\nالمدة: ${duration} دقيقة`,
          metadata: { expiresAt: expiresAt.toISOString(), duration },
        },
      });
    } else if (type === 'ban') {
      if (performerLevel < 90 && !duration) {
        return NextResponse.json({ error: 'المشرفون يمكنهم الحظر المؤقت فقط' }, { status: 403 });
      }

      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

      result = await prisma.ban.create({
        data: { userId: targetUserId, issuedBy: performerId, reason, duration, expiresAt },
      });

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'BAN',
          title: 'تم حظرك',
          content: `السبب: ${reason}${duration ? `\nالمدة: ${duration} دقيقة` : '\nحظر دائم'}`,
          metadata: { expiresAt: expiresAt?.toISOString(), duration, reason },
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: type.toUpperCase(),
        performedBy: performerId,
        targetUserId,
        details: { type, reason, duration, roomId },
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error issuing punishment:', error);
    return NextResponse.json({ error: 'خطأ في تطبيق العقوبة' }, { status: 500 });
  }
}

// GET /api/admin/punishments - list punishments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';

    const [warnings, mutes, bans] = await Promise.all([
      type === 'all' || type === 'warning'
        ? prisma.warning.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true } },
              issuer: { select: { username: true } },
            },
          })
        : [],
      type === 'all' || type === 'mute'
        ? prisma.mute.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true } },
              issuer: { select: { username: true } },
            },
          })
        : [],
      type === 'all' || type === 'ban'
        ? prisma.ban.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { username: true } },
              issuer: { select: { username: true } },
            },
          })
        : [],
    ]);

    return NextResponse.json({ warnings, mutes, bans });
  } catch (error) {
    console.error('Error fetching punishments:', error);
    return NextResponse.json({ error: 'خطأ في جلب العقوبات' }, { status: 500 });
  }
}

// DELETE /api/admin/punishments - lift punishment
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 50) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { type, id } = await req.json();
    const performerId = (session.user as any).id;

    if (type === 'mute') {
      const mute = await prisma.mute.update({
        where: { id },
        data: { isActive: false, liftedBy: performerId, liftedAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          userId: mute.userId,
          type: 'UNMUTE',
          title: 'تم فك الكتم',
          content: 'تم رفع الكتم عنك',
        },
      });
    } else if (type === 'ban') {
      const ban = await prisma.ban.update({
        where: { id },
        data: { isActive: false, liftedBy: performerId, liftedAt: new Date() },
      });

      await prisma.notification.create({
        data: {
          userId: ban.userId,
          type: 'UNBAN',
          title: 'تم فك الحظر',
          content: 'تم رفع الحظر عنك',
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: `LIFT_${type.toUpperCase()}`,
        performedBy: performerId,
        details: { type, id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error lifting punishment:', error);
    return NextResponse.json({ error: 'خطأ في رفع العقوبة' }, { status: 500 });
  }
}
