"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ModUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Moderator {
  id: string;
  userId: string;
  rank: string;
  permissions: string;
  isActive: boolean;
  createdAt: string;
  user: ModUser;
  _count: { reports: number; activityLogs: number; sessions: number };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Instruction {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetType: string;
  targetRank: string;
  targetModId: string;
  createdAt: string;
  acknowledgments: { moderatorUserId: string; status: string }[];
}

interface Report {
  id: string;
  violationType: string;
  severity: string;
  description: string;
  status: string;
  adminNote: string;
  escalatedTo: string;
  createdAt: string;
  reportedUser: ModUser;
  reporter: { user: { name: string } };
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  moderator: { user: { name: string } };
}

const RANK_LABELS: Record<string, string> = {
  assistant: "مساعد مشرف",
  moderator: "مشرف دردشة",
  head: "رئيس مشرفين",
};

const RANK_COLORS: Record<string, string> = {
  assistant: "bg-blue-100 text-blue-700",
  moderator: "bg-emerald-100 text-emerald-700",
  head: "bg-purple-100 text-purple-700",
};

const ALL_PERMISSIONS = [
  { key: "view_chat", label: "عرض الدردشة" },
  { key: "view_violations", label: "عرض المخالفات" },
  { key: "view_instructions", label: "عرض التعليمات" },
  { key: "submit_report", label: "رفع بلاغ" },
  { key: "send_internal_note", label: "ملاحظات داخلية" },
  { key: "warn_user", label: "إصدار تحذير" },
  { key: "temp_ban", label: "حظر مؤقت" },
  { key: "review_reports", label: "مراجعة البلاغات" },
  { key: "view_activity_log", label: "سجل الأنشطة" },
  { key: "escalate", label: "تصعيد البلاغات" },
  { key: "review_escalations", label: "مراجعة التصعيدات" },
  { key: "manage_moderators", label: "إدارة المشرفين" },
  { key: "view_stats", label: "عرض الإحصائيات" },
  { key: "approve_reports", label: "اعتماد البلاغات" },
  { key: "bold_message", label: "الكتابة بالخط العريض" },
];

