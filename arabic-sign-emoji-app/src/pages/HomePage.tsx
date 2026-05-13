import { Send, X, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import TranslationView from "../components/TranslationView";

const QUICK_PHRASES = [
  "السلام عليكم",
  "كيف حالك",
  "شكراً جزيلاً",
  "أحبك",
  "مع السلامة",
  "صباح الخير",
  "أنا سعيد",
  "ساعدني",
];

export default function HomePage() {
  const {
    input,
    setInput,
    result,
    setResult,
    handleTranslate,
    toggleFavorite,
    favoritesSet,
    stats,
  } = useApp();

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result.emojiString).catch(() => {});
  }

  function shareResult() {
    if (!result) return;
    const text = `${result.input}\n${result.emojiString}\n\nمترجم لغة الإشارة`;
    if (navigator.share) {
      navigator.share({ title: "مترجم لغة الإشارة", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
        <label className="block text-sm text-purple-200 mb-2">
          اكتب النص العربي
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTranslate();
            }
          }}
          aria-label="أدخل النص العربي للترجمة إلى لغة الإشارة"
          placeholder="اكتب هنا... مثال: السلام عليكم، كيف حالك؟ (اضغط Enter للترجمة)"
          className="w-full min-h-[100px] rounded-xl bg-white/5 border border-white/10 focus:border-pink-400 outline-none p-3 text-white placeholder:text-purple-300/60 resize-y"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTranslate()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 font-semibold shadow-lg transition flex items-center gap-2 text-white"
          >
            <Send className="w-4 h-4" />
            ترجم إلى لغة الإشارة
          </button>
          <button
            onClick={() => {
              setInput("");
              setResult(null);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition flex items-center gap-1 text-white"
          >
            <X className="w-4 h-4" />
            مسح
          </button>
          <div className="ms-auto text-xs text-purple-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            ترجمات: {stats.totalTranslations} · كلمات: {stats.totalWords}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-purple-200 mb-2">عبارات سريعة</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PHRASES.map((q) => (
              <button
                key={q}
                onClick={() => handleTranslate(q)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs transition text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {result ? (
        <TranslationView
          result={result}
          isFavorite={favoritesSet.has(result.input)}
          onToggleFavorite={() => toggleFavorite(result)}
          onCopy={copyResult}
          onShare={shareResult}
        />
      ) : (
        <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-10 text-center text-purple-200 shadow-2xl">
          <div className="text-5xl mb-3">✍️</div>
          <div className="text-lg font-semibold mb-1">ابدأ بكتابة نص عربي</div>
          <div className="text-sm">
            سترى الترجمة هنا بالإيموجي وحركات اليد
          </div>
        </div>
      )}
    </div>
  );
}
