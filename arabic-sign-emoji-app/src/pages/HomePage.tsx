import { useState } from "react";
import { Send, X, Sparkles, Mic, MicOff, Volume2, Flame } from "lucide-react";
import { useApp } from "../context/AppContext";
import TranslationView from "../components/TranslationView";
import WordOfDayCard from "../components/WordOfDayCard";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { isSpeechSynthesisSupported, speak } from "../lib/speech";

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
    extendedStats,
  } = useApp();

  const [voiceError, setVoiceError] = useState<string | null>(null);
  const ttsSupported = isSpeechSynthesisSupported();

  const { supported: voiceSupported, listening, toggle: toggleVoice } = useVoiceInput({
    onTranscript: (transcript) => {
      setInput((input ? input + " " : "") + transcript);
      setVoiceError(null);
    },
    onError: (msg) => setVoiceError(msg),
  });

  function speakInput() {
    if (!input.trim()) return;
    speak(input, { onError: (msg) => setVoiceError(msg) });
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

  return (
    <div className="space-y-5">
      <WordOfDayCard />
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
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              aria-pressed={listening}
              title={listening ? "إيقاف التسجيل الصوتي" : "إدخال صوتي"}
              aria-label={listening ? "إيقاف التسجيل الصوتي" : "تسجيل صوتي"}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1 text-white ${
                listening
                  ? "bg-red-500/80 hover:bg-red-500 animate-pulse"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {listening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span className="text-sm">{listening ? "يستمع..." : "صوت"}</span>
            </button>
          )}
          {ttsSupported && (
            <button
              onClick={speakInput}
              disabled={!input.trim()}
              title="نطق النص"
              aria-label="نطق النص"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-1 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">نطق</span>
            </button>
          )}
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
          <div className="ms-auto text-xs text-purple-200 flex items-center gap-2">
            {extendedStats.currentStreak > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-100"
                title={`سلسلة ${extendedStats.currentStreak} يوم`}
              >
                <Flame className="w-3 h-3" />
                {extendedStats.currentStreak}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              ترجمات: {stats.totalTranslations} · كلمات: {stats.totalWords}
            </span>
          </div>
        </div>

        {voiceError && (
          <div
            role="alert"
            className="mt-3 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-100 text-sm flex items-start justify-between gap-2"
          >
            <span>{voiceError}</span>
            <button
              onClick={() => setVoiceError(null)}
              aria-label="إخفاء التنبيه"
              className="text-red-100/70 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

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
