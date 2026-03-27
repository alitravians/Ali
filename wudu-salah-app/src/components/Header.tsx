import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const titles: Record<string, string> = {
  '/wudu': 'تعلم الوضوء',
  '/wudu/conditions': 'شروط الوضوء',
  '/wudu/steps': 'خطوات الوضوء',
  '/wudu/mistakes': 'أخطاء الوضوء',
  '/wudu/invalidators': 'مبطلات الوضوء',
  '/salah': 'تعلم الصلاة',
  '/salah/conditions': 'شروط الصلاة',
  '/salah/pillars': 'أركان الصلاة',
  '/salah/obligations': 'واجبات الصلاة',
  '/salah/sunnah': 'سنن الصلاة',
  '/salah/steps': 'خطوات الصلاة',
  '/salah/mistakes': 'أخطاء الصلاة',
  '/salah/invalidators': 'مبطلات الصلاة',
  '/children': 'قسم الأطفال',
  '/adults': 'قسم الكبار',
  '/adhkar': 'الأذكار',
  '/quiz': 'الاختبارات',
  '/favorites': 'المفضلة',
  '/achievements': 'الإنجازات',
  '/faq': 'الأسئلة الشائعة',
  '/settings': 'الإعدادات',
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const title = titles[location.pathname] || 'تعلم الوضوء والصلاة';

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-l from-primary to-secondary text-white shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-bold flex-1">{title}</h1>
      </div>
    </header>
  );
}
