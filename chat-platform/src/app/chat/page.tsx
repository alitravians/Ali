'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/components/SocketProvider';
import type { ChatMessage, ChatRoom } from '@/types/chat';
import Link from 'next/link';

function ChatContent() {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const _router = useRouter();
  const user = session?.user as any;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [_onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch rooms
  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRooms(data);
          if (data.length > 0 && !activeRoom) {
            setActiveRoom(data[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch messages when room changes
  useEffect(() => {
    if (!activeRoom) return;
    setMessages([]);
    fetch(`/api/rooms/${activeRoom}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
      });

    // Join room via socket
    if (socket) {
      socket.emit('room:join', { roomId: activeRoom });
    }

    return () => {
      if (socket && activeRoom) {
        socket.emit('room:leave', { roomId: activeRoom });
      }
    };
  }, [activeRoom, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (msg) => {
      if (msg.roomId === activeRoom) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      } else {
        setUnreadCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(msg.roomId, (newMap.get(msg.roomId) || 0) + 1);
          return newMap;
        });
      }
    });

    socket.on('message:edited', ({ messageId, content, roomId }) => {
      if (roomId === activeRoom) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m));
      }
    });

    socket.on('message:deleted', ({ messageId, roomId }) => {
      if (roomId === activeRoom) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    });

    socket.on('typing:update', ({ roomId, userId, username, isTyping }) => {
      if (roomId === activeRoom && userId !== user?.id) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (isTyping) newMap.set(userId, username);
          else newMap.delete(userId);
          return newMap;
        });
      }
    });

    socket.on('user:status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        if (status === 'ONLINE') newMap.set(userId, status);
        else newMap.delete(userId);
        return newMap;
      });
    });

    socket.on('room:frozen', ({ roomId, isFrozen }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isFrozen } : r));
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('message:new');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('typing:update');
      socket.off('user:status');
      socket.off('room:frozen');
      socket.off('error');
    };
  }, [socket, activeRoom, user?.id]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !activeRoom) return;

    socket.emit('message:send', {
      content: newMessage,
      roomId: activeRoom,
      replyToId: replyTo?.id,
    });

    setNewMessage('');
    setReplyTo(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing:stop', { roomId: activeRoom });
    }
  };

  const handleTyping = () => {
    if (!socket || !activeRoom) return;
    socket.emit('typing:start', { roomId: activeRoom });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId: activeRoom });
    }, 2000);
  };

  const deleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('message:delete', { messageId });
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-gray-400 text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-950 via-[#0d0d1a] to-gray-950 overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-blue-600/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* Sidebar - Rooms */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 flex flex-col overflow-hidden relative z-10`}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl border-l border-white/[0.06]" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">ChatZone</h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 online-indicator' : 'bg-red-400'}`} />
                    <span className="text-[11px] text-gray-500">{isConnected ? 'متصل' : 'غير متصل'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">الغرف</p>
              <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full">{rooms.length}</span>
            </div>
            {rooms.map(room => {
              const isActive = activeRoom === room.id;
              const unread = unreadCounts.get(room.id) || 0;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room.id);
                    setUnreadCounts(prev => { const n = new Map(prev); n.delete(room.id); return n; });
                    if (window.innerWidth < 768) setShowSidebar(false);
                  }}
                  className={`w-full text-right px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-l from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                      isActive
                        ? 'bg-indigo-500/20 shadow-inner'
                        : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                    }`}>
                      {room.isFrozen ? '🔒' : room.type === 'PRIVATE' ? '🔐' : '💬'}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : ''}`}>{room.name}</p>
                      <p className="text-[11px] text-gray-600 truncate">{room.memberCount} عضو</p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1.5 shadow-lg shadow-indigo-500/30">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User info */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] font-medium" style={{ color: user?.roleColor || '#808080' }}>{user?.roleDisplayName || 'عضو'}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-full bg-gray-800/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.06] transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    الملف الشخصي
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.06] transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    الإشعارات
                  </Link>
                  <Link href="/rules" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.06] transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    القوانين
                  </Link>
                  <div className="border-t border-white/[0.06]" />
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 text-right px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Chat Header */}
        <div className="h-16 bg-gray-900/40 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-gray-400 hover:text-white transition-colors lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/10">
                <span className="text-base">{activeRoomData?.isFrozen ? '🔒' : '💬'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {activeRoomData?.name || 'اختر غرفة'}
                  {activeRoomData?.isFrozen && (
                    <span className="text-[10px] bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 font-medium">مجمدة</span>
                  )}
                </h3>
                {activeRoomData?.description && (
                  <p className="text-[11px] text-gray-500">{activeRoomData.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-1.5 border border-white/[0.05]">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-xs text-gray-400">{activeRoomData?.memberCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-1 chat-messages-area">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
            </div>
          )}
          {messages.map((msg, index) => {
            const isOwn = msg.userId === user?.id;
            const showAvatar = index === 0 || messages[index - 1]?.userId !== msg.userId;
            return (
              <div key={msg.id} className={`message-enter ${!showAvatar ? 'mt-0.5' : 'mt-4 first:mt-0'}`}>
                <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {showAvatar ? (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/10 mt-1">
                      {msg.user.username[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-9 flex-shrink-0" />
                  )}
                  <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[13px] font-semibold" style={{ color: msg.user.roleColor }}>{msg.user.username}</span>
                        {msg.user.roleLevel >= 50 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold border" style={{
                            backgroundColor: msg.user.roleColor + '15',
                            color: msg.user.roleColor,
                            borderColor: msg.user.roleColor + '30',
                          }}>
                            {msg.user.roleDisplayName}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isEdited && <span className="text-[10px] text-gray-600 italic">(معدّل)</span>}
                      </div>
                    )}

                    {msg.replyTo && (
                      <div className={`bg-white/[0.03] border-r-2 border-indigo-500/50 rounded-lg px-3 py-2 mb-1.5 ${isOwn ? 'mr-0' : 'ml-0'}`}>
                        <span className="text-[11px] text-indigo-400 font-medium">{msg.replyTo.user.username}</span>
                        <p className="text-[11px] text-gray-500 truncate">{msg.replyTo.content.slice(0, 50)}</p>
                      </div>
                    )}

                    <div className={`group/msg relative rounded-2xl px-4 py-2.5 ${
                      msg.isBold
                        ? 'message-bold'
                        : isOwn
                          ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-white/[0.06] backdrop-blur-sm text-gray-100 border border-white/[0.06]'
                    }`}>
                      <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>

                      {/* Message actions - appear on hover */}
                      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all ${
                        isOwn ? '-left-24' : '-right-24'
                      }`}>
                        <button onClick={() => setReplyTo(msg)} className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-indigo-400 hover:bg-gray-800 transition-all" title="رد">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        {(isOwn || (user?.roleLevel || 0) >= 50) && (
                          <button onClick={() => deleteMessage(msg.id)} className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all" title="حذف">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const reason = prompt('سبب البلاغ:');
                            if (reason) {
                              fetch('/api/reports', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ targetUserId: msg.userId, messageId: msg.id, roomId: activeRoom, reason }),
                              });
                            }
                          }}
                          className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-all"
                          title="بلاغ"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="px-6 py-2 flex items-center gap-2">
            <div className="flex gap-1 bg-white/[0.04] rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
            </div>
            <span className="text-xs text-gray-500">{Array.from(typingUsers.values()).join(' و ')} يكتب...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="mx-6 mb-2 bg-indigo-500/10 border border-indigo-500/15 rounded-xl px-4 py-2.5 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-indigo-500 rounded-full" />
              <div>
                <span className="text-indigo-400 text-xs font-medium">رد على {replyTo.user.username}</span>
                <p className="text-gray-400 text-xs truncate max-w-[300px]">{replyTo.content.slice(0, 60)}</p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06] bg-gray-900/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50 ? 'الغرفة مجمدة...' : 'اكتب رسالتك...'}
                disabled={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed placeholder-gray-600"
                dir="auto"
              />
              {(user?.roleLevel || 0) >= 50 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <span className="text-[10px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded" title="استخدم $ للخط العريض">$</span>
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || (activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50)}
              className="p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <SocketProvider>
      <ChatContent />
    </SocketProvider>
  );
}
