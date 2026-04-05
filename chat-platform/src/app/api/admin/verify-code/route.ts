import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

// Simple in-memory rate limiter by IP
const attempts: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000; // 1 minute

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, WINDOW_MS);

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
    // Rate limit by IP
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
    }

    const { code } = await request.json();

    const adminCode = process.env.ADMIN_ACCESS_CODE || '3131';
    const moderatorCode = process.env.MODERATOR_ACCESS_CODE || '2121';

    // Check if code is valid first
    let targetPath = '';
    let requiredLevel = 0;

    if (code === adminCode) {
      targetPath = '/admin';
      requiredLevel = 90;
    } else if (code === moderatorCode) {
      targetPath = '/moderator';
      requiredLevel = 50;
    } else {
      return NextResponse.json({ error: 'رمز الدخول غير صحيح' }, { status: 401 });
    }

    // Code is correct — now check if user is logged in
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      // Not logged in — tell them to log in first, then redirect to admin
      return NextResponse.json({
        needsLogin: true,
        redirect: `/login?callbackUrl=${targetPath}`,
        message: 'يجب تسجيل الدخول أولاً للوصول للوحة التحكم',
      });
    }

    // Logged in — check role level
    const roleLevel = (session.user as any).roleLevel || 0;
    if (roleLevel < requiredLevel) {
      return NextResponse.json({
        error: 'ليس لديك الصلاحية للوصول لهذه اللوحة',
      }, { status: 403 });
    }

    // All good — redirect to panel
    return NextResponse.json({ redirect: targetPath });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
