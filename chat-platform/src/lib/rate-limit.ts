// Rate limiter for authentication endpoints
// Tracks attempts per userId (logged in) or per IP+endpoint (anonymous)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

export function checkAuthRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Separate tracker for registration (3 per hour per IP)
export function checkRegisterRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  return checkAuthRateLimit(`register:${ip}`, 3, 60 * 60 * 1000); // 3 per hour
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  return checkAuthRateLimit(`login:${ip}`, 5, 15 * 60 * 1000); // 5 per 15 min
}
