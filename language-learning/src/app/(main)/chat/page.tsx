"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import EntryEffectOverlay from "@/components/chat/EntryEffectOverlay";
import type { EntryEffect, EffectType } from "@/components/chat/EntryEffectOverlay";

interface ChatRoom {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  type: string;
  _count: { messages: number };
}

interface ChatUser {
  id: string;
  name: string;
  role: string;
  chatRank: string;
  chatBadgeColor: string;
}

interface UserBadge {
  icon: string;
  imageUrl: string;
  nameAr: string;
  color: string;
}

interface InventoryEffect {
  previewData: string;
  icon: string;
  color: string;
  nameAr: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  user: ChatUser;
  userBadges?: UserBadge[];
  userInventory?: Record<string, InventoryEffect>;
}

interface BanInfo {
  reason: string;
  endsAt: string;
  startedAt: string;
}

interface ActiveBan {
  id: string;
  reason: string;
  endsAt: string;
  startedAt: string;
  duration: number;
}

const RANK_LABELS: Record<string, string> = {
  member: "عضو",
  vip: "VIP",
  teacher: "معلم",
  tester: "مختبر",
  moderator: "مشرف",
  admin: "مدير",
};

const RANK_ICONS: Record<string, string> = {
  member: "👤",
  vip: "⭐",
  teacher: "📚",
  tester: "🔧",
  moderator: "🛡️",
  admin: "👑",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function formatFullDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) + " - " +
    d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} يوم ${hours % 24} ساعة`;
  }
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes} دقيقة ${seconds} ثانية`;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [activeBan, setActiveBan] = useState<ActiveBan | null>(null);
  const [appealText, setAppealText] = useState("");
  const [appealSent, setAppealSent] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [countdown, setCountdown] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Admin action popup state
  const [actionMenuUser, setActionMenuUser] = useState<ChatUser | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inline ban modal state
  const [showBanModal, setShowBanModal] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<ChatUser | null>(null);
  const [banMinutes, setBanMinutes] = useState<number>(30);
  const [banReason, setBanReason] = useState("");
  const [banSubmitting, setBanSubmitting] = useState(false);

  // Escalation modal state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateTargetUser, setEscalateTargetUser] = useState<ChatUser | null>(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateSubmitting, setEscalateSubmitting] = useState(false);

  // Warn modal state
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnTargetUser, setWarnTargetUser] = useState<ChatUser | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [warnSubmitting, setWarnSubmitting] = useState(false);

  // Ban popup for banned user trying to type
  const [showBanPopup, setShowBanPopup] = useState(false);

  // Bold message mode
  const [boldMode, setBoldMode] = useState(false);
  const [canBold, setCanBold] = useState(false);

  // Entry effects tracking (professional system with cooldown)
  const [shownEntryEffects, setShownEntryEffects] = useState<Set<string>>(new Set());
  const [entryEffectQueue, setEntryEffectQueue] = useState<EntryEffect[]>([]);
  const [entryEffectCooldowns, setEntryEffectCooldowns] = useState<Record<string, number>>({});
  const [effectSoundMuted, setEffectSoundMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("effectSoundMuted") === "true";
    }
    return false;
  });
  const ENTRY_EFFECT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown per user

  const userId = session?.user ? (session.user as { id: string }).id : "";
  const userRole = session?.user ? (session.user as { role?: string }).role : "";
  const userChatRank = session?.user ? (session.user as { chatRank?: string }).chatRank : "";
  const isStaff = userRole === "admin" || userChatRank === "moderator" || userChatRank === "admin";

  // Check if user has bold_message permission
  useEffect(() => {
    if (userRole === "admin") {
      setCanBold(true);
      return;
    }
    if (!userId) return;
    fetch(`/api/moderator?section=dashboard`)
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then(() => {
        // User is a moderator, check permissions
        fetch(`/api/moderator?section=permissions`)
          .then((r) => { if (r.ok) return r.json(); throw new Error(); })
          .then((data) => {
            if (Array.isArray(data?.permissions) && (data.permissions.includes("bold_message") || data.permissions.includes("all"))) {
              setCanBold(true);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [userId, userRole]);

  // Fetch rooms
  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRooms(data);
          setActiveRoom(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Check ban status
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/chat/bans?userId=${userId}&active=true`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const ban = data[0];
          setActiveBan(ban);
          setBanInfo({ reason: ban.reason, endsAt: ban.endsAt, startedAt: ban.startedAt });
        }
      })
      .catch(() => {});
  }, [userId]);

  // Countdown timer for ban
  useEffect(() => {
    if (!banInfo) return;
    const timer = setInterval(() => {
      const remaining = formatCountdown(banInfo.endsAt);
      setCountdown(remaining);
      if (remaining === "انتهى") {
        setBanInfo(null);
        setActiveBan(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [banInfo]);

  // Fetch messages with polling
  const fetchMessages = useCallback(() => {
    if (!activeRoom) return;
    fetch(`/api/chat/messages?roomId=${activeRoom}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
          // Detect entry effects for new users (professional system with cooldown)
          const newEffects: EntryEffect[] = [];
          const now = Date.now();
          for (const msg of data) {
            if (msg.userInventory?.entry_effect && !shownEntryEffects.has(msg.user.id)) {
              // Check cooldown - don't show effect if user entered recently
              const lastShown = entryEffectCooldowns[msg.user.id] || 0;
              if (now - lastShown < ENTRY_EFFECT_COOLDOWN) continue;
              // Skip own effects
              if (msg.user.id === userId) continue;
              
              // Parse effect type from previewData
              let effectType: EffectType = "glow";
              let rarity = "common";
              try {
                const pd = JSON.parse(msg.userInventory.entry_effect.previewData || "{}");
                if (pd.effect) effectType = pd.effect as EffectType;
                if (pd.rarity) rarity = pd.rarity;
              } catch { /* use default */ }
              
              newEffects.push({
                userId: msg.user.id,
                userName: msg.user.name,
                effectType,
                icon: msg.userInventory.entry_effect.icon,
                color: msg.userInventory.entry_effect.color,
                nameAr: msg.userInventory.entry_effect.nameAr,
                rarity,
                videoUrl: msg.userInventory.entry_effect.videoUrl || undefined,
                soundUrl: msg.userInventory.entry_effect.soundUrl || undefined,
                effectDuration: msg.userInventory.entry_effect.effectDuration || 5,
              });
            }
          }
          if (newEffects.length > 0) {
            setShownEntryEffects((prev) => {
              const next = new Set(prev);
              newEffects.forEach((e) => next.add(e.userId));
              return next;
            });
            // Update cooldowns
            setEntryEffectCooldowns((prev) => {
              const updated = { ...prev };
              newEffects.forEach((e) => { updated[e.userId] = now; });
              return updated;
            });
            setEntryEffectQueue((prev) => [...prev, ...newEffects]);
          }
        }
      })
      .catch(() => {});
  }, [activeRoom, shownEntryEffects, entryEffectCooldowns, userId, ENTRY_EFFECT_COOLDOWN]);

  useEffect(() => {
    fetchMessages();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close action menu on click outside
  useEffect(() => {
    if (!actionMenuUser) return;
    const handleClick = () => setActionMenuUser(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [actionMenuUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeRoom) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), roomId: activeRoom, bold: boldMode }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.ban) {
          setBanInfo(data.ban);
        }
        alert(data.error);
      } else {
        setNewMessage("");
        fetchMessages();
      }
    } catch {
      alert("فشل في إرسال الرسالة");
    }
    setSending(false);
  };

  const handleAppeal = async () => {
    if (!appealText.trim() || !activeBan) return;
    try {
      const res = await fetch("/api/chat/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banId: activeBan.id, reason: appealText.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAppealSent(true);
      }
    } catch {
      alert("فشل في إرسال الاعتراض");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("حذف هذه الرسالة؟")) return;
    await fetch(`/api/chat/messages?id=${messageId}`, { method: "DELETE" });
    fetchMessages();
  };

  // Handle username click - show action menu for admin/staff
  const handleUsernameClick = (e: React.MouseEvent, user: ChatUser) => {
    if (!isStaff) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActionMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setActionMenuUser(user);
  };

  // Inline ban from chat
  const handleInlineBan = async () => {
    if (!banTargetUser || !banReason.trim() || banMinutes < 1) return;
    setBanSubmitting(true);
    try {
      const res = await fetch("/api/chat/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: banTargetUser.id, reason: banReason.trim(), duration: banMinutes }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowBanModal(false);
        setBanReason("");
        setBanMinutes(30);
        fetchMessages();
      }
    } catch {
      alert("فشل في تنفيذ الحظر");
    }
    setBanSubmitting(false);
  };

  // Escalate user
  const handleEscalate = async () => {
    if (!escalateTargetUser || !escalateReason.trim()) return;
    setEscalateSubmitting(true);
    try {
      const res = await fetch("/api/chat/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: escalateTargetUser.id, reason: escalateReason.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowEscalateModal(false);
        setEscalateReason("");
        alert("تم تصعيد المستخدم للإدارة بنجاح");
      }
    } catch {
      alert("فشل في التصعيد");
    }
    setEscalateSubmitting(false);
  };

  // Warn user from chat
  const handleInlineWarn = async () => {
    if (!warnTargetUser || !warnReason.trim()) return;
    setWarnSubmitting(true);
    try {
      const res = await fetch("/api/chat/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: warnTargetUser.id, reason: warnReason.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowWarnModal(false);
        setWarnReason("");
      }
    } catch {
      alert("فشل في إرسال التحذير");
    }
    setWarnSubmitting(false);
  };

  // Handle banned user clicking on input
  const handleBannedInputClick = () => {
    if (banInfo) {
      setShowBanPopup(true);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">الدردشة</h2>
          <p className="text-gray-600 mb-4">يجب تسجيل الدخول للمشاركة في الدردشة</p>
          <Link href="/auth/login" className="btn-primary">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  const activeRoomData = rooms.find((r) => r.id === activeRoom);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden btn-secondary text-sm px-3 py-2"
            >
              {showSidebar ? "✕" : "☰"}
            </button>
            <h1 className="text-xl font-bold text-gray-900">💬 الدردشة</h1>
          </div>
          <Link href="/" className="btn-secondary text-sm">← الرئيسية</Link>
        </div>

        {/* Ban Banner */}
        {banInfo && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🚫</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-800">أنت محظور من الدردشة</h3>
                <p className="text-sm text-red-700 mt-1">السبب: {banInfo.reason}</p>
                {banInfo.startedAt && (
                  <p className="text-sm text-red-700">تاريخ الحظر: {formatFullDateTime(banInfo.startedAt)}</p>
                )}
                <p className="text-sm text-red-700">ينتهي في: {formatFullDateTime(banInfo.endsAt)}</p>
                <p className="text-sm text-red-700">الوقت المتبقي: <strong>{countdown}</strong></p>
                {!appealSent ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-2">تقديم اعتراض:</p>
                    <textarea
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      className="w-full border border-red-300 rounded-lg p-2 text-sm"
                      rows={2}
                      placeholder="اكتب سبب اعتراضك..."
                    />
                    <button
                      onClick={handleAppeal}
                      disabled={!appealText.trim()}
                      className="mt-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      إرسال الاعتراض
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-emerald-700 font-medium">تم إرسال اعتراضك بنجاح. سيتم مراجعته من قبل الإدارة.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar - Rooms */}
          <div className={`${showSidebar ? "block" : "hidden"} md:block w-full md:w-64 flex-shrink-0`}>
            <div className="card h-full flex flex-col">
              <div className="p-3 border-b">
                <h3 className="font-bold text-gray-800 text-sm">الغرف</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => { setActiveRoom(room.id); setShowSidebar(false); }}
                    className={`w-full text-right p-3 rounded-lg transition-colors ${
                      activeRoom === room.id
                        ? "bg-primary-50 border border-primary-200 text-primary-800"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {room.type === "support" ? "🎧" : room.type === "educational" ? "📚" : room.type === "admin" ? "👑" : "💬"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{room.nameAr}</p>
                        <p className="text-xs text-gray-500">{room._count.messages} رسالة</p>
                      </div>
                    </div>
                  </button>
                ))}
                {rooms.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-8">لا توجد غرف بعد</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 card flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {activeRoomData?.type === "support" ? "🎧" : activeRoomData?.type === "educational" ? "📚" : "💬"}
                </span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{activeRoomData?.nameAr || "اختر غرفة"}</h3>
                  {activeRoomData?.description && (
                    <p className="text-xs text-gray-500">{activeRoomData.description}</p>
                  )}
                </div>
              </div>
              {userRole === "admin" && (
                <Link href="/admin/chat" className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 transition-colors">
                  إدارة الدردشة
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-5xl mb-3">💬</div>
                    <p className="text-sm">لا توجد رسائل بعد. كن أول من يكتب!</p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.user.id === userId;
                const showDate = idx === 0 || formatDate(msg.createdAt) !== formatDate(messages[idx - 1].createdAt);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(msg.createdAt)}</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    )}

                    {msg.isSystem ? (
                      <div className="flex justify-center">
                        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                        <div className={`max-w-[75%] ${isMe ? "order-2" : ""}`}>
                          {/* User info */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-xs">{RANK_ICONS[msg.user.chatRank] || "👤"}</span>
                              <span
                                className={`text-xs font-bold ${isStaff ? "cursor-pointer hover:underline" : ""}`}
                                style={{ color: msg.user.chatBadgeColor || "#6b7280" }}
                                onClick={(e) => handleUsernameClick(e, msg.user)}
                              >
                                {msg.user.name}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                                style={{ backgroundColor: msg.user.chatBadgeColor || "#6b7280" }}
                              >
                                {RANK_LABELS[msg.user.chatRank] || "عضو"}
                              </span>
                              {msg.userBadges && msg.userBadges.length > 0 && msg.userBadges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                                  style={{ backgroundColor: badge.color }}
                                  title={badge.nameAr}
                                >
                                  {badge.imageUrl ? (
                                    <img src={badge.imageUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                  ) : (
                                    badge.icon
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Necklace display */}
                          {!isMe && msg.userInventory?.necklace && (() => {
                            try {
                              return (
                                <div className="flex items-center gap-1 mb-0.5 px-1">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: msg.userInventory!.necklace.color + "20", color: msg.userInventory!.necklace.color }}>
                                    {msg.userInventory!.necklace.icon} {msg.userInventory!.necklace.nameAr}
                                  </span>
                                </div>
                              );
                            } catch { return null; }
                          })()}
                          {/* Message bubble - with custom bubble support */}
                          {(() => {
                            let bubbleStyle: React.CSSProperties = {};
                            let bubbleClass = "";
                            let hasBubble = false;
                            if (!isMe && msg.userInventory?.bubble) {
                              try {
                                const bData = JSON.parse(msg.userInventory.bubble.previewData);
                                if (bData.bg) {
                                  bubbleStyle = { background: bData.bg, color: bData.text || "#fff", border: `2px solid ${bData.border || "transparent"}` };
                                  bubbleClass = "rounded-2xl px-4 py-2 relative rounded-bl-md shadow-sm";
                                  hasBubble = true;
                                }
                              } catch { /* ignore */ }
                            }
                            if (!hasBubble) {
                              bubbleClass = `rounded-2xl px-4 py-2 relative ${
                                isMe ? "bg-primary-600 text-white rounded-br-md"
                                  : msg.content.startsWith("[BOLD]") ? "bg-amber-50 border-2 border-amber-300 text-gray-900 rounded-bl-md shadow-md"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                              }`;
                            }
                            return (
                              <div className={bubbleClass} style={bubbleStyle}>
                                {msg.content.startsWith("[BOLD]") ? (
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-amber-500 mt-0.5">&#9733;</span>
                                    <p className="text-base font-bold leading-relaxed whitespace-pre-wrap break-words" style={hasBubble ? {} : { color: "black" }}>
                                      {msg.content.slice(6)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                <div className={`flex items-center gap-2 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                  <span className={`text-[10px] ${isMe ? "text-primary-200" : hasBubble ? "opacity-70" : "text-gray-400"}`}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Admin delete button */}
                          {userRole === "admin" && !isMe && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 mt-1 px-1 transition-opacity"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t">
              {banInfo ? (
                <div
                  className="text-center text-sm text-red-500 py-2 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
                  onClick={handleBannedInputClick}
                >
                  🚫 أنت محظور من الدردشة - اضغط هنا للتفاصيل
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  {canBold && (
                    <button
                      type="button"
                      onClick={() => setBoldMode(!boldMode)}
                      title={boldMode ? "إلغاء الخط العريض" : "كتابة بالخط العريض"}
                      className={`px-3 py-2.5 rounded-xl text-sm font-black transition-all border-2 ${
                        boldMode
                          ? "bg-amber-100 border-amber-400 text-amber-800 shadow-inner"
                          : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      }`}
                    >
                      B
                    </button>
                  )}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={boldMode ? "اكتب رسالة عريضة..." : "اكتب رسالتك..."}
                    className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      boldMode ? "border-amber-300 bg-amber-50 font-bold" : "border-gray-200"
                    }`}
                    maxLength={1000}
                    disabled={!activeRoom}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending || !activeRoom}
                    className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "..." : "إرسال"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Action Popup Menu */}
      {actionMenuUser && isStaff && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px]"
          style={{ left: actionMenuPos.x, top: actionMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">{actionMenuUser.name}</p>
            <p className="text-xs text-gray-500">
              {RANK_ICONS[actionMenuUser.chatRank]} {RANK_LABELS[actionMenuUser.chatRank] || "عضو"}
            </p>
          </div>
          {userRole === "admin" && (
            <button
              onClick={() => {
                setBanTargetUser(actionMenuUser);
                setShowBanModal(true);
                setActionMenuUser(null);
              }}
              className="w-full text-right px-4 py-2.5 text-sm hover:bg-red-50 text-red-700 flex items-center gap-2 transition-colors"
            >
              <span>🚫</span>
              <span>حظر مؤقت</span>
            </button>
          )}
          <button
            onClick={() => {
              setWarnTargetUser(actionMenuUser);
              setShowWarnModal(true);
              setActionMenuUser(null);
            }}
            className="w-full text-right px-4 py-2.5 text-sm hover:bg-amber-50 text-amber-700 flex items-center gap-2 transition-colors"
          >
            <span>⚠️</span>
            <span>تحذير</span>
          </button>
          <button
            onClick={() => {
              setEscalateTargetUser(actionMenuUser);
              setShowEscalateModal(true);
              setActionMenuUser(null);
            }}
            className="w-full text-right px-4 py-2.5 text-sm hover:bg-orange-50 text-orange-700 flex items-center gap-2 transition-colors"
          >
            <span>📢</span>
            <span>تصعيد للإدارة</span>
          </button>
          {userRole === "admin" && (
            <Link
              href="/admin/chat"
              className="w-full text-right px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2 transition-colors"
              onClick={() => setActionMenuUser(null)}
            >
              <span>👤</span>
              <span>عرض معلومات المستخدم</span>
            </Link>
          )}
        </div>
      )}

      {/* Inline Ban Modal */}
      {showBanModal && banTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🚫 حظر مؤقت</h3>
            <p className="text-sm text-gray-500 mb-4">حظر المستخدم: <strong>{banTargetUser.name}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة (بالدقائق)</label>
                <input
                  type="number"
                  value={banMinutes}
                  onChange={(e) => setBanMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input-field w-full"
                  min={1}
                  max={525600}
                  placeholder="30"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[10, 30, 60, 360, 1440, 10080].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBanMinutes(m)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        banMinutes === m ? "bg-red-100 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {m < 60 ? `${m} دقيقة` : m < 1440 ? `${m / 60} ساعة` : `${m / 1440} يوم`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سبب الحظر</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="input-field w-full"
                  rows={3}
                  placeholder="اكتب سبب الحظر..."
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setShowBanModal(false); setBanReason(""); }}
                className="btn-secondary text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleInlineBan}
                disabled={!banReason.trim() || banSubmitting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {banSubmitting ? "جاري الحظر..." : "تنفيذ الحظر"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warn Modal */}
      {showWarnModal && warnTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">⚠️ تحذير مستخدم</h3>
            <p className="text-sm text-gray-500 mb-4">تحذير: <strong>{warnTargetUser.name}</strong></p>
            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="سبب التحذير..."
              maxLength={500}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setShowWarnModal(false); setWarnReason(""); }}
                className="btn-secondary text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleInlineWarn}
                disabled={!warnReason.trim() || warnSubmitting}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {warnSubmitting ? "جاري الإرسال..." : "إرسال التحذير"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && escalateTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">📢 تصعيد للإدارة</h3>
            <p className="text-sm text-gray-500 mb-4">تصعيد المستخدم: <strong>{escalateTargetUser.name}</strong></p>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="سبب التصعيد..."
              maxLength={500}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => { setShowEscalateModal(false); setEscalateReason(""); }}
                className="btn-secondary text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleEscalate}
                disabled={!escalateReason.trim() || escalateSubmitting}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {escalateSubmitting ? "جاري التصعيد..." : "تصعيد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Popup - dates/times WITHOUT reason */}
      {showBanPopup && banInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-3">🚫</div>
            <h3 className="text-lg font-bold text-red-800 mb-4">لا يمكنك الكتابة</h3>
            <div className="bg-red-50 rounded-xl p-4 space-y-2 text-sm text-right">
              {banInfo.startedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-red-700 font-medium">{formatFullDateTime(banInfo.startedAt)}</span>
                  <span className="text-red-500">تاريخ الحظر:</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-red-700 font-medium">{formatFullDateTime(banInfo.endsAt)}</span>
                <span className="text-red-500">ينتهي في:</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-700 font-bold">{countdown}</span>
                <span className="text-red-500">الوقت المتبقي:</span>
              </div>
            </div>
            <button
              onClick={() => setShowBanPopup(false)}
              className="mt-4 btn-secondary text-sm w-full"
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      {/* Sound mute toggle for entry effects */}
      <button
        onClick={() => {
          setEffectSoundMuted((prev: boolean) => {
            const next = !prev;
            localStorage.setItem("effectSoundMuted", String(next));
            return next;
          });
        }}
        className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all"
        title={effectSoundMuted ? "تفعيل صوت تأثيرات الدخول" : "كتم صوت تأثيرات الدخول"}
      >
        {effectSoundMuted ? "🔇" : "🔊"}
      </button>

      {/* Professional Entry Effects Overlay */}
      <EntryEffectOverlay
        effects={entryEffectQueue}
        onEffectComplete={(completedUserId) => {
          setEntryEffectQueue((prev) => prev.filter((e) => e.userId !== completedUserId));
        }}
        soundMuted={effectSoundMuted}
      />
    </div>
  );
}
