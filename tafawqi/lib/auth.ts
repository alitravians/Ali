import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Resolve the signing secret lazily on first use. Throwing at module-load
// time breaks Next.js's "collect page data" pass during `next build`, which
// imports every route once with NODE_ENV=production but no env vars.
const DEV_FALLBACK = "tafawqi-dev-secret-change-me-do-not-use-in-prod";
const COOKIE = "tafawqi_session";

function getSecret(): string {
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length >= 16) return raw;
  // In production, never silently fall back. Refuse at the point of use.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is missing or too short in production. Set a strong (>=16 chars) random value."
    );
  }
  return raw || DEV_FALLBACK;
}

export type SessionPayload = {
  uid: string;
  role: "student" | "admin";
  // Issued-at timestamp (seconds). When the user resets password we bump
  // user.passwordChangedAt and reject any session with iat older than that.
  iat?: number;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = signSession(payload);
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser() {
  const sess = await getSession();
  if (!sess) return null;
  const user = await prisma.user.findUnique({ where: { id: sess.uid } });
  if (!user) return null;
  // Invalidate sessions issued before the last password change.
  if (user.passwordChangedAt && sess.iat) {
    const sessIatMs = sess.iat * 1000;
    if (sessIatMs < user.passwordChangedAt.getTime()) return null;
  }
  return user;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}
