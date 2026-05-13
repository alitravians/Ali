import { History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import Dialog from "../components/Dialog";
import { useApp } from "../context/AppContext";
import type { TranslationResult } from "../translator";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryDialog({ open, onClose }: Props) {
  const { history, favoritesSet, toggleFavorite, deleteHistory, clearHistory, setInput, setResult } =
    useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return history;
    const q = query.trim();
    return history.filter(
      (h) =>
        h.input.includes(q) ||
        h.emojiString.includes(q) ||
        h.tokens.some((t) => t.word.includes(q))
    );
  }, [history, query]);

  function handlePick(item: TranslationResult) {
    setInput(item.input);
    setResult(item);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="سجل الترجمات"
      icon={<HistoryIcon className="w-5 h-5" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="البحث في السجل..."
              aria-label="البحث في سجل الترجمات"
              className="w-full bg-white/10 border border-white/20 rounded-lg pe-9 ps-3 py-2 text-white placeholder:text-purple-300/60 outline-none focus:border-pink-400 text-sm"
            />
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm("هل تريد مسح كل السجل؟")) clearHistory();
              }}
              className="px-3 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white text-sm"
            >
              مسح الكل
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-purple-200 text-sm">
            {history.length === 0
              ? "لا يوجد سجل بعد — ابدأ بترجمة كلمة!"
              : "لا توجد نتائج للبحث"}
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {filtered.map((item, idx) => (
              <div
                key={`${item.input}-${idx}`}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 cursor-pointer group transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handlePick(item)}
                  >
                    <div className="text-white font-semibold truncate">
                      {item.input}
                    </div>
                    <div className="text-2xl break-words">
                      {item.emojiString}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      onClick={() => toggleFavorite(item)}
                      className="text-yellow-300 hover:text-yellow-400 text-lg"
                      title="مفضلة"
                      aria-label="إضافة/إزالة من المفضلة"
                    >
                      {favoritesSet.has(item.input) ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => deleteHistory(item.input)}
                      className="text-red-300 hover:text-red-400"
                      title="حذف"
                      aria-label="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
