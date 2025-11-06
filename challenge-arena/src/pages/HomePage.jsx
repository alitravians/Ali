import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, FileText, Search, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';

function HomePage({ onNavigate }) {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 'registry',
      title: t('challengeRegistry'),
      icon: Trophy,
      description: 'عرض جميع التحديات المعتمدة',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'submit',
      title: t('submitChallenge'),
      icon: FileText,
      description: 'قدم طلب تحدي رسمي جديد',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'status',
      title: t('checkStatus'),
      icon: Search,
      description: 'تحقق من حالة طلبك',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'howto',
      title: t('howToBook'),
      icon: BookOpen,
      description: 'تعرف على كيفية حجز التحديات',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'قدم طلبك',
      description: 'املأ نموذج التحدي بمعلومات الخصمين والتاريخ والوقت'
    },
    {
      number: '2',
      title: 'انتظر الموافقة',
      description: 'ستتم مراجعة طلبك من قبل الإدارة'
    },
    {
      number: '3',
      title: 'استلم النتيجة',
      description: 'تابع النتيجة النهائية من سجل التحديات'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4 animate-glow">
            {t('welcome')}
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto">
            {t('welcomeMessage')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button
              onClick={() => onNavigate('submit')}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 transform hover:scale-105 transition-all"
            >
              ابدأ تحدي جديد
            </button>
            <button
              onClick={() => onNavigate('registry')}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-slate-700 text-lg font-bold rounded-xl shadow-lg border-2 border-cyan-500 hover:border-cyan-400 transform hover:scale-105 transition-all"
            >
              عرض التحديات
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-200">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
          كيف يعمل الموقع؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-500 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-700">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
          الخدمات المتاحة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`${item.color} p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-white`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <Icon size={56} strokeWidth={2} />
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-sm opacity-90">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-200">
        <p className="text-slate-700">
          © 2025 أرض التحديات - جميع الحقوق محفوظة
        </p>
        <p className="text-xs text-slate-500 mt-2">
          تم التطوير بواسطة{' '}
          <span 
            className="dev-credit"
            style={{
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              WebkitTextStroke: '0.3px rgba(255,255,255,0.35)'
            }}
          >
            Boon
          </span>
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
