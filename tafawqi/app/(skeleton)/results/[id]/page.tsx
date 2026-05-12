"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import ShareResult from "@/app/components/share-result";

type Answer = {
  id: string;
  isCorrect: boolean;
  yourAnswer: any;
  question: {
    id: string;
    prompt: string;
    type: "mcq" | "tf" | "fill" | "match" | "order";
    explanation: string;
    section: { slug: string; title: string };
    payload: any;
  };
};

type Result = {
  id: string;
  score: number;
  total: number;
  durationSec: number;
  quiz: {
    slug: string;
    title: string;
    chapter?: { slug: string; title: string; icon: string } | null;
    section?: { slug: string; title: string } | null;
  };
  answers: Answer[];
};

export default function ResultsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { id } = params;
  const [data, setData] = useState<Result | null>(null);
  const [shareEnabled, setShareEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/attempts/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setError(d.error);
        setData(d.attempt);
        setShareEnabled(d.socialShareEnabled !== false);
      })
      .catch(() => setError("فشل تحميل النتيجة"));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 text-center">
          <div className="text-rose-600">{error}</div>
          <Link href="/" className="btn-secondary mt-3">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-center text-violet-600">تحميل النتيجة…</div>;

  const pct = Math.round((data.score / Math.max(1, data.total)) * 100);
  const status = pct === 100 ? { icon: "💯", text: "علامة كاملة!", color: "text-amber-600" }
    : pct >= 80 ? { icon: "🌟", text: "أداءٌ ممتاز!", color: "text-emerald-600" }
    : pct >= 60 ? { icon: "👍", text: "جيد، استمري!", color: "text-blue-600" }
    : { icon: "💪", text: "تابعي التدريب، ستتحسنين!", color: "text-violet-600" };

  // Compute weakest sections
  const wrongBySection = new Map<string, { title: string; slug: string; wrong: number; total: number }>();
  for (const a of data.answers) {
    const k = a.question.section.slug;
    const cur = wrongBySection.get(k) || { title: a.question.section.title, slug: k, wrong: 0, total: 0 };
    cur.total += 1;
    if (!a.isCorrect) cur.wrong += 1;
    wrongBySection.set(k, cur);
  }
  const weakSections = Array.from(wrongBySection.values()).filter((s) => s.wrong / s.total >= 0.5);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-6 sm:p-8 mb-6 text-center bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30">
        <div className="text-6xl mb-2 animate-pop">{status.icon}</div>
        <h1 className={`text-2xl sm:text-3xl font-black ${status.color} dark:text-violet-100`}>{status.text}</h1>
        <div className="mt-4 text-7xl font-black text-violet-900 dark:text-violet-100 num">{pct}%</div>
        <div className="text-violet-600 dark:text-violet-300 num">{data.score} من {data.total} إجابة صحيحة</div>
        <div className="mt-2 text-sm text-violet-500 dark:text-violet-300/70 num">المدة: {data.durationSec} ثانية</div>

        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <Link href={`/quiz/${data.quiz.slug}`} className="btn-primary">🔁 أعيدي الاختبار</Link>
          {data.quiz.section && (
            <Link href={`/chapters/${data.quiz.chapter?.slug || ""}`} className="btn-secondary">{data.quiz.chapter?.icon} العودة للفصل</Link>
          )}
          <Link href="/dashboard" className="btn-secondary">📊 لوحتي</Link>
        </div>
      </div>

      {/* F7 — share result widget */}
      {shareEnabled && (
        <ShareResult
          resultId={data.id}
          score={data.score}
          total={data.total}
          quizTitle={data.quiz.title}
        />
      )}

      {weakSections.length > 0 && (
        <div className="card p-5 mb-6 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/40">
          <div className="font-bold text-amber-900 dark:text-amber-100 mb-2">💡 يبدو أنكِ تحتاجين تدريباً إضافياً في:</div>
          <ul className="space-y-1.5">
            {weakSections.map((w) => (
              <li key={w.slug} className="flex justify-between items-center">
                <span className="text-amber-900 dark:text-amber-200">{w.title}</span>
                <Link href={`/quiz/quiz-${w.slug}-5`} className="text-sm font-bold text-amber-700 dark:text-amber-300 hover:underline">
                  تدرّبي الآن ←
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="text-xl font-extrabold text-violet-900 dark:text-violet-100 mb-3">مراجعة الأسئلة</h2>
      <div className="space-y-3">
        {data.answers.map((a, i) => (
          <AnswerCard key={a.id} idx={i} a={a} />
        ))}
      </div>
    </div>
  );
}

function renderAnswerValue(a: Answer): string {
  const q = a.question;
  if (q.type === "mcq") {
    const idx = Number(a.yourAnswer);
    return Number.isFinite(idx) ? (q.payload?.options?.[idx] ?? "—") : "—";
  }
  if (q.type === "tf") return a.yourAnswer === true ? "صحيح" : a.yourAnswer === false ? "خطأ" : "—";
  if (q.type === "fill") return String(a.yourAnswer ?? "—");
  if (q.type === "match" || q.type === "order") return Array.isArray(a.yourAnswer) ? a.yourAnswer.join("، ") : "—";
  return String(a.yourAnswer ?? "—");
}

function renderCorrectValue(a: Answer): string {
  const q = a.question;
  if (q.type === "mcq") return q.payload?.options?.[q.payload?.answer] ?? "—";
  if (q.type === "tf") return q.payload?.answer ? "صحيح" : "خطأ";
  if (q.type === "fill") return (q.payload?.answers || []).slice(0, 2).join("  أو  ");
  if (q.type === "match") return (q.payload?.pairs || []).join("، ");
  if (q.type === "order") return (q.payload?.correct || []).join("، ");
  return "—";
}

function AnswerCard({ idx, a }: { idx: number; a: Answer }) {
  return (
    <div className={`card p-5 ${a.isCorrect ? "border-emerald-200 dark:border-emerald-700/40" : "border-rose-200 dark:border-rose-700/40"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full grid place-items-center text-white font-bold shrink-0 ${a.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
          {a.isCorrect ? "✓" : "✗"}
        </div>
        <div className="flex-1">
          <div className="text-xs text-violet-500 dark:text-violet-300/70 mb-1 num">سؤال {idx + 1} · {a.question.section.title}</div>
          <div className="font-bold text-violet-900 dark:text-violet-100 leading-relaxed">{a.question.prompt}</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-900/40">
              <div className="text-xs text-violet-500">إجابتكِ</div>
              <div className="font-semibold text-violet-900 dark:text-violet-100">{renderAnswerValue(a)}</div>
            </div>
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-xs text-emerald-700 dark:text-emerald-200">الإجابة الصحيحة</div>
              <div className="font-semibold text-emerald-800 dark:text-emerald-100">{renderCorrectValue(a)}</div>
            </div>
          </div>
          {a.question.explanation && (
            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/40">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-200 mb-1">💡 الشرح</div>
              <div className="text-blue-900 dark:text-blue-100 leading-relaxed">{a.question.explanation}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
