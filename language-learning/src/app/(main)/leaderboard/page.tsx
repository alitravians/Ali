"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  totalXpEarned: number;
  points: number;
  chatRank: string;
  xpNeeded: number;
  progressPercent: number;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const userId = (session?.user as { id?: string })?.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <section className="gradient-bg text-white py-10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-2">🏆 لوحة المتصدرين</h1>
            <p className="text-primary-200">تنافس مع الآخرين وارتقِ في المستويات</p>
          </div>
        </section>

        {/* Top 3 */}
        {entries.length >= 3 && (
          <div className="max-w-4xl mx-auto px-4 -mt-6">
            <div className="grid grid-cols-3 gap-4">
              {[entries[1], entries[0], entries[2]].map((e, i) => {
                const order = [2, 1, 3][i];
                const sizes = { 1: "w-20 h-20", 2: "w-16 h-16", 3: "w-16 h-16" };
                const textSizes = { 1: "text-xl", 2: "text-lg", 3: "text-lg" };
                return (
                  <div key={e.id} className={`card p-4 text-center ${order === 1 ? "-mt-4 shadow-lg" : ""} ${e.id === userId ? "ring-2 ring-primary-400" : ""}`}>
                    <div className="text-2xl mb-1">{RANK_ICONS[order - 1]}</div>
                    <div className={`${sizes[order as 1|2|3]} mx-auto rounded-full overflow-hidden bg-gray-100 mb-2`}>
                      {e.avatar ? (
                        <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                          {e.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className={`font-bold text-gray-900 ${textSizes[order as 1|2|3]} truncate`}>{e.name}</h3>
                    <p className="text-primary-600 font-bold">المستوى {e.level}</p>
                    <p className="text-xs text-gray-400">{e.totalXpEarned} XP</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full List */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {entries.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-gray-500">لا يوجد بيانات بعد</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-center p-3 font-medium text-gray-700 w-16">#</th>
                      <th className="text-right p-3 font-medium text-gray-700">المستخدم</th>
                      <th className="text-center p-3 font-medium text-gray-700">المستوى</th>
                      <th className="text-center p-3 font-medium text-gray-700">XP</th>
                      <th className="text-center p-3 font-medium text-gray-700 hidden sm:table-cell">التقدم</th>
                      <th className="text-center p-3 font-medium text-gray-700 hidden md:table-cell">النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className={`border-b hover:bg-gray-50 transition-colors ${e.id === userId ? "bg-primary-50" : ""}`}>
                        <td className="text-center p-3">
                          {e.rank <= 3 ? (
                            <span className="text-xl">{RANK_ICONS[e.rank - 1]}</span>
                          ) : (
                            <span className="font-bold text-gray-500">{e.rank}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              {e.avatar ? (
                                <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                                  {e.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{e.name}</p>
                              {e.id === userId && <span className="text-xs text-primary-600">أنت</span>}
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                            {e.level}
                          </span>
                        </td>
                        <td className="text-center p-3 font-medium text-gray-700">{e.totalXpEarned}</td>
                        <td className="text-center p-3 hidden sm:table-cell">
                          <div className="w-full max-w-24 mx-auto">
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${e.progressPercent}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{e.xp}/{e.xpNeeded}</p>
                          </div>
                        </td>
                        <td className="text-center p-3 font-medium text-amber-600 hidden md:table-cell">💰 {e.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
