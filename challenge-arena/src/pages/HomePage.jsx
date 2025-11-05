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
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4">
          {t('welcome')}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
          {t('welcomeMessage')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <button
            onClick={() => onNavigate('submit')}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            ابدأ تحدي جديد
          </button>
          <button
            onClick={() => onNavigate('registry')}
            className="px-8 py-4 bg-white hover:bg-gray-50 text-purple-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-2 border-purple-600"
          >
            عرض التحديات
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-12">
          كيف يعمل الموقع؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto shadow-lg">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-12">
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
      <footer className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <p className="text-gray-600">
          © 2025 أرض التحديات - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
