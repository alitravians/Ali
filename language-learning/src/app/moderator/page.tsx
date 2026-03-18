"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// ============ Types ============
interface ModUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface ModeratorInfo {
  id: string;
  userId: string;
  rank: string;
  permissions: string[];
  user: ModUser;
}

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  todayViolations: number;
  unreadInstructions: number;
  unreadNotifications: number;
}

interface Instruction {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetType: string;
  sentBy: string;
  createdAt: string;
  acknowledgments: { status: string; readAt: string | null; acknowledgedAt: string | null }[];
}

interface Report {
  id: string;
  reportedUserId: string;
  violationType: string;
  severity: string;
  description: string;
  evidence: string;
  suggestedAction: string;
  status: string;
  adminNote: string;
  escalatedTo: string;
  createdAt: string;
  reviewedAt: string | null;
  reportedUser: ModUser;
  reporter: { user: { name: string } };
}

interface Violation {
  id: string;
  userId: string;
  violationType: string;
  severity: string;
  description: string;
  action: string;
  actionBy: string;
  createdAt: string;
  user: ModUser;
}

interface Activity {
  id: string;
  action: string;
  targetUserId: string;
  details: string;
  createdAt: string;
  moderator: { user: { name: string } };
}

interface ModNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  chatRank: string;
  _count: { modViolations: number; chatWarnings: number; chatBans: number };
}

// ============ Constants ============
const VIOLATION_TYPES = [
  { value: "abuse", label: "إساءة لفظية" },
  { value: "insult", label: "سب أو شتم" },
  { value: "spam", label: "رسائل مزعجة (سبام)" },
  { value: "inappropriate", label: "محتوى غير مناسب" },
  { value: "impersonation", label: "انتحال شخصية" },
  { value: "threat", label: "تحريض أو تهديد" },
  { value: "rules_violation", label: "مخالفة قوانين الشات" },
  { value: "repeated_disturbance", label: "إزعاج متكرر" },
  { value: "other", label: "أخرى" },
];

const SEVERITY_LEVELS = [
  { value: "minor", label: "بسيطة", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "متوسطة", color: "bg-yellow-100 text-yellow-700" },
  { value: "serious", label: "خطيرة", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "حرجة", color: "bg-red-100 text-red-700" },
];

const RANK_LABELS: Record<string, string> = {
  assistant: "مساعد مشرف الدردشة",
  moderator: "مشرف الدردشة",
  head: "رئيس مشرفين الشات",
};

const ACTION_LABELS: Record<string, string> = {
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
  report: "رفع بلاغ",
  warning: "إصدار تحذير",
  ban: "حظر مؤقت",
  escalation: "تصعيد",
  ack_instruction: "تأكيد اطلاع",
  review_report: "مراجعة بلاغ",
};

