import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-violet-100 dark:border-violet-900/40 bg-white/60 dark:bg-[#0b1020]/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-extrabold text-violet-900 dark:text-violet-100 mb-2">تفوّقي</div>
          <p className="text-violet-600/90 dark:text-violet-300/80 leading-relaxed">
            منصة عربية ذكية لاختبارات الرياضيات القصيرة لطالبات الصف العاشر في سوريا.
            تدرّبي، حلّلي أخطاءكِ، واحصلي على شهادات إنجاز.
          </p>
        </div>
        <div>
          <div className="font-bold text-violet-900 dark:text-violet-100 mb-2">روابط سريعة</div>
          <ul className="space-y-1.5">
            <li><Link href="/chapters" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">الفصول</Link></li>
            <li><Link href="/leaderboard" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">المتصدرات</Link></li>
            <li><Link href="/about" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">عن المنصة</Link></li>
            <li><Link href="/about#faq" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">الأسئلة الشائعة</Link></li>
            <li><Link href="/about#contact" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">الدعم والتواصل</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-violet-900 dark:text-violet-100 mb-2">للمشرفات</div>
          <ul className="space-y-1.5">
            <li><Link href="/admin" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">لوحة الإدارة</Link></li>
            <li><Link href="/login" className="hover:text-violet-700 dark:hover:text-violet-200 text-violet-600/90 dark:text-violet-300/80">تسجيل الدخول</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-violet-100 dark:border-violet-900/40 py-4 text-center text-xs text-violet-500 dark:text-violet-300/70">
        © {new Date().getFullYear()} تفوّقي — منهاج الجمهورية العربية السورية للصف العاشر
      </div>
    </footer>
  );
}
