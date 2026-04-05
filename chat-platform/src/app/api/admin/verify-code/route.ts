import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simple in-memory rate limiter
const attempts: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    // Rate limit by user ID
    const userId = (session.user as any).id || session.user.email || 'unknown';
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
    }

    const { code } = await request.json();

    const adminCode = process.env.ADMIN_ACCESS_CODE || '3131';
    const moderatorCode = process.env.MODERATOR_ACCESS_CODE || '2121';

    if (code === adminCode) {
      return NextResponse.json({ redirect: '/admin' });
    } else if (code === moderatorCode) {
      return NextResponse.json({ redirect: '/moderator' });
    } else {
      return NextResponse.json({ error: 'رمز الدخول غير صحيح' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
