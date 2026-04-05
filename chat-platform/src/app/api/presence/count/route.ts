import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Count users with ONLINE status
    const totalOnline = await prisma.user.count({
      where: { status: 'ONLINE' },
    });

    return NextResponse.json({ totalOnline });
  } catch (error) {
    console.error('Presence count error:', error);
    return NextResponse.json({ totalOnline: 0 });
  }
}
