import { Calendar, Flame, Sparkles } from "lucide-react";
import Dialog from "../components/Dialog";
import { useApp } from "../context/AppContext";
import { useDailyWord } from "../hooks/useDailyWord";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatDateArabic(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function WordOfDayDialog({ open, onClose }: Props) {
  const { handleTranslate, extendedStats } = useApp();
  const daily = useDailyWord();

  const handleLearn = () => {
    handleTranslate(daily.word);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="كلمة اليوم"
      icon={<Calendar className="w-5 h-5 text-yellow-300" />}
    >
      <div className="space-y-4">
        <p className="text-xs text-purple-200/80">
          {formatDateArabic(daily.date)}
        </p>

        <div className="bg-gradient-to-br from-yellow-400/20 via-orange-400/15 to-pink-400/20 border border-yellow-300/40 rounded-2xl p-6 text-center">
          <div className="text-6xl mb-3 leading-none">{daily.emoji}</div>
          <div className="text-2xl font-bold text-white">{daily.word}</div>
          <p className="text-sm text-purple-100/80 mt-2">
            تعلّم هذه الكلمة اليوم!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300 shrink-0" />
            <div>
              <div className="text-xs text-purple-200/80">السلسلة الحالية</div>
              <div className="text-lg font-bold text-orange-200">
                {extendedStats.currentStreak} يوم
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
            <div>
              <div className="text-xs text-purple-200/80">أطول سلسلة</div>
              <div className="text-lg font-bold text-yellow-200">
                {extendedStats.longestStreak} يوم
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLearn}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-bold py-3 rounded-xl shadow-lg transition"
        >
          ترجم هذه الكلمة الآن
        </button>

        <p className="text-xs text-purple-200/70 text-center">
          كل ترجمة في يوم جديد تزيد سلسلتك. حافظ على نشاطك اليومي 🔥
        </p>
      </div>
    </Dialog>
  );
}
