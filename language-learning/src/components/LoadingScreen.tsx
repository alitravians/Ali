"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate progress over time
        const increment = prev < 60 ? 4 : prev < 85 ? 3 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // Start fade out after progress completes
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 300);

      // Remove loading screen after fade animation
      const removeTimer = setTimeout(() => {
        setLoading(false);
      }, 1000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [progress]);

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Loading Screen */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
          fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 30%, #a21caf 70%, #c026d3 100%)",
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, white 0%, transparent 70%)",
              top: "-10%",
              right: "-5%",
              animation: "floatSlow 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, white 0%, transparent 70%)",
              bottom: "-15%",
              left: "-10%",
              animation: "floatSlow 8s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full opacity-5"
            style={{
              background: "radial-gradient(circle, white 0%, transparent 70%)",
              top: "40%",
              left: "30%",
              animation: "floatSlow 6s ease-in-out infinite 2s",
            }}
          />
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                opacity: 0.15 + (i % 3) * 0.1,
                left: `${8 + i * 8}%`,
                top: `${10 + (i % 4) * 22}%`,
                animation: `particleFloat ${3 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center px-6">
          {/* Logo icon with glow */}
          <div
            className="mx-auto mb-8 relative"
            style={{ animation: "logoReveal 1s ease-out forwards" }}
          >
            <div
              className="w-28 h-28 mx-auto rounded-3xl flex items-center justify-center shadow-2xl relative"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px)",
                border: "2px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              <span className="text-6xl" style={{ animation: "iconPulse 2s ease-in-out infinite" }}>
                🌍
              </span>
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 w-28 h-28 mx-auto rounded-3xl"
              style={{
                boxShadow: "0 0 60px rgba(255, 255, 255, 0.2), 0 0 120px rgba(196, 38, 211, 0.15)",
                animation: "glowPulse 2s ease-in-out infinite",
              }}
            />
          </div>

          {/* App name */}
          <h1
            className="text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight"
            style={{ animation: "textReveal 0.8s ease-out 0.3s both" }}
          >
            LinguaMaster
          </h1>

          {/* Tagline */}
          <p
            className="text-xl md:text-2xl text-white/80 mb-12 font-light"
            style={{ animation: "textReveal 0.8s ease-out 0.5s both" }}
          >
            منصة تعلم اللغات الاحترافية
          </p>

          {/* Progress bar */}
          <div
            className="w-64 md:w-80 mx-auto"
            style={{ animation: "textReveal 0.8s ease-out 0.7s both" }}
          >
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255, 255, 255, 0.15)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-100 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,1))",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)",
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-white/60 text-sm">جاري تحميل المنصة...</p>
              <p className="text-white/60 text-sm font-mono" dir="ltr">
                {progress}%
              </p>
            </div>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-white/40 rounded-full"
                style={{
                  animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content (hidden during loading, shown after) */}
      <div className={fadeOut ? "opacity-100 transition-opacity duration-500" : "opacity-0"}>
        {children}
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
          50% { transform: translateY(-35px) translateX(-5px); opacity: 0.15; }
          75% { transform: translateY(-15px) translateX(15px); opacity: 0.25; }
        }

        @keyframes logoReveal {
          from { opacity: 0; transform: scale(0.5) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes textReveal {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
