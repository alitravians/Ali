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

  // Feature: Chat disabled check
  const [chatDisabled, setChatDisabled] = useState(false);

  // Feature: Message editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Feature: Infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);

  // Feature: Message search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  // Feature: Notification badge
  const [notifCount, setNotifCount] = useState(0);

  // Feature: Sound notifications (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatzone_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Feature: Reactions
  const [messageReactions, setMessageReactions] = useState<Map<string, { emoji: string; count: number }[]>>(new Map());
  const [userReactions, setUserReactions] = useState<Map<string, string[]>>(new Map());
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢'];

  // Feature: Pinned messages
  const [pinnedMessages, setPinnedMessages] = useState<{ id: string; content: string; username: string }[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  // Feature: Block user
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdW2MkZOQgo5+aXN/g4eCfnx/iISLi4mGg4aJhYWIi4mGiYqHiYuIiImKh4mHhoiKiIiHiIeJhoiKiYiHh4eIh4aIioiHhoeIiIeGiImJh4aHh4eHhoiIiIeGh4eHh4eIiIiHhoeHh4eHiIeHhoeHh4eHh4eHhoeHh4eHh4eIh4eGh4eHh4eHh4eHhoeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eH');
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check chat enabled status
  useEffect(() => {
    fetch('/api/site-status')
      .then(res => res.json())
      .then(data => { if (!data.chatEnabled) setChatDisabled(true); })
      .catch(() => {});
  }, []);

  // Fetch notification count
  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifCount(data.filter((n: any) => !n.isRead).length);
        }
      })
      .catch(() => {});
    // Load blocked users
    fetch('/api/blocks')
      .then(res => res.json())
      .then(data => {
        if (data.blocks) {
          setBlockedUserIds(new Set(data.blocks.map((u: any) => u.id)));
        }
      })
      .catch(() => {});
  }, []);

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

  // Fetch messages when room changes (with infinite scroll support)
  useEffect(() => {
    if (!activeRoom) return;
    setMessages([]);
    setTypingUsers(new Map());
    setHasMore(true);
    setOldestCursor(null);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setPinnedMessages([]);
    setShowPinned(false);
    setShowReactionPicker(null);
    fetch(`/api/rooms/${activeRoom}/messages?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages);
          setHasMore(!!data.nextCursor);
          setOldestCursor(data.nextCursor || null);
          // Load pinned messages from fetched data
          const pinned = data.messages.filter((m: any) => m.isPinned).map((m: any) => ({
            id: m.id, content: m.content, username: m.user.username,
          }));
          if (pinned.length > 0) setPinnedMessages(pinned);
          // Load reactions from fetched data
          const reactionsMap = new Map<string, { emoji: string; count: number }[]>();
          const userReactionsMap = new Map<string, string[]>();
          for (const m of data.messages) {
            if (m.reactions && m.reactions.length > 0) {
              reactionsMap.set(m.id, m.reactions);
            }
            if (m.userReactions && m.userReactions.length > 0) {
              userReactionsMap.set(m.id, m.userReactions);
            }
          }
          setMessageReactions(reactionsMap);
          setUserReactions(userReactionsMap);
        }
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
      // Sound + Browser notifications for messages from others
      if (msg.userId !== user?.id) {
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification(`${msg.user.username}`, {
            body: msg.content.slice(0, 100),
            icon: '/favicon.ico',
            tag: msg.id,
          });
        }
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

    // Reaction updates
    socket.on('reaction:updated', ({ messageId, reactions, userReactions: myReactions, reactedByUserId }) => {
      setMessageReactions(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, reactions);
        return newMap;
      });
      if (reactedByUserId === user?.id) {
        setUserReactions(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, myReactions);
          return newMap;
        });
      }
    });

    // Pinned messages
    socket.on('message:pinned', ({ messageId, content, username, roomId }) => {
      if (roomId === activeRoom) {
        setPinnedMessages(prev => [...prev.filter(p => p.id !== messageId), { id: messageId, content, username }]);
      }
    });
    socket.on('message:unpinned', ({ messageId, roomId }) => {
      if (roomId === activeRoom) {
        setPinnedMessages(prev => prev.filter(p => p.id !== messageId));
      }
    });

    // Realtime notification counter
    socket.on('notification:new', () => {
      setNotifCount(prev => prev + 1);
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
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
      socket.off('reaction:updated');
      socket.off('message:pinned');
      socket.off('message:unpinned');
      socket.off('notification:new');
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

  // Feature: Toggle reaction
  const toggleReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('reaction:toggle', { messageId, emoji });
    setShowReactionPicker(null);
  };

  // Feature: Pin/Unpin message
  const pinMessage = (messageId: string) => {
    if (!socket || !activeRoom) return;
    socket.emit('message:pin', { messageId, roomId: activeRoom });
  };
  const unpinMessage = (messageId: string) => {
    if (!socket || !activeRoom) return;
    socket.emit('message:unpin', { messageId, roomId: activeRoom });
  };

  // Feature: Block/Unblock user
  const blockUser = async (targetUserId: string) => {
    try {
      await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: targetUserId }),
      });
      setBlockedUserIds(prev => new Set([...prev, targetUserId]));
    } catch { /* ignore */ }
  };
  const unblockUser = async (targetUserId: string) => {
    try {
      await fetch(`/api/blocks?userId=${targetUserId}`, { method: 'DELETE' });
      setBlockedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    } catch { /* ignore */ }
  };

  // Render message content with @mention highlighting
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionedName = part.slice(1);
        const isSelf = mentionedName.toLowerCase() === user?.name?.toLowerCase();
        return (
          <span key={i} className={`font-semibold ${isSelf ? 'text-yellow-300 bg-yellow-500/20 px-0.5 rounded' : 'text-violet-300'}`}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Feature: Edit message
  const startEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };
  const submitEdit = () => {
    if (!socket || !editingMessageId || !editContent.trim()) return;
    socket.emit('message:edit', { messageId: editingMessageId, content: editContent });
    cancelEdit();
  };

  // Feature: Load more messages (infinite scroll)
  const loadMoreMessages = useCallback(() => {
    if (!activeRoom || loadingMore || !hasMore || !oldestCursor) return;
    setLoadingMore(true);
    fetch(`/api/rooms/${activeRoom}/messages?cursor=${oldestCursor}&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => [...data.messages, ...prev]);
          setHasMore(!!data.nextCursor);
          setOldestCursor(data.nextCursor || null);
          // Merge reactions from older messages
          for (const m of data.messages) {
            if (m.reactions && m.reactions.length > 0) {
              setMessageReactions(prev => { const n = new Map(prev); n.set(m.id, m.reactions); return n; });
            }
            if (m.userReactions && m.userReactions.length > 0) {
              setUserReactions(prev => { const n = new Map(prev); n.set(m.id, m.userReactions); return n; });
            }
          }
        } else {
          setHasMore(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [activeRoom, loadingMore, hasMore, oldestCursor]);

  // Infinite scroll handler
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMoreMessages]);

  // Feature: Search messages
  const searchMessages = useCallback(async () => {
    if (!searchQuery.trim() || !activeRoom) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/rooms/${activeRoom}/messages/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.messages || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, activeRoom]);

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
      case 'ONLINE': return 'bg-violet-400';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030711]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-gray-400 text-lg font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#030711] overflow-hidden relative" dir="rtl">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Sidebar - Rooms */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 flex flex-col overflow-hidden relative z-10 border-l border-white/[0.06]`}>
        <div className="absolute inset-0 bg-[#0A0F1C]/90 backdrop-blur-xl" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">ChatZone</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 online-indicator' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-gray-500">{isConnected ? 'متصل' : 'غير متصل'}</span>
                  <span className="text-[10px] text-gray-600 mr-1">•</span>
                  <span className="text-[10px] text-violet-400 font-medium">{totalOnline} متواجد</span>
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
                      ? 'sidebar-active text-white'
                      : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      isActive ? 'bg-violet-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                    }`}>
                      {room.isFrozen ? '🔒' : room.type === 'PRIVATE' ? '🔐' : '💬'}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>{room.name}</p>
                      <p className="text-[10px] text-gray-600 truncate">
                        {roomOnline > 0 ? (
                          <span className="text-violet-400">{roomOnline} متواجد</span>
                        ) : (
                          <span>{room.memberCount} عضو</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="bg-violet-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1 shadow-lg shadow-violet-500/30">
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-violet-500/20">
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
                <div className="absolute bottom-full right-0 mb-2 w-full bg-[#0A0F1C]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
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
        <div className="h-14 bg-[#0A0F1C]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="text-gray-400 hover:text-white transition-colors lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/10">
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
            {/* Sound toggle */}
            <button
              onClick={() => {
              const newVal = !soundEnabled;
              setSoundEnabled(newVal);
              localStorage.setItem('chatzone_sound_enabled', String(newVal));
            }}
              className={`p-1.5 rounded-lg text-xs transition-all ${soundEnabled ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500 bg-white/[0.03]'}`}
              title={soundEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-lg text-xs transition-all ${showSearch ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20' : 'text-gray-400 bg-white/[0.03] hover:bg-white/[0.06]'}`}
              title="بحث في الرسائل"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            {/* Notifications badge */}
            <Link
              href="/notifications"
              className="relative p-1.5 rounded-lg text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
              title="الإشعارات"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </Link>
            {/* Online count badge */}
            <button
              onClick={() => setShowPresencePanel(!showPresencePanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showPresencePanel
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
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
            {/* Search bar */}
            {showSearch && (
              <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0A0F1C]/60">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchMessages()}
                    placeholder="ابحث في رسائل الغرفة..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    dir="auto"
                    autoFocus
                  />
                  <button onClick={searchMessages} disabled={searching} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white transition-colors disabled:opacity-50">
                    {searching ? '...' : 'بحث'}
                  </button>
                  <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                    <p className="text-[10px] text-gray-500 mb-1">{searchResults.length} نتيجة</p>
                    {searchResults.map(sr => (
                      <div key={sr.id} className="bg-white/[0.03] rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-medium" style={{ color: sr.user.roleColor }}>{sr.user.username}</span>
                          <span className="text-[9px] text-gray-600">{new Date(sr.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <p className="text-gray-300 text-[12px]">{sr.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && !searching && (
                  <p className="text-gray-500 text-xs mt-2 text-center">لا توجد نتائج</p>
                )}
              </div>
            )}

            {/* Chat disabled notice */}
            {chatDisabled && (
              <div className="mx-4 mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-yellow-400 text-lg">⚠️</span>
                <span className="text-yellow-300 text-sm">الدردشة معطّلة حالياً من قبل الإدارة</span>
              </div>
            )}

            {/* Pinned messages bar */}
            {pinnedMessages.length > 0 && (
              <div className="mx-4 mt-2">
                <button
                  onClick={() => setShowPinned(!showPinned)}
                  className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-amber-500/15 transition-colors"
                >
                  <span className="text-amber-400">📌</span>
                  <span className="text-amber-300 text-sm font-medium">{pinnedMessages.length} رسالة مثبتة</span>
                  <svg className={`w-3 h-3 text-amber-400 mr-auto transition-transform ${showPinned ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showPinned && (
                  <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                    {pinnedMessages.map(pm => (
                      <div key={pm.id} className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-amber-400 font-medium">{pm.username}</span>
                          <p className="text-gray-300 text-xs truncate max-w-[300px]">{pm.content}</p>
                        </div>
                        {(user?.roleLevel || 0) >= 50 && (
                          <button onClick={() => unpinMessage(pm.id)} className="text-gray-500 hover:text-red-400 text-xs p-1" title="إلغاء التثبيت">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 chat-messages-area">
              {/* Infinite scroll: load more indicator */}
              {loadingMore && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              )}
              {hasMore && !loadingMore && messages.length > 0 && (
                <button onClick={loadMoreMessages} className="w-full text-center py-2 text-gray-500 hover:text-violet-400 text-xs transition-colors">
                  ▲ تحميل رسائل أقدم
                </button>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                </div>
              )}
              {(() => {
                // Filter out blocked messages before rendering to fix avatar grouping
                const visibleMessages = messages.filter(msg => {
                  const isOwn = msg.userId === user?.id;
                  const isBlocked = blockedUserIds.has(msg.userId);
                  return !(isBlocked && !isOwn);
                });
                return visibleMessages.map((msg, index) => {
                const isOwn = msg.userId === user?.id;
                const showAvatar = index === 0 || visibleMessages[index - 1]?.userId !== msg.userId;
                const msgReactions = messageReactions.get(msg.id) || [];
                const myReactions = userReactions.get(msg.id) || [];
                return (
                  <div key={msg.id} className={`message-enter ${!showAvatar ? 'mt-0.5' : 'mt-3 first:mt-0'}`}>
                    <div className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-violet-500/10 mt-1">
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
                            {msg.isEdited && <span className="text-[10px] text-gray-500 italic">(معدّل)</span>}
                          </div>
                        )}

                        {msg.replyTo && (
                          <div className={`bg-white/[0.03] border-r-2 border-violet-500/50 rounded-lg px-3 py-1.5 mb-1 ${isOwn ? 'mr-0' : 'ml-0'}`}>
                            <span className="text-[10px] text-violet-400 font-medium">{msg.replyTo.user.username}</span>
                            <p className="text-[10px] text-gray-500 truncate">{msg.replyTo.content.slice(0, 50)}</p>
                          </div>
                        )}

                        <div className={`group/msg relative rounded-2xl px-3.5 py-2 ${
                          msg.isBold
                            ? 'message-bold'
                            : isOwn
                              ? 'bg-gradient-to-l from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/10'
                              : 'bg-white/[0.05] backdrop-blur-sm text-gray-100 border border-white/[0.06]'
                        }`}>
                          {editingMessageId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                className="flex-1 bg-black/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                                dir="auto"
                                autoFocus
                              />
                              <button onClick={submitEdit} className="text-emerald-400 hover:text-emerald-300 text-xs">✓</button>
                              <button onClick={cancelEdit} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                            </div>
                          ) : (
                            <p className="text-[13px] leading-relaxed break-words">{renderMessageContent(msg.content)}</p>
                          )}

                          {/* Message actions */}
                          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all ${
                            isOwn ? '-left-32' : '-right-32'
                          }`}>
                            {/* Reaction picker trigger */}
                            <button onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)} className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-yellow-400 transition-all" title="تفاعل">
                              <span className="text-xs">😀</span>
                            </button>
                            <button onClick={() => setReplyTo(msg)} className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-violet-400 transition-all" title="رد">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            </button>
                            {isOwn && (
                              <button onClick={() => startEdit(msg)} className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-emerald-400 transition-all" title="تعديل">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {(isOwn || (user?.roleLevel || 0) >= 50) && (
                              <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-red-400 transition-all" title="حذف">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                            {/* Pin button for moderators */}
                            {(user?.roleLevel || 0) >= 50 && (
                              <button onClick={() => pinMessage(msg.id)} className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-amber-400 transition-all" title="تثبيت">
                                <span className="text-xs">📌</span>
                              </button>
                            )}
                            {/* Block user (not own messages) */}
                            {!isOwn && (
                              <button
                                onClick={() => blockUser(msg.userId)}
                                className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-red-400 transition-all"
                                title="حظر شخصي"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
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
                              className="p-1 rounded-lg bg-[#0A0F1C]/90 text-gray-400 hover:text-amber-400 transition-all"
                              title="بلاغ"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            </button>
                          </div>

                          {/* Reaction picker popup */}
                          {showReactionPicker === msg.id && (
                            <div className={`absolute -bottom-10 flex gap-1 bg-[#0A0F1C] border border-white/10 rounded-xl px-2 py-1 shadow-xl z-20 ${isOwn ? 'left-0' : 'right-0'}`}>
                              {REACTION_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className={`text-lg hover:scale-125 transition-transform px-0.5 ${myReactions.includes(emoji) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reactions display */}
                        {msgReactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {msgReactions.map(r => (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction(msg.id, r.emoji)}
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] transition-all ${
                                  myReactions.includes(r.emoji)
                                    ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                                    : 'bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:bg-white/[0.08]'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="text-[10px]">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="px-4 py-1.5 flex items-center gap-2">
                <div className="flex gap-1 bg-white/[0.04] rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full typing-dot" />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full typing-dot" />
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
              <div className="mx-4 mb-2 bg-violet-500/10 border border-violet-500/15 rounded-xl px-4 py-2 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-7 bg-violet-500 rounded-full" />
                  <div>
                    <span className="text-violet-400 text-xs font-medium">رد على {replyTo.user.username}</span>
                    <p className="text-gray-400 text-xs truncate max-w-[300px]">{replyTo.content.slice(0, 60)}</p>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06] bg-[#0A0F1C]/60 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50 ? 'الغرفة مجمدة...' : 'اكتب رسالتك...'}
                    disabled={activeRoomData?.isFrozen && (user?.roleLevel || 0) < 50}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed placeholder-gray-600"
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
                  className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-95"
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
            <div className="w-72 border-r border-white/[0.06] bg-[#0A0F1C]/90 backdrop-blur-xl flex flex-col overflow-hidden">
              {/* Panel Header */}
              <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full online-indicator" />
                    المتواجدون الآن
                  </h3>
                  <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">{totalOnline}</span>
                </div>
                <input
                  value={presenceFilter}
                  onChange={e => setPresenceFilter(e.target.value)}
                  placeholder="بحث عن مستخدم..."
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/30"
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
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                            {pu.avatar ? <img src={pu.avatar} alt="" className="w-full h-full rounded-lg object-cover" /> : pu.username[0]?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${getStatusColor(pu.status)}`} />
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
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/70 to-indigo-600/70 flex items-center justify-center text-xs font-bold text-white">
                            {pu.avatar ? <img src={pu.avatar} alt="" className="w-full h-full rounded-lg object-cover" /> : pu.username[0]?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${getStatusColor(pu.status)}`} />
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
          <div className="bg-[#0A0F1C] border border-white/[0.08] rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-violet-500/20">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    selectedProfile.username[0]?.toUpperCase()
                  )}
                </div>
                <span className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-3 border-[#0A0F1C] ${getStatusColor(selectedProfile.status)}`} />
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
                    <span className="text-violet-400 text-xs">{rooms.find(r => r.id === selectedProfile.currentRoomId)?.name || 'غرفة'}</span>
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
