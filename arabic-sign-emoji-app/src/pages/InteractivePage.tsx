import { GraduationCap } from "lucide-react";
import PlaceholderPage from "./PlaceholderPage";

export default function InteractivePage() {
  return (
    <PlaceholderPage
      title="التعلم التفاعلي"
      icon={<GraduationCap className="w-6 h-6 text-cyan-300" />}
      description="دروس تفاعلية لتعلّم لغة الإشارة العربية خطوة بخطوة، مع رسوم متحركة ثلاثية الأبعاد لحركات الأصابع."
      comingInPr="PR H"
    />
  );
}
