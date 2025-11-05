import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, FileText, Search, BookOpen, Tv } from 'lucide-react';

function HomePage({ onNavigate }) {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 'registry',
      title: t('challengeRegistry'),
      icon: Trophy,
      description: 'عرض جميع التحديات المعتمدة',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'submit',
      title: t('submitChallenge'),
      icon: FileText,
      description: 'قدم طلب تحدي رسمي جديد',
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'status',
      title: t('checkStatus'),
      icon: Search,
      description: 'تحقق من حالة طلبك',
      color: 'from-orange-500 to-orange-700'
    },
    {
      id: 'howto',
      title: t('howToBook'),
      icon: BookOpen,
      description: 'تعرف على كيفية حجز التحديات',
      color: 'from-purple-500 to-purple-700'
    },
    {
      id: 'live',
      title: t('liveChallenge'),
      icon: Tv,
      description: 'شاهد التحديات المباشرة',
      color: 'from-red-500 to-red-700'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          {t('welcome')}
        </h1>
        <p className="text-xl text-gray-300">
          {t('welcomeMessage')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`bg-gradient-to-br ${item.color} p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-white`}
            >
              <div className="flex flex-col items-center space-y-4">
                <Icon size={48} />
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm opacity-90">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
