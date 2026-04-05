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
    const { code } = await request.json();

    const adminCode = process.env.ADMIN_ACCESS_CODE || '3131';
    const moderatorCode = process.env.MODERATOR_ACCESS_CODE || '2121';

    // Check authentication FIRST before revealing whether code is correct
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      // Not logged in — return identical response regardless of code validity
      // No rate limiting for unauthenticated users to prevent DoS against admin IPs
      return NextResponse.json({
        needsLogin: true,
        redirect: '/login?callbackUrl=/chat',
        message: 'يجب تسجيل الدخول أولاً للوصول للوحة التحكم',
      });
    }

    // Rate limit only authenticated users (by userId) to prevent brute-force
    // This prevents unauthenticated attackers from exhausting rate limit slots
    const userId = (session.user as any).id || 'unknown';
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
    }

    // User is authenticated — check code + role together
    // Return identical error for wrong code AND right code with wrong role
    // to prevent authenticated users from enumerating valid codes
    const roleLevel = (session.user as any).roleLevel || 0;
    const genericError = 'رمز الدخول غير صحيح أو ليس لديك الصلاحية';

    if (code === adminCode && roleLevel >= 90) {
      return NextResponse.json({ redirect: '/admin' });
    } else if (code === moderatorCode && roleLevel >= 50) {
      return NextResponse.json({ redirect: '/moderator' });
    } else {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
