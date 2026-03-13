import { useState } from 'react';
import { MessageSquareReply, Zap, Shield, Bell, ChevronLeft, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: MessageSquareReply,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'مرحباً بك',
    subtitle: 'في تطبيق الردود التلقائية لواتساب',
    description: 'أتمتة ردودك على واتساب بشكل ذكي واحترافي. وفر وقتك وتواصل مع عملائك بكفاءة.',
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'ردود ذكية',
    subtitle: 'كلمات مفتاحية مع ردود مخصصة',
    description: 'أضف كلمات مفتاحية وربطها بردود تلقائية. دعم المطابقة الدقيقة والتقريبية مع دعم كامل للعربية.',
  },
  {
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'تحكم كامل',
    subtitle: 'إعدادات متقدمة ومرنة',
    description: 'جدولة زمنية، استثناء أرقام معينة، تحديد هدف الرد، وتأخير الإرسال حسب رغبتك.',
  },
  {
    icon: Bell,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    title: 'متابعة مستمرة',
    subtitle: 'سجل وإحصائيات وتنبيهات',
    description: 'تابع جميع الردود المرسلة، شاهد الإحصائيات، واحصل على تنبيهات فورية.',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLast = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const nextSlide = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Skip button */}
        <div className="flex justify-start mb-8">
          <button
            onClick={onComplete}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            تخطي
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${slide.bg} animate-slideUp`}>
            <Icon size={48} className={slide.color} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-12 animate-slideUp" key={currentSlide}>
          <h1 className="text-2xl font-bold text-white mb-2">{slide.title}</h1>
          <h2 className="text-sm font-medium text-emerald-400 mb-4">{slide.subtitle}</h2>
          <p className="text-sm text-gray-400 leading-relaxed px-4">{slide.description}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-6 bg-emerald-400'
                  : 'w-1.5 bg-gray-700 hover:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={nextSlide}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>
              <Sparkles size={18} />
              ابدأ الآن
            </>
          ) : (
            <>
              التالي
              <ChevronLeft size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
