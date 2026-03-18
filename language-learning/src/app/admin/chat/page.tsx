"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  chatRank: string;
  chatBadgeColor: string;
  _count: { chatMessages: number; chatWarnings: number; chatBans: number };
}

interface ChatRoom {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  type: string;
  isActive: boolean;
  _count: { messages: number };
}

interface Warning {
  id: string;
  reason: string;
  issuedBy: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Ban {
  id: string;
  reason: string;
  duration: number;
  isActive: boolean;
  startedAt: string;
  endsAt: string;
  user: { id: string; name: string; email: string };
  appeals: Appeal[];
}

interface Appeal {
  id: string;
  reason: string;
  status: string;
  adminNote: string;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
  ban: { reason: string; duration: number; endsAt: string };
}

interface AdminLog {
  id: string;
  action: string;
  targetUserId: string;
  details: string;
  createdAt: string;
  admin: { id: string; name: string };
}

const RANKS = [
  { value: "member", label: "عضو", color: "#6b7280" },
  { value: "vip", label: "VIP", color: "#f59e0b" },
  { value: "teacher", label: "معلم", color: "#10b981" },
  { value: "tester", label: "مختبر", color: "#8b5cf6" },
  { value: "moderator", label: "مشرف", color: "#3b82f6" },
  { value: "admin", label: "مدير", color: "#ef4444" },
];

const BAN_DURATIONS = [
  { value: "10m", label: "10 دقائق" },
  { value: "30m", label: "30 دقيقة" },
  { value: "1h", label: "ساعة واحدة" },
  { value: "6h", label: "6 ساعات" },
  { value: "24h", label: "24 ساعة" },
  { value: "3d", label: "3 أيام" },
  { value: "7d", label: "7 أيام" },
  { value: "permanent", label: "دائم" },
];

const ACTION_LABELS: Record<string, string> = {
  warn: "تحذير",
  ban: "حظر",
  unban: "رفع حظر",
  mute: "كتم",
  rank_change: "تغيير رتبة",
  delete_message: "حذف رسالة",
  appeal_review: "مراجعة اعتراض",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminChatPage() {
  const [tab, setTab] = useState<"users" | "rooms" | "warnings" | "bans" | "appeals" | "logs">("users");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("1h");
  const [newRank, setNewRank] = useState("member");
  const [newBadgeColor, setNewBadgeColor] = useState("#6b7280");
  const [appealDecision, setAppealDecision] = useState("rejected");
  const [appealNote, setAppealNote] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomNameAr, setNewRoomNameAr] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomType, setNewRoomType] = useState("public");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, roomsRes, warningsRes, bansRes, appealsRes, logsRes] = await Promise.all([
        fetch("/api/chat/users"),
        fetch("/api/chat/rooms"),
        fetch("/api/chat/warnings"),
        fetch("/api/chat/bans"),
        fetch("/api/chat/appeals?status=pending"),
        fetch("/api/chat/admin-log"),
      ]);
      const [usersData, roomsData, warningsData, bansData, appealsData, logsData] = await Promise.all([
        usersRes.json(),
        roomsRes.json(),
        warningsRes.json(),
        bansRes.json(),
        appealsRes.json(),
        logsRes.json(),
      ]);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(roomsData)) setRooms(roomsData);
      if (Array.isArray(warningsData)) setWarnings(warningsData);
      if (Array.isArray(bansData)) setBans(bansData);
      if (Array.isArray(appealsData)) setAppeals(appealsData);
      if (Array.isArray(logsData)) setLogs(logsData);
    } catch {
      // Silently handle fetch errors
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleWarn = async () => {
    if (!selectedUser || !warnReason.trim()) return;
    await fetch("/api/chat/warnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, reason: warnReason }),
    });
    setShowWarnModal(false);
    setWarnReason("");
    fetchData();
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    await fetch("/api/chat/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, reason: banReason, duration: banDuration }),
    });
    setShowBanModal(false);
    setBanReason("");
    fetchData();
  };

  const handleUnban = async (banId: string) => {
    if (!confirm("رفع الحظر عن هذا المستخدم؟")) return;
    await fetch("/api/chat/bans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banId }),
    });
    fetchData();
  };

  const handleRankChange = async () => {
    if (!selectedUser) return;
    await fetch("/api/chat/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, chatRank: newRank, chatBadgeColor: newBadgeColor }),
    });
    setShowRankModal(false);
    fetchData();
  };

  const handleAppealReview = async () => {
    if (!selectedAppeal) return;
    await fetch("/api/chat/appeals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appealId: selectedAppeal.id, status: appealDecision, adminNote: appealNote }),
    });
    setShowAppealModal(false);
    setAppealNote("");
    fetchData();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !newRoomNameAr.trim()) return;
    await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName, nameAr: newRoomNameAr, description: newRoomDesc, type: newRoomType }),
    });
    setShowRoomModal(false);
    setNewRoomName("");
    setNewRoomNameAr("");
    setNewRoomDesc("");
    fetchData();
  };

  const tabs = [
    { id: "users" as const, label: "المستخدمين", icon: "👥", count: users.length },
    { id: "rooms" as const, label: "الغرف", icon: "💬", count: rooms.length },
    { id: "warnings" as const, label: "التحذيرات", icon: "⚠️", count: warnings.length },
    { id: "bans" as const, label: "الحظر", icon: "🚫", count: bans.filter((b) => b.isActive).length },
    { id: "appeals" as const, label: "الاعتراضات", icon: "📋", count: appeals.length },
    { id: "logs" as const, label: "السجلات", icon: "📜", count: logs.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">💬 إدارة الدردشة</h1>
            <div className="flex gap-2">
              <Link href="/chat" className="btn-secondary text-sm">فتح الدردشة</Link>
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id ? "bg-primary-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab === t.id ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-700">المستخدم</th>
                    <th className="text-right p-3 font-medium text-gray-700">الرتبة</th>
                    <th className="text-center p-3 font-medium text-gray-700">الرسائل</th>
                    <th className="text-center p-3 font-medium text-gray-700">التحذيرات</th>
                    <th className="text-center p-3 font-medium text-gray-700">الحظر</th>
                    <th className="text-center p-3 font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: u.chatBadgeColor || "#6b7280" }}
                        >
                          {RANKS.find((r) => r.value === u.chatRank)?.label || "عضو"}
                        </span>
                      </td>
                      <td className="text-center p-3 text-gray-600">{u._count.chatMessages}</td>
                      <td className="text-center p-3">
                        <span className={u._count.chatWarnings > 0 ? "text-amber-600 font-bold" : "text-gray-400"}>
                          {u._count.chatWarnings}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className={u._count.chatBans > 0 ? "text-red-600 font-bold" : "text-gray-400"}>
                          {u._count.chatBans}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedUser(u); setNewRank(u.chatRank); setNewBadgeColor(u.chatBadgeColor); setShowRankModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="تغيير الرتبة"
                          >🏅</button>
                          <button
                            onClick={() => { setSelectedUser(u); setShowWarnModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="تحذير"
                          >⚠️</button>
                          <button
                            onClick={() => { setSelectedUser(u); setShowBanModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="حظر"
                          >🚫</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {tab === "rooms" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowRoomModal(true)} className="btn-primary text-sm">+ إنشاء غرفة جديدة</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {room.type === "support" ? "🎧" : room.type === "educational" ? "📚" : room.type === "admin" ? "👑" : "💬"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{room.nameAr}</h4>
                      <p className="text-xs text-gray-500">{room.name}</p>
                    </div>
                  </div>
                  {room.description && <p className="text-xs text-gray-600 mb-2">{room.description}</p>}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{room._count.messages} رسالة</span>
                    <span className={`px-2 py-0.5 rounded-full ${room.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {room.isActive ? "نشطة" : "معطلة"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings Tab */}
        {tab === "warnings" && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-700">المستخدم</th>
                    <th className="text-right p-3 font-medium text-gray-700">السبب</th>
                    <th className="text-right p-3 font-medium text-gray-700">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((w) => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{w.user.name}</td>
                      <td className="p-3 text-gray-700">{w.reason}</td>
                      <td className="p-3 text-gray-500 text-xs">{formatDate(w.createdAt)}</td>
                    </tr>
                  ))}
                  {warnings.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">لا توجد تحذيرات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bans Tab */}
        {tab === "bans" && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-700">المستخدم</th>
                    <th className="text-right p-3 font-medium text-gray-700">السبب</th>
                    <th className="text-center p-3 font-medium text-gray-700">الحالة</th>
                    <th className="text-right p-3 font-medium text-gray-700">ينتهي في</th>
                    <th className="text-center p-3 font-medium text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {bans.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{b.user.name}</p>
                        <p className="text-xs text-gray-500">{b.user.email}</p>
                      </td>
                      <td className="p-3 text-gray-700">{b.reason}</td>
                      <td className="text-center p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          b.isActive && new Date(b.endsAt) > new Date() ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {b.isActive && new Date(b.endsAt) > new Date() ? "نشط" : "منتهي"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{formatDate(b.endsAt)}</td>
                      <td className="text-center p-3">
                        {b.isActive && new Date(b.endsAt) > new Date() && (
                          <button onClick={() => handleUnban(b.id)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-200">
                            رفع الحظر
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bans.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">لا توجد حالات حظر</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appeals Tab */}
        {tab === "appeals" && (
          <div className="space-y-4">
            {appeals.length === 0 && (
              <div className="card p-8 text-center text-gray-400">لا توجد اعتراضات قيد المراجعة</div>
            )}
            {appeals.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📋</span>
                      <h4 className="font-bold text-gray-900">{a.user.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === "pending" ? "bg-amber-100 text-amber-700" : a.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {a.status === "pending" ? "قيد المراجعة" : a.status === "accepted" ? "مقبول" : a.status === "reduced" ? "مخفف" : "مرفوض"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1"><strong>سبب الحظر:</strong> {a.ban.reason}</p>
                    <p className="text-sm text-gray-700 mb-1"><strong>سبب الاعتراض:</strong> {a.reason}</p>
                    <p className="text-xs text-gray-500">تاريخ التقديم: {formatDate(a.createdAt)}</p>
                  </div>
                  {a.status === "pending" && (
                    <button
                      onClick={() => { setSelectedAppeal(a); setAppealDecision("rejected"); setAppealNote(""); setShowAppealModal(true); }}
                      className="btn-primary text-sm"
                    >
                      مراجعة
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {tab === "logs" && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-700">الإجراء</th>
                    <th className="text-right p-3 font-medium text-gray-700">المسؤول</th>
                    <th className="text-right p-3 font-medium text-gray-700">التفاصيل</th>
                    <th className="text-right p-3 font-medium text-gray-700">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {ACTION_LABELS[l.action] || l.action}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{l.admin.name}</td>
                      <td className="p-3 text-gray-700 text-xs max-w-xs truncate">{l.details}</td>
                      <td className="p-3 text-gray-500 text-xs">{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">لا توجد سجلات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      {showWarnModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ تحذير {selectedUser.name}</h3>
            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="input-field w-full mb-4"
              rows={3}
              placeholder="سبب التحذير..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowWarnModal(false)} className="btn-secondary text-sm">إلغاء</button>
              <button onClick={handleWarn} disabled={!warnReason.trim()} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">إرسال التحذير</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚫 حظر {selectedUser.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة</label>
                <select value={banDuration} onChange={(e) => setBanDuration(e.target.value)} className="input-field w-full">
                  {BAN_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="input-field w-full"
                  rows={3}
                  placeholder="سبب الحظر..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowBanModal(false)} className="btn-secondary text-sm">إلغاء</button>
              <button onClick={handleBan} disabled={!banReason.trim()} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50">تنفيذ الحظر</button>
            </div>
          </div>
        </div>
      )}

      {/* Rank Modal */}
      {showRankModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🏅 تغيير رتبة {selectedUser.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرتبة</label>
                <select value={newRank} onChange={(e) => { setNewRank(e.target.value); const r = RANKS.find((r) => r.value === e.target.value); if (r) setNewBadgeColor(r.color); }} className="input-field w-full">
                  {RANKS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">لون الشارة</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={newBadgeColor} onChange={(e) => setNewBadgeColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                  <input type="text" value={newBadgeColor} onChange={(e) => setNewBadgeColor(e.target.value)} className="input-field flex-1" dir="ltr" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-sm text-gray-600">معاينة:</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: newBadgeColor }}>
                  {RANKS.find((r) => r.value === newRank)?.label || "عضو"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowRankModal(false)} className="btn-secondary text-sm">إلغاء</button>
              <button onClick={handleRankChange} className="btn-primary text-sm">حفظ التغييرات</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💬 إنشاء غرفة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الغرفة (إنجليزي)</label>
                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="input-field w-full" dir="ltr" placeholder="general-chat" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الغرفة (عربي)</label>
                <input type="text" value={newRoomNameAr} onChange={(e) => setNewRoomNameAr(e.target.value)} className="input-field w-full" placeholder="الدردشة العامة" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <input type="text" value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)} className="input-field w-full" placeholder="وصف مختصر للغرفة..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <select value={newRoomType} onChange={(e) => setNewRoomType(e.target.value)} className="input-field w-full">
                  <option value="public">عامة</option>
                  <option value="support">دعم فني</option>
                  <option value="educational">تعليمية</option>
                  <option value="admin">إدارية</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowRoomModal(false)} className="btn-secondary text-sm">إلغاء</button>
              <button onClick={handleCreateRoom} disabled={!newRoomName.trim() || !newRoomNameAr.trim()} className="btn-primary text-sm disabled:opacity-50">إنشاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Review Modal */}
      {showAppealModal && selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 مراجعة الاعتراض</h3>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700"><strong>المستخدم:</strong> {selectedAppeal.user.name}</p>
                <p className="text-sm text-gray-700"><strong>سبب الحظر:</strong> {selectedAppeal.ban.reason}</p>
                <p className="text-sm text-gray-700"><strong>سبب الاعتراض:</strong> {selectedAppeal.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القرار</label>
                <select value={appealDecision} onChange={(e) => setAppealDecision(e.target.value)} className="input-field w-full">
                  <option value="accepted">قبول (رفع الحظر)</option>
                  <option value="reduced">تخفيف (نصف المدة المتبقية)</option>
                  <option value="rejected">رفض</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة للمستخدم</label>
                <textarea value={appealNote} onChange={(e) => setAppealNote(e.target.value)} className="input-field w-full" rows={2} placeholder="ملاحظة اختيارية..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAppealModal(false)} className="btn-secondary text-sm">إلغاء</button>
              <button onClick={handleAppealReview} className="btn-primary text-sm">تأكيد القرار</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
