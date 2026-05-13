import { Calendar, Flame } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useDailyWord } from "../hooks/useDailyWord";

export default function WordOfDayCard() {
  const { handleTranslate, extendedStats } = useApp();
  const daily = useDailyWord();

  return (
    <section
      className="bg-gradient-to-r from-yellow-400/15 via-orange-400/10 to-pink-400/15 border border-yellow-300/30 rounded-2xl p-4 shadow-lg flex items-center gap-4"
      aria-label="كلمة اليوم"
    >
      <div className="text-5xl shrink-0 leading-none" aria-hidden>
        {daily.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] text-yellow-200/90 mb-0.5">
          <Calendar className="w-3 h-3" />
          كلمة اليوم
        </div>
        <div className="text-lg font-bold text-white truncate">
          {daily.word}
        </div>
        <button
          type="button"
          onClick={() => handleTranslate(daily.word)}
          className="mt-1 text-xs text-yellow-200 hover:text-yellow-100 underline-offset-2 hover:underline"
        >
          ترجمها الآن
        </button>
      </div>
      {extendedStats.currentStreak > 0 && (
        <div
          className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-400/40"
          aria-label={`سلسلة ${extendedStats.currentStreak} يوم`}
        >
          <Flame className="w-4 h-4 text-orange-300" />
          <span className="text-sm font-bold text-orange-100">
            {extendedStats.currentStreak}
          </span>
        </div>
      )}
    </section>
  );
}
