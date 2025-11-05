import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, FileText, Search, BookOpen, Tv, Zap, Target, CheckCircle2 } from 'lucide-react';

function HomePage({ onNavigate }) {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 'registry',
      title: t('challengeRegistry'),
      icon: Trophy,
      description: 'عرض جميع التحديات المعتمدة',
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30'
    },
    {
      id: 'submit',
      title: t('submitChallenge'),
      icon: FileText,
      description: 'قدم طلب تحدي رسمي جديد',
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30'
    },
    {
      id: 'status',
      title: t('checkStatus'),
      icon: Search,
      description: 'تحقق من حالة طلبك',
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30'
    },
    {
      id: 'howto',
      title: t('howToBook'),
      icon: BookOpen,
      description: 'تعرف على كيفية حجز التحديات',
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/30'
    },
    {
      id: 'live',
      title: t('liveChallenge'),
      icon: Tv,
      description: 'شاهد التحديات المباشرة',
      gradient: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/30'
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
      title: 'شاهد التحدي',
      description: 'تابع التحدي المباشر في الوقت المحدد'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section with Premium Design */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full mb-4">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm">منصة التحديات الاحترافية</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            {t('welcome')}
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('welcomeMessage')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
            <button
              onClick={() => onNavigate('submit')}
              className="group relative w-full px-10 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                ابدأ تحدي جديد
              </span>
            </button>
            <button
              onClick={() => onNavigate('registry')}
              className="group w-full px-10 py-6 bg-white hover:bg-slate-50 text-blue-600 text-lg font-bold rounded-2xl shadow-lg border-2 border-blue-600 hover:border-blue-700 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-3">
                <Target className="w-5 h-5" />
                عرض التحديات
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section - Premium Card Design */}
      <section className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4 tracking-tight">
          كيف يعمل الموقع؟
        </h2>
        <p className="text-slate-600 text-center text-lg mb-16 max-w-2xl mx-auto">
          ثلاث خطوات بسيطة للبدء في تحديك القادم
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-4xl font-bold rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transform group-hover:-translate-y-1 transition-all duration-200">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid - Premium Gradient Cards */}
      <section>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4 tracking-tight">
          الخدمات المتاحة
        </h2>
        <p className="text-slate-600 text-center text-lg mb-16 max-w-2xl mx-auto">
          استكشف جميع الخدمات المتاحة في منصة التحديات
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative bg-gradient-to-br ${item.gradient} p-10 rounded-2xl shadow-lg ${item.shadow} hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-white h-full overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative flex flex-col items-center space-y-5">
                  <div className="p-4 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Icon size={48} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-base opacity-95 leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer - Professional Design */}
      <footer className="relative mt-20">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100 to-transparent rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-lg p-12 text-center">
          <p className="text-slate-700 text-lg font-medium">
            © 2025 أرض التحديات - جميع الحقوق محفوظة
          </p>
          <p className="text-xs text-slate-500 mt-3">v2025-11-05.4</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
