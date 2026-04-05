import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/blocks - list blocked users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const blocks = await prisma.userBlock.findMany({
      where: { blockedById: userId },
      include: { blockedUser: { select: { id: true, username: true, displayName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ blocks: blocks.map(b => b.blockedUser) });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// POST /api/blocks - block user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { blockedUserId } = await req.json();

    if (!blockedUserId || blockedUserId === userId) {
      return NextResponse.json({ error: 'لا يمكنك حظر نفسك' }, { status: 400 });
    }

    // Check user exists
    const targetUser = await prisma.user.findUnique({ where: { id: blockedUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Check if already blocked
    const existing = await prisma.userBlock.findUnique({
      where: { blockedById_blockedUserId: { blockedById: userId, blockedUserId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'المستخدم محظور بالفعل' }, { status: 400 });
    }

    await prisma.userBlock.create({
      data: { blockedById: userId, blockedUserId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// DELETE /api/blocks?userId=xxx - unblock user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get('userId');

    if (!blockedUserId) {
      return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 });
    }

    await prisma.userBlock.deleteMany({
      where: { blockedById: userId, blockedUserId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
