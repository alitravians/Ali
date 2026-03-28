import { useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface WelcomePageProps {
  onContinue: () => void;
}

export default function WelcomePage({ onContinue }: WelcomePageProps) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '🕌',
      title: 'مرحباً بك في الإصدار التجريبي!',
      description: 'شكراً لانضمامك كمختبر لتطبيق تعلم الوضوء والصلاة. مساهمتك تساعدنا في تحسين التطبيق وتقديم تجربة أفضل للجميع.',
      highlight: 'أنت جزء مهم من فريق التطوير',
    },
    {
      icon: '📱',
      title: 'ماذا يحتوي التطبيق؟',
      description: 'التطبيق يشمل تعليم الوضوء والصلاة خطوة بخطوة، أذكار، اختبارات تفاعلية، وأقسام مخصصة للأطفال والكبار.',
      features: [
        { emoji: '💧', text: 'تعلم الوضوء الصحيح' },
        { emoji: '🤲', text: 'تعلم الصلاة بالتفصيل' },
        { emoji: '📖', text: 'أذكار بعد الوضوء والصلاة' },
        { emoji: '📝', text: 'اختبارات تفاعلية' },
        { emoji: '👶', text: 'قسم خاص للأطفال' },
      ],
    },
    {
      icon: '🔍',
      title: 'كيف تساعدنا؟',
      description: 'نحتاج ملاحظاتك القيّمة لتحسين التطبيق قبل إطلاقه رسمياً.',
      tips: [
        'جرّب جميع أقسام التطبيق',
        'لاحظ أي أخطاء أو مشاكل في الاستخدام',
        'شاركنا رأيك في التصميم والمحتوى',
        'اقترح أي تحسينات أو إضافات تراها مناسبة',
      ],
    },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      localStorage.setItem('wudu_welcome_seen', 'true');
      onContinue();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, onContinue]);

  const goPrev = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const skipWelcome = useCallback(() => {
    localStorage.setItem('wudu_welcome_seen', 'true');
    onContinue();
  }, [onContinue]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      background: isDark
        ? 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(160deg, #f0fdfa 0%, #e0f2fe 50%, #f0f9ff 100%)',
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        top: '-80px',
        right: '-80px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
        bottom: '-60px',
        left: '-60px',
        pointerEvents: 'none',
      }} />

      {/* Beta badge */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff',
        padding: '6px 16px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        نسخة تجريبية BETA
      </div>

      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 24px',
        position: 'relative',
        zIndex: 1,
        minHeight: 0,
      }}>
        {/* Icon */}
        <div style={{
          fontSize: '64px',
          marginBottom: '16px',
          animation: 'welcome-bounce 2s ease-in-out infinite',
          flexShrink: 0,
        }}>
          {step.icon}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: isDark ? '#f1f5f9' : '#1e293b',
          marginBottom: '10px',
          textAlign: 'center',
          lineHeight: 1.5,
          flexShrink: 0,
        }}>
          {step.title}
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '14px',
          color: isDark ? '#94a3b8' : '#64748b',
          textAlign: 'center',
          lineHeight: 1.8,
          maxWidth: '340px',
          marginBottom: '16px',
          flexShrink: 0,
        }}>
          {step.description}
        </p>

        {/* Step 0: Highlight */}
        {step.highlight && (
          <div style={{
            background: isDark
              ? 'rgba(6,182,212,0.15)'
              : 'rgba(6,182,212,0.1)',
            border: `1px solid ${isDark ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.2)'}`,
            borderRadius: '12px',
            padding: '12px 20px',
            color: isDark ? '#22d3ee' : '#0891b2',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            ⭐ {step.highlight}
          </div>
        )}

        {/* Step 1: Features list */}
        {step.features && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '300px',
            flexShrink: 0,
          }}>
            {step.features.map((f, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                padding: '8px 14px',
                borderRadius: '12px',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                animation: `feature-slide 0.4s ease-out ${i * 0.1}s both`,
              }}>
                <span style={{ fontSize: '20px' }}>{f.emoji}</span>
                <span style={{
                  fontSize: '13px',
                  color: isDark ? '#e2e8f0' : '#334155',
                  fontWeight: '500',
                }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Tips */}
        {step.tips && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '100%',
            maxWidth: '320px',
            flexShrink: 0,
          }}>
            {step.tips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '6px 0',
                animation: `feature-slide 0.4s ease-out ${i * 0.1}s both`,
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669, #34d399)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontSize: '13px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: 1.6,
                  paddingTop: '2px',
                }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section - fixed at bottom, always accessible */}
      <div style={{
        padding: '16px 24px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        background: isDark
          ? 'linear-gradient(to top, #1e293b 60%, transparent)'
          : 'linear-gradient(to top, #f0f9ff 60%, transparent)',
      }}>
        {/* Step indicators */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
        }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === currentStep ? '24px' : '8px',
              height: '8px',
              borderRadius: '999px',
              background: i === currentStep
                ? 'linear-gradient(90deg, #0891b2, #06b6d4)'
                : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
        }}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goPrev}
              onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                background: 'transparent',
                color: isDark ? '#e2e8f0' : '#475569',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              السابق
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
            style={{
              flex: currentStep > 0 ? 1 : undefined,
              width: currentStep === 0 ? '100%' : undefined,
              padding: '14px 28px',
              borderRadius: '14px',
              border: 'none',
              background: isLast
                ? 'linear-gradient(135deg, #059669, #34d399)'
                : 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: isLast
                ? '0 4px 12px rgba(5,150,105,0.3)'
                : '0 4px 12px rgba(8,145,178,0.3)',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            {isLast ? 'ابدأ الاستكشاف 🚀' : 'التالي'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            type="button"
            onClick={skipWelcome}
            onTouchEnd={(e) => { e.preventDefault(); skipWelcome(); }}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#64748b' : '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '8px 16px',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            تخطي المقدمة
          </button>
        )}
      </div>

      <style>{`
        @keyframes welcome-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes feature-slide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