const VIOLATION_LABELS: Record<string, string> = {
  abuse: "إساءة لفظية",
  insult: "سب أو شتم",
  spam: "رسائل مزعجة",
  inappropriate: "محتوى غير مناسب",
  impersonation: "انتحال شخصية",
  threat: "تحريض أو تهديد",
  rules_violation: "مخالفة قوانين",
  repeated_disturbance: "إزعاج متكرر",
  other: "أخرى",
  warning: "تحذير",
  ban: "حظر",
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

export default function AdminModeratorsPage() {
  const [activeSection, setActiveSection] = useState("moderators");
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Add moderator form
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRank, setSelectedRank] = useState("assistant");
  const [newPin, setNewPin] = useState("");

  // Instruction form
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  const [instTitle, setInstTitle] = useState("");
  const [instContent, setInstContent] = useState("");
  const [instPriority, setInstPriority] = useState("normal");
  const [instTargetType, setInstTargetType] = useState("all");
  const [instTargetRank, setInstTargetRank] = useState("");
  const [instTargetModId, setInstTargetModId] = useState("");

  // Permission editor
  const [editingPermsMod, setEditingPermsMod] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  // Review report
  const [reviewingReport, setReviewingReport] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchModerators = async () => {
    const res = await fetch("/api/admin/moderators?section=list");
    const data = await res.json();
    if (data.moderators) setModerators(data.moderators);
    if (data.availableUsers) setAvailableUsers(data.availableUsers);
    setLoading(false);
  };

  const fetchInstructions = async () => {
    const res = await fetch("/api/admin/moderators?section=instructions");
    const data = await res.json();
    if (data.instructions) setInstructions(data.instructions);
  };

  const fetchReports = async () => {
    const res = await fetch("/api/admin/moderators?section=reports");
    const data = await res.json();
    if (data.reports) setReports(data.reports);
  };

  const fetchActivities = async () => {
    const res = await fetch("/api/admin/moderators?section=activity");
    const data = await res.json();
    if (data.activities) setActivities(data.activities);
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  useEffect(() => {
    if (activeSection === "instructions") fetchInstructions();
    if (activeSection === "reports") fetchReports();
    if (activeSection === "activity") fetchActivities();
  }, [activeSection]);

  // Auto-refresh (skip when editing permissions or reviewing reports)
  useEffect(() => {
    const interval = setInterval(() => {
      if (editingPermsMod || reviewingReport) return;
      if (activeSection === "moderators") fetchModerators();
      if (activeSection === "reports") fetchReports();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSection, editingPermsMod, reviewingReport]);

  const handleAddModerator = async () => {
    if (!selectedUserId || !selectedRank) return;
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", userId: selectedUserId, rank: selectedRank, pin: newPin }),
    });
    setShowAddForm(false);
    setSelectedUserId("");
    setSelectedRank("assistant");
    setNewPin("");
    fetchModerators();
  };

  const handleRemoveModerator = async (modId: string) => {
    if (!confirm("هل أنت متأكد من إزالة هذا المشرف؟")) return;
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", modId }),
    });
    fetchModerators();
  };

  const handleUpdateRank = async (modId: string, rank: string) => {
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", modId, rank }),
    });
    fetchModerators();
  };

  const handleToggleActive = async (modId: string, isActive: boolean) => {
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", modId, isActive: !isActive }),
    });
    fetchModerators();
  };

  const handleSavePermissions = async (modId: string) => {
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_permissions", modId, permissions: editPerms }),
    });
    setEditingPermsMod(null);
    fetchModerators();
  };

  const handleResetPin = async (modId: string) => {
    const pin = prompt("أدخل رمز الأمان الجديد (4 أرقام على الأقل):");
    if (!pin || pin.length < 4) return;
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_pin", modId, newPin: pin }),
    });
    alert("تم إعادة تعيين رمز الأمان");
  };

  const handleSendInstruction = async () => {
    if (!instTitle || !instContent) return;
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_instruction",
        title: instTitle,
        content: instContent,
        priority: instPriority,
        targetType: instTargetType,
        targetRank: instTargetRank,
        targetModId: instTargetModId,
      }),
    });
    setShowInstructionForm(false);
    setInstTitle(""); setInstContent(""); setInstPriority("normal"); setInstTargetType("all");
    fetchInstructions();
  };

  const handleReviewReport = async (reportId: string, status: string) => {
    await fetch("/api/admin/moderators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review_escalation", reportId, status, adminNote: reviewNote }),
    });
    setReviewingReport(null);
    setReviewNote("");
    fetchReports();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sections = [
    { id: "moderators", label: "المشرفين", icon: "👮" },
    { id: "instructions", label: "التعليمات", icon: "📋" },
    { id: "reports", label: "البلاغات", icon: "🚨" },
    { id: "activity", label: "سجل الأنشطة", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة المشرفين</h1>
              <p className="text-gray-500 text-sm">تعيين وإدارة مشرفين الشات وصلاحياتهم</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { label: "الرئيسية", href: "/admin", icon: "🏠" },
              { label: "اللغات", href: "/admin/languages", icon: "🌐" },
              { label: "المستويات", href: "/admin/levels", icon: "📊" },
              { label: "الدروس", href: "/admin/lessons", icon: "📚" },
              { label: "الأسئلة", href: "/admin/questions", icon: "❓" },
              { label: "الشهادات", href: "/admin/certificates", icon: "🎓" },
              { label: "المستخدمين", href: "/admin/users", icon: "👥" },
              { label: "التذاكر", href: "/admin/tickets", icon: "🎫" },
              { label: "رسائل الاتصال", href: "/admin/contact", icon: "📬" },
              { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
              { label: "الدردشة", href: "/admin/chat", icon: "💬" },
              { label: "تغيير الأسماء", href: "/admin/name-requests", icon: "✏️" },
              { label: "فريق العمل", href: "/admin/team", icon: "👨‍💼" },
              { label: "المشرفين", href: "/admin/moderators", icon: "👮" },
              { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
              { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/moderators" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section Tabs */}
        <div className="flex gap-2 mb-6">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeSection === s.id ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ============ MODERATORS LIST ============ */}
        {activeSection === "moderators" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">قائمة المشرفين ({moderators.length})</h2>
              <button onClick={() => setShowAddForm(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                + تعيين مشرف جديد
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">تعيين مشرف جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">المستخدم</label>
                    <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">اختر مستخدم</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">الرتبة</label>
                    <select value={selectedRank} onChange={(e) => setSelectedRank(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="assistant">مساعد مشرف</option>
                      <option value="moderator">مشرف دردشة</option>
                      <option value="head">رئيس مشرفين</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">رمز الأمان (PIN)</label>
                    <input type="text" value={newPin} onChange={(e) => setNewPin(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="4 أرقام على الأقل" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddModerator} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">تعيين المشرف</button>
                  <button onClick={() => setShowAddForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                </div>
              </div>
            )}

            {/* Moderators Grid */}
            {moderators.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400">لا يوجد مشرفين معينين</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moderators.map((mod) => {
                  const perms: string[] = JSON.parse(mod.permissions || "[]");
                  return (
                    <div key={mod.id} className={`bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl p-5 ${!mod.isActive ? "opacity-60" : ""}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg overflow-hidden">
                          {mod.user.avatar ? (
                            <img src={mod.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            mod.user.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{mod.user.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${RANK_COLORS[mod.rank] || "bg-gray-100 text-gray-600"}`}>
                              {RANK_LABELS[mod.rank] || mod.rank}
                            </span>
                            {!mod.isActive && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">معطّل</span>}
                          </div>
                          <p className="text-gray-500 text-xs">{mod.user.email}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>بلاغات: {mod._count.reports}</span>
                            <span>أنشطة: {mod._count.activityLogs}</span>
                            <span>جلسات: {mod._count.sessions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                        <select
                          value={mod.rank}
                          onChange={(e) => handleUpdateRank(mod.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="assistant">مساعد مشرف</option>
                          <option value="moderator">مشرف دردشة</option>
                          <option value="head">رئيس مشرفين</option>
                        </select>
                        <button onClick={() => handleToggleActive(mod.id, mod.isActive)}
                          className={`text-xs px-3 py-1 rounded ${mod.isActive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {mod.isActive ? "تعطيل" : "تفعيل"}
                        </button>
                        <button onClick={() => { setEditingPermsMod(editingPermsMod === mod.id ? null : mod.id); setEditPerms(perms); }}
                          className={`text-xs px-3 py-1 rounded ${editingPermsMod === mod.id ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}>
                          الصلاحيات
                        </button>
                        <button onClick={() => handleResetPin(mod.id)}
                          className="text-xs px-3 py-1 rounded bg-purple-50 text-purple-600">
                          إعادة PIN
                        </button>
                        <button onClick={() => handleRemoveModerator(mod.id)}
                          className="text-xs px-3 py-1 rounded bg-red-50 text-red-600">
                          إزالة
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Permission Editor Modal */}
            {editingPermsMod && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingPermsMod(null)}>
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-bold text-lg text-gray-900 mb-4">تعديل الصلاحيات</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={editPerms.includes(p.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPerms([...editPerms, p.key]);
                            } else {
                              setEditPerms(editPerms.filter(k => k !== p.key));
                            }
                          }}
                          className="rounded border-gray-300 w-4 h-4"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-5 pt-4 border-t">
                    <button onClick={() => handleSavePermissions(editingPermsMod)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm flex-1">حفظ الصلاحيات</button>
                    <button onClick={() => setEditingPermsMod(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ INSTRUCTIONS ============ */}
        {activeSection === "instructions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">التعليمات والملاحظات</h2>
              <button onClick={() => setShowInstructionForm(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                + إرسال تعليمات
              </button>
            </div>

            {/* Instruction Form */}
            {showInstructionForm && (
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">إرسال تعليمات جديدة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">العنوان</label>
                    <input type="text" value={instTitle} onChange={(e) => setInstTitle(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="عنوان التعليمات..." />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">المحتوى</label>
                    <textarea value={instContent} onChange={(e) => setInstContent(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm h-32 resize-none" placeholder="محتوى التعليمات..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">الأهمية</label>
                      <select value={instPriority} onChange={(e) => setInstPriority(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="normal">عادية</option>
                        <option value="important">مهمة</option>
                        <option value="urgent">عاجلة</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">الهدف</label>
                      <select value={instTargetType} onChange={(e) => setInstTargetType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="all">جميع المشرفين</option>
                        <option value="rank">حسب الرتبة</option>
                        <option value="specific">مشرف محدد</option>
                      </select>
                    </div>
                    {instTargetType === "rank" && (
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">الرتبة</label>
                        <select value={instTargetRank} onChange={(e) => setInstTargetRank(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="">اختر الرتبة</option>
                          <option value="assistant">مساعد مشرف</option>
                          <option value="moderator">مشرف دردشة</option>
                          <option value="head">رئيس مشرفين</option>
                        </select>
                      </div>
                    )}
                    {instTargetType === "specific" && (
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">المشرف</label>
                        <select value={instTargetModId} onChange={(e) => setInstTargetModId(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="">اختر المشرف</option>
                          {moderators.map((m) => (
                            <option key={m.id} value={m.id}>{m.user.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSendInstruction} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">إرسال</button>
                  <button onClick={() => setShowInstructionForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                </div>
              </div>
            )}

            {/* Instructions List */}
            {instructions.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400">لا توجد تعليمات</p>
              </div>
            ) : (
              instructions.map((inst) => {
                const totalMods = inst.acknowledgments.length;
                const confirmed = inst.acknowledgments.filter(a => a.status === "confirmed").length;
                const read = inst.acknowledgments.filter(a => a.status !== "unread").length;
                return (
                  <div key={inst.id} className={`card p-5 ${inst.priority === "urgent" ? "border-red-300 border-2" : inst.priority === "important" ? "border-amber-300 border-2" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        inst.priority === "urgent" ? "bg-red-100" : inst.priority === "important" ? "bg-amber-100" : "bg-gray-100"
                      }`}>
                        {inst.priority === "urgent" ? "🔴" : inst.priority === "important" ? "🟡" : "📋"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{inst.title}</h3>
                          {inst.priority !== "normal" && (
                            <span className={`text-xs px-2 py-0.5 rounded ${inst.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {inst.priority === "urgent" ? "عاجل" : "مهم"}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap mb-2">{inst.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{new Date(inst.createdAt).toLocaleDateString("ar")}</span>
                          <span>الهدف: {inst.targetType === "all" ? "الجميع" : inst.targetType === "rank" ? RANK_LABELS[inst.targetRank] : "مشرف محدد"}</span>
                          <span className="text-emerald-600">تأكيد: {confirmed}/{totalMods}</span>
                          <span className="text-blue-600">اطلاع: {read}/{totalMods}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============ REPORTS ============ */}
        {activeSection === "reports" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">البلاغات ({reports.length})</h2>
            {reports.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400">لا توجد بلاغات</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className={`card p-5 ${report.status === "escalated" ? "border-red-300 border-2" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      report.severity === "critical" ? "bg-red-100" :
                      report.severity === "serious" ? "bg-orange-100" :
                      report.severity === "medium" ? "bg-yellow-100" : "bg-gray-100"
                    }`}>
                      {report.severity === "critical" ? "🔴" : report.severity === "serious" ? "🟠" : report.severity === "medium" ? "🟡" : "⚪"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{report.reportedUser.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          report.status === "pending" ? "bg-amber-100 text-amber-700" :
                          report.status === "escalated" ? "bg-red-100 text-red-700" :
                          report.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {report.status === "pending" ? "معلق" : report.status === "escalated" ? "مصعّد" : report.status === "resolved" ? "تم حله" : report.status === "dismissed" ? "مرفوض" : report.status}
                        </span>
                        {report.escalatedTo === "admin" && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">مصعّد للإدارة</span>}
                      </div>
                      <p className="text-gray-600 text-sm">النوع: {VIOLATION_LABELS[report.violationType] || report.violationType}</p>
                      <p className="text-gray-700 text-sm mt-1">{report.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>بواسطة: {report.reporter.user.name}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString("ar")}</span>
                      </div>
                      {report.adminNote && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">ملاحظة: {report.adminNote}</div>
                      )}
                    </div>
                  </div>

                  {/* Admin actions for pending/escalated reports */}
                  {(report.status === "pending" || report.status === "escalated") && (
                    <div className="flex gap-2 mt-3 mr-13">
                      {reviewingReport !== report.id ? (
                        <>
                          <button onClick={() => handleReviewReport(report.id, "resolved")} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded hover:bg-emerald-100">
                            تم الحل
                          </button>
                          <button onClick={() => handleReviewReport(report.id, "dismissed")} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200">
                            رفض
                          </button>
                          <button onClick={() => setReviewingReport(report.id)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">
                            مراجعة مع ملاحظة
                          </button>
                        </>
                      ) : (
                        <div className="flex-1">
                          <input type="text" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                            className="w-full border rounded px-3 py-1.5 text-sm mb-2" placeholder="ملاحظة الإدارة..." />
                          <div className="flex gap-2">
                            <button onClick={() => handleReviewReport(report.id, "resolved")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded">حل</button>
                            <button onClick={() => handleReviewReport(report.id, "dismissed")} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded">رفض</button>
                            <button onClick={() => { setReviewingReport(null); setReviewNote(""); }} className="text-xs bg-gray-200 text-gray-600 px-3 py-1.5 rounded">إلغاء</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ============ ACTIVITY LOG ============ */}
        {activeSection === "activity" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">سجل أنشطة المشرفين</h2>
            {activities.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-400">لا توجد أنشطة مسجلة</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-right text-xs text-gray-500 font-medium">المشرف</th>
                      <th className="py-3 px-4 text-right text-xs text-gray-500 font-medium">الإجراء</th>
                      <th className="py-3 px-4 text-right text-xs text-gray-500 font-medium">التفاصيل</th>
                      <th className="py-3 px-4 text-right text-xs text-gray-500 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => (
                      <tr key={act.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{act.moderator.user.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{ACTION_LABELS[act.action] || act.action}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{act.details || "—"}</td>
                        <td className="py-3 px-4 text-xs text-gray-400">{new Date(act.createdAt).toLocaleDateString("ar")} {new Date(act.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
