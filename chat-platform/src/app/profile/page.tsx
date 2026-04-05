'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type ProfileTab = 'info' | 'badges' | 'level' | 'tickets' | 'notifications' | 'settings';

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: 'info', label: 'المعلومات العامة', icon: '👤' },
  { id: 'badges', label: 'الشارات والعناصر', icon: '🏅' },
  { id: 'level', label: 'المستوى والنقاط', icon: '💎' },
  { id: 'tickets', label: 'التذاكر', icon: '🎫' },
  { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

const TICKET_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوحة', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REVIEWING: { label: 'قيد المراجعة', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  REPLIED: { label: 'تم الرد', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  WAITING_USER: { label: 'بانتظار المستخدم', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  CLOSED: { label: 'مغلقة', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  ESCALATED: { label: 'مصعدة', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  const [avatar, setAvatar] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [joinDate, setJoinDate] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Tab data
  const [tickets, setTickets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setLevel(data.level || 1);
          setXp(data.xp || 0);
          setJoinDate(data.createdAt || '');
        }
      }).catch(() => {});
    fetch('/api/profile/avatar')
      .then(r => r.json())
      .then(data => { if (data?.avatar) setAvatar(data.avatar); })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (activeTab === 'tickets') {
      fetch('/api/tickets').then(r => r.json()).then(d => { if (Array.isArray(d)) setTickets(d); }).catch(() => {});
    } else if (activeTab === 'notifications') {
      fetch('/api/notifications').then(r => r.json()).then(d => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }).catch(() => {});
    }
  }, [activeTab, status]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setAvatarMessage('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setAvatar(data.avatar);
        setAvatarMessage('تم تحديث الصورة بنجاح');
        setTimeout(() => setAvatarMessage(''), 3000);
      } else {
        setAvatarMessage(data.error || 'فشل في رفع الصورة');
      }
    } catch {
      setAvatarMessage('حدث خطأ أثناء رفع الصورة');
    }
    setAvatarLoading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleDeleteAvatar = async () => {
    setAvatarLoading(true);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (res.ok) { setAvatar(''); setAvatarMessage('تم حذف الصورة'); setTimeout(() => setAvatarMessage(''), 3000); }
    } catch { /* ignore */ }
    setAvatarLoading(false);
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    setEditMessage('');
    try {
      const body: any = { displayName, bio };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMessage('تم حفظ التغييرات بنجاح');
        setCurrentPassword(''); setNewPassword('');
      } else {
        setEditMessage(data.error || 'فشل في الحفظ');
      }
    } catch { setEditMessage('حدث خطأ'); }
    setEditLoading(false);
    setTimeout(() => setEditMessage(''), 4000);
  };

  const xpForNext = 100;
  const xpProgress = xp % xpForNext;
  const totalXp = xp;

  return (
    <div className="min-h-screen bg-[#030711] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">الملف الشخصي</h1>
          <Link href="/" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← الرئيسية</Link>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/[0.06] shadow-lg">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}>
                <span className="text-white text-[10px]">{avatarLoading ? '...' : '📷'}</span>
              </div>
              {avatar && (
                <button onClick={handleDeleteAvatar}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white truncate">{user?.name}</h2>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0" style={{
                  backgroundColor: (user?.roleColor || '#808080') + '15',
                  color: user?.roleColor || '#808080',
                }}>{user?.roleDisplayName || 'عضو'}</span>
              </div>
              <p className="text-gray-600 text-xs" dir="ltr">{user?.email}</p>

              {/* Level badge + XP bar */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/15">
                  <span className="text-xs">💎</span>
                  <span className="text-amber-400 text-[11px] font-bold">المستوى {level}</span>
                </div>
                <div className="flex-1 max-w-[120px]">
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-600 mt-0.5">{xpProgress}/{xpForNext} XP</p>
                </div>
              </div>

              {joinDate && <p className="text-gray-700 text-[10px] mt-1">انضم {new Date(joinDate).toLocaleDateString('ar-SA')}</p>}
            </div>

            {avatarMessage && (
              <div className={`text-[10px] px-2.5 py-1 rounded-lg shrink-0 ${avatarMessage.includes('نجاح') || avatarMessage.includes('حذف') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {avatarMessage}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-white/[0.02] text-gray-500 border border-white/[0.04] hover:text-white hover:bg-white/[0.04]'}`}>
              <span>{tab.icon}</span> {tab.label}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">

          {/* ===== INFO TAB ===== */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white mb-4">المعلومات العامة</h3>
              {[
                { label: 'اسم المستخدم', value: user?.name },
                { label: 'البريد الإلكتروني', value: user?.email, dir: 'ltr' as const },
                { label: 'الرتبة', value: user?.roleDisplayName || 'عضو', color: user?.roleColor },
                { label: 'المستوى', value: `💎 المستوى ${level}` },
                { label: 'نقاط الخبرة', value: `${totalXp} XP` },
                { label: 'النبذة', value: bio || 'لم تُضاف بعد' },
                { label: 'تاريخ الانضمام', value: joinDate ? new Date(joinDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                { label: 'الحالة', value: '🟢 نشط' },
              ].map((field, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3 flex items-center justify-between">
                  <p className="text-gray-500 text-[11px]">{field.label}</p>
                  <p className="text-sm text-white" dir={field.dir} style={field.color ? { color: field.color } : undefined}>{field.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ===== BADGES TAB ===== */}
          {activeTab === 'badges' && (
            <div>
              <h3 className="text-base font-bold text-white mb-4">الشارات والعناصر</h3>
              <div className="text-center py-12 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className="text-4xl mb-3">🏅</div>
                <p className="text-gray-400 text-sm mb-1">لا توجد شارات بعد</p>
                <p className="text-gray-600 text-[11px]">ستظهر الشارات والعناصر المكتسبة هنا</p>
              </div>
            </div>
          )}

          {/* ===== LEVEL TAB ===== */}
          {activeTab === 'level' && (
            <div>
              <h3 className="text-base font-bold text-white mb-6">المستوى والنقاط</h3>

              {/* Level Display */}
              <div className="flex items-center justify-center mb-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
                    <div>
                      <div className="text-3xl mb-0.5">💎</div>
                      <div className="text-amber-400 text-lg font-bold">{level}</div>
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm">المستوى {level}</p>
                  <p className="text-gray-500 text-[11px]">إجمالي {totalXp} نقطة خبرة</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">التقدم نحو المستوى {level + 1}</span>
                  <span className="text-amber-400 text-xs font-bold">{xpProgress}/{xpForNext} XP</span>
                </div>
                <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
                </div>
                <p className="text-gray-600 text-[10px] mt-2">تحتاج {xpForNext - xpProgress} نقطة إضافية للمستوى التالي</p>
              </div>

              {/* How to earn XP */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-5">
                <h4 className="text-white text-xs font-bold mb-3">كيف تكسب نقاط XP؟</h4>
                <div className="space-y-2 text-[11px]">
                  {[
                    { label: 'إرسال رسالة في الدردشة', xp: '+5 XP' },
                    { label: 'تسجيل الدخول يومياً', xp: '+10 XP' },
                    { label: 'إنشاء تذكرة دعم', xp: '+5 XP' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-emerald-400 font-medium">{item.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== TICKETS TAB ===== */}
          {activeTab === 'tickets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">التذاكر</h3>
                <Link href="/support" className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-violet-400 text-[11px] font-medium transition-all">
                  + تذكرة جديدة
                </Link>
              </div>
              {tickets.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-400 text-sm mb-1">لا توجد تذاكر</p>
                  <p className="text-gray-600 text-[11px]">اذهب للدعم الفني لفتح تذكرة جديدة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket: any) => {
                    const st = TICKET_STATUSES[ticket.status] || TICKET_STATUSES.OPEN;
                    return (
                      <Link key={ticket.id} href={`/support/${ticket.id}`}
                        className="block bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-4 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-white text-sm font-medium truncate mb-1">{ticket.title}</h4>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded border ${st.bg} ${st.color}`}>{st.label}</span>
                              <span className="text-gray-600">{new Date(ticket.createdAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                          <span className="text-gray-600 text-[11px]">💬 {ticket._count?.replies || 0}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== NOTIFICATIONS TAB ===== */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">الإشعارات</h3>
                <Link href="/notifications" className="text-violet-400 hover:text-violet-300 text-[11px] font-medium transition-colors">
                  عرض الكل ←
                </Link>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-gray-400 text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 15).map((notif: any) => (
                    <div key={notif.id}
                      className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 ${!notif.isRead ? 'ring-1 ring-violet-500/15' : 'opacity-75'}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-white text-xs font-medium truncate">{notif.title}</h4>
                            {!notif.isRead && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0" />}
                          </div>
                          {notif.content && <p className="text-gray-500 text-[11px] line-clamp-1">{notif.content}</p>}
                        </div>
                        <span className="text-gray-700 text-[9px] shrink-0">{new Date(notif.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-white mb-4">إعدادات الحساب</h3>

              {/* Avatar */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <p className="text-gray-400 text-xs font-medium mb-3">📷 الصورة الشخصية</p>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.06]">
                    {avatar ? (
                      <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-violet-400 text-[11px] font-medium transition-all">
                    تغيير الصورة
                  </button>
                  {avatar && (
                    <button onClick={handleDeleteAvatar}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[11px] font-medium transition-all">
                      حذف
                    </button>
                  )}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">الاسم المعروض</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50}
                  placeholder="اسم معروض (اختياري)"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600" dir="auto" />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">نبذة عنك</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={200}
                  placeholder="اكتب نبذة مختصرة عنك..." rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all resize-none placeholder:text-gray-600" dir="auto" />
                <p className="text-[10px] text-gray-600 mt-1 text-left">{bio.length}/200</p>
              </div>

              {/* Password Change */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
                <p className="text-gray-400 text-xs font-medium">🔒 تغيير كلمة المرور</p>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="كلمة المرور الحالية"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600" />
              </div>

              {/* Save Button */}
              <button onClick={handleSaveProfile} disabled={editLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                {editLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>

              {editMessage && (
                <div className={`text-center text-xs px-4 py-2.5 rounded-xl ${editMessage.includes('نجاح') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}>
                  {editMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
