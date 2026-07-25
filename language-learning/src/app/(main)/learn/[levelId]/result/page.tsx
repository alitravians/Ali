"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface TestResult {
  scorePercentage: number;
  passed: boolean;
  grade: string;
  gradeAr: string;
  pointsEarned: number;
  scores: {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
  };
  languageName: string;
  levelName: string;
  levelId: string;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("testResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push(`/learn/${params.levelId}`);
    }
  }, [params.levelId, router]);

  const generateCertificate = async () => {
    if (!result) return;
    setCertLoading(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: result.levelId }),
      });
      if (res.ok) {
        router.push("/profile/certificates");
      }
    } catch {
      // ignore
    }
    setCertLoading(false);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const skillBars = [
    { label: "القراءة", value: result.scores.reading, color: "bg-blue-500", icon: "📖" },
    { label: "الكتابة", value: result.scores.writing, color: "bg-purple-500", icon: "✍️" },
    { label: "الاستماع", value: result.scores.listening, color: "bg-amber-500", icon: "👂" },
    { label: "النطق", value: result.scores.speaking, color: "bg-pink-500", icon: "🗣️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Result card */}
        <div className="card p-8 text-center animate-fadeIn">
          {result.passed ? (
            <>
              <div className="text-6xl mb-4 animate-bounce-gentle">🏆</div>
              <h1 className="text-3xl font-bold text-emerald-600 mb-2">تهانينا! لقد نجحت!</h1>
              <p className="text-gray-500 mb-6">لقد اجتزت اختبار {result.levelName} في {result.languageName} بنجاح</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📝</div>
              <h1 className="text-3xl font-bold text-gray-700 mb-2">لم تجتز الاختبار</h1>
              <p className="text-gray-500 mb-6">حاول مرة أخرى بعد مراجعة الدروس</p>
            </>
          )}

          {/* Score circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={result.passed ? "#10b981" : "#ef4444"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${result.scorePercentage * 3.14} 314`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{result.scorePercentage}%</span>
              <span className={`text-sm font-medium ${result.passed ? "text-emerald-600" : "text-red-500"}`}>
                {result.gradeAr}
              </span>
            </div>
          </div>

          {/* Points earned */}
          <div className="badge-primary text-lg mb-8">
            +{result.pointsEarned} نقطة
          </div>

          {/* Skills breakdown */}
          <div className="space-y-4 text-right mb-8">
            <h3 className="font-bold text-gray-700 mb-4">تحليل المهارات</h3>
            {skillBars.map((skill) => (
              <div key={skill.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{skill.icon} {skill.label}</span>
                  <span className="text-sm font-semibold">{skill.value}%</span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className={`progress-fill h-3 ${skill.color}`}
                    style={{ width: `${skill.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {result.passed && (
              <button
                onClick={generateCertificate}
                disabled={certLoading}
                className="btn-success w-full text-lg py-4"
              >
                {certLoading ? "جاري إصدار الشهادة..." : "احصل على الشهادة 🎓"}
              </button>
            )}
            {!result.passed && (
              <Link href={`/learn/${params.levelId}`} className="btn-primary w-full text-lg py-4 block text-center">
                العودة للدروس ومراجعتها
              </Link>
            )}
            <Link href="/profile" className="btn-secondary w-full block text-center">
              الذهاب للملف الشخصي
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
