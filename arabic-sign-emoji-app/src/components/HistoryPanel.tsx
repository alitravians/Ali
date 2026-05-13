import { Star, Trash2 } from "lucide-react";
import type { TranslationResult } from "../translator";

interface Props {
  title: string;
  items: TranslationResult[];
  favoritesSet: Set<string>;
  onPick: (item: TranslationResult) => void;
  onToggleFavorite: (item: TranslationResult) => void;
  onDelete?: (item: TranslationResult) => void;
  emptyMessage: string;
}

export default function HistoryPanel({
  title,
  items,
  favoritesSet,
  onPick,
  onToggleFavorite,
  onDelete,
  emptyMessage,
}: Props) {
  return (
    <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
      <h3 className="font-bold text-white mb-3">{title}</h3>
      {items.length === 0 ? (
        <div className="text-purple-200 text-sm text-center py-6">{emptyMessage}</div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {items.map((it) => (
            <div
              key={it.timestamp + "_" + it.input}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-white text-sm transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onPick(it)}
                  className="flex-1 text-right space-y-1"
                >
                  <div className="font-semibold break-words">{it.input}</div>
                  <div className="text-xl break-words">{it.emojiString}</div>
                </button>
                <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onToggleFavorite(it)}
                    className="p-1 rounded hover:bg-white/10"
                    title="مفضلة"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        favoritesSet.has(it.input)
                          ? "fill-yellow-400 text-yellow-400"
                          : ""
                      }`}
                    />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(it)}
                      className="p-1 rounded hover:bg-white/10"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
