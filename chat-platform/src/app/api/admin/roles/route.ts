import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/roles - list all roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      orderBy: { level: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        level: true,
        color: true,
        icon: true,
        isDefault: true,
        isSystem: true,
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'خطأ في جلب الرتب' }, { status: 500 });
  }
}

// PUT /api/admin/roles - change user role
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { userId, roleId } = await req.json();
    const performerId = (session.user as any).id;
    const performerLevel = (session.user as any).roleLevel;

    if (!userId || !roleId) {
      return NextResponse.json({ error: 'معرف المستخدم والرتبة مطلوبان' }, { status: 400 });
    }

    // Get target user current roles
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true }, orderBy: { role: { level: 'desc' } } },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Get new role
    const newRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!newRole) {
      return NextResponse.json({ error: 'الرتبة غير موجودة' }, { status: 404 });
    }

    // Prevent assigning role equal or higher than performer
    if (newRole.level >= performerLevel) {
      return NextResponse.json({ error: 'لا يمكنك تعيين رتبة بنفس مستواك أو أعلى' }, { status: 403 });
    }

    // Prevent modifying users with equal or higher role
    const targetHighestLevel = targetUser.userRoles[0]?.role.level || 0;
    if (targetHighestLevel >= performerLevel) {
      return NextResponse.json({ error: 'لا يمكنك تعديل رتبة مستخدم بنفس مستواك أو أعلى' }, { status: 403 });
    }

    // Remove all existing roles and assign new role atomically
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.create({
        data: { userId, roleId },
      });
      await tx.auditLog.create({
        data: {
          action: 'CHANGE_ROLE',
          performedBy: performerId,
          targetUserId: userId,
          details: {
            previousRole: targetUser.userRoles[0]?.role.displayName || 'عضو',
            newRole: newRole.displayName,
            newRoleLevel: newRole.level,
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing role:', error);
    return NextResponse.json({ error: 'خطأ في تغيير الرتبة' }, { status: 500 });
  }
}
