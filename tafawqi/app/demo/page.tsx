import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DemoQuiz from "./demo-quiz";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "تجربة مجّانية — تفوّقي",
  description:
    "جرّبي ٥ أسئلة مختارة من اختبارات تفوّقي بدون تسجيل — تحقّقي من النمط قبل إنشاء حساب.",
};

async function isDemoEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "guest_demo_enabled" },
    });
    // Default open: only disable when admin explicitly sets "false".
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

// F15 — Five hand-picked sample questions covering different question types
// (MCQ, true/false, short fill-in). Kept here (not in DB) so guests cannot
// probe production questions and so the demo always works even on an empty
// database. Texts are short Arabic 10th-grade math basics.
const DEMO_QUESTIONS = [
  {
    id: "d1",
    type: "mcq" as const,
    prompt: "ما ناتج ٧ × ٨؟",
    options: ["٥٤", "٥٦", "٦٤", "٤٨"],
    answer: 1,
    explanation: "٧ × ٨ = ٥٦",
  },
  {
    id: "d2",
    type: "mcq" as const,
    prompt: "ما قيمة س في المعادلة: ٢س + ٣ = ١١؟",
    options: ["٣", "٤", "٥", "٧"],
    answer: 1,
    explanation: "٢س = ٨ ⇒ س = ٤",
  },
  {
    id: "d3",
    type: "tf" as const,
    prompt: "العدد ١٧ عدد أوّليّ.",
    answer: true,
    explanation: "١٧ يقبل القسمة على ١ ونفسه فقط، فهو أوّليّ.",
  },
  {
    id: "d4",
    type: "fill" as const,
    prompt: "ما الجذر التربيعيّ للعدد ٨١؟",
    answer: ["٩", "9"],
    explanation: "٩ × ٩ = ٨١",
  },
  {
    id: "d5",
    type: "mcq" as const,
    prompt: "مجموع زوايا المثلّث يساوي:",
    options: ["٩٠°", "١٢٠°", "١٨٠°", "٣٦٠°"],
    answer: 2,
    explanation: "مجموع زوايا أيّ مثلّث = ١٨٠°",
  },
];

export default async function DemoPage() {
  const enabled = await isDemoEnabled();
  if (!enabled) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4" aria-hidden>🚪</div>
        <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">
          التجربة المجّانيّة متوقّفة حاليّاً
        </h1>
        <p className="text-violet-600 dark:text-violet-300 mb-6">
          لا توجد تجربة ضيف الآن. أنشئي حساباً مجّانياً للوصول إلى الاختبارات الكاملة.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register" className="btn-primary px-5 py-2.5">إنشاء حساب</Link>
          <Link href="/" className="btn-secondary px-5 py-2.5">الرئيسية</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 text-center">
        <div className="chip mb-3 mx-auto bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          ✨ تجربة بدون تسجيل
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-100">
          جرّبي تفوّقي في دقائق
        </h1>
        <p className="mt-3 text-violet-700/90 dark:text-violet-200/85 leading-relaxed">
          خمسة أسئلة قصيرة لاكتشاف نمط تفوّقي — لا تسجيل، لا حفظ بيانات.
        </p>
      </header>
      <DemoQuiz questions={DEMO_QUESTIONS} />
    </div>
  );
}
