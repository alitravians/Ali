'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  ADMIN: { label: 'إدارية', icon: '👑', color: 'text-amber-400' },
  TICKET: { label: 'التذاكر', icon: '🎫', color: 'text-violet-400' },
  CHAT: { label: 'الدردشة', icon: '💬', color: 'text-blue-400' },
  PUNISHMENT: { label: 'العقوبات', icon: '⚖️', color: 'text-red-400' },
  ITEM: { label: 'العناصر', icon: '🎒', color: 'text-emerald-400' },
  BADGE: { label: 'الشارات', icon: '🏅', color: 'text-yellow-400' },
  LEVEL: { label: 'المستوى', icon: '💎', color: 'text-cyan-400' },
  PROFILE: { label: 'الملف الشخصي', icon: '👤', color: 'text-indigo-400' },
  GENERAL: { label: 'عامة', icon: '🔔', color: 'text-gray-400' },
};

const TYPE_ICONS: Record<string, string> = {
  WARNING: '⚠️', MUTE: '🔇', BAN: '🚫', UNMUTE: '🔓', UNBAN: '🔓',
  ANNOUNCEMENT: '📢', REPORT_STATUS: '📋', SYSTEM: '⚙️', MENTION: '💬',
  REACTION: '❤️', TICKET: '🎫', BADGE: '🏅', LEVEL_UP: '⬆️', XP: '✨',
  PROFILE: '👤', ADMIN: '👑', ITEM: '🎁',
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'border-r-4 border-r-red-500 bg-red-500/[0.03]',
  HIGH: 'border-r-4 border-r-amber-500 bg-amber-500/[0.02]',
  NORMAL: '',
  LOW: 'opacity-80',
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (readFilter) params.set('read', readFilter);
      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setCategoryCounts(data.categoryCounts || {});
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [activeCategory, readFilter]);

  const handleAction = async (action: string, id?: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    fetchNotifications();
  };

  const handleClick = (notif: any) => {
    if (!notif.isRead) handleAction('read', notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">🔔 الإشعارات</h1>
            <p className="text-gray-500 text-sm">
              {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← الرئيسية</Link>
            {unreadCount > 0 && (
              <button onClick={() => handleAction('readAll')}
                className="px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-violet-400 text-xs font-medium transition-all">
                تحديد الكل كمقروء
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!activeCategory ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white'}`}>
            الكل {notifications.length > 0 && `(${Object.values(categoryCounts).reduce((a: number, b: number) => a + b, 0)})`}
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const count = categoryCounts[key] || 0;
            if (count === 0 && !activeCategory) return null;
            return (
              <button key={key} onClick={() => setActiveCategory(activeCategory === key ? '' : key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeCategory === key ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white'}`}>
                <span>{cat.icon}</span> {cat.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Read Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: '', label: 'الكل' },
            { value: 'false', label: 'غير مقروء' },
            { value: 'true', label: 'مقروء' },
          ].map(f => (
            <button key={f.value} onClick={() => setReadFilter(readFilter === f.value ? '' : f.value)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${readFilter === f.value ? 'bg-white/[0.08] text-white' : 'text-gray-600 hover:text-gray-400'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-20"><span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-gray-400 mb-2">لا توجد إشعارات</p>
            <p className="text-gray-600 text-sm">ستظهر الإشعارات هنا عند وصولها</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cat = CATEGORY_MAP[notif.category] || CATEGORY_MAP.GENERAL;
              const icon = TYPE_ICONS[notif.type] || '🔔';
              const priorityStyle = PRIORITY_STYLES[notif.priority] || '';
              return (
                <div key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl p-4 transition-all cursor-pointer ${priorityStyle} ${!notif.isRead ? 'ring-1 ring-violet-500/15' : 'opacity-75 hover:opacity-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5 shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-white font-medium text-sm truncate">{notif.title}</h3>
                          {!notif.isRead && <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.color} bg-white/[0.03]`}>{cat.label}</span>
                          <span className="text-gray-600 text-[10px]">{new Date(notif.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                      {notif.content && <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{notif.content}</p>}
                      {notif.link && <p className="text-violet-400/60 text-[10px] mt-1">اضغط للانتقال ←</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleAction('archive', notif.id); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-all" title="أرشفة">
                        📥
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleAction('delete', notif.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all" title="حذف">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
