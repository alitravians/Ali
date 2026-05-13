import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, BookOpen, Send, History, Star, Sparkles, Info, X } from "lucide-react";
import SplashScreen from "./components/SplashScreen";
import PrivacyAgreement from "./components/PrivacyAgreement";
import TranslationView from "./components/TranslationView";
import CategoriesPanel from "./components/CategoriesPanel";
import HistoryPanel from "./components/HistoryPanel";
import { translate, type TranslationResult } from "./translator";
import {
  loadAgreed,
  loadDarkMode,
  loadFavorites,
  loadHistory,
  loadStats,
  saveAgreed,
  saveDarkMode,
  saveFavorites,
  saveHistory,
  saveStats,
} from "./storage";
import { changelog } from "./data/changelog";

type Stage = "splash" | "privacy" | "app";
type SidePanel = "categories" | "history" | "favorites";

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

export default function App() {
  const [stage, setStage] = useState<Stage>("splash");
  const [dark, setDark] = useState(loadDarkMode());
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>(loadHistory());
  const [favorites, setFavorites] = useState<TranslationResult[]>(loadFavorites());
  const [stats, setStats] = useState(loadStats());
  const [side, setSide] = useState<SidePanel>("categories");
  const [showUpdates, setShowUpdates] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    saveDarkMode(dark);
  }, [dark]);

  useEffect(() => {
    if (stage === "splash") return;
    const agreed = loadAgreed();
    if (!agreed) setStage("privacy");
    else setStage("app");
  }, [stage]);

  const favoritesSet = useMemo(
    () => new Set(favorites.map((f) => f.input)),
    [favorites]
  );

  function persistHistory(next: TranslationResult[]) {
    setHistory(next);
    saveHistory(next);
  }

  function persistFavorites(next: TranslationResult[]) {
    setFavorites(next);
    saveFavorites(next);
  }

  function handleTranslate(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    const r = translate(value);
    setResult(r);
    setInput(value);
    const filtered = history.filter((h) => h.input !== value);
    persistHistory([r, ...filtered].slice(0, 200));
    const nextStats = {
      totalTranslations: stats.totalTranslations + 1,
      totalWords: stats.totalWords + r.tokens.length,
    };
    setStats(nextStats);
    saveStats(nextStats);
  }

  function toggleFavorite(item: TranslationResult) {
    const exists = favorites.some((f) => f.input === item.input);
    const next = exists
      ? favorites.filter((f) => f.input !== item.input)
      : [item, ...favorites];
    persistFavorites(next);
  }

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

  if (stage === "splash") {
    return <SplashScreen onComplete={() => setStage("privacy")} />;
  }

  if (stage === "privacy") {
    return (
      <PrivacyAgreement
        onAgree={() => {
          saveAgreed(true);
          setStage("app");
        }}
      />
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800 dark:from-black dark:via-zinc-900 dark:to-zinc-800 text-white"
    >
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤟</div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">مترجم لغة الإشارة</h1>
              <p className="text-purple-200 text-xs">
                ترجمة النص العربي إلى لغة الإشارة بالإيموجي
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdates(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="آخر التحديثات"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="الوضع الداكن"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

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
            placeholder="اكتب هنا... مثال: السلام عليكم، كيف حالك؟ (اضغط Enter للترجمة)"
            className="w-full min-h-[100px] rounded-xl bg-white/5 border border-white/10 focus:border-pink-400 outline-none p-3 text-white placeholder:text-purple-300/60 resize-y"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTranslate()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 font-semibold shadow-lg transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              ترجم إلى لغة الإشارة
            </button>
            <button
              onClick={() => {
                setInput("");
                setResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition flex items-center gap-1"
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
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
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
                <div className="text-lg font-semibold mb-1">
                  ابدأ بكتابة نص عربي
                </div>
                <div className="text-sm">سترى الترجمة هنا بالإيموجي وحركات اليد</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex bg-white/5 backdrop-blur rounded-xl p-1">
              <button
                onClick={() => setSide("categories")}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition ${
                  side === "categories" ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <BookOpen className="w-4 h-4" /> التصنيفات
              </button>
              <button
                onClick={() => setSide("history")}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition ${
                  side === "history" ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <History className="w-4 h-4" /> السجل
              </button>
              <button
                onClick={() => setSide("favorites")}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition ${
                  side === "favorites" ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <Star className="w-4 h-4" /> المفضلة
              </button>
            </div>

            {side === "categories" && (
              <CategoriesPanel onPick={(w) => handleTranslate(w)} />
            )}
            {side === "history" && (
              <HistoryPanel
                title="سجل الترجمات"
                items={history}
                favoritesSet={favoritesSet}
                onPick={(it) => {
                  setInput(it.input);
                  setResult(it);
                }}
                onToggleFavorite={toggleFavorite}
                onDelete={(it) =>
                  persistHistory(history.filter((h) => h.input !== it.input))
                }
                emptyMessage="لا يوجد سجل بعد — ابدأ بترجمة كلمة!"
              />
            )}
            {side === "favorites" && (
              <HistoryPanel
                title="المفضلة"
                items={favorites}
                favoritesSet={favoritesSet}
                onPick={(it) => {
                  setInput(it.input);
                  setResult(it);
                }}
                onToggleFavorite={toggleFavorite}
                emptyMessage="لا توجد ترجمات في المفضلة بعد"
              />
            )}
          </div>
        </div>

        <footer className="text-center text-xs text-purple-200/70 py-4">
          تم التطوير بواسطة Ali · مترجم لغة الإشارة العربية
        </footer>
      </div>

      {showUpdates && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowUpdates(false)}
        >
          <div
            className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-white/20 rounded-2xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">آخر التحديثات</h2>
              <button
                onClick={() => setShowUpdates(false)}
                className="p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {changelog.map((entry) => (
                <div key={entry.id} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">v{entry.version}</span>
                    <span className="text-xs text-purple-200">{entry.date}</span>
                  </div>
                  <ul className="text-sm space-y-1 list-disc pr-5 text-purple-100">
                    {entry.changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
