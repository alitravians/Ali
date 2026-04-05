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

    // Update settings — only allow known keys
    const ALLOWED_KEYS = new Set([
      'chat_enabled', 'registration_enabled', 'presence_enabled', 'presence_public',
      'show_last_seen', 'show_room_presence', 'maintenance_mode', 'maintenance_message',
      'site_name', 'welcome_message', 'max_message_length',
      'page_rules', 'page_welcome', 'page_about', 'page_privacy',
    ]);
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        if (!ALLOWED_KEYS.has(key)) continue;
        await prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }

    // Update banned words atomically
    if (bannedWords !== undefined) {
      await prisma.$transaction(async (tx) => {
        await tx.bannedWord.deleteMany();
        if (bannedWords.length > 0) {
          const uniqueWords = [...new Set(bannedWords as string[])];
          await tx.bannedWord.createMany({
            data: uniqueWords.map((word: string) => ({
              word,
              createdBy: (session.user as any).id,
            })),
          });
        }
      });
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
