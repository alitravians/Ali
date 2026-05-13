import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Trophy,
  GraduationCap,
  Sparkles,
  Bell,
  Settings,
  Calendar,
  Dumbbell,
  Languages,
  Hand,
  Moon,
  Sun,
  BookOpen,
  MessageSquare,
  HelpCircle,
  History,
  Star,
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface Props {
  onOpenStats: () => void;
  onOpenWordOfDay: () => void;
  onOpenTraining: () => void;
  onOpenCategories: () => void;
  onOpenFeedback: () => void;
  onOpenHistory: () => void;
  onOpenFavorites: () => void;
  onOpenAdmin: () => void;
  unreadNotifications?: number;
  newAchievements?: number;
  pendingTraining?: number;
}

export default function AppHeader({
  onOpenStats,
  onOpenWordOfDay,
  onOpenTraining,
  onOpenCategories,
  onOpenFeedback,
  onOpenHistory,
  onOpenFavorites,
  onOpenAdmin,
  unreadNotifications = 0,
  newAchievements = 0,
  pendingTraining = 0,
}: Props) {
  const { dark, toggleDark, history, favorites } = useApp();
  const navigate = useNavigate();

  const iconBtn =
    "p-2 rounded-lg text-white hover:bg-white/20 transition relative";

  return (
    <header className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onOpenStats}
          className={iconBtn}
          title="الإحصائيات"
          aria-label="الإحصائيات"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/quiz")}
          className={iconBtn}
          title="وضع الاختبار"
          aria-label="وضع الاختبار"
        >
          <Trophy className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/achievements")}
          className={iconBtn}
          title="الإنجازات والمكافآت"
          aria-label="الإنجازات والمكافآت"
        >
          <Sparkles className="w-5 h-5" />
          {newAchievements > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[10px] flex items-center justify-center">
              {newAchievements}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/interactive")}
          className={iconBtn}
          title="التعلم التفاعلي"
          aria-label="التعلم التفاعلي"
        >
          <GraduationCap className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/updates")}
          className={iconBtn}
          title="التحديثات"
          aria-label="التحديثات"
        >
          <Languages className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/notifications")}
          className={iconBtn}
          title="الإشعارات الطارئة"
          aria-label="الإشعارات الطارئة"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
              {unreadNotifications}
            </span>
          )}
        </button>
        <button
          onClick={onOpenAdmin}
          className={iconBtn}
          title="لوحة التحكم"
          aria-label="لوحة التحكم"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 ms-auto md:ms-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            مترجم لغة الإشارة
          </h1>
          <Hand className="w-7 h-7 text-yellow-300 -scale-x-100" />
        </div>
      </div>

      <p className="text-center text-purple-200 text-sm">
        ترجمة النص العربي إلى لغة الإشارة بحركات اليد
        <br className="md:hidden" /> لخدمة مجتمع الصم والبكم
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onOpenWordOfDay}
          className={iconBtn}
          title="كلمة اليوم"
          aria-label="كلمة اليوم"
        >
          <Calendar className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenTraining}
          className={iconBtn}
          title="التدريب المتقدم"
          aria-label="التدريب المتقدم"
        >
          <Dumbbell className="w-5 h-5" />
          {pendingTraining > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center">
              {pendingTraining}
            </span>
          )}
        </button>
        <button
          onClick={onOpenCategories}
          className={iconBtn}
          title="تصنيفات الكلمات"
          aria-label="تصنيفات الكلمات"
        >
          <BookOpen className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenFeedback}
          className={iconBtn}
          title="أرسل ملاحظاتك"
          aria-label="أرسل ملاحظاتك"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/guide")}
          className={iconBtn}
          title="دليل الاستخدام الشامل"
          aria-label="دليل الاستخدام الشامل"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[10px] flex items-center justify-center animate-pulse">
            !
          </span>
        </button>
        <button
          onClick={onOpenHistory}
          className={iconBtn}
          title="سجل الترجمات"
          aria-label="سجل الترجمات"
        >
          <History className="w-5 h-5" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-xs flex items-center justify-center">
              {history.length}
            </span>
          )}
        </button>
        <button
          onClick={onOpenFavorites}
          className={iconBtn}
          title="المفضلة"
          aria-label="المفضلة"
        >
          <Star className="w-5 h-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-xs flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </button>
        <button
          onClick={toggleDark}
          className={iconBtn}
          title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
          aria-label="تبديل الوضع الداكن"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
