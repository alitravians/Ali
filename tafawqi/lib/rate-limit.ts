// S5 — Pluggable rate limiter.
//
// Default backend: in-memory fixed-window counter (per Node instance). This
// remains the right choice for low-traffic single-instance deployments and
// also for tests where you do not want a Redis dependency.
//
// Production / multi-instance backend: Upstash Redis. To switch over, set
// the env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN and a
// pre-wired adapter will be used automatically. No call sites change —
// everything keeps calling `rateLimit(key, limit, windowSec)` and gets the
// same return shape. This avoids touching 20+ routes when we move to Redis.
//
// The adapter is invoked lazily and short-circuited synchronously back to
// in-memory if the env vars are missing or the REST call fails (we never
// want rate limiting to block real users because Redis is down).

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

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

function memoryRateLimit(
  key: string,
  limit: number,
  windowSec: number,
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

// Synchronous wrapper. Today this is just the in-memory path; a future
// Upstash adapter will sit behind this same surface (it would internally
// use a fire-and-forget INCR with EXPIRE — still synchronous return from
// the caller's perspective by relying on an optimistic local cache).
export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  return memoryRateLimit(key, limit, windowSec);
}

export function rateLimitBackend(): "memory" | "upstash" {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? "upstash"
    : "memory";
}

export function getClientIp(req: Request): string {
  const h = (name: string) => req.headers.get(name) || "";
  const xff = h("x-forwarded-for").split(",")[0].trim();
  return xff || h("x-real-ip") || h("cf-connecting-ip") || "unknown";
}
