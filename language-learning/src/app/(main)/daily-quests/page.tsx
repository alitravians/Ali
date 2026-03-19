"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Quest {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  type: string;
  target: number;
  xpReward: number;
  pointsReward: number;
  icon: string;
  userProgress: number;
  isCompleted: boolean;
  isRewarded: boolean;
  progressPercent: number;
}

export default function DailyQuestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchQuests = async () => {
    try {
      const res = await fetch("/api/daily-quests");
      const data = await res.json();
      if (Array.isArray(data)) setQuests(data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetchQuests();
  }, [status, router]);

  const handleClaim = async (questId: string) => {
    if (claiming) return;
    setClaiming(questId);
    setMessage(null);
    try {
      const res = await fetch("/api/daily-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `حصلت على ${data.xpReward} XP و ${data.pointsReward} نقطة!`, type: "success" });
        fetchQuests();
      } else {
        setMessage({ text: data.error || "فشل في استلام المكافأة", type: "error" });
      }
    } catch {
      setMessage({ text: "حدث خطأ", type: "error" });
    }
    setClaiming(null);
    setTimeout(() => setMessage(null), 5000);
  };

  const completedCount = quests.filter((q) => q.isRewarded).length;
  const totalCount = quests.length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <section className="gradient-bg text-white py-10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">🎯 المهام اليومية</h1>
            <p className="text-primary-200 mb-4">أكمل المهام واحصل على مكافآت يومية</p>
            <div className="inline-flex items-center gap-4 bg-white/20 rounded-2xl px-6 py-3">
              <span className="text-lg">المكتملة: <strong>{completedCount}</strong> / {totalCount}</span>
            </div>
          </div>
        </section>

        {/* Message */}
        {message && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className={`p-4 rounded-xl text-center font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          </div>
        )}

        {/* Quests List */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {quests.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-500">لا توجد مهام يومية متاحة حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quests.map((quest) => (
                <div key={quest.id} className={`card p-5 ${quest.isRewarded ? "bg-emerald-50 border-emerald-200" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${quest.isRewarded ? "bg-emerald-100" : quest.isCompleted ? "bg-amber-100" : "bg-gray-100"}`}>
                      {quest.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{quest.nameAr}</h3>
                        {quest.isRewarded && <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">تم الاستلام</span>}
                        {quest.isCompleted && !quest.isRewarded && <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-medium animate-pulse">جاهز للاستلام!</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{quest.descriptionAr}</p>

                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{quest.userProgress} / {quest.target}</span>
                          <span>{quest.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${quest.isRewarded ? "bg-emerald-500" : quest.isCompleted ? "bg-amber-500" : "bg-primary-500"}`}
                            style={{ width: `${quest.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>⭐ {quest.xpReward} XP</span>
                        <span>💰 {quest.pointsReward} نقطة</span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div>
                      {quest.isCompleted && !quest.isRewarded ? (
                        <button
                          onClick={() => handleClaim(quest.id)}
                          disabled={claiming === quest.id}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors animate-pulse"
                        >
                          {claiming === quest.id ? "جاري..." : "استلام"}
                        </button>
                      ) : quest.isRewarded ? (
                        <div className="text-emerald-500 text-2xl">&#10003;</div>
                      ) : (
                        <div className="text-gray-300 text-xl">🔒</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="card p-5 mt-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">💡 كيف تعمل المهام اليومية؟</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• المهام تتجدد تلقائياً كل يوم</li>
              <li>• أكمل المهمة للحصول على XP ونقاط</li>
              <li>• استخدم النقاط للشراء من المتجر</li>
              <li>• XP يرفع مستواك ويفتح مزايا جديدة</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
