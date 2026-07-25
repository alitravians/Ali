"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  order: number;
  _count: { words: number; questions: number };
}

interface Level {
  id: string;
  name: string;
  nameAr: string;
  order: number;
  description: string;
  lessons: Lesson[];
  _count: { lessons: number; tests: number };
}

interface Language {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  flag: string;
  description: string;
  levels: Level[];
}

export default function LanguageDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [language, setLanguage] = useState<Language | null>(null);
  const [progress, setProgress] = useState<Record<string, { overallProgress: number; isCompleted: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/languages/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setLanguage(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (session?.user) {
      fetch("/api/progress")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const progressMap: Record<string, { overallProgress: number; isCompleted: boolean }> = {};
            data.forEach((p: { levelId: string; overallProgress: number; isCompleted: boolean }) => {
              progressMap[p.levelId] = { overallProgress: p.overallProgress, isCompleted: p.isCompleted };
            });
            setProgress(progressMap);
          }
        })
        .catch(() => {});
    }
  }, [params.id, session]);

  const isLevelLocked = (level: Level, index: number): boolean => {
    if (index === 0) return false;
    if (!session?.user) return true;
    const prevLevel = language?.levels[index - 1];
    if (!prevLevel) return false;
    return !progress[prevLevel.id]?.isCompleted;
  };

  const getLevelColor = (order: number): string => {
    if (order === 1) return "from-emerald-400 to-emerald-600";
    if (order === 2) return "from-blue-400 to-blue-600";
    return "from-purple-400 to-purple-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">اللغة غير موجودة</h2>
            <Link href="/languages" className="btn-primary inline-block mt-4">العودة للغات</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="text-6xl mb-4">{language.flag || "🌐"}</div>
            <h1 className="text-4xl font-bold mb-2">{language.nameAr}</h1>
            <p className="text-xl text-primary-100">{language.name}</p>
            {language.description && (
              <p className="text-primary-200 mt-4 max-w-2xl mx-auto">{language.description}</p>
            )}
          </div>
        </section>

        {/* Levels */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">المستويات</h2>
            <div className="space-y-6">
              {language.levels.map((level, index) => {
                const locked = isLevelLocked(level, index);
                const levelProgress = progress[level.id];

                return (
                  <div
                    key={level.id}
                    className={`card ${locked ? "opacity-60" : ""} overflow-visible`}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${getLevelColor(level.order)} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                          {locked ? (
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <span className="text-white text-2xl font-bold">{level.order}</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {level.nameAr}
                            <span className="text-gray-400 font-normal text-base mr-2">({level.name})</span>
                          </h3>
                          {level.description && (
                            <p className="text-gray-500 mb-3">{level.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            <span className="badge-primary">{level._count.lessons} درس</span>
                            <span className="badge-warning">{level._count.tests} اختبار</span>
                          </div>

                          {/* Progress bar */}
                          {levelProgress && (
                            <div className="mt-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">التقدم</span>
                                <span className="font-semibold text-primary-600">{levelProgress.overallProgress}%</span>
                              </div>
                              <div className="progress-bar h-2">
                                <div
                                  className={`progress-fill h-2 bg-gradient-to-r ${getLevelColor(level.order)}`}
                                  style={{ width: `${levelProgress.overallProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {locked ? (
                            <div className="text-center">
                              <span className="text-gray-400 text-sm">🔒 مقفل</span>
                              <p className="text-xs text-gray-400 mt-1">أكمل المستوى السابق</p>
                            </div>
                          ) : !session?.user ? (
                            <Link href="/login" className="btn-primary text-sm">
                              سجل دخول للبدء
                            </Link>
                          ) : levelProgress?.isCompleted ? (
                            <div className="text-center">
                              <span className="badge-success mb-2 block">مكتمل ✓</span>
                              <Link href={`/learn/${level.id}`} className="btn-secondary text-sm">
                                مراجعة
                              </Link>
                            </div>
                          ) : (
                            <Link href={`/learn/${level.id}`} className="btn-primary text-sm">
                              {levelProgress ? "متابعة التعلم" : "ابدأ التعلم"}
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Lessons preview */}
                      {!locked && level.lessons.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-600 mb-3">الدروس:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {level.lessons.map((lesson) => (
                              <div key={lesson.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                                <span className="font-medium text-gray-700">{lesson.titleAr}</span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {lesson._count.words} كلمة • {lesson._count.questions} سؤال
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
