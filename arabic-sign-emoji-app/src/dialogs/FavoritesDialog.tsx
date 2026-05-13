import { Star } from "lucide-react";
import Dialog from "../components/Dialog";
import { useApp } from "../context/AppContext";
import type { TranslationResult } from "../translator";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FavoritesDialog({ open, onClose }: Props) {
  const { favorites, toggleFavorite, setInput, setResult } = useApp();

  function handlePick(item: TranslationResult) {
    setInput(item.input);
    setResult(item);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="المفضلة"
      icon={<Star className="w-5 h-5 text-yellow-300" />}
      maxWidth="max-w-2xl"
    >
      {favorites.length === 0 ? (
        <div className="text-center py-10 text-purple-200 text-sm">
          لا توجد ترجمات في المفضلة بعد
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {favorites.map((item, idx) => (
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
                  <div className="text-2xl break-words">{item.emojiString}</div>
                </div>
                <button
                  onClick={() => toggleFavorite(item)}
                  className="text-yellow-300 hover:text-yellow-400 text-2xl"
                  aria-label="إزالة من المفضلة"
                >
                  ★
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
