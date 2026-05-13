import { HelpCircle } from "lucide-react";
import PlaceholderPage from "./PlaceholderPage";

export default function GuidePage() {
  return (
    <PlaceholderPage
      title="دليل الاستخدام الشامل"
      icon={<HelpCircle className="w-6 h-6 text-green-300" />}
      description="شرح تفصيلي لكل ميزة في التطبيق: الترجمة، الإدخال الصوتي، التصنيفات، التدريب، الاختبار، الإنجازات، كلمة اليوم، الإشعارات."
      comingInPr="PR C"
    />
  );
}
