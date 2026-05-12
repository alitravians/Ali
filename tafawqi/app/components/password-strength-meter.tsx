"use client";
// Shared password strength meter. Pure presentational; computes its own
// strength from the password string. Server is the source of truth for
// password acceptance, but this gives realtime feedback while typing.
import { passwordStrength, checkPassword } from "@/lib/password";

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const s = passwordStrength(password);
  const c = checkPassword(password);
  const pct = (s.score / 4) * 100;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1.5 w-full bg-violet-100 dark:bg-violet-900/40 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-200"
          style={{ width: `${pct}%`, background: s.color }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[11px]">
        <span style={{ color: s.color }} className="font-semibold">
          قوّة كلمة المرور: {s.labelAr}
        </span>
        {!c.ok && password.length > 0 && (
          <span className="text-rose-600 dark:text-rose-300/90">{c.reason}</span>
        )}
      </div>
    </div>
  );
}
