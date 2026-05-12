// S2 — Email verification core.
//
// `createVerification(user)` creates a fresh token row and (if SMTP is
// configured) sends a verification email. With no SMTP configured it logs
// the link to stdout and resolves successfully — this lets us ship the
// schema, routes, and UI now and turn the feature on without code changes
// once an SMTP provider is wired in (SendGrid/Resend/SES/etc.).
//
// `verify(token)` validates the token, marks the user as verified, and
// invalidates the token row.
//
// The feature is gated by SiteSetting `email_verification_required` (default
// false). When true, /api/auth/login refuses unverified users with a clear
// Arabic error message.

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerification(user: { id: string; email: string }): Promise<{
  token: string;
  link: string;
  sent: boolean;
}> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
    },
  });
  // Build the verification link. The base URL is taken from NEXT_PUBLIC_SITE_URL
  // (set per environment in Vercel). Falls back to relative path which still works
  // when the user is already on the site.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const link = `${baseUrl}/verify-email?token=${token}`;

  const sent = await maybeSendEmail(user.email, link);
  return { token, link, sent };
}

async function maybeSendEmail(_email: string, link: string): Promise<boolean> {
  // SMTP integration is intentionally stubbed for now. Wire SENDGRID_API_KEY
  // or RESEND_API_KEY through here when ready; until then, just log the link
  // in development so we can paste it into a browser during local testing.
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[email-verification] would send link:", link);
  }
  return false;
}

export async function consumeVerification(token: string): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: string }
> {
  if (!token || token.length < 16 || token.length > 128) {
    return { ok: false, reason: "الرمز غير صالح" };
  }
  const row = await prisma.emailVerification.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: "الرمز غير صالح" };
  if (row.usedAt) return { ok: false, reason: "تم استخدام هذا الرمز سابقاً" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "انتهت صلاحية الرمز" };
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true, userId: row.userId, email: row.email };
}

export async function isVerificationRequired(): Promise<boolean> {
  try {
    const s = await prisma.siteSetting.findUnique({
      where: { key: "email_verification_required" },
    });
    return s?.value === "true";
  } catch {
    return false;
  }
}
