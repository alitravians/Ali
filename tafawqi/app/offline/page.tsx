// F9 — Offline fallback page. Served by the service worker when a navigation
// request fails (e.g. on a flaky mobile network during an exam break).
export const metadata = {
  title: "بدون اتصال",
};

export default function OfflinePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4" aria-hidden>📶</div>
      <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">
        لا يوجد اتّصال بالإنترنت
      </h1>
      <p className="text-violet-600 dark:text-violet-300 mb-8 leading-relaxed">
        لا تستطيع تفوّقي تحميل هذه الصفحة الآن. تحقّقي من اتّصالكِ ثمّ أعيدي المحاولة.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <a href="/" className="btn-primary px-5 py-2.5">المحاولة من جديد</a>
      </div>
    </div>
  );
}
