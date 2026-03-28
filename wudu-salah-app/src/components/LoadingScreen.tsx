import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جارٍ تحميل المحتوى...');
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300);
    setTimeout(() => setShowSubtitle(true), 800);
  }, []);

  useEffect(() => {
    const stages = [
      { target: 12, text: 'جارٍ تحميل المحتوى...' },
      { target: 28, text: 'تحضير دروس الوضوء...' },
      { target: 45, text: 'تحضير دروس الصلاة...' },
      { target: 62, text: 'تحميل الأذكار والاختبارات...' },
      { target: 80, text: 'إعداد واجهة التطبيق...' },
      { target: 95, text: 'اللمسات الأخيرة...' },
      { target: 100, text: 'جاهز!' },
    ];

    let currentStage = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        setTimeout(() => setFadeOut(true), 300);
        setTimeout(onComplete, 900);
        return;
      }

      const stage = stages[currentStage];
      const remaining = stage.target - currentProgress;
      const step = Math.max(0.5, remaining * 0.08 + Math.random() * 1.5);
      currentProgress = Math.min(currentProgress + step, stage.target);
      setProgress(Math.round(currentProgress));
      setStatusText(stage.text);

      if (currentProgress >= stage.target) {
        currentStage++;
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #021B13 0%, #064A35 30%, #0D6B4F 60%, #0A5C43 100%)',
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease-out',
    }}>
      {/* Animated background particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            borderRadius: '50%',
            background: `rgba(255, 215, 0, ${0.05 + Math.random() * 0.1})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-float ${5 + Math.random() * 10}s linear infinite`,
            animationDelay: `${-Math.random() * 10}s`,
          }} />
        ))}
      </div>

      {/* Geometric pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `
          linear-gradient(30deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%),
          linear-gradient(150deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%),
          linear-gradient(30deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%),
          linear-gradient(150deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%)
        `,
        backgroundSize: '80px 140px',
        backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px',
      }} />

      {/* Rotating rings */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        border: '1px solid rgba(255,215,0,0.08)',
        borderRadius: '50%',
        animation: 'rotate-ring 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '340px',
        height: '340px',
        border: '1px solid rgba(255,215,0,0.05)',
        borderRadius: '50%',
        animation: 'rotate-ring 25s linear infinite reverse',
      }} />

      {/* Glowing backdrop */}
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 40%, transparent 70%)',
        animation: 'pulse-glow 3s ease-in-out infinite',
      }} />

      {/* Mosque icon */}
      <div style={{
        fontSize: '90px',
        marginBottom: '12px',
        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
        animation: 'float-icon 3s ease-in-out infinite',
        position: 'relative',
        zIndex: 1,
      }}>
        🕌
      </div>

      {/* App title with slide-in */}
      <h1 style={{
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '4px',
        textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
        opacity: showTitle ? 1 : 0,
        transform: showTitle ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        تعلم الوضوء والصلاة
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: '15px',
        marginBottom: '10px',
        position: 'relative',
        zIndex: 1,
        opacity: showSubtitle ? 1 : 0,
        transform: showSubtitle ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        للأطفال والكبار
      </p>

      {/* Beta badge */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '3px 16px',
        borderRadius: '999px',
        marginBottom: '35px',
        position: 'relative',
        zIndex: 1,
        opacity: showSubtitle ? 1 : 0,
        transform: showSubtitle ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
        boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
      }}>
        الإصدار التجريبي
      </div>

      {/* Progress container */}
      <div style={{
        width: '280px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Circular progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
          }}>
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.15s ease-out', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5))' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFA500" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{
                color: '#FFD700',
                fontSize: '22px',
                fontWeight: 'bold',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 8px rgba(255,215,0,0.3)',
              }}>
                {progress}
              </span>
              <span style={{
                color: 'rgba(255,215,0,0.7)',
                fontSize: '10px',
                marginTop: '-2px',
              }}>%</span>
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          marginBottom: '12px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
            backgroundSize: '200% 100%',
            animation: 'gradient-move 2s linear infinite',
            boxShadow: '0 0 15px rgba(255,215,0,0.5), 0 0 5px rgba(255,215,0,0.8)',
            transition: 'width 0.15s ease-out',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '999px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <span style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            transition: 'all 0.3s ease',
          }}>
            {statusText}
          </span>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '16px',
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: i <= Math.floor(progress / 20) ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.4s ease',
              boxShadow: i <= Math.floor(progress / 20) ? '0 0 6px rgba(255,215,0,0.4)' : 'none',
              animation: i <= Math.floor(progress / 20) ? `dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite` : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Bottom credit */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 1,
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '11px',
        }}>
          تم برمجة و تطوير بواسطة <span style={{
            fontWeight: 'bold',
            animation: 'credit-color 3s ease-in-out infinite',
          }}>Ali</span>
        </p>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.03); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.8); }
          40% { transform: scale(1.3); }
        }
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particle-float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes credit-color {
          0%, 100% { color: rgba(255,215,0,0.6); }
          33% { color: rgba(52,211,153,0.6); }
          66% { color: rgba(139,92,246,0.6); }
        }
      `}</style>
    </div>
  );
}
