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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-950 overflow-hidden">
      {/* Sidebar - Rooms */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 bg-gray-900/50 border-l border-gray-800 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold gradient-text">ChatZone</h2>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 online-indicator' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-500">{isConnected ? 'متصل' : 'غير متصل'}</span>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-xs text-gray-500 px-3 py-2 font-semibold">الغرف</p>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
                setUnreadCounts(prev => { const n = new Map(prev); n.delete(room.id); return n; });
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`w-full text-right px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
                activeRoom === room.id
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{room.isFrozen ? '🔒' : room.type === 'PRIVATE' ? '🔐' : '💬'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  <p className="text-xs text-gray-500 truncate">{room.memberCount} عضو</p>
                </div>
              </div>
              {(unreadCounts.get(room.id) || 0) > 0 && (
                <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCounts.get(room.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User info */}
        <div className="p-3 border-t border-gray-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 text-right min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs" style={{ color: user?.roleColor || '#808080' }}>{user?.roleDisplayName || 'عضو'}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <Link href="/profile" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">الملف الشخصي</Link>
                <Link href="/notifications" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">الإشعارات</Link>
                <Link href="/rules" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">القوانين</Link>
                <hr className="border-gray-700" />
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-right px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-14 bg-gray-900/30 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-gray-400 hover:text-white transition-colors md:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {activeRoomData?.name || 'اختر غرفة'}
                {activeRoomData?.isFrozen && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">مجمدة</span>}
              </h3>
              {activeRoomData?.description && (
                <p className="text-xs text-gray-500">{activeRoomData.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>لا توجد رسائل بعد. ابدأ المحادثة!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="message-enter group">
              <div className={`flex items-start gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {msg.user.username[0]?.toUpperCase()}
                </div>
                <div className={`max-w-[70%] ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: msg.user.roleColor }}>{msg.user.username}</span>
                    {msg.user.roleLevel >= 50 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: msg.user.roleColor + '20', color: msg.user.roleColor }}>
                        {msg.user.roleDisplayName}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600">
                      {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isEdited && <span className="text-[10px] text-gray-600">(معدّل)</span>}
                  </div>

                  {msg.replyTo && (
                    <div className="bg-white/5 border-r-2 border-indigo-500 rounded-lg px-3 py-1.5 mb-1 text-xs text-gray-400">
                      <span className="text-indigo-400">{msg.replyTo.user.username}</span>: {msg.replyTo.content.slice(0, 50)}
                    </div>
                  )}

                  <div className={`rounded-2xl px-4 py-2.5 ${
                    msg.isBold
                      ? 'message-bold'
                      : msg.userId === user?.id
                        ? 'bg-indigo-600/80 text-white'
                        : 'bg-gray-800/80 text-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>

                  {/* Message actions */}
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setReplyTo(msg)} className="text-[10px] text-gray-500 hover:text-indigo-400">رد</button>
                    {(msg.userId === user?.id || (user?.roleLevel || 0) >= 50) && (
                      <button onClick={() => deleteMessage(msg.id)} className="text-[10px] text-gray-500 hover:text-red-400">حذف</button>
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
                      className="text-[10px] text-gray-500 hover:text-orange-400"
                    >
                      بلاغ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-1.5 text-xs text-gray-500 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full typing-dot" />
            </div>
            {Array.from(typingUsers.values()).join(' و ')} يكتب...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="mx-4 mb-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-indigo-400 text-xs">رد على {replyTo.user.username}</span>
              <p className="text-gray-400 text-xs truncate">{replyTo.content.slice(0, 60)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white text-lg">×</button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50 ? 'الغرفة مجمدة...' : 'اكتب رسالتك... (استخدم $ للخط العريض)'}
              disabled={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50}
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              dir="auto"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || (activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50)}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
