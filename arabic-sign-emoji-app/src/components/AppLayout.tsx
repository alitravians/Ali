import { useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import OnboardingModal from "./OnboardingModal";
import StatsDialog from "../dialogs/StatsDialog";
import HistoryDialog from "../dialogs/HistoryDialog";
import FavoritesDialog from "../dialogs/FavoritesDialog";
import CategoriesDialog from "../dialogs/CategoriesDialog";
import WordOfDayDialog from "../dialogs/WordOfDayDialog";
import PlaceholderDialog from "../dialogs/PlaceholderDialog";
import { Dumbbell, MessageSquare, Settings } from "lucide-react";
import { useApp } from "../context/AppContext";

interface LayoutProps {
  children?: ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [wordOpen, setWordOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { tutorialOpen, closeTutorial } = useApp();

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800 dark:from-black dark:via-zinc-900 dark:to-zinc-800 text-white"
    >
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <AppHeader
          onOpenStats={() => setStatsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenFavorites={() => setFavoritesOpen(true)}
          onOpenCategories={() => setCategoriesOpen(true)}
          onOpenWordOfDay={() => setWordOpen(true)}
          onOpenTraining={() => setTrainingOpen(true)}
          onOpenFeedback={() => setFeedbackOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
        />

        <main>{children ?? <Outlet />}</main>

        <footer className="text-center text-xs text-purple-200/70 py-6">
          تم التطوير لخدمة مجتمع الصم والبكم · مترجم لغة الإشارة العربية
        </footer>
      </div>

      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} />
      <HistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <FavoritesDialog
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
      />
      <CategoriesDialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />

      <WordOfDayDialog open={wordOpen} onClose={() => setWordOpen(false)} />
      <PlaceholderDialog
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        title="التدريب المتقدم"
        icon={<Dumbbell className="w-5 h-5 text-orange-300" />}
        description="3 مستويات تدريبية (مبتدئ، متوسط، متقدم) لتعلّم الإشارات تدريجياً مع نظام نقاط."
        comingInPr="PR F"
      />
      <PlaceholderDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="أرسل ملاحظاتك"
        icon={<MessageSquare className="w-5 h-5" />}
        description="نموذج لإرسال الاقتراحات، البلاغات والتقييم، مع حفظها في Firebase ليطّلع عليها فريق الإدارة."
        comingInPr="PR J"
      />
      <PlaceholderDialog
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title="لوحة التحكم"
        icon={<Settings className="w-5 h-5" />}
        description="لوحة تحكم الإدارة محمية بكود 3131. تشمل إرسال إشعارات، إدارة الملاحظات، إعدادات الواجهة، وحظر الأجهزة."
        comingInPr="PR I/J"
      />

      {tutorialOpen && <OnboardingModal onClose={closeTutorial} />}
    </div>
  );
}
