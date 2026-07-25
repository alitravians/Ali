"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";

interface Question {
  id: string;
  type: string;
  question: string;
  questionAr: string;
  options: string;
  answer: string;
  explanation: string;
  points: number;
}

interface TestData {
  id: string;
  title: string;
  titleAr: string;
  passingScore: number;
  level: {
    id: string;
    name: string;
    nameAr: string;
    language: { name: string; nameAr: string; code: string; flag: string };
    lessons: { questions: Question[] }[];
  };
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [writingInput, setWritingInput] = useState("");

  useEffect(() => {
    if (!session?.user) { router.push("/login"); return; }
    fetch(`/api/tests?levelId=${params.levelId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const t = data[0];
          setTest(t);
          const allQ = t.level.lessons.flatMap((l: { questions: Question[] }) => l.questions);
          // Shuffle questions
          const shuffled = allQ.sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.levelId, session, router]);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = test?.level?.language?.code || "en";
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  }, [test]);

  const currentQ = questions[currentIndex];

  const selectAnswer = (questionId: string, answer: string) => {
    if (showResult[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setShowResult((prev) => ({ ...prev, [questionId]: true }));
  };

  const submitWriting = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: writingInput.trim() }));
    setShowResult((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const nextQuestion = () => {
    setWritingInput("");
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const submitTest = async () => {
    if (!test) return;
    setSubmitting(true);

    let readingScore = 0, writingScore = 0, listeningScore = 0, speakingScore = 0;
    let readingTotal = 0, writingTotal = 0, listeningTotal = 0, speakingTotal = 0;
    let totalEarned = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id] || "";
      const isCorrect = userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
      const pts = isCorrect ? q.points : 0;
      totalEarned += pts;

      if (q.type === "multiple_choice" || q.type === "matching") {
        readingScore += pts;
        readingTotal += q.points;
      } else if (q.type === "writing") {
        writingScore += pts;
        writingTotal += q.points;
      } else if (q.type === "listening") {
        listeningScore += pts;
        listeningTotal += q.points;
      } else if (q.type === "pronunciation") {
        speakingScore += pts;
        speakingTotal += q.points;
      }
    });

    const scores = {
      total: totalEarned,
      reading: readingTotal > 0 ? Math.round((readingScore / readingTotal) * 100) : 0,
      writing: writingTotal > 0 ? Math.round((writingScore / writingTotal) * 100) : 0,
      listening: listeningTotal > 0 ? Math.round((listeningScore / listeningTotal) * 100) : 0,
      speaking: speakingTotal > 0 ? Math.round((speakingScore / speakingTotal) * 100) : 0,
    };

    try {
      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id, answers, scores }),
      });
      const result = await res.json();
      
      // Store result in sessionStorage for result page
      sessionStorage.setItem("testResult", JSON.stringify({
        ...result,
        scores,
        languageName: test.level.language.nameAr,
        levelName: test.level.nameAr,
        levelId: test.level.id,
      }));
      
      router.push(`/learn/${params.levelId}/result`);
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">لا يوجد اختبار متاح</h2>
            <button onClick={() => router.back()} className="btn-primary mt-4">العودة</button>
          </div>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  let options: string[] = [];
  try { options = JSON.parse(currentQ.options || "[]"); } catch { options = []; }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              السؤال {currentIndex + 1} من {questions.length}
            </span>
            <span className="badge-primary text-xs">
              {test.level.language.flag} {test.level.nameAr}
            </span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-fill h-2 bg-primary-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-8 animate-fadeIn" key={currentQ.id}>
          {/* Question type badge */}
          <div className="mb-4">
            <span className={`badge text-xs ${
              currentQ.type === "multiple_choice" ? "bg-blue-100 text-blue-700" :
              currentQ.type === "writing" ? "bg-purple-100 text-purple-700" :
              currentQ.type === "listening" ? "bg-amber-100 text-amber-700" :
              currentQ.type === "matching" ? "bg-emerald-100 text-emerald-700" :
              "bg-pink-100 text-pink-700"
            }`}>
              {currentQ.type === "multiple_choice" ? "اختيار من متعدد" :
               currentQ.type === "writing" ? "كتابة" :
               currentQ.type === "listening" ? "استماع" :
               currentQ.type === "matching" ? "توصيل" :
               "نطق"}
            </span>
          </div>

          {/* Question text */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQ.questionAr || currentQ.question}
          </h2>

          {/* Listening: play audio */}
          {(currentQ.type === "listening" || currentQ.type === "pronunciation") && (
            <button
              onClick={() => speak(currentQ.question)}
              className="w-16 h-16 bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl transition-colors"
            >
              🔊
            </button>
          )}

          {/* Multiple choice / matching options */}
          {(currentQ.type === "multiple_choice" || currentQ.type === "matching" || currentQ.type === "listening") && options.length > 0 && (
            <div className="space-y-3">
              {options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                const isCorrect = opt.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();
                const revealed = showResult[currentQ.id];

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(currentQ.id, opt)}
                    disabled={revealed}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all font-medium ${
                      revealed
                        ? isCorrect
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : isSelected
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-400"
                        : isSelected
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm ${
                        revealed && isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                        revealed && isSelected && !isCorrect ? "border-red-500 bg-red-500 text-white" :
                        isSelected ? "border-primary-500 bg-primary-500 text-white" :
                        "border-gray-300"
                      }`}>
                        {revealed && isCorrect ? "✓" :
                         revealed && isSelected && !isCorrect ? "✗" :
                         String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Writing input */}
          {(currentQ.type === "writing" || currentQ.type === "pronunciation") && !showResult[currentQ.id] && (
            <div className="space-y-4">
              <input
                type="text"
                value={writingInput}
                onChange={(e) => setWritingInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && writingInput.trim() && submitWriting()}
                className="input-field text-center text-xl"
                placeholder="اكتب إجابتك هنا..."
                dir="ltr"
                autoFocus
              />
              <button
                onClick={submitWriting}
                disabled={!writingInput.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                تحقق
              </button>
            </div>
          )}

          {/* Writing result */}
          {(currentQ.type === "writing" || currentQ.type === "pronunciation") && showResult[currentQ.id] && (
            <div className={`rounded-xl p-4 ${
              answers[currentQ.id]?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim()
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}>
              {answers[currentQ.id]?.toLowerCase().trim() === currentQ.answer.toLowerCase().trim() ? (
                <p className="text-emerald-700 font-bold text-lg">إجابة صحيحة! 🎉</p>
              ) : (
                <div>
                  <p className="text-red-700 font-bold">إجابة خاطئة</p>
                  <p className="text-red-600 mt-1">إجابتك: <strong>{answers[currentQ.id]}</strong></p>
                  <p className="text-red-600">الإجابة الصحيحة: <strong>{currentQ.answer}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {showResult[currentQ.id] && currentQ.explanation && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-700 text-sm">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            {showResult[currentQ.id] && !isLastQuestion && (
              <button onClick={nextQuestion} className="btn-primary flex-1">
                السؤال التالي ←
              </button>
            )}
            {showResult[currentQ.id] && isLastQuestion && allAnswered && (
              <button
                onClick={submitTest}
                disabled={submitting}
                className="btn-success flex-1 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري إرسال النتائج...
                  </span>
                ) : (
                  "إنهاء الاختبار وعرض النتيجة"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => { if (showResult[q.id]) { setCurrentIndex(i); setWritingInput(""); } }}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i === currentIndex
                  ? "bg-primary-600 text-white scale-110"
                  : showResult[q.id]
                    ? answers[q.id]?.toLowerCase().trim() === q.answer.toLowerCase().trim()
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
