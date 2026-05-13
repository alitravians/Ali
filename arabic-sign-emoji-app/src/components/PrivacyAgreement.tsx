import { useState } from "react";

interface Props {
  onAgree: () => void;
}

export default function PrivacyAgreement({ onAgree }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4"
    >
      <div className="relative z-10 max-w-2xl w-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 text-white">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🤟</div>
          <h2 className="text-2xl font-bold">مترجم لغة الإشارة العربية</h2>
          <p className="text-purple-200 text-sm mt-1">سياسة الخصوصية والاستخدام</p>
        </div>

        <div className="space-y-3 text-sm text-purple-100 max-h-72 overflow-y-auto pr-2">
          <p>
            نحن في تطبيق "مترجم لغة الإشارة العربية" نحترم خصوصيتك ونلتزم بحماية بياناتك
            الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات عند
            استخدامك لتطبيقنا.
          </p>
          <p className="font-semibold text-white">المعلومات التي نجمعها</p>
          <p>
            التطبيق يعمل بالكامل من جهازك. لا يتم إرسال نصوصك أو ترجماتك إلى أي خادم.
            نقوم بتخزين التفضيلات والسجل والمفضلة محلياً فقط في جهازك (localStorage).
          </p>
          <p className="font-semibold text-white">كيف نستخدم المعلومات</p>
          <p>
            البيانات المخزنة محلياً تُستخدم لتذكر تفضيلاتك (مثل الوضع الداكن) وعرض سجل
            ترجماتك السابقة. لا يتم مشاركة هذه البيانات مع أي طرف ثالث.
          </p>
          <p className="font-semibold text-white">موافقتك</p>
          <p>
            باستخدامك للتطبيق فإنك توافق على سياسة الخصوصية وشروط الاستخدام. يمكنك مسح
            البيانات المحلية في أي وقت من إعدادات المتصفح.
          </p>
        </div>

        <label className="mt-5 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 accent-pink-500"
          />
          <span className="text-sm">أوافق على سياسة الخصوصية وشروط الاستخدام</span>
        </label>

        <button
          disabled={!accepted}
          onClick={onAgree}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-lg"
        >
          متابعة إلى التطبيق
        </button>
      </div>
    </div>
  );
}
