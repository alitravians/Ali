import { useEffect } from "react";
import { X } from "lucide-react";
import type { Achievement } from "../data/achievements";

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(t);
  }, [achievement.id, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 inset-x-0 z-[60] flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md w-[92%] sm:w-auto bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-[slideDown_0.35s_ease-out]">
        <div className="text-3xl shrink-0" aria-hidden>
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-xs">🎉 إنجاز جديد!</p>
          <p className="font-bold text-base truncate">{achievement.name}</p>
          <p className="text-white/85 text-xs truncate">
            {achievement.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="text-white/80 hover:text-white shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
