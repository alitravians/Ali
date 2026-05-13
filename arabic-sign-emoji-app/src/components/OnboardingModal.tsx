import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { onboardingSteps } from "../data/onboardingSteps";

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [page, setPage] = useState(0);
  const total = onboardingSteps.length;
  const step = onboardingSteps[page];
  const isLast = page === total - 1;
  const isFirst = page === 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setPage((p) => Math.min(p + 1, total - 1));
      if (e.key === "ArrowRight") setPage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  const handleNext = () => {
    if (isLast) onClose();
    else setPage((p) => Math.min(p + 1, total - 1));
  };

  const handlePrev = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="جولة تعريفية"
    >
      <div className="w-full max-w-md bg-gradient-to-br from-purple-700 via-purple-800 to-pink-700 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <span className="text-white/70 text-sm">
            {page + 1} / {total}
          </span>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded transition"
            aria-label="تخطي الجولة"
            title="تخطي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-8 text-center min-h-[260px] flex flex-col justify-center">
          <div className="text-6xl mb-4" aria-hidden="true">
            {step.emoji}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            {step.title}
          </h2>
          <p className="text-white/90 text-base leading-relaxed">
            {step.content}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pb-2">
          {onboardingSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`الانتقال للصفحة ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === page ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-black/20">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-white/90 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-5 py-2 rounded-lg bg-white text-purple-700 font-bold hover:bg-white/90 transition"
          >
            <span>{isLast ? "ابدأ الاستخدام" : "التالي"}</span>
            {!isLast && <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
