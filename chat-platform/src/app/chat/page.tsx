'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/components/SocketProvider';
import type { ChatMessage, ChatRoom, PresenceUser } from '@/types/chat';
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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPresencePanel, setShowPresencePanel] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Presence state
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [selectedProfile, setSelectedProfile] = useState<PresenceUser | null>(null);
  const [presenceFilter, setPresenceFilter] = useState('');

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

    // Request full presence list on connect
    socket.emit('presence:request');

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
      if (status === 'OFFLINE') {
        setPresenceUsers(prev => prev.filter(u => u.id !== userId));
      }
    });

    socket.on('room:frozen', ({ roomId, isFrozen }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isFrozen } : r));
    });

    // Presence events
    socket.on('presence:full', ({ users, totalOnline: total, roomCounts: counts }) => {
      setPresenceUsers(users);
      setTotalOnline(total);
      setRoomCounts(counts);
    });

    socket.on('presence:join', ({ user: presUser }) => {
      setPresenceUsers(prev => {
        const filtered = prev.filter(u => u.id !== presUser.id);
        const updated = [...filtered, presUser].sort((a, b) => {
          if (b.roleLevel !== a.roleLevel) return b.roleLevel - a.roleLevel;
          return a.username.localeCompare(b.username);
        });
        return updated;
      });
      setTotalOnline(prev => prev + 1);
    });

    socket.on('presence:leave', ({ userId }) => {
      setPresenceUsers(prev => prev.filter(u => u.id !== userId));
      setTotalOnline(prev => Math.max(0, prev - 1));
    });

    socket.on('presence:update', ({ userId, status, currentRoomId }) => {
      setPresenceUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: status as PresenceUser['status'], currentRoomId } : u
      ));
    });

    socket.on('presence:room_counts', ({ roomCounts: counts, totalOnline: total }) => {
      setRoomCounts(counts);
      setTotalOnline(total);
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
      socket.off('presence:full');
      socket.off('presence:join');
      socket.off('presence:leave');
      socket.off('presence:update');
      socket.off('presence:room_counts');
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

  // Filter presence users
  const filteredPresenceUsers = presenceUsers.filter(u =>
    !presenceFilter || u.username.toLowerCase().includes(presenceFilter.toLowerCase())
  );
  const roomPresenceUsers = filteredPresenceUsers.filter(u => u.currentRoomId === activeRoom);
  const otherPresenceUsers = filteredPresenceUsers.filter(u => u.currentRoomId !== activeRoom);

  // Role badge helper
  const getRoleBadge = (roleLevel: number) => {
    if (roleLevel >= 100) return { label: 'المالك', icon: '👑' };
    if (roleLevel >= 90) return { label: 'إداري', icon: '🛡️' };
    if (roleLevel >= 80) return { label: 'رئيس مشرفين', icon: '⚔️' };
    if (roleLevel >= 70) return { label: 'مشرف', icon: '🔰' };
    if (roleLevel >= 50) return { label: 'مساعد', icon: '🌟' };
    return { label: 'عضو', icon: '' };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TYPING': return 'يكتب الآن...';
      case 'IN_ROOM': return 'في الغرفة';
      case 'ONLINE': return 'متصل';
      default: return 'غير متصل';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TYPING': return 'bg-amber-400';
      case 'IN_ROOM': return 'bg-emerald-400';
      case 'ONLINE': return 'bg-cyan-400';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-gray-400 text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0b1120] overflow-hidden relative" dir="rtl">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Sidebar - Rooms */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 flex flex-col overflow-hidden relative z-10 border-l border-white/[0.06]`}>
        <div className="absolute inset-0 bg-[#0d1526]/90 backdrop-blur-xl" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">ChatZone</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 online-indicator' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-gray-500">{isConnected ? 'متصل' : 'غير متصل'}</span>
                  <span className="text-[10px] text-gray-600 mr-1">•</span>
                  <span className="text-[10px] text-cyan-400 font-medium">{totalOnline} متواجد</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الغرف</p>
              <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full">{rooms.length}</span>
            </div>
            {rooms.map(room => {
              const isActive = activeRoom === room.id;
              const unread = unreadCounts.get(room.id) || 0;
              const roomOnline = roomCounts[room.id] || 0;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room.id);
                    setUnreadCounts(prev => { const n = new Map(prev); n.delete(room.id); return n; });
                    if (window.innerWidth < 768) setShowSidebar(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-l from-cyan-500/15 to-teal-500/10 text-white border border-cyan-500/20'
                      : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      isActive ? 'bg-cyan-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                    }`}>
                      {room.isFrozen ? '🔒' : room.type === 'PRIVATE' ? '🔐' : '💬'}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>{room.name}</p>
                      <p className="text-[10px] text-gray-600 truncate">
                        {roomOnline > 0 ? (
                          <span className="text-cyan-500">{roomOnline} متواجد</span>
                        ) : (
                          <span>{room.memberCount} عضو</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="bg-cyan-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1 shadow-lg shadow-cyan-500/30">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User info */}
          <div className="p-2 border-t border-white/[0.06]">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-cyan-500/20">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-[10px] font-medium" style={{ color: user?.roleColor || '#808080' }}>{user?.roleDisplayName || 'عضو'}</p>
                </div>
                <svg className={`w-3.5 h-3.5 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-full bg-[#111827]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    الملف الشخصي
                  </Link>
                  <Link href="/rules" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    القوانين
                  </Link>
                  <div className="border-t border-white/[0.06]" />
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-3 text-right px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
        <div className="h-14 bg-[#0d1526]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-gray-400 hover:text-white transition-colors lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/10">
                <span className="text-sm">{activeRoomData?.isFrozen ? '🔒' : '💬'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {activeRoomData?.name || 'اختر غرفة'}
                  {activeRoomData?.isFrozen && (
                    <span className="text-[10px] bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 font-medium">مجمدة</span>
                  )}
                </h3>
                {activeRoomData?.description && (
                  <p className="text-[10px] text-gray-500">{activeRoomData.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Online count badge */}
            <button
              onClick={() => setShowPresencePanel(!showPresencePanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showPresencePanel
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full online-indicator" />
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>{roomCounts[activeRoom || ''] || totalOnline}</span>
              <span className="text-gray-500">متواجد</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 chat-messages-area">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                </div>
              )}
              {messages.map((msg, index) => {
                const isOwn = msg.userId === user?.id;
                const showAvatar = index === 0 || messages[index - 1]?.userId !== msg.userId;
                return (
                  <div key={msg.id} className={`message-enter ${!showAvatar ? 'mt-0.5' : 'mt-3 first:mt-0'}`}>
                    <div className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-cyan-500/10 mt-1">
                          {msg.user.avatar ? (
                            <img src={msg.user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            msg.user.username[0]?.toUpperCase()
                          )}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}
                      <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[12px] font-semibold" style={{ color: msg.user.roleColor }}>{msg.user.username}</span>
                            {msg.user.roleLevel >= 50 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                                backgroundColor: msg.user.roleColor + '15',
                                color: msg.user.roleColor,
                              }}>
                                {getRoleBadge(msg.user.roleLevel).icon} {msg.user.roleDisplayName}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-600">
                              {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.isEdited && <span className="text-[10px] text-gray-600 italic">(معدّل)</span>}
                          </div>
                        )}

                        {msg.replyTo && (
                          <div className={`bg-white/[0.03] border-r-2 border-cyan-500/50 rounded-lg px-3 py-1.5 mb-1 ${isOwn ? 'mr-0' : 'ml-0'}`}>
                            <span className="text-[10px] text-cyan-400 font-medium">{msg.replyTo.user.username}</span>
                            <p className="text-[10px] text-gray-500 truncate">{msg.replyTo.content.slice(0, 50)}</p>
                          </div>
                        )}

                        <div className={`group/msg relative rounded-2xl px-3.5 py-2 ${
                          msg.isBold
                            ? 'message-bold'
                            : isOwn
                              ? 'bg-gradient-to-l from-cyan-600 to-teal-700 text-white shadow-lg shadow-cyan-500/10'
                              : 'bg-white/[0.05] backdrop-blur-sm text-gray-100 border border-white/[0.06]'
                        }`}>
                          <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>

                          {/* Message actions */}
                          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all ${
                            isOwn ? '-left-20' : '-right-20'
                          }`}>
                            <button onClick={() => setReplyTo(msg)} className="p-1 rounded-lg bg-[#111827]/90 text-gray-400 hover:text-cyan-400 transition-all" title="رد">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            </button>
                            {(isOwn || (user?.roleLevel || 0) >= 50) && (
                              <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded-lg bg-[#111827]/90 text-gray-400 hover:text-red-400 transition-all" title="حذف">
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
                              className="p-1 rounded-lg bg-[#111827]/90 text-gray-400 hover:text-amber-400 transition-all"
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
              <div className="px-4 py-1.5 flex items-center gap-2">
                <div className="flex gap-1 bg-white/[0.04] rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full typing-dot" />
                </div>
                <span className="text-[11px] text-gray-500">{Array.from(typingUsers.values()).join(' و ')} يكتب...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Reply preview */}
            {replyTo && (
              <div className="mx-4 mb-2 bg-cyan-500/10 border border-cyan-500/15 rounded-xl px-4 py-2 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-7 bg-cyan-500 rounded-full" />
                  <div>
                    <span className="text-cyan-400 text-xs font-medium">رد على {replyTo.user.username}</span>
                    <p className="text-gray-400 text-xs truncate max-w-[300px]">{replyTo.content.slice(0, 60)}</p>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06] bg-[#0d1526]/60 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50 ? 'الغرفة مجمدة...' : 'اكتب رسالتك...'}
                    disabled={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed placeholder-gray-600"
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
                  className="p-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-95"
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ==================== Online Users Panel ==================== */}
          {showPresencePanel && (
            <div className="w-72 border-r border-white/[0.06] bg-[#0d1526]/90 backdrop-blur-xl flex flex-col overflow-hidden">
              {/* Panel Header */}
              <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full online-indicator" />
                    المتواجدون الآن
                  </h3>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-medium">{totalOnline}</span>
                </div>
                <input
                  value={presenceFilter}
                  onChange={e => setPresenceFilter(e.target.value)}
                  placeholder="بحث عن مستخدم..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30"
                  dir="auto"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Users in current room */}
                {roomPresenceUsers.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1.5">
                      في هذه الغرفة — {roomPresenceUsers.length}
                    </p>
                    {roomPresenceUsers.map(pu => (
                      <button
                        key={pu.id}
                        onClick={() => setSelectedProfile(pu)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-all text-right group"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                            {pu.avatar ? <img src={pu.avatar} alt="" className="w-full h-full rounded-lg object-cover" /> : pu.username[0]?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-[#0d1526] ${getStatusColor(pu.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white truncate">{pu.username}</span>
                            {pu.roleLevel >= 50 && (
                              <span className="text-[9px]">{getRoleBadge(pu.roleLevel).icon}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{getStatusLabel(pu.status)}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{
                          backgroundColor: pu.roleColor + '15',
                          color: pu.roleColor,
                        }}>{pu.roleDisplayName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Other online users */}
                {otherPresenceUsers.length > 0 && (
                  <div className="p-2 border-t border-white/[0.04]">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1.5">
                      متواجدون آخرون — {otherPresenceUsers.length}
                    </p>
                    {otherPresenceUsers.map(pu => (
                      <button
                        key={pu.id}
                        onClick={() => setSelectedProfile(pu)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-all text-right"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-teal-600/70 flex items-center justify-center text-xs font-bold text-white">
                            {pu.avatar ? <img src={pu.avatar} alt="" className="w-full h-full rounded-lg object-cover" /> : pu.username[0]?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-[#0d1526] ${getStatusColor(pu.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-300 truncate">{pu.username}</span>
                            {pu.roleLevel >= 50 && (
                              <span className="text-[9px]">{getRoleBadge(pu.roleLevel).icon}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-600">{getStatusLabel(pu.status)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredPresenceUsers.length === 0 && (
                  <div className="p-6 text-center text-gray-600 text-xs">
                    {presenceFilter ? 'لا توجد نتائج' : 'لا يوجد متواجدون حالياً'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Popup */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProfile(null)}>
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-cyan-500/20">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    selectedProfile.username[0]?.toUpperCase()
                  )}
                </div>
                <span className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-3 border-[#111827] ${getStatusColor(selectedProfile.status)}`} />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{selectedProfile.username}</h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{
                  backgroundColor: selectedProfile.roleColor + '20',
                  color: selectedProfile.roleColor,
                }}>
                  {getRoleBadge(selectedProfile.roleLevel).icon} {selectedProfile.roleDisplayName}
                </span>
              </div>

              <div className="w-full glass rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">الحالة</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedProfile.status)}`} />
                    <span className="text-white text-xs">{getStatusLabel(selectedProfile.status)}</span>
                  </div>
                </div>
                {selectedProfile.currentRoomId && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-gray-400">الغرفة</span>
                    <span className="text-cyan-400 text-xs">{rooms.find(r => r.id === selectedProfile.currentRoomId)?.name || 'غرفة'}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-gray-300 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
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
