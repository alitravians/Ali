import { Sparkles, Trophy, Lock } from "lucide-react";
import { achievements, type Achievement } from "../data/achievements";
import { useApp } from "../context/AppContext";
import { progressFor } from "../lib/achievementEngine";

const TYPE_LABEL: Record<string, string> = {
  translations: "الترجمات",
  words: "الكلمات",
  streak: "السلسلة اليومية",
  quiz: "الاختبارات",
  training: "التدريب",
  favorites: "المفضلة",
};

const TYPE_ORDER = [
  "translations",
  "words",
  "streak",
  "quiz",
  "training",
  "favorites",
];

export default function AchievementsPage() {
  const { unlockedAchievements, extendedStats, trainingProgress, favorites } =
    useApp();

  const ctx = {
    extendedStats,
    trainingProgress,
    favoritesCount: favorites.length,
  };

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: achievements.filter((a) => a.type === type),
  }));

  const unlockedCount = Object.keys(unlockedAchievements).length;
  const total = achievements.length;
  const overallPct = Math.round((unlockedCount / total) * 100);

  return (
    <div className="space-y-6">
      <section className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <h1 className="text-2xl font-bold text-white">
            الإنجازات والمكافآت
          </h1>
        </div>
        <p className="text-sm text-purple-100/80 mb-4">
          أنجزت <span className="text-yellow-200 font-bold">{unlockedCount}</span>{" "}
          من <span className="text-yellow-200 font-bold">{total}</span> إنجاز
        </p>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="text-xs text-purple-200/80 text-left mt-1">
          {overallPct}%
        </div>
      </section>

      {grouped.map(({ type, items }) => (
        <section key={type} className="space-y-3">
          <h2 className="text-sm font-semibold text-purple-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            {TYPE_LABEL[type]}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                unlocked={!!unlockedAchievements[a.id]}
                unlockedAt={unlockedAchievements[a.id]?.unlockedAt}
                progress={progressFor(a, ctx)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface CardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: number;
  progress: { current: number; required: number; pct: number };
}

function AchievementCard({
  achievement,
  unlocked,
  unlockedAt,
  progress,
}: CardProps) {
  return (
    <div
      className={
        unlocked
          ? "bg-gradient-to-br from-yellow-400/20 via-orange-400/15 to-pink-400/15 border border-yellow-300/40 rounded-xl p-4"
          : "bg-white/5 border border-white/10 rounded-xl p-4 opacity-80"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-4xl shrink-0 ${unlocked ? "" : "grayscale opacity-50"}`}
          aria-hidden
        >
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white truncate">{achievement.name}</h3>
            {!unlocked && <Lock className="w-3 h-3 text-purple-300/70" />}
          </div>
          <p className="text-xs text-purple-100/80 mt-0.5">
            {achievement.description}
          </p>
          {unlocked ? (
            <p className="text-[11px] text-yellow-200 mt-2">
              ✓ تم الفتح
              {unlockedAt
                ? ` · ${new Date(unlockedAt).toLocaleDateString("ar-EG")}`
                : ""}
            </p>
          ) : (
            <div className="mt-2">
              <div className="flex justify-between text-[11px] text-purple-200/80 mb-1">
                <span>
                  {progress.current} / {progress.required}
                </span>
                <span>{progress.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
