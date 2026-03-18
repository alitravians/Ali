"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

interface ChatMessage {
  id: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  user: ChatUser;
}

interface BanInfo {
  reason: string;
  endsAt: string;
}

interface ActiveBan {
  id: string;
  reason: string;
  endsAt: string;
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

  const userId = session?.user ? (session.user as { id: string }).id : "";
  const userRole = session?.user ? (session.user as { role?: string }).role : "";

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
          setBanInfo({ reason: ban.reason, endsAt: ban.endsAt });
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
        }
      })
      .catch(() => {});
  }, [activeRoom]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeRoom) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), roomId: activeRoom }),
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
                              <span className="text-xs font-bold" style={{ color: msg.user.chatBadgeColor || "#6b7280" }}>
                                {msg.user.name}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                                style={{ backgroundColor: msg.user.chatBadgeColor || "#6b7280" }}
                              >
                                {RANK_LABELS[msg.user.chatRank] || "عضو"}
                              </span>
                            </div>
                          )}
                          {/* Message bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2 relative ${
                              isMe
                                ? "bg-primary-600 text-white rounded-br-md"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-2 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span className={`text-[10px] ${isMe ? "text-primary-200" : "text-gray-400"}`}>
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
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
                <div className="text-center text-sm text-red-500 py-2">
                  أنت محظور من الدردشة - الوقت المتبقي: {countdown}
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
    </div>
  );
}
