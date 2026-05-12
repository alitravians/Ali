import Link from "next/link";
import { getMockExam } from "@/lib/mock-exam";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "امتحان المحاكاة",
  description:
    "امتحان محاكاة شامل لتقييم استعدادكِ — اختبر مهاراتكِ في الرياضيات قبل الامتحان الفعليّ.",
};

export default async function MockExamPage() {
  const exam = await getMockExam();
  if (!exam) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4" aria-hidden>📚</div>
        <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">
          لا يوجد امتحان محاكاة متاح
        </h1>
        <p className="text-violet-600 dark:text-violet-300 mb-6 leading-relaxed">
          سيُعلن عن امتحانات محاكاة شاملة قريباً. تابعي لوحتكِ للحصول على آخر الإعلانات.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link href="/dashboard" className="btn-primary px-5 py-2.5">لوحتي</Link>
          <Link href="/chapters" className="btn-secondary px-5 py-2.5">الفصول</Link>
        </div>
      </div>
    );
  }
  const minutes = Math.round(exam.durationSec / 60);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-6">
        <div className="chip mb-3 mx-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
          📚 امتحان محاكاة شامل
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">
          {exam.title}
        </h1>
        {exam.description && (
          <p className="mt-3 text-violet-700/90 dark:text-violet-200/85 leading-relaxed">
            {exam.description}
          </p>
        )}
      </header>

      <div className="card p-6 mb-5">
        <div className="grid sm:grid-cols-3 gap-3 text-center mb-5">
          <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 p-4">
            <div className="text-3xl mb-1">⏱</div>
            <div className="font-bold text-violet-900 dark:text-violet-100">{minutes} دقيقة</div>
            <div className="text-xs text-violet-600 dark:text-violet-300">مدّة الامتحان</div>
          </div>
          <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 p-4">
            <div className="text-3xl mb-1">📝</div>
            <div className="font-bold text-violet-900 dark:text-violet-100">{exam.questionCount} سؤال</div>
            <div className="text-xs text-violet-600 dark:text-violet-300">عدد الأسئلة</div>
          </div>
          <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 p-4">
            <div className="text-3xl mb-1">🎯</div>
            <div className="font-bold text-violet-900 dark:text-violet-100">واحد فقط</div>
            <div className="text-xs text-violet-600 dark:text-violet-300">محاولة لكلّ طالبة</div>
          </div>
        </div>

        <ul className="text-sm text-violet-700/90 dark:text-violet-200/85 space-y-2 mb-6 list-disc ps-5 leading-relaxed">
          <li>سيحتسب الوقت تلقائيّاً من لحظة بدء الامتحان.</li>
          <li>يمكنكِ متابعة الإجابة لاحقاً عبر زرّ "استئناف المحاولة" — لا تفقدي تقدّمكِ.</li>
          <li>عند انتهاء الوقت، يُسلَّم الامتحان تلقائيّاً.</li>
          <li>تظهر النتيجة فوراً مع شرح الأخطاء ونصائح للقسم.</li>
        </ul>

        <Link href={`/quiz/${exam.slug}`} className="btn-primary w-full py-3 text-lg block text-center">
          ابدئي الامتحان الآن
        </Link>
      </div>

      <div className="text-center">
        <Link href="/dashboard" className="text-violet-600 hover:text-violet-800 text-sm">
          ← العودة إلى لوحتي
        </Link>
      </div>
    </div>
  );
}
