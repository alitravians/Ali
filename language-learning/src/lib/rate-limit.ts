/**
 * In-memory rate limiter for API endpoints.
 * Prevents brute force attacks on login, registration, and other sensitive endpoints.
 * 
 * Note: In production with multiple instances, use Redis-based rate limiting instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(rateLimitStore.keys());
  for (const key of keys) {
    const entry = rateLimitStore.get(key);
    if (entry && now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier (e.g., IP + endpoint, or userId + action)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers.
 * Supports X-Forwarded-For, X-Real-IP, and direct connection.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

// Pre-configured rate limit configs for common use cases
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes */
  LOGIN: { maxRequests: 5, windowSeconds: 15 * 60 },
  /** Registration: 3 accounts per hour */
  REGISTER: { maxRequests: 3, windowSeconds: 60 * 60 },
  /** Contact form: 3 submissions per hour */
  CONTACT: { maxRequests: 3, windowSeconds: 60 * 60 },
  /** Chat messages: 30 per minute */
  CHAT_MESSAGE: { maxRequests: 30, windowSeconds: 60 },
  /** API general: 60 requests per minute */
  API_GENERAL: { maxRequests: 60, windowSeconds: 60 },
  /** Ticket creation: 5 per hour */
  TICKET: { maxRequests: 5, windowSeconds: 60 * 60 },
} as const;
