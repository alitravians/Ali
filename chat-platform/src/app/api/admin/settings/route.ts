import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    // Banned words
    const bannedWords = await prisma.bannedWord.findMany({ orderBy: { createdAt: 'desc' } });

    return NextResponse.json({ settings: settingsMap, bannedWords });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// PUT /api/admin/settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).roleLevel < 90) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { settings, bannedWords } = await req.json();

    // Update settings
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        await prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }

    // Update banned words
    if (bannedWords !== undefined) {
      await prisma.bannedWord.deleteMany();
      if (bannedWords.length > 0) {
        await prisma.bannedWord.createMany({
          data: bannedWords.map((word: string) => ({
            word,
            createdBy: (session.user as any).id,
          })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_SETTINGS',
        performedBy: (session.user as any).id,
        details: { settings, bannedWordsCount: bannedWords?.length },
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}
