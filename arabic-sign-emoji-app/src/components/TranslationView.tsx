import { Copy, Share2, Star } from "lucide-react";
import type { TranslationResult } from "../translator";
import { handSigns } from "../data/handSigns";

interface Props {
  result: TranslationResult;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export default function TranslationView({
  result,
  isFavorite,
  onToggleFavorite,
  onCopy,
  onShare,
}: Props) {
  return (
    <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white">الترجمة</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Star
              className={`w-4 h-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
          </button>
          <button
            onClick={onCopy}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="نسخ"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onShare}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-3xl text-center py-6 leading-loose break-words">
        {result.emojiString || "—"}
      </div>

      <div className="mt-3 space-y-2">
        {result.tokens.map((t, i) => {
          const sign = handSigns[t.emoji];
          return (
            <div
              key={i}
              className="flex items-center justify-between bg-white/5 rounded-lg p-3 text-white text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <div className="font-semibold">{t.word}</div>
                  {t.fingerSpelled && (
                    <div className="text-xs text-purple-200">
                      تهجئة بالأصابع (كلمة غير معروفة)
                    </div>
                  )}
                  {sign && (
                    <div className="text-xs text-purple-200">{sign.description}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