// ============ Main Component ============
export default function ModeratorPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [moderator, setModerator] = useState<ModeratorInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [needsPin, setNeedsPin] = useState(false);

  // Section data
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [recentInstructions, setRecentInstructions] = useState<Instruction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<ModNotification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  // Report form
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportUserId, setReportUserId] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportSeverity, setReportSeverity] = useState("medium");
  const [reportDescription, setReportDescription] = useState("");
  const [reportEvidence, setReportEvidence] = useState("");
  const [reportSuggestedAction, setReportSuggestedAction] = useState("");
  const [reportFilter, setReportFilter] = useState("all");

  // User search
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  // Warning/Ban forms
  const [showWarnForm, setShowWarnForm] = useState(false);
  const [warnUserId, setWarnUserId] = useState("");
  const [warnReason, setWarnReason] = useState("");
  const [showBanForm, setShowBanForm] = useState(false);
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(30);

  // Review form
  const [reviewReportId, setReviewReportId] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const hasPermission = useCallback((perm: string) => {
    if (!moderator) return false;
    return moderator.permissions.includes(perm) || moderator.permissions.includes("all");
  }, [moderator]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/moderator?section=dashboard");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.moderator) {
        setModerator(data.moderator);
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setRecentInstructions(data.recentInstructions || []);
        setLoading(false);
        // Check if PIN is needed (has security pin set)
        setAuthenticated(true); // For now, session-based auth
      }
    } catch {
      setLoading(false);
    }
  }, [router]);

  const fetchInstructions = async () => {
    const res = await fetch("/api/moderator?section=instructions");
    const data = await res.json();
    if (data.instructions) setInstructions(data.instructions);
  };

  const fetchReports = async (filter = "all") => {
    const res = await fetch(`/api/moderator?section=reports&filter=${filter}`);
    const data = await res.json();
    if (data.reports) setReports(data.reports);
  };

  const fetchViolations = async () => {
    const res = await fetch("/api/moderator?section=violations");
    const data = await res.json();
    if (data.violations) setViolations(data.violations);
  };

  const fetchActivities = async () => {
    const res = await fetch("/api/moderator?section=activity");
    const data = await res.json();
    if (data.activities) setActivities(data.activities);
  };

  const fetchNotifications = async () => {
    const res = await fetch("/api/moderator?section=notifications");
    const data = await res.json();
    if (data.notifications) setNotifications(data.notifications);
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const res = await fetch(`/api/moderator?section=users&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.users) setSearchResults(data.users);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchDashboard();
    }
  }, [status, router, fetchDashboard]);

  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === "instructions") fetchInstructions();
    if (activeTab === "reports") fetchReports(reportFilter);
    if (activeTab === "violations") fetchViolations();
    if (activeTab === "activity") fetchActivities();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, authenticated, reportFilter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      fetchDashboard();
      if (activeTab === "reports") fetchReports(reportFilter);
      if (activeTab === "notifications") fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, [authenticated, activeTab, reportFilter, fetchDashboard]);

  // Handle PIN verification
  const handleVerifyPin = async () => {
    const res = await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_pin",
        pin,
        browser: navigator.userAgent,
        fingerprint: `${navigator.language}-${screen.width}x${screen.height}`,
      }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setNeedsPin(false);
      setPin("");
    } else {
      setPinError("رمز الأمان غير صحيح");
    }
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportUserId || !reportType || !reportDescription) return;
    const res = await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_report",
        reportedUserId: reportUserId,
        violationType: reportType,
        severity: reportSeverity,
        description: reportDescription,
        evidence: reportEvidence,
        suggestedAction: reportSuggestedAction,
      }),
    });
    if (res.ok) {
      setShowReportForm(false);
      setReportUserId(""); setReportType(""); setReportSeverity("medium");
      setReportDescription(""); setReportEvidence(""); setReportSuggestedAction("");
      fetchReports(reportFilter);
      fetchDashboard();
    }
  };

  // Warn user
  const handleWarnUser = async () => {
    if (!warnUserId || !warnReason) return;
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "warn_user", targetUserId: warnUserId, reason: warnReason }),
    });
    setShowWarnForm(false); setWarnUserId(""); setWarnReason("");
    fetchDashboard();
  };

  // Temp ban
  const handleTempBan = async () => {
    if (!banUserId || !banReason) return;
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "temp_ban", targetUserId: banUserId, reason: banReason, duration: banDuration }),
    });
    setShowBanForm(false); setBanUserId(""); setBanReason(""); setBanDuration(30);
    fetchDashboard();
  };

  // Acknowledge instruction
  const handleAckInstruction = async (instructionId: string, ackStatus: string) => {
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ack_instruction", instructionId, ackStatus }),
    });
    fetchInstructions();
    fetchDashboard();
  };

  // Escalate report
  const handleEscalate = async (reportId: string) => {
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "escalate_report", reportId, escalateTo: "head" }),
    });
    fetchReports(reportFilter);
  };

  // Review report
  const handleReviewReport = async () => {
    if (!reviewReportId || !reviewStatus) return;
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review_report", reportId: reviewReportId, status: reviewStatus, adminNote: reviewNote }),
    });
    setReviewReportId(""); setReviewStatus(""); setReviewNote("");
    fetchReports(reportFilter);
  };

  // Mark notification read
  const handleMarkRead = async (id: string) => {
    await fetch("/api/moderator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_notification_read", notificationId: id }),
    });
    fetchNotifications();
    fetchDashboard();
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // PIN verification screen
  if (needsPin && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🔐</div>
            <h2 className="text-xl font-bold text-white">التحقق الأمني</h2>
            <p className="text-slate-400 text-sm mt-1">أدخل رمز الأمان للوصول إلى لوحة المشرفين</p>
          </div>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(""); }}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-xl tracking-widest mb-3"
            placeholder="****"
            maxLength={8}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyPin()}
          />
          {pinError && <p className="text-red-400 text-sm text-center mb-3">{pinError}</p>}
          <button onClick={handleVerifyPin} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
            تأكيد الدخول
          </button>
        </div>
      </div>
    );
  }

  if (!moderator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-white mb-2">غير مصرح بالدخول</h2>
          <p className="text-slate-400 mb-4">ليس لديك صلاحيات للوصول إلى لوحة المشرفين</p>
          <button onClick={() => router.push("/")} className="bg-emerald-600 text-white px-6 py-2 rounded-lg">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "الرئيسية", icon: "🏠", show: true },
    { id: "instructions", label: "التعليمات", icon: "📋", show: true },
    { id: "reports", label: "البلاغات", icon: "🚨", show: true },
    { id: "violations", label: "المخالفات", icon: "⚠️", show: hasPermission("view_violations") },
    { id: "activity", label: "سجل الأنشطة", icon: "📊", show: hasPermission("view_activity_log") || moderator.rank !== "assistant" },
    { id: "notifications", label: "الإشعارات", icon: "🔔", show: true },
  ];

  return (
    <div className="min-h-screen bg-slate-900" dir="rtl">
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {moderator.user.avatar ? (
                <img src={moderator.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                moderator.user.name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{moderator.user.name}</p>
              <p className="text-emerald-400 text-xs">{RANK_LABELS[moderator.rank] || moderator.rank}</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {stats && stats.unreadNotifications > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stats.unreadNotifications}</span>
            )}
            <button onClick={() => router.push("/")} className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded hover:bg-slate-700">
              ← الموقع
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.filter(t => t.show).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {tab.icon} {tab.label}
                {tab.id === "notifications" && stats && stats.unreadNotifications > 0 && (
                  <span className="mr-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.unreadNotifications}</span>
                )}
                {tab.id === "instructions" && stats && stats.unreadInstructions > 0 && (
                  <span className="mr-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.unreadInstructions}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ============ DASHBOARD ============ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-3xl font-bold text-emerald-400">{stats?.totalReports || 0}</p>
                <p className="text-slate-400 text-sm">بلاغاتي</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-3xl font-bold text-amber-400">{stats?.pendingReports || 0}</p>
                <p className="text-slate-400 text-sm">بلاغات معلقة</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-3xl font-bold text-red-400">{stats?.todayViolations || 0}</p>
                <p className="text-slate-400 text-sm">مخالفات اليوم</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-3xl font-bold text-blue-400">{stats?.unreadInstructions || 0}</p>
                <p className="text-slate-400 text-sm">تعليمات جديدة</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-bold mb-4">إجراءات سريعة</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setShowReportForm(true); setActiveTab("reports"); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  🚨 رفع بلاغ
                </button>
                {hasPermission("warn_user") && (
                  <button onClick={() => setShowWarnForm(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    ⚠️ إصدار تحذير
                  </button>
                )}
                {hasPermission("temp_ban") && (
                  <button onClick={() => setShowBanForm(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    🔒 حظر مؤقت
                  </button>
                )}
                <button onClick={() => setActiveTab("instructions")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  📋 التعليمات
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Instructions */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-bold mb-4">📋 آخر التعليمات</h3>
                {recentInstructions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">لا توجد تعليمات</p>
                ) : (
                  <div className="space-y-3">
                    {recentInstructions.map((inst) => (
                      <div key={inst.id} className={`p-3 rounded-lg border ${
                        inst.priority === "urgent" ? "border-red-500/50 bg-red-500/10" :
                        inst.priority === "important" ? "border-amber-500/50 bg-amber-500/10" :
                        "border-slate-600 bg-slate-700/50"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {inst.priority === "urgent" && <span className="text-red-400 text-xs font-bold">عاجل</span>}
                          {inst.priority === "important" && <span className="text-amber-400 text-xs font-bold">مهم</span>}
                          <p className="text-white text-sm font-medium flex-1">{inst.title}</p>
                        </div>
                        <p className="text-slate-400 text-xs">{new Date(inst.createdAt).toLocaleDateString("ar")}</p>
                        {inst.acknowledgments[0]?.status === "unread" && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded mt-1 inline-block">غير مقروءة</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-white font-bold mb-4">📊 آخر أنشطتي</h3>
                {recentActivity.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">لا توجد أنشطة</p>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.slice(0, 8).map((act) => (
                      <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
                        <span className="text-lg">{act.action === "report" ? "🚨" : act.action === "warning" ? "⚠️" : act.action === "ban" ? "🔒" : act.action === "login" ? "🔑" : "📋"}</span>
                        <div className="flex-1">
                          <p className="text-slate-300 text-sm">{ACTION_LABELS[act.action] || act.action}</p>
                          {act.details && <p className="text-slate-500 text-xs truncate">{act.details}</p>}
                        </div>
                        <p className="text-slate-500 text-xs">{new Date(act.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ INSTRUCTIONS ============ */}
        {activeTab === "instructions" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">📋 التعليمات والملاحظات الإدارية</h2>
            {instructions.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-500">لا توجد تعليمات حالياً</p>
              </div>
            ) : (
              instructions.map((inst) => {
                const ack = inst.acknowledgments[0];
                const isUnread = !ack || ack.status === "unread";
                return (
                  <div key={inst.id} className={`bg-slate-800 rounded-xl p-6 border ${
                    inst.priority === "urgent" ? "border-red-500" :
                    inst.priority === "important" ? "border-amber-500" :
                    "border-slate-700"
                  } ${isUnread ? "ring-2 ring-emerald-500/30" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        inst.priority === "urgent" ? "bg-red-500/20" :
                        inst.priority === "important" ? "bg-amber-500/20" :
                        "bg-slate-700"
                      }`}>
                        {inst.priority === "urgent" ? "🔴" : inst.priority === "important" ? "🟡" : "📋"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-bold">{inst.title}</h3>
                          {inst.priority === "urgent" && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">عاجل</span>}
                          {inst.priority === "important" && <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">مهم</span>}
                          {isUnread && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded">جديد</span>}
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">{inst.content}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{new Date(inst.createdAt).toLocaleDateString("ar")} - {new Date(inst.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</span>
                          {ack && ack.status !== "unread" && (
                            <span className="text-emerald-400">
                              {ack.status === "confirmed" ? "تم التأكيد ✓" : ack.status === "acknowledged" ? "تم الاطلاع" : "مقروءة"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 mr-13">
                      {isUnread && (
                        <button onClick={() => handleAckInstruction(inst.id, "read")} className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-600">
                          تم القراءة
                        </button>
                      )}
                      {(!ack || ack.status !== "confirmed") && (
                        <button onClick={() => handleAckInstruction(inst.id, "confirmed")} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700">
                          تأكيد الاستلام ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============ REPORTS ============ */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🚨 البلاغات</h2>
              <button onClick={() => setShowReportForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                + رفع بلاغ جديد
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {[
                { value: "all", label: "الكل" },
                { value: "pending", label: "معلقة" },
                { value: "escalated", label: "مصعّدة" },
                { value: "resolved", label: "تم حلها" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setReportFilter(f.value); fetchReports(f.value); }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${reportFilter === f.value ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Report Form Modal */}
            {showReportForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700">
                  <h3 className="text-white font-bold text-lg mb-4">رفع بلاغ جديد</h3>
                  
                  {/* User Search */}
                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">البحث عن المستخدم</label>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="اسم أو بريد المستخدم..."
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-1 bg-slate-700 rounded-lg border border-slate-600 max-h-32 overflow-y-auto">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => { setReportUserId(u.id); setUserSearch(u.name); setSearchResults([]); }}
                            className="w-full text-right px-3 py-2 hover:bg-slate-600 text-sm text-slate-300 flex items-center gap-2"
                          >
                            <span>{u.name}</span>
                            <span className="text-slate-500 text-xs">{u.email}</span>
                            {u._count.modViolations > 0 && (
                              <span className="text-red-400 text-xs mr-auto">{u._count.modViolations} مخالفة</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Violation Type */}
                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">نوع المخالفة</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">اختر نوع المخالفة</option>
                      {VIOLATION_TYPES.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">درجة المخالفة</label>
                    <div className="flex gap-2">
                      {SEVERITY_LEVELS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setReportSeverity(s.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${reportSeverity === s.value ? s.color + " ring-2 ring-white/30" : "bg-slate-700 text-slate-400"}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">وصف المخالفة</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                      placeholder="اشرح المخالفة بالتفصيل..."
                    />
                  </div>

                  {/* Evidence */}
                  <div className="mb-4">
                    <label className="text-slate-300 text-sm mb-1 block">الدليل (اختياري)</label>
                    <input
                      type="text"
                      value={reportEvidence}
                      onChange={(e) => setReportEvidence(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="رابط أو نص الرسالة المخالفة..."
                    />
                  </div>

                  {/* Suggested Action */}
                  <div className="mb-6">
                    <label className="text-slate-300 text-sm mb-1 block">الإجراء المقترح (اختياري)</label>
                    <input
                      type="text"
                      value={reportSuggestedAction}
                      onChange={(e) => setReportSuggestedAction(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="مثال: حظر مؤقت 24 ساعة..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSubmitReport} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700">
                      إرسال البلاغ
                    </button>
                    <button onClick={() => setShowReportForm(false)} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600">
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reports List */}
            {reports.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-500">لا توجد بلاغات</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      report.severity === "critical" ? "bg-red-500/20" :
                      report.severity === "serious" ? "bg-orange-500/20" :
                      report.severity === "medium" ? "bg-yellow-500/20" :
                      "bg-slate-700"
                    }`}>
                      {report.severity === "critical" ? "🔴" : report.severity === "serious" ? "🟠" : report.severity === "medium" ? "🟡" : "⚪"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{report.reportedUser.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          report.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                          report.status === "escalated" ? "bg-red-500/20 text-red-400" :
                          report.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-slate-600 text-slate-400"
                        }`}>
                          {report.status === "pending" ? "معلق" : report.status === "escalated" ? "مصعّد" : report.status === "resolved" ? "تم حله" : report.status === "dismissed" ? "مرفوض" : report.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_LEVELS.find(s => s.value === report.severity)?.color || "bg-slate-600 text-slate-400"}`}>
                          {SEVERITY_LEVELS.find(s => s.value === report.severity)?.label || report.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-1">
                        النوع: {VIOLATION_TYPES.find(v => v.value === report.violationType)?.label || report.violationType}
                      </p>
                      <p className="text-slate-300 text-sm">{report.description}</p>
                      {report.evidence && <p className="text-slate-500 text-xs mt-1">الدليل: {report.evidence}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>بواسطة: {report.reporter.user.name}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString("ar")}</span>
                      </div>
                      {report.adminNote && (
                        <div className="mt-2 p-2 bg-slate-700/50 rounded text-sm text-slate-300">
                          ملاحظة: {report.adminNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Report Actions */}
                  <div className="flex gap-2 mt-3 mr-14">
                    {report.status === "pending" && hasPermission("escalate") && (
                      <button onClick={() => handleEscalate(report.id)} className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-lg text-xs hover:bg-orange-600/30">
                        تصعيد ↑
                      </button>
                    )}
                    {report.status === "pending" && hasPermission("review_reports") && (
                      <>
                        <button onClick={() => { setReviewReportId(report.id); setReviewStatus("resolved"); }} className="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-lg text-xs hover:bg-emerald-600/30">
                          تم الحل
                        </button>
                        <button onClick={() => { setReviewReportId(report.id); setReviewStatus("dismissed"); }} className="bg-slate-600/50 text-slate-400 px-3 py-1 rounded-lg text-xs hover:bg-slate-600">
                          رفض
                        </button>
                      </>
                    )}
                  </div>

                  {/* Review Form Inline */}
                  {reviewReportId === report.id && (
                    <div className="mt-3 mr-14 p-3 bg-slate-700/50 rounded-lg">
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm mb-2"
                        placeholder="ملاحظة (اختياري)..."
                      />
                      <div className="flex gap-2">
                        <button onClick={handleReviewReport} className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">تأكيد</button>
                        <button onClick={() => { setReviewReportId(""); setReviewNote(""); }} className="bg-slate-600 text-slate-300 px-3 py-1 rounded text-sm">إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ============ VIOLATIONS ============ */}
        {activeTab === "violations" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">⚠️ سجل المخالفات</h2>
            {violations.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-500">لا توجد مخالفات مسجلة</p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="py-3 px-4 text-right text-xs text-slate-400 font-medium">المستخدم</th>
                      <th className="py-3 px-4 text-right text-xs text-slate-400 font-medium">النوع</th>
                      <th className="py-3 px-4 text-right text-xs text-slate-400 font-medium">الدرجة</th>
                      <th className="py-3 px-4 text-right text-xs text-slate-400 font-medium">الإجراء</th>
                      <th className="py-3 px-4 text-right text-xs text-slate-400 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-sm text-white">{v.user.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-300">{VIOLATION_TYPES.find(t => t.value === v.violationType)?.label || v.violationType}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_LEVELS.find(s => s.value === v.severity)?.color || ""}`}>
                            {SEVERITY_LEVELS.find(s => s.value === v.severity)?.label || v.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400">{v.action || "—"}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(v.createdAt).toLocaleDateString("ar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============ ACTIVITY LOG ============ */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">📊 سجل الأنشطة الإشرافية</h2>
            {activities.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-500">لا توجد أنشطة مسجلة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((act) => (
                  <div key={act.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center gap-3">
                    <span className="text-2xl">
                      {act.action === "report" ? "🚨" : act.action === "warning" ? "⚠️" : act.action === "ban" ? "🔒" :
                       act.action === "login" ? "🔑" : act.action === "escalation" ? "↑" : act.action === "ack_instruction" ? "📋" : "📊"}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{ACTION_LABELS[act.action] || act.action}</p>
                      {act.details && <p className="text-slate-400 text-xs">{act.details}</p>}
                      <p className="text-slate-500 text-xs mt-1">بواسطة: {act.moderator.user.name}</p>
                    </div>
                    <p className="text-slate-500 text-xs">{new Date(act.createdAt).toLocaleDateString("ar")} {new Date(act.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ NOTIFICATIONS ============ */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🔔 الإشعارات</h2>
              {notifications.some(n => !n.isRead) && (
                <button onClick={() => handleMarkRead("all")} className="text-emerald-400 text-sm hover:text-emerald-300">
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-500">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-slate-800 rounded-lg p-4 border cursor-pointer transition-colors ${
                    notif.isRead ? "border-slate-700" : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {notif.type === "report" ? "🚨" : notif.type === "instruction" ? "📋" : notif.type === "warning" ? "⚠️" : notif.type === "escalation" ? "↑" : "🔔"}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${notif.isRead ? "text-slate-400" : "text-white"}`}>{notif.title}</p>
                      <p className="text-slate-500 text-xs">{notif.message}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-slate-500 text-xs">{new Date(notif.createdAt).toLocaleDateString("ar")}</p>
                      {!notif.isRead && <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block mt-1"></span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ============ WARN MODAL ============ */}
      {showWarnForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-4">⚠️ إصدار تحذير</h3>
            <div className="mb-4">
              <label className="text-slate-300 text-sm mb-1 block">البحث عن المستخدم</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="اسم أو بريد..."
              />
              {searchResults.length > 0 && (
                <div className="mt-1 bg-slate-700 rounded-lg border border-slate-600 max-h-32 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => { setWarnUserId(u.id); setUserSearch(u.name); setSearchResults([]); }}
                      className="w-full text-right px-3 py-2 hover:bg-slate-600 text-sm text-slate-300">
                      {u.name} - {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-slate-300 text-sm mb-1 block">سبب التحذير</label>
              <textarea value={warnReason} onChange={(e) => setWarnReason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none"
                placeholder="سبب التحذير..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleWarnUser} className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg font-bold hover:bg-amber-700">إصدار التحذير</button>
              <button onClick={() => { setShowWarnForm(false); setWarnUserId(""); setWarnReason(""); }} className="px-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ BAN MODAL ============ */}
      {showBanForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-4">🔒 حظر مؤقت</h3>
            <div className="mb-4">
              <label className="text-slate-300 text-sm mb-1 block">البحث عن المستخدم</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="اسم أو بريد..."
              />
              {searchResults.length > 0 && (
                <div className="mt-1 bg-slate-700 rounded-lg border border-slate-600 max-h-32 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => { setBanUserId(u.id); setUserSearch(u.name); setSearchResults([]); }}
                      className="w-full text-right px-3 py-2 hover:bg-slate-600 text-sm text-slate-300">
                      {u.name} - {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-slate-300 text-sm mb-1 block">سبب الحظر</label>
              <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none"
                placeholder="سبب الحظر..." />
            </div>
            <div className="mb-4">
              <label className="text-slate-300 text-sm mb-1 block">مدة الحظر (بالدقائق)</label>
              <div className="flex gap-2">
                {[15, 30, 60, 120, 1440].map((d) => (
                  <button key={d} onClick={() => setBanDuration(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${banDuration === d ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-400"}`}>
                    {d < 60 ? `${d} دقيقة` : d < 1440 ? `${d / 60} ساعة` : "24 ساعة"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleTempBan} className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-bold hover:bg-orange-700">تنفيذ الحظر</button>
              <button onClick={() => { setShowBanForm(false); setBanUserId(""); setBanReason(""); }} className="px-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
