'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markAsRead = async (id?: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : { markAll: true }),
    });
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING': return '⚠️';
      case 'MUTE': return '🔇';
      case 'BAN': return '🚫';
      case 'UNMUTE': case 'UNBAN': return '🔓';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WARNING': return 'border-orange-500/30 bg-orange-500/5';
      case 'MUTE': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'BAN': return 'border-red-500/30 bg-red-500/5';
      case 'UNMUTE': case 'UNBAN': return 'border-green-500/30 bg-green-500/5';
      default: return 'border-indigo-500/30 bg-indigo-500/5';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold gradient-text">الإشعارات</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => markAsRead()} className="text-indigo-400 hover:text-indigo-300 text-sm">تحديد الكل كمقروء</button>
            <Link href="/chat" className="text-gray-400 hover:text-white text-sm">← العودة للدردشة</Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-gray-400">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`glass rounded-xl p-4 border cursor-pointer transition-all hover:bg-white/5 ${getTypeColor(notif.type)} ${!notif.isRead ? 'ring-1 ring-indigo-500/20' : 'opacity-70'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{getTypeIcon(notif.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium text-sm">{notif.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notif.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                        <span className="text-gray-600 text-xs">{new Date(notif.createdAt).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-1 whitespace-pre-line">{notif.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
