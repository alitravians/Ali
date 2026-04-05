import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/profile - get profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, displayName: true, bio: true, avatar: true, level: true, xp: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب الملف الشخصي' }, { status: 500 });
  }
}

// PUT /api/profile - update profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { displayName, bio, currentPassword, newPassword } = body;

    const updateData: Record<string, any> = {};

    // Update display name
    if (displayName !== undefined) {
      const trimmed = (displayName as string).trim();
      if (trimmed.length > 50) {
        return NextResponse.json({ error: 'الاسم طويل جداً (الحد 50 حرف)' }, { status: 400 });
      }
      updateData.displayName = trimmed || null;
    }

    // Update bio
    if (bio !== undefined) {
      const trimmed = (bio as string).trim();
      if (trimmed.length > 200) {
        return NextResponse.json({ error: 'النبذة طويلة جداً (الحد 200 حرف)' }, { status: 400 });
      }
      updateData.bio = trimmed || null;
    }

    // Change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'يجب إدخال كلمة المرور الحالية' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة قصيرة (الحد الأدنى 6 أحرف)' }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
      if (!user) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, displayName: true, bio: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'خطأ في تحديث الملف الشخصي' }, { status: 500 });
  }
}
