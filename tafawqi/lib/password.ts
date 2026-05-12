// S1 / F4 — Shared password strength rules.
//
// Used by:
//   - Server: app/api/auth/register and app/api/auth/reset-confirm to enforce rules.
//   - Client: app/register and app/forgot/confirm to render a live strength meter.
//
// Rules (server-enforced):
//   1. Minimum length: 8 characters.
//   2. Must contain at least one non-letter (digit, symbol, or unicode non-letter).
//
// The strength meter is informational only; the API is the source of truth.

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  labelAr: string;
  color: string;
};

export type PasswordCheck = {
  ok: boolean;
  reason: string | null;
};

const MIN_LENGTH = 8;
const NON_LETTER_RE = /[^A-Za-z\p{L}]/u;
const HAS_DIGIT_RE = /\d/;
const HAS_SYMBOL_RE = /[^\w\s]/;
const HAS_UPPER_RE = /[A-Z]/;
const HAS_LOWER_RE = /[a-z]/;

export function checkPassword(raw: string): PasswordCheck {
  const pw = String(raw ?? "");
  if (pw.length === 0) return { ok: false, reason: "كلمة المرور مطلوبة" };
  if (pw.length < MIN_LENGTH) {
    return { ok: false, reason: `كلمة المرور يجب أن لا تقلّ عن ${MIN_LENGTH} أحرف` };
  }
  if (pw.length > 200) {
    return { ok: false, reason: "كلمة المرور طويلة جداً" };
  }
  if (!NON_LETTER_RE.test(pw)) {
    return {
      ok: false,
      reason: "كلمة المرور يجب أن تحتوي على رقم أو رمز واحد على الأقلّ",
    };
  }
  return { ok: true, reason: null };
}

export function passwordStrength(raw: string): PasswordStrength {
  const pw = String(raw ?? "");
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (HAS_DIGIT_RE.test(pw) && HAS_SYMBOL_RE.test(pw)) score++;
  if ((HAS_UPPER_RE.test(pw) && HAS_LOWER_RE.test(pw)) || pw.length >= 14) score++;
  // Clamp to 0..4
  if (score > 4) score = 4;
  const map: Record<number, PasswordStrength> = {
    0: { score: 0, labelAr: "فارغة", color: "#94a3b8" },
    1: { score: 1, labelAr: "ضعيفة", color: "#ef4444" },
    2: { score: 2, labelAr: "مقبولة", color: "#f59e0b" },
    3: { score: 3, labelAr: "جيّدة", color: "#10b981" },
    4: { score: 4, labelAr: "ممتازة", color: "#059669" },
  };
  return map[score as 0 | 1 | 2 | 3 | 4];
}
