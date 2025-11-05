import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, FileText, Search, BookOpen, Tv, ArrowLeft, CheckCircle } from 'lucide-react';

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
    },
    {
      id: 'live',
      title: t('liveChallenge'),
      icon: Tv,
      description: 'شاهد التحديات المباشرة',
      color: 'bg-red-500 hover:bg-red-600'
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
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16 bg-gradient-to-b from-blue-50 to-white rounded-3xl shadow-sm p-12">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          {t('welcome')}
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          {t('welcomeMessage')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-10">
          <button
            onClick={() => onNavigate('submit')}
            className="w-full px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            ابدأ تحدي جديد
          </button>
          <button
            onClick={() => onNavigate('registry')}
            className="w-full px-10 py-5 bg-white hover:bg-gray-50 text-blue-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-2 border-blue-600"
          >
            عرض التحديات
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-3xl shadow-lg p-10 md:p-14">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
          كيف يعمل الموقع؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="text-center space-y-5">
              <div className="w-20 h-20 bg-blue-600 text-white text-3xl font-bold rounded-full flex items-center justify-center mx-auto shadow-md">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
          الخدمات المتاحة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`${item.color} p-10 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-white h-full`}
              >
                <div className="flex flex-col items-center space-y-5">
                  <Icon size={64} strokeWidth={2} />
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-base opacity-95">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-gray-50 to-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-gray-700 text-lg">
          © 2025 أرض التحديات - جميع الحقوق محفوظة
        </p>
        <p className="text-xs text-gray-500 mt-2">v2025-11-05.2</p>
      </footer>
    </div>
  );
}

export default HomePage;
