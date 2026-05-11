// Input sanitization helpers

// Normalize email: trim + lowercase
export function normalizeEmail(s: string): string {
  return String(s ?? "").trim().toLowerCase();
}

// Strip HTML tags and control characters from a display name.
// React already escapes on render, but we still don't want raw HTML stored.
export function sanitizeName(s: string): string {
  return String(s ?? "")
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/[\u0000-\u001f\u007f]/g, "") // strip control chars
    .replace(/\s+/g, " ")
    .trim();
}

// Generic short text sanitizer (titles, descriptions)
export function sanitizeText(s: string, maxLen = 200): string {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLen);
}

// Safely parse JSON body and return a JSON-or-null result.
// Caps payload size to prevent abuse.
export async function safeJson<T = unknown>(
  req: Request,
  maxBytes = 64 * 1024
): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return { ok: false, reason: "حجم البيانات كبير جداً" };
    if (!text.trim()) return { ok: false, reason: "البيانات فارغة" };
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, reason: "صيغة البيانات غير صحيحة" };
  }
}
