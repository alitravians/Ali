import { categories } from "../data/categories";

interface Props {
  onPick: (word: string) => void;
}

export default function CategoriesPanel({ onPick }: Props) {
  return (
    <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
      <h3 className="font-bold text-white mb-3">تصنيفات الكلمات</h3>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {categories.map((c) => (
          <div key={c.id} className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-semibold text-white">{c.name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.words.map((w) => (
                <button
                  key={w}
                  onClick={() => onPick(w)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
