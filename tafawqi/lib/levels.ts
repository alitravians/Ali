// نظام المستويات والشارات
// كل مستوى يحتاج إلى مجموع معين من النقاط

export const LEVELS = [
  { id: 0, name: "مبتدئة", icon: "🌱", min: 0, color: "#94a3b8" },
  { id: 1, name: "متعلِّمة", icon: "📖", min: 50, color: "#06b6d4" },
  { id: 2, name: "مجتهدة", icon: "✏️", min: 150, color: "#0ea5e9" },
  { id: 3, name: "ذكيّة", icon: "🧠", min: 300, color: "#6366f1" },
  { id: 4, name: "متفوِّقة", icon: "⭐", min: 500, color: "#8b5cf6" },
  { id: 5, name: "نجمة", icon: "🌟", min: 800, color: "#d946ef" },
  { id: 6, name: "نابغة", icon: "👑", min: 1200, color: "#ec4899" },
  { id: 7, name: "أسطورة", icon: "🏆", min: 2000, color: "#f59e0b" },
];

export function levelForPoints(points: number) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) cur = l;
  const next = LEVELS.find((l) => l.min > points);
  const progressInLevel = next ? (points - cur.min) / (next.min - cur.min) : 1;
  return { current: cur, next, progress: Math.min(1, Math.max(0, progressInLevel)) };
}

export function pointsForResult(correct: number, total: number, durationSec: number) {
  if (total === 0 || correct === 0) return 0;
  const base = correct * 10;
  const ratio = correct / total;
  const bonus = ratio === 1 ? 20 : ratio >= 0.8 ? 10 : 0;
  // Speed bonus only when at least ½ the answers are correct AND duration is plausibly fast
  const speed = ratio >= 0.5 && durationSec > 0 && durationSec < 60 ? 5 : 0;
  return base + bonus + speed;
}
