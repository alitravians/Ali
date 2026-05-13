import { BookOpen } from "lucide-react";
import Dialog from "../components/Dialog";
import { categories } from "../data/categories";
import { useApp } from "../context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CategoriesDialog({ open, onClose }: Props) {
  const { handleTranslate } = useApp();

  function pick(word: string) {
    handleTranslate(word);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="تصنيفات الكلمات"
      icon={<BookOpen className="w-5 h-5" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2 text-white font-bold">
              <span className="text-xl">{cat.emoji}</span>
              <span>{cat.name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.words.map((w) => (
                <button
                  key={w}
                  onClick={() => pick(w)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
