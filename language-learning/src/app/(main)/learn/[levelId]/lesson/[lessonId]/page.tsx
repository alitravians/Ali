"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface Word {
  id: string;
  word: string;
  translation: string;
  translationAr: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
}

interface GrammarRule {
  id: string;
  title: string;
  titleAr: string;
  explanation: string;
  explanationAr: string;
  examples: string;
}

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  words: Word[];
  grammarRules: GrammarRule[];
  questions: { id: string }[];
  level: {
    id: string;
    name: string;
    nameAr: string;
    language: { id: string; name: string; nameAr: string; code: string; flag: string };
  };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"words" | "grammar" | "practice">("words");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceResult, setPracticeResult] = useState<"correct" | "wrong" | null>(null);
  const [completedPractice, setCompletedPractice] = useState(0);

  useEffect(() => {
    if (!session?.user) { router.push("/login"); return; }
    fetch(`/api/lessons/${params.lessonId}`)
      .then((r) => r.json())
      .then((data) => { setLesson(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.lessonId, session, router]);

  const speak = useCallback((text: string, lang?: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || lesson?.level?.language?.code || "en";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [lesson]);

  const markComplete = async () => {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levelId: params.levelId, lessonId: params.lessonId }),
    });
    router.push(`/learn/${params.levelId}`);
  };

  const checkPractice = () => {
    if (!lesson) return;
    const word = lesson.words[practiceIndex];
    if (practiceAnswer.trim().toLowerCase() === word.word.toLowerCase()) {
      setPracticeResult("correct");
      setCompletedPractice((p) => p + 1);
    } else {
      setPracticeResult("wrong");
    }
  };

  const nextPractice = () => {
    if (!lesson) return;
    setPracticeAnswer("");
    setPracticeResult(null);
    if (practiceIndex < lesson.words.length - 1) {
      setPracticeIndex((i) => i + 1);
    }
  };

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href={`/languages/${lesson.level.language.id}`} className="hover:text-primary-600">
              {lesson.level.language.flag} {lesson.level.language.nameAr}
            </Link>
            <span>/</span>
            <Link href={`/learn/${params.levelId}`} className="hover:text-primary-600">
              {lesson.level.nameAr}
            </Link>
            <span>/</span>
            <span className="text-gray-700">{lesson.titleAr}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.titleAr}</h1>
          <p className="text-gray-500">{lesson.title}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { key: "words" as const, label: "الكلمات", icon: "📖", count: lesson.words.length },
              { key: "grammar" as const, label: "القواعد", icon: "📐", count: lesson.grammarRules.length },
              { key: "practice" as const, label: "تمرين الكتابة", icon: "✍️", count: lesson.words.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-5 font-medium text-sm border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Words Tab */}
        {activeTab === "words" && (
          <div className="space-y-4 animate-fadeIn">
            {lesson.words.length === 0 ? (
              <p className="text-center text-gray-500 py-10">لا توجد كلمات في هذا الدرس</p>
            ) : (
              lesson.words.map((word) => (
                <div key={word.id} className="card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-primary-700">{word.word}</span>
                        <button
                          onClick={() => speak(word.word)}
                          className="w-10 h-10 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-full flex items-center justify-center transition-colors"
                          title="استمع للنطق"
                        >
                          🔊
                        </button>
                        {word.pronunciation && (
                          <span className="text-gray-400 text-sm">/{word.pronunciation}/</span>
                        )}
                      </div>
                      <p className="text-lg text-gray-700 mb-1">{word.translationAr || word.translation}</p>
                      <p className="text-sm text-gray-500">{word.translation}</p>
                      {word.example && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-700 font-medium">{word.example}</p>
                            <button
                              onClick={() => speak(word.example)}
                              className="text-primary-500 hover:text-primary-700 shrink-0"
                            >
                              🔊
                            </button>
                          </div>
                          {word.exampleTranslation && (
                            <p className="text-gray-500 text-sm mt-1">{word.exampleTranslation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Grammar Tab */}
        {activeTab === "grammar" && (
          <div className="space-y-6 animate-fadeIn">
            {lesson.grammarRules.length === 0 ? (
              <p className="text-center text-gray-500 py-10">لا توجد قواعد في هذا الدرس</p>
            ) : (
              lesson.grammarRules.map((rule) => {
                let examples: string[] = [];
                try { examples = JSON.parse(rule.examples); } catch { examples = []; }
                return (
                  <div key={rule.id} className="card p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{rule.titleAr || rule.title}</h3>
                    <p className="text-gray-500 text-sm mb-4">{rule.title}</p>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {rule.explanationAr || rule.explanation}
                      </p>
                    </div>
                    {examples.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-600">أمثلة:</h4>
                        {examples.map((ex: string, i: number) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                            <span className="text-gray-700">{ex}</span>
                            <button onClick={() => speak(ex)} className="text-primary-500 shrink-0">🔊</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === "practice" && (
          <div className="max-w-lg mx-auto animate-fadeIn">
            {lesson.words.length === 0 ? (
              <p className="text-center text-gray-500 py-10">لا توجد كلمات للتمرين</p>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {practiceIndex + 1} من {lesson.words.length}
                  </p>
                  <div className="progress-bar h-2 max-w-xs mx-auto">
                    <div
                      className="progress-fill h-2 bg-primary-500"
                      style={{ width: `${((practiceIndex + 1) / lesson.words.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="card p-8 text-center">
                  <p className="text-sm text-gray-500 mb-2">اكتب الكلمة التي تعني:</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {lesson.words[practiceIndex].translationAr || lesson.words[practiceIndex].translation}
                  </p>
                  <p className="text-gray-500 mb-6">{lesson.words[practiceIndex].translation}</p>

                  <input
                    type="text"
                    value={practiceAnswer}
                    onChange={(e) => setPracticeAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !practiceResult && checkPractice()}
                    className="input-field text-center text-xl mb-4"
                    placeholder="اكتب الكلمة هنا..."
                    dir="ltr"
                    disabled={!!practiceResult}
                    autoFocus
                  />

                  {practiceResult === "correct" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 animate-fadeIn">
                      <p className="text-emerald-700 font-bold text-lg">إجابة صحيحة! 🎉</p>
                    </div>
                  )}

                  {practiceResult === "wrong" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 animate-fadeIn">
                      <p className="text-red-700 font-bold">إجابة خاطئة</p>
                      <p className="text-red-600 mt-1">
                        الإجابة الصحيحة: <strong>{lesson.words[practiceIndex].word}</strong>
                      </p>
                    </div>
                  )}

                  {!practiceResult ? (
                    <button onClick={checkPractice} className="btn-primary w-full" disabled={!practiceAnswer.trim()}>
                      تحقق
                    </button>
                  ) : practiceIndex < lesson.words.length - 1 ? (
                    <button onClick={nextPractice} className="btn-primary w-full">
                      التالي →
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-lg font-bold text-gray-700">
                        أحسنت! أكملت التمرين ({completedPractice}/{lesson.words.length} صحيحة)
                      </p>
                      <button onClick={() => { setPracticeIndex(0); setPracticeAnswer(""); setPracticeResult(null); setCompletedPractice(0); }} className="btn-secondary w-full">
                        إعادة التمرين
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Complete button */}
        <div className="mt-10 text-center">
          <button onClick={markComplete} className="btn-success text-lg py-4 px-10">
            إنهاء الدرس والعودة ✓
          </button>
        </div>
      </div>
    </div>
  );
}
