import { Bell } from "lucide-react";
import PlaceholderPage from "./PlaceholderPage";

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="الإشعارات الطارئة"
      icon={<Bell className="w-6 h-6 text-red-300" />}
      description="إشعارات الإدارة المُرسلة لكل المستخدمين عبر Firestore. يدعم: إشعارات عادية، تحذيرات، وإشعارات طارئة."
      comingInPr="PR J"
    />
  );
}
