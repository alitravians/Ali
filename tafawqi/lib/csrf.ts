// Defense-in-depth CSRF guard for state-changing API endpoints.
//
// Cookies are already SameSite=Lax (so a cross-site form POST cannot be sent
// with credentials automatically), but for state-changing endpoints we add a
// strict same-origin check using the Origin / Referer headers. Modern browsers
// always send Origin on POST/PUT/PATCH/DELETE.

const ALLOWED_HOSTS = new Set<string>([
  // Hosts can be overridden via env at runtime.
  ...(process.env.APP_ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
]);

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isSameOriginRequest(req: Request): boolean {
  // Determine our own host from the incoming URL so this stays correct under
  // preview deployments, custom domains, etc.
  let selfHost: string | null = null;
  try {
    selfHost = new URL(req.url).host.toLowerCase();
  } catch {
    selfHost = null;
  }
  const origin = hostOf(req.headers.get("origin"));
  const referer = hostOf(req.headers.get("referer"));

  // Some browsers strip Origin on same-origin GETs. For POST/PATCH/DELETE/PUT
  // Chromium, Firefox, Safari all send Origin → so requiring at least one of
  // them to match is safe.
  if (origin && (origin === selfHost || ALLOWED_HOSTS.has(origin))) return true;
  if (referer && (referer === selfHost || ALLOWED_HOSTS.has(referer))) return true;
  return false;
}

export function requireSameOrigin(req: Request): { ok: true } | { ok: false; reason: string } {
  if (req.method === "GET" || req.method === "HEAD") return { ok: true };
  if (!isSameOriginRequest(req)) {
    return { ok: false, reason: "طلب من مصدر غير موثوق" };
  }
  return { ok: true };
}
