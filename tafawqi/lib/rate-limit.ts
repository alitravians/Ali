// In-memory rate limiter (sliding window).
// Note: for serverless/edge deployments, this resets per-instance.
// For production-grade rate limiting use Redis/Upstash. This provides best-effort
// throttling against casual abuse on a single instance.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 5000;

function gc() {
  if (buckets.size <= MAX_BUCKETS) return;
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k);
    if (buckets.size <= MAX_BUCKETS / 2) break;
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const now = Date.now();
  const winMs = windowSec * 1000;
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + winMs };
    buckets.set(key, b);
    gc();
  }
  b.count++;
  const ok = b.count <= limit;
  const remaining = Math.max(0, limit - b.count);
  const retryAfterSec = ok ? 0 : Math.ceil((b.resetAt - now) / 1000);
  return { ok, remaining, resetAt: b.resetAt, retryAfterSec };
}

export function getClientIp(req: Request): string {
  const h = (name: string) => req.headers.get(name) || "";
  const xff = h("x-forwarded-for").split(",")[0].trim();
  return xff || h("x-real-ip") || h("cf-connecting-ip") || "unknown";
}
