"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ProgressData {
  id: string;
  overallProgress: number;
  readingScore: number;
  writingScore: number;
  listeningScore: number;
  speakingScore: number;
  isCompleted: boolean;
  level: {
    id: string;
    name: string;
    nameAr: string;
    language: { name: string; nameAr: string; flag: string };
  };
}

interface Badge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  earnedAt: string;
}

interface Notification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NameChangeStatus {
  currentName: string;
  lastNameChange: string | null;
  canChange: boolean;
  cooldownEndsAt: string | null;
  pendingRequest: {
    id: string;
    requestedName: string;
    status: string;
    createdAt: string;
  } | null;
  recentRequests: {
    id: string;
    currentName: string;
    requestedName: string;
    status: string;
    adminNote: string;
    createdAt: string;
    reviewedAt: string | null;
  }[];
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"progress" | "badges" | "notifications">("progress");
  const [loading, setLoading] = useState(true);

  // Name change state
  const [nameChangeStatus, setNameChangeStatus] = useState<NameChangeStatus | null>(null);
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameChangeLoading, setNameChangeLoading] = useState(false);
  const [nameChangeError, setNameChangeError] = useState("");
  const [nameChangeSuccess, setNameChangeSuccess] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState("");

  const fetchNameChangeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/name-change");
      const data = await res.json();
      if (!data.error) {
        setNameChangeStatus(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/progress").then((r) => r.json()),
      fetch("/api/badges").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ])
      .then(([prog, bdg, notif]) => {
        setProgress(Array.isArray(prog) ? prog : []);
        setBadges(Array.isArray(bdg) ? bdg : []);
        setNotifications(Array.isArray(notif) ? notif : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchNameChangeStatus();
  }, [status, router, fetchNameChangeStatus]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!nameChangeStatus?.cooldownEndsAt) {
      setCooldownRemaining("");
      return;
    }
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(nameChangeStatus.cooldownEndsAt!).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setCooldownRemaining("");
        fetchNameChangeStatus();
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCooldownRemaining(`${days} يوم و ${hours} ساعة و ${mins} دقيقة`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nameChangeStatus?.cooldownEndsAt, fetchNameChangeStatus]);

  const handleNameChange = async () => {
    if (!newName.trim()) return;
    setNameChangeLoading(true);
    setNameChangeError("");
    setNameChangeSuccess("");
    try {
      const res = await fetch("/api/profile/name-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameChangeError(data.error || "فشل في تغيير الاسم");
      } else {
        if (data.status === "auto_approved") {
          setNameChangeSuccess("تم تغيير اسمك بنجاح!");
          await updateSession();
        } else if (data.status === "pending") {
          setNameChangeSuccess("تم إرسال طلبك للمراجعة الإدارية. سيتم إشعارك بالنتيجة.");
        }
        setShowNameChangeModal(false);
        setNewName("");
        fetchNameChangeStatus();
      }
    } catch {
      setNameChangeError("حدث خطأ أثناء تغيير الاسم");
    }
    setNameChangeLoading(false);
  };

  const markNotificationRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalPoints = (session?.user as { points?: number })?.points || 0;
  const completedLevels = progress.filter((p) => p.isCompleted).length;
  const avgProgress = progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + p.overallProgress, 0) / progress.length) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Profile Header */}
        <section className="gradient-bg text-white py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                👤
              </div>
              <div className="text-center md:text-right flex-1">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <h1 className="text-3xl font-bold mb-1">{session?.user?.name}</h1>
                  <button
                    onClick={() => {
                      setShowNameChangeModal(true);
                      setNewName("");
                      setNameChangeError("");
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                    title="تغيير الاسم"
                  >
                    تعديل
                  </button>
                </div>
                <p className="text-primary-200">{session?.user?.email}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div className="bg-white/10 rounded-2xl px-6 py-4">
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-primary-200">نقطة</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-6 py-4">
                  <p className="text-2xl font-bold">{completedLevels}</p>
                  <p className="text-sm text-primary-200">مستوى مكتمل</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-6 py-4">
                  <p className="text-2xl font-bold">{badges.length}</p>
                  <p className="text-sm text-primary-200">شارة</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Name Change Section */}
        <section className="py-4 bg-white border-b">
          <div className="max-w-5xl mx-auto px-4">
            {/* Success/Error Messages */}
            {nameChangeSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3 flex items-center gap-3">
                <span className="text-emerald-500 text-xl">&#10003;</span>
                <p className="text-emerald-700 text-sm font-medium">{nameChangeSuccess}</p>
                <button onClick={() => setNameChangeSuccess("")} className="mr-auto text-emerald-400 hover:text-emerald-600">&#10005;</button>
              </div>
            )}

            {/* Pending Request Banner */}
            {nameChangeStatus?.pendingRequest && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 text-xl">&#9201;</span>
                  <div className="flex-1">
                    <p className="text-amber-800 font-medium text-sm">طلب تغيير اسم قيد المراجعة</p>
                    <p className="text-amber-600 text-xs mt-1">
                      الاسم المطلوب: <strong>{nameChangeStatus.pendingRequest.requestedName}</strong> - 
                      تم الإرسال في {new Date(nameChangeStatus.pendingRequest.createdAt).toLocaleDateString("ar")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cooldown Info */}
            {cooldownRemaining && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-blue-500 text-xl">&#128338;</span>
                  <div>
                    <p className="text-blue-800 font-medium text-sm">فترة الانتظار لتغيير الاسم</p>
                    <p className="text-blue-600 text-xs mt-1">يمكنك تغيير اسمك بعد: {cooldownRemaining}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Name Change History */}
            {nameChangeStatus?.recentRequests && nameChangeStatus.recentRequests.length > 0 && (
              <details className="mb-3">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 py-1">سجل طلبات تغيير الاسم ({nameChangeStatus.recentRequests.length})</summary>
                <div className="mt-2 space-y-2">
                  {nameChangeStatus.recentRequests.map((req) => (
                    <div key={req.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          req.status === "approved" || req.status === "auto_approved" ? "bg-emerald-100 text-emerald-700" :
                          req.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {req.status === "approved" ? "موافق" : req.status === "auto_approved" ? "موافق تلقائي" : req.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                        </span>
                        <span className="text-gray-500">{req.currentName} &#8592; {req.requestedName}</span>
                        <span className="text-gray-400 text-xs mr-auto">{new Date(req.createdAt).toLocaleDateString("ar")}</span>
                      </div>
                      {req.adminNote && <p className="text-gray-600 text-xs mt-1">ملاحظة الإدارة: {req.adminNote}</p>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>

        {/* Name Change Modal */}
        {showNameChangeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNameChangeModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تغيير الاسم</h3>
              <p className="text-sm text-gray-500 mb-4">يمكنك تغيير اسمك مرة كل 7 أيام. الأسماء غير المناسبة ستخضع لمراجعة إدارية.</p>
              
              {!nameChangeStatus?.canChange ? (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm">
                    {nameChangeStatus?.pendingRequest ? "لديك طلب قيد المراجعة بالفعل" : "يجب الانتظار حتى انتهاء فترة الانتظار"}
                  </p>
                  {cooldownRemaining && <p className="text-gray-500 text-xs mt-2">متبقي: {cooldownRemaining}</p>}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الحالي</label>
                    <p className="text-gray-900 font-medium bg-gray-50 rounded-lg px-3 py-2">{nameChangeStatus?.currentName || session?.user?.name}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الجديد</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="أدخل الاسم الجديد"
                      maxLength={30}
                      dir="auto"
                    />
                    <p className="text-xs text-gray-400 mt-1">2-30 حرفاً (حروف عربية، إنجليزية، أرقام)</p>
                  </div>
                  {nameChangeError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-700 text-sm">{nameChangeError}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleNameChange}
                      disabled={nameChangeLoading || !newName.trim()}
                      className="flex-1 bg-primary-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {nameChangeLoading ? "جاري الإرسال..." : "تغيير الاسم"}
                    </button>
                    <button
                      onClick={() => setShowNameChangeModal(false)}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <section className="py-6 border-b bg-white">
          <div className="max-w-5xl mx-auto px-4 flex gap-4 justify-center">
            <Link href="/profile/certificates" className="btn-primary text-sm">
              🎓 شهاداتي
            </Link>
            <Link href="/profile/tickets" className="btn-secondary text-sm">
              🎫 الدعم الفني
            </Link>
            <Link href="/languages" className="btn-secondary text-sm">
              📚 تعلم لغة جديدة
            </Link>
          </div>
        </section>

        {/* Tabs */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 max-w-md mx-auto">
              {[
                { key: "progress" as const, label: "التقدم", icon: "📊" },
                { key: "badges" as const, label: "الشارات", icon: "🏅" },
                { key: "notifications" as const, label: "الإشعارات", icon: "🔔", count: notifications.filter((n) => !n.isRead).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key ? "bg-white shadow text-primary-600" : "text-gray-500"
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.count ? (
                    <span className="mr-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{tab.count}</span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <div className="animate-fadeIn">
                {progress.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">لم تبدأ التعلم بعد</h3>
                    <p className="text-gray-500 mb-4">ابدأ رحلتك في تعلم اللغات الآن</p>
                    <Link href="/languages" className="btn-primary inline-block">اختر لغة للبدء</Link>
                  </div>
                ) : (
                  <>
                    {/* Overall stats */}
                    <div className="card p-6 mb-6">
                      <h3 className="font-bold text-gray-700 mb-4">نسبة التقدم الإجمالية</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="progress-bar h-4">
                            <div className="progress-fill h-4 bg-primary-500" style={{ width: `${avgProgress}%` }}></div>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-primary-600">{avgProgress}%</span>
                      </div>
                    </div>

                    {/* Per-level progress */}
                    <div className="space-y-4">
                      {progress.map((p) => (
                        <div key={p.id} className={`card p-6 ${p.isCompleted ? "border-emerald-200" : ""}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-gray-900">
                                {p.level.language.flag} {p.level.language.nameAr} - {p.level.nameAr}
                              </h4>
                              {p.isCompleted && <span className="badge-success text-xs">مكتمل ✓</span>}
                            </div>
                            <span className="text-2xl font-bold text-primary-600">{p.overallProgress}%</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: "القراءة", value: p.readingScore, color: "bg-blue-500", icon: "📖" },
                              { label: "الكتابة", value: p.writingScore, color: "bg-purple-500", icon: "✍️" },
                              { label: "الاستماع", value: p.listeningScore, color: "bg-amber-500", icon: "👂" },
                              { label: "النطق", value: p.speakingScore, color: "bg-pink-500", icon: "🗣️" },
                            ].map((skill) => (
                              <div key={skill.label} className="text-center">
                                <p className="text-xs text-gray-500 mb-1">{skill.icon} {skill.label}</p>
                                <div className="progress-bar h-2 mb-1">
                                  <div className={`progress-fill h-2 ${skill.color}`} style={{ width: `${skill.value}%` }}></div>
                                </div>
                                <p className="text-xs font-bold">{skill.value}%</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <Link href={`/learn/${p.level.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                              {p.isCompleted ? "مراجعة الدروس ←" : "متابعة التعلم ←"}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <div className="animate-fadeIn">
                {badges.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🏅</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد شارات بعد</h3>
                    <p className="text-gray-500">أكمل الدروس والاختبارات لكسب الشارات</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {badges.map((badge) => (
                      <div key={badge.id} className="card p-6 text-center">
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{badge.nameAr || badge.name}</h4>
                        <p className="text-xs text-gray-500">{badge.descriptionAr || badge.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(badge.earnedAt).toLocaleDateString("ar")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="animate-fadeIn space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔔</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد إشعارات</h3>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markNotificationRead(notif.id)}
                      className={`card p-5 cursor-pointer transition-all ${!notif.isRead ? "border-primary-200 bg-primary-50/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? "bg-primary-500" : "bg-gray-300"}`}></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">{notif.titleAr || notif.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{notif.messageAr || notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleDateString("ar")}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
