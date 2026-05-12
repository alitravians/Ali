"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DemoQuestion =
  | { id: string; type: "mcq"; prompt: string; options: string[]; answer: number; explanation: string }
  | { id: string; type: "tf"; prompt: string; answer: boolean; explanation: string }
  | { id: string; type: "fill"; prompt: string; answer: string[]; explanation: string };

type Answer = string | number | boolean | undefined;

// F15 — Pure client-side scoring. We never POST any answer to the server so
// guest sessions leave no trace in the database.
function isCorrect(q: DemoQuestion, a: Answer): boolean {
  if (q.type === "mcq") return typeof a === "number" && a === q.answer;
  if (q.type === "tf") return typeof a === "boolean" && a === q.answer;
  if (q.type === "fill") {
    if (typeof a !== "string") return false;
    const norm = a.trim();
    return q.answer.some((v) => v === norm);
  }
  return false;
}

export default function DemoQuiz({ questions }: { questions: DemoQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((s, q) => s + (isCorrect(q, answers[q.id]) ? 1 : 0), 0);
  }, [submitted, questions, answers]);
  const pct = Math.round((score / questions.length) * 100);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");

  function setAnswer(id: string, v: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }

  return (
    <div className="space-y-5">
      {questions.map((q, idx) => {
        const ans = answers[q.id];
        const correct = submitted && isCorrect(q, ans);
        return (
          <div
            key={q.id}
            className={[
              "card p-5 transition",
              submitted ? (correct ? "ring-2 ring-emerald-400/70" : "ring-2 ring-rose-400/70") : "",
            ].join(" ")}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="chip bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                السؤال {idx + 1} من {questions.length}
              </span>
              {submitted && (
                <span
                  className={[
                    "chip",
                    correct
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
                  ].join(" ")}
                >
                  {correct ? "إجابة صحيحة" : "إجابة غير صحيحة"}
                </span>
              )}
            </div>
            <div className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-4 leading-relaxed">
              {q.prompt}
            </div>

            {q.type === "mcq" && (
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, i) => {
                  const picked = ans === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswer(q.id, i)}
                      className={[
                        "text-start px-4 py-2.5 rounded-xl border transition",
                        picked
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:bg-violet-50",
                        submitted ? "opacity-90 cursor-default" : "",
                      ].join(" ")}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
            {q.type === "tf" && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "صحيح", v: true },
                  { label: "خاطئ", v: false },
                ].map((o) => {
                  const picked = ans === o.v;
                  return (
                    <button
                      key={String(o.v)}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswer(q.id, o.v)}
                      className={[
                        "px-5 py-2 rounded-xl border transition",
                        picked
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:bg-violet-50",
                        submitted ? "opacity-90 cursor-default" : "",
                      ].join(" ")}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
            {q.type === "fill" && (
              <input
                disabled={submitted}
                type="text"
                inputMode="numeric"
                value={(ans as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="اكتبي إجابتك هنا"
                className="input w-full max-w-xs"
              />
            )}

            {submitted && (
              <div className="mt-4 text-sm text-violet-700/90 dark:text-violet-200/85 bg-violet-50/60 dark:bg-violet-900/20 rounded-lg p-3">
                <strong>الشرح:</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allAnswered ? "أنهيتُ — أظهري النتيجة" : "أكملي الإجابات أوّلاً"}
        </button>
      ) : (
        <div className="card p-6 text-center bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30">
          <div className="text-5xl mb-2">{pct >= 80 ? "🏆" : pct >= 50 ? "👏" : "💪"}</div>
          <div className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-1">
            النتيجة: {score}/{questions.length} ({pct}%)
          </div>
          <p className="text-violet-700/90 dark:text-violet-200/85 mb-4 leading-relaxed">
            هذه فقط ٥ أسئلة — في تفوّقي ستجدين عشرات الاختبارات الكاملة مع تقييم فوريّ، شارات
            إنجاز، وشهادات.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Link href="/register" className="btn-primary px-5 py-2.5">
              أنشئي حسابكِ المجّاني
            </Link>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="btn-secondary px-5 py-2.5"
            >
              إعادة التجربة
            </button>
            <Link href="/" className="btn-secondary px-5 py-2.5">
              الرئيسية
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
