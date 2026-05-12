"use client";
// F2 — small streak indicator. Shows 🔥 + current streak count.
// Used on /dashboard. Renders nothing for streaks of 0.

export default function StreakBadge({
  current,
  best,
  size = "md",
}: {
  current: number;
  best: number;
  size?: "sm" | "md" | "lg";
}) {
  if (current <= 0) return null;
  const cls =
    size === "lg"
      ? "px-4 py-2 text-base"
      : size === "sm"
      ? "px-2 py-1 text-xs"
      : "px-3 py-1.5 text-sm";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 text-rose-700 dark:text-rose-200 font-extrabold ${cls}`}
      title={best > current ? `أعلى رقم قياسي: ${best} يوماً` : undefined}
    >
      <span aria-hidden="true">🔥</span>
      <span className="num">{current}</span>
      <span className="font-semibold">{current === 1 ? "يوم" : current === 2 ? "يومان" : "أيّام"}</span>
    </div>
  );
}
