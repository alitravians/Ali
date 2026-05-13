import { Sparkles } from "lucide-react";
import PlaceholderPage from "./PlaceholderPage";

export default function AchievementsPage() {
  return (
    <PlaceholderPage
      title="الإنجازات والمكافآت"
      icon={<Sparkles className="w-6 h-6 text-yellow-300" />}
      description="19 إنجاز موزعة على 6 فئات: ترجمات، كلمات، سلسلة، اختبارات، تدريب، ومفضلة. يفتح تلقائياً عند الإنجاز مع تنبيه فوري."
      comingInPr="PR E"
    />
  );
}
