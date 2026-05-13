import { BarChart3 } from "lucide-react";
import Dialog from "../components/Dialog";
import { useApp } from "../context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function StatsDialog({ open, onClose }: Props) {
  const { stats, extendedStats } = useApp();
  const maxWeekly = Math.max(1, ...extendedStats.weeklyActivity);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="الإحصائيات"
      icon={<BarChart3 className="w-5 h-5" />}
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">
            {stats.totalTranslations}
          </div>
          <div className="text-xs text-purple-200 mt-1">إجمالي الترجمات</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{stats.totalWords}</div>
          <div className="text-xs text-purple-200 mt-1">إجمالي الكلمات</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-300">
            {extendedStats.currentStreak}
          </div>
          <div className="text-xs text-purple-200 mt-1">السلسلة الحالية 🔥</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-300">
            {extendedStats.longestStreak}
          </div>
          <div className="text-xs text-purple-200 mt-1">أطول سلسلة</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">النشاط الأسبوعي</h3>
        <div className="flex items-end justify-between gap-1 h-32">
          {extendedStats.weeklyActivity.map((value, i) => {
            const height = Math.max(4, (value / maxWeekly) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-pink-500 to-purple-400 transition-all"
                  style={{ height: `${height}%` }}
                  title={`${value} ترجمة`}
                />
                <div className="text-[10px] text-purple-200">
                  {DAY_LABELS[i].slice(0, 3)}
                </div>
                <div className="text-[10px] text-white font-semibold">{value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
