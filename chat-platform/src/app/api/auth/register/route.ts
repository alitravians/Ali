import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { checkRegisterRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 registrations per hour per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkRegisterRateLimit(ip);
    if (!rateCheck.allowed) {
      const retryMin = Math.ceil(rateCheck.retryAfterMs / 60000);
      return NextResponse.json(
        { error: `محاولات تسجيل كثيرة. حاول بعد ${retryMin} دقيقة` },
        { status: 429 }
      );
    }

    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json({ error: 'اسم المستخدم يجب أن يكون بين 3 و 20 حرف ولا يمكن أن يكون فارغاً' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    // Check registration setting
    const regSetting = await prisma.siteSetting.findUnique({ where: { key: 'registration_enabled' } });
    if (regSetting && regSetting.value === 'false') {
      return NextResponse.json({ error: 'التسجيل مغلق حالياً' }, { status: 403 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username: { equals: trimmedUsername, mode: 'insensitive' } }] },
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 });
      }
      return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const defaultRole = await prisma.role.findFirst({ where: { isDefault: true } });

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        displayName: trimmedUsername,
        userRoles: defaultRole
          ? { create: { roleId: defaultRole.id } }
          : undefined,
      },
    });

    // Join all public rooms
    const publicRooms = await prisma.room.findMany({ where: { type: 'PUBLIC' } });
    if (publicRooms.length > 0) {
      await prisma.roomMember.createMany({
        data: publicRooms.map((room) => ({
          userId: user.id,
          roomId: room.id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ message: 'تم إنشاء الحساب بنجاح', userId: user.id }, { status: 201 });
  } catch (_error) {
    console.error('Registration error:', _error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التسجيل' }, { status: 500 });
  }
}
