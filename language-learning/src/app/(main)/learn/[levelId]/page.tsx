"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
  order: number;
  content: string;
  words: Word[];
  grammarRules: GrammarRule[];
  questions: { id: string }[];
}

interface Level {
  id: string;
  name: string;
  nameAr: string;
  language: { id: string; name: string; nameAr: string; flag: string };
  lessons: Lesson[];
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetch(`/api/lessons?levelId=${params.levelId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLessons(data);
          setLevel({
            id: data[0].level.id,
            name: data[0].level.name,
            nameAr: data[0].level.nameAr || data[0].level.name,
            language: data[0].level.language,
            lessons: data,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const levelProgress = data.find((p: { levelId: string }) => p.levelId === params.levelId);
          if (levelProgress) {
            try {
              setCompletedLessons(JSON.parse(levelProgress.completedLessons || "[]"));
            } catch {
              setCompletedLessons([]);
            }
          }
        }
      })
      .catch(() => {});
  }, [params.levelId, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const allCompleted = lessons.length > 0 && lessons.every((l) => completedLessons.includes(l.id));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="gradient-bg text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/languages/${level?.language?.id || ""}`} className="text-primary-200 hover:text-white transition-colors">
                {level?.language?.flag} {level?.language?.nameAr}
              </Link>
              <span className="text-primary-300">/</span>
              <span>{level?.nameAr}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">دروس مستوى {level?.nameAr}</h1>
            <p className="text-primary-100">
              {completedLessons.length} من {lessons.length} دروس مكتملة
            </p>
            <div className="progress-bar h-3 mt-4 max-w-md bg-white/20">
              <div
                className="progress-fill h-3 bg-white"
                style={{ width: `${lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            {lessons.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700">لا توجد دروس حالياً</h3>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {lessons.map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${params.levelId}/lesson/${lesson.id}`}
                        className={`card-hover p-6 flex items-center gap-4 ${isCompleted ? "border-emerald-200 bg-emerald-50/50" : ""}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{lesson.titleAr}</h3>
                          <p className="text-sm text-gray-500">{lesson.title}</p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            <span>{lesson.words.length} كلمة</span>
                            <span>{lesson.grammarRules.length} قاعدة</span>
                            <span>{lesson.questions.length} سؤال</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 flip-rtl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>

                {/* Test button */}
                <div className="mt-10 text-center">
                  {allCompleted ? (
                    <Link href={`/learn/${params.levelId}/test`} className="btn-primary text-lg py-4 px-10 inline-block">
                      ابدأ الاختبار النهائي 📝
                    </Link>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-md mx-auto">
                      <p className="text-amber-700 font-medium">
                        أكمل جميع الدروس أولاً لفتح الاختبار النهائي
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
