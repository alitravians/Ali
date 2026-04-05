import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pages/[slug] - get dynamic page content
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const allowedSlugs = ['rules', 'welcome', 'about', 'privacy'];
    if (!allowedSlugs.includes(params.slug)) {
      return NextResponse.json({ error: 'صفحة غير موجودة' }, { status: 404 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: `page_${params.slug}` },
    });

    return NextResponse.json({
      slug: params.slug,
      content: setting?.value || '',
    });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
