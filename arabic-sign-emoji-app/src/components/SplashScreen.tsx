import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const tick = 25;
    const step = 100 / (duration / tick);
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + step + Math.random() * 0.5;
        if (next >= 100) {
          clearInterval(id);
          setTimeout(onComplete, 400);
          return 100;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800 text-white p-4"
    >
      <div className="text-6xl mb-4 animate-bounce">🤟</div>
      <h1 className="text-3xl font-bold mb-2">مترجم لغة الإشارة</h1>
      <p className="text-purple-200 mb-8 text-center">
        ترجمة النص العربي إلى لغة الإشارة بالإيموجي
      </p>
      <div className="w-64 max-w-full">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-150"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>
        <div className="mt-3 text-center text-sm text-purple-200">
          {Math.round(progress)}%
        </div>
        <div className="mt-1 text-center text-xs text-purple-300/70">
          🔤 تحميل قاموس الكلمات العربية...
        </div>
      </div>
      <div className="absolute bottom-4 text-xs text-purple-200/60">
        تم التطوير بواسطة Ali
      </div>
    </div>
  );
}
