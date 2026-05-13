import { Trophy } from "lucide-react";
import PlaceholderPage from "./PlaceholderPage";

export default function QuizPage() {
  return (
    <PlaceholderPage
      title="وضع الاختبار"
      icon={<Trophy className="w-6 h-6 text-yellow-300" />}
      description="اختبر معرفتك بلغة الإشارة العربية. أسئلة متنوعة على القاموس الكامل (331 كلمة) مع تتبع الإجابات الصحيحة وفتح إنجازات حسب أدائك."
      comingInPr="PR F"
    />
  );
}
