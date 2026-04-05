import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    // Check registration setting
    const regSetting = await prisma.siteSetting.findUnique({ where: { key: 'registration_enabled' } });
    if (regSetting && regSetting.value === 'false') {
      return NextResponse.json({ error: 'التسجيل مغلق حالياً' }, { status: 403 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: trimmedUsername }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 });
      }
      return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const defaultRole = await prisma.role.findFirst({ where: { isDefault: true } });

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email,
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
