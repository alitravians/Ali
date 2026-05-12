"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, use } from "react";
import ReportQuestionModal from "@/app/components/report-question-modal";

// F5 — resume key. Per-quiz, per-browser. We store the in-progress state
// after every answer change so a tab close/refresh doesn't lose progress.
function resumeKey(slug: string) {
  return `tafawqi.resume.v1.${slug}`;
}
type ResumeData = {
  answers: Record<string, unknown>;
  questionTimes: Record<string, number>;
  current: number;
  startedAt: number;
  savedAt: number;
};

type Question = {
  id: string;
  order: number;
  prompt: string;
  type: "mcq" | "tf" | "fill" | "match" | "order";
  options?: string[];
  left?: string[];
  right?: string[];
  items?: string[];
};

type QuizMeta = {
  slug: string;
  title: string;
  description?: string;
  durationSec: number;
  kind: string;
  chapter?: { title: string; icon: string; color: string } | null;
  section?: { title: string } | null;
};

export default function QuizPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const { slug } = params;
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [authed, setAuthed] = useState<boolean>(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secLeft, setSecLeft] = useState(0);
  // F5 — surfaces a "أكملي الاختبار السابق" prompt before the start screen.
  const [resumeOffer, setResumeOffer] = useState<ResumeData | null>(null);
  // F6 — report-question modal visibility.
  const [reporting, setReporting] = useState<string | null>(null);
  const startedAt = useRef<number>(0);
  const questionStartedAt = useRef<number>(0);

  useEffect(() => {
    fetch(`/api/quiz/${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setQuiz(d.quiz);
        setQuestions(d.questions);
        setAuthed(Boolean(d.auth));
        setSecLeft(d.quiz.durationSec);
        // F5 — detect a saved in-progress attempt for this quiz.
        try {
          const raw = window.localStorage.getItem(resumeKey(slug));
          if (raw) {
            const data = JSON.parse(raw) as ResumeData;
            // Discard saves older than 24h to avoid stale offers.
            if (data && Date.now() - (data.savedAt ?? 0) < 24 * 60 * 60 * 1000) {
              setResumeOffer(data);
            } else {
              window.localStorage.removeItem(resumeKey(slug));
            }
          }
        } catch {}
      })
      .catch(() => setError("تعذر تحميل الاختبار"));
  }, [slug]);

  // F5 — persist progress on every change (debounced to next tick).
  useEffect(() => {
    if (!started) return;
    const id = setTimeout(() => {
      try {
        const data: ResumeData = {
          answers,
          questionTimes,
          current,
          startedAt: startedAt.current,
          savedAt: Date.now(),
        };
        window.localStorage.setItem(resumeKey(slug), JSON.stringify(data));
      } catch {}
    }, 100);
    return () => clearTimeout(id);
  }, [answers, questionTimes, current, started, slug]);

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    if (started) questionStartedAt.current = Date.now();
  }, [current, started]);

  const total = questions.length;
  const q = questions[current];

  function setAnswer(qid: string, v: any) {
    setAnswers((a) => ({ ...a, [qid]: v }));
  }

  function recordTime(qid: string) {
    const dt = Date.now() - questionStartedAt.current;
    setQuestionTimes((m) => ({ ...m, [qid]: (m[qid] || 0) + dt }));
  }

  function next() {
    if (q) recordTime(q.id);
    if (current + 1 < total) setCurrent(current + 1);
    else finish();
  }

  function prev() {
    if (q) recordTime(q.id);
    setCurrent(Math.max(0, current - 1));
  }

  async function finish() {
    if (submitting) return;
    if (q) recordTime(q.id);
    setSubmitting(true);
    const durationSec = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    const payload = {
      quizSlug: slug,
      durationSec,
      answers: questions.map((qq) => ({
        questionId: qq.id,
        answer: answers[qq.id] ?? null,
        timeMs: questionTimes[qq.id] ?? 0,
      })),
    };
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          // Save attempt locally and redirect
          sessionStorage.setItem("pending_attempt", JSON.stringify(payload));
          router.push(`/login?redirect=/quiz/${slug}`);
          return;
        }
        throw new Error(json.error || "فشل حفظ النتيجة");
      }
      // F5 — clear the saved progress for this quiz.
      try { window.localStorage.removeItem(resumeKey(slug)); } catch {}
      router.push(`/results/${json.attemptId}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  function start() {
    setStarted(true);
    startedAt.current = Date.now();
    questionStartedAt.current = Date.now();
    setResumeOffer(null);
  }

  // F5 — restore from a previously saved in-progress attempt.
  function resumeFromSaved(data: ResumeData) {
    setAnswers(data.answers || {});
    setQuestionTimes(data.questionTimes || {});
    setCurrent(data.current || 0);
    startedAt.current = data.startedAt || Date.now();
    questionStartedAt.current = Date.now();
    if (quiz) {
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      setSecLeft(Math.max(10, quiz.durationSec - elapsed));
    }
    setStarted(true);
    setResumeOffer(null);
  }

  function discardSaved() {
    try { window.localStorage.removeItem(resumeKey(slug)); } catch {}
    setResumeOffer(null);
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-rose-600 dark:text-rose-300 mb-3">{error}</div>
          <Link href="/chapters" className="btn-secondary">العودة للفصول</Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <div className="p-10 text-center text-violet-600">جارٍ تحميل الاختبار…</div>;
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {resumeOffer && (
          <div className="card p-4 mb-4 bg-gradient-to-l from-amber-50 to-fuchsia-50 dark:from-amber-900/20 dark:to-fuchsia-900/20 border-2 border-amber-300/60 dark:border-amber-700/40 animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-extrabold text-amber-800 dark:text-amber-200">⚡ اختبار غير مكتمل</div>
                <div className="text-sm text-amber-700/90 dark:text-amber-200/80">
                  لديكِ تقدّم محفوظ في هذا الاختبار (من توقّفتِ عنده).
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => resumeFromSaved(resumeOffer)} className="btn-primary text-sm px-4 py-2">
                  📖 أكملي من حيث توقّفتِ
                </button>
                <button onClick={discardSaved} className="btn-ghost text-sm px-4 py-2">إعادة من البداية</button>
              </div>
            </div>
          </div>
        )}
        <div className="card p-8 text-center animate-fade-in">
          {quiz.chapter && (
            <div className="text-4xl mb-2" style={{ color: quiz.chapter.color }}>{quiz.chapter.icon}</div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-violet-900 dark:text-violet-100">{quiz.title}</h1>
          {quiz.section && (
            <div className="mt-1 text-sm text-violet-600 dark:text-violet-300">{quiz.section.title}</div>
          )}
          {quiz.description && (
            <p className="mt-3 text-violet-600/80 dark:text-violet-300/70">{quiz.description}</p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="card p-4">
              <div className="text-xs text-violet-500">عدد الأسئلة</div>
              <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 num">{questions.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-violet-500">المدة</div>
              <div className="text-2xl font-extrabold text-violet-900 dark:text-violet-100 num">
                {Math.round(quiz.durationSec / 60)} دقيقة
              </div>
            </div>
          </div>
          {!authed && (
            <div className="mt-4 text-sm text-amber-700 dark:text-amber-300">
              ملاحظة: لن تُحفظ نتيجتكِ بدون تسجيل الدخول. <Link href={`/login?redirect=/quiz/${slug}`} className="font-bold underline">سجّلي الدخول</Link>
            </div>
          )}
          <button onClick={start} className="btn-primary mt-6 px-6 py-3 text-lg">
            🚀 ابدئي الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="card p-3 mb-4 flex items-center justify-between gap-3 sticky top-20 z-30">
        <div className="text-sm text-violet-600 dark:text-violet-300">
          سؤال <span className="font-extrabold num">{current + 1}</span> / <span className="num">{total}</span>
        </div>
        <div className={`text-lg font-extrabold num ${secLeft < 30 ? "text-rose-600 animate-pulse" : "text-violet-700 dark:text-violet-200"}`}>
          {Math.floor(secLeft / 60).toString().padStart(2, "0")}:{(secLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>
      <div className="h-2 rounded-full bg-violet-100 dark:bg-violet-900/40 overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-l from-fuchsia-500 to-violet-600 transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>

      {reporting && (
        <ReportQuestionModal
          questionId={reporting}
          onClose={() => setReporting(null)}
        />
      )}

      {q && (
        <div className="card p-6 animate-fade-in">
          <div className="text-xl sm:text-2xl font-bold text-violet-900 dark:text-violet-100 leading-relaxed mb-5">
            {q.prompt}
          </div>

          {q.type === "mcq" && q.options && (
            <div className="space-y-2">
              {q.options.map((op, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswer(q.id, i)}
                    className={`w-full text-right px-4 py-3 rounded-xl border transition flex items-center gap-3 ${
                      selected
                        ? "bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500"
                        : "bg-white dark:bg-[#1c1a3d]/50 border-violet-100 dark:border-violet-900/40 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                    }`}
                  >
                    <div className={`w-7 h-7 grid place-items-center rounded-full text-sm font-bold ${selected ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"}`}>
                      {["أ", "ب", "ج", "د", "هـ"][i]}
                    </div>
                    <div className="flex-1 text-base sm:text-lg">{op}</div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "tf" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAnswer(q.id, true)}
                className={`px-4 py-4 rounded-xl border-2 text-lg font-bold transition ${
                  answers[q.id] === true ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400" : "bg-white dark:bg-[#1c1a3d]/50 border-violet-100 dark:border-violet-900/40 hover:bg-violet-50"
                }`}
              >
                ✅ صحيح
              </button>
              <button
                onClick={() => setAnswer(q.id, false)}
                className={`px-4 py-4 rounded-xl border-2 text-lg font-bold transition ${
                  answers[q.id] === false ? "bg-rose-100 dark:bg-rose-900/40 border-rose-400" : "bg-white dark:bg-[#1c1a3d]/50 border-violet-100 dark:border-violet-900/40 hover:bg-violet-50"
                }`}
              >
                ❌ خطأ
              </button>
            </div>
          )}

          {q.type === "fill" && (
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="اكتبي إجابتكِ هنا..."
              className="input text-lg"
              autoFocus
            />
          )}

          {q.type === "match" && q.left && q.right && (
            <div className="space-y-2">
              {q.left.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/40">{l}</div>
                  <select
                    value={(answers[q.id]?.[i] ?? "")}
                    onChange={(e) => {
                      const arr = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                      arr[i] = Number(e.target.value);
                      setAnswer(q.id, arr);
                    }}
                    className="input w-44"
                  >
                    <option value="">اختاري…</option>
                    {q.right!.map((r, j) => (
                      <option key={j} value={j}>{r}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {q.type === "order" && q.items && (
            <OrderQuestion items={q.items} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 gap-3">
        <button onClick={prev} disabled={current === 0 || submitting} className="btn-secondary">
          ← السؤال السابق
        </button>
        <div className="flex gap-2">
          {current + 1 === total ? (
            <button onClick={finish} disabled={submitting} className="btn-primary text-lg">
              {submitting ? "...جارٍ الحفظ" : "إنهاء الاختبار 🎉"}
            </button>
          ) : (
            <button onClick={next} className="btn-primary">
              السؤال التالي →
            </button>
          )}
        </div>
      </div>

      {q && authed && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setReporting(q.id)}
            className="text-xs text-violet-500 dark:text-violet-300/70 hover:text-rose-600 dark:hover:text-rose-300 hover:underline"
          >
            🚩 أبلغي عن خطأ في هذا السؤال
          </button>
        </div>
      )}
    </div>
  );
}

function OrderQuestion({ items, value, onChange }: { items: string[]; value: number[] | undefined; onChange: (v: number[]) => void }) {
  // value is sequence of indices into items (in chosen order)
  const order = value && Array.isArray(value) ? value : [];
  function add(i: number) {
    if (order.includes(i)) return;
    onChange([...order, i]);
  }
  function reset() {
    onChange([]);
  }
  return (
    <div className="space-y-3">
      <div className="text-sm text-violet-600 dark:text-violet-300">انقري على البنود بالترتيب الصحيح:</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => add(i)}
            disabled={order.includes(i)}
            className={`px-3 py-2 rounded-xl border transition ${order.includes(i) ? "bg-gray-100 dark:bg-gray-700 text-gray-400 line-through" : "bg-white dark:bg-[#1c1a3d]/50 border-violet-200 dark:border-violet-700/40 hover:bg-violet-50"}`}
          >
            {it}
          </button>
        ))}
      </div>
      <div className="card p-3">
        <div className="text-xs text-violet-500 mb-2">ترتيبكِ:</div>
        <ol className="space-y-1.5">
          {order.map((idx, n) => (
            <li key={n} className="flex items-center gap-2">
              <span className="w-6 h-6 grid place-items-center rounded-full bg-violet-600 text-white text-xs font-bold">{n + 1}</span>
              <span>{items[idx]}</span>
            </li>
          ))}
        </ol>
        {order.length > 0 && (
          <button onClick={reset} className="mt-2 text-xs text-rose-600 hover:underline">إعادة الترتيب</button>
        )}
      </div>
    </div>
  );
}
