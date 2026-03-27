import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('جارٍ تحميل المحتوى...');

  useEffect(() => {
    const stages = [
      { target: 15, text: 'جارٍ تحميل المحتوى...' },
      { target: 35, text: 'تحضير دروس الوضوء...' },
      { target: 55, text: 'تحضير دروس الصلاة...' },
      { target: 75, text: 'تحميل الأذكار والاختبارات...' },
      { target: 90, text: 'إعداد واجهة التطبيق...' },
      { target: 100, text: 'جاهز!' },
    ];

    let currentStage = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
        return;
      }

      const stage = stages[currentStage];
      const step = Math.random() * 3 + 1;
      currentProgress = Math.min(currentProgress + step, stage.target);
      setProgress(Math.round(currentProgress));
      setStatusText(stage.text);

      if (currentProgress >= stage.target) {
        currentStage++;
      }
    }, 50);

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
      background: 'linear-gradient(135deg, #064A35 0%, #0D6B4F 40%, #1B8A6B 100%)',
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage: `repeating-conic-gradient(rgba(255,255,255,0.1) 0% 25%, transparent 0% 50%)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Glowing circle behind icon */}
      <div style={{
        position: 'absolute',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -65%)',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }} />

      {/* Mosque icon */}
      <div style={{
        fontSize: '80px',
        marginBottom: '16px',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        animation: 'float-icon 3s ease-in-out infinite',
        position: 'relative',
        zIndex: 1,
      }}>
        🕌
      </div>

      {/* App title */}
      <h1 style={{
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '6px',
        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        تعلم الوضوء والصلاة
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        marginBottom: '40px',
        position: 'relative',
        zIndex: 1,
      }}>
        الإصدار التجريبي
      </p>

      {/* Progress container */}
      <div style={{
        width: '260px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Progress percentage */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
          }}>
            {statusText}
          </span>
          <span style={{
            color: '#FFD700',
            fontSize: '18px',
            fontWeight: 'bold',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {progress}%
          </span>
        </div>

        {/* Progress bar track */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '999px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}>
          {/* Progress bar fill */}
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            transition: 'width 0.15s ease-out',
            position: 'relative',
          }}>
            {/* Shimmer effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '999px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Dots animation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px',
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,215,0,0.6)',
              animation: `dot-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: translate(-50%, -65%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -65%) scale(1.1); opacity: 0.7; }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
