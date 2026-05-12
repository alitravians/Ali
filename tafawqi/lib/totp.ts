// F18 / S4 — Minimal RFC 6238 TOTP implementation using only Node crypto.
// Compatible with Google Authenticator / Authy / 1Password / etc.
//
// We avoid adding a runtime dependency for this one feature. The cost is a
// ~70-line file that handles:
//   - base32 encoding/decoding for the shared secret
//   - HMAC-SHA1 of the time-step counter
//   - dynamic truncation to a 6-digit code
//   - ±1 step window when verifying (default clock skew tolerance)
//   - `otpauth://` provisioning URL builder for QR-code rendering

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(): string {
  // 20 bytes = 160 bits, the RFC-recommended size for HMAC-SHA1.
  return base32Encode(randomBytes(20));
}

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(b32: string): Buffer {
  const cleaned = b32.replace(/=+$/g, "").toUpperCase().replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer; JS numbers fit up to 2^53 so the
  // high 32 bits are zero for any plausible Unix-time / step value.
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function totpCode(secret: string, when: number = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(when / 1000 / STEP_SECONDS));
}

// Verify a TOTP code with a ±1 step window (≈ ±30 s) for clock skew tolerance.
// Returns true if the code matches any of [t-1, t, t+1].
export function verifyTotp(secret: string, code: string, when: number = Date.now()): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const decoded = base32Decode(secret);
  const t = Math.floor(when / 1000 / STEP_SECONDS);
  for (const step of [-1, 0, 1]) {
    const candidate = hotp(decoded, t + step);
    if (constantTimeEq(candidate, normalized)) return true;
  }
  return false;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Build a standard `otpauth://` URL that can be encoded as a QR code by any
// authenticator app. Issuer + account are URL-encoded; the secret stays in
// base32 form (no padding) as the spec requires.
export function buildOtpAuthUrl(secret: string, accountName: string, issuer: string): string {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(accountName)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}
