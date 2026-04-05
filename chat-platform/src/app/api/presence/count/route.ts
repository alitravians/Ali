import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
