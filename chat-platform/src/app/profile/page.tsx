'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  const [avatar, setAvatar] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

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
        }
      })
      .catch(() => {});
    fetch('/api/profile/avatar')
      .then(r => r.json())
      .then(data => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => {});
  }, [status]);

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
      if (res.ok) {
        setAvatar('');
        setAvatarMessage('تم حذف الصورة');
        setTimeout(() => setAvatarMessage(''), 3000);
      }
    } catch { /* ignore */ }
    setAvatarLoading(false);
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    setEditMessage('');
    try {
      const body: any = { displayName, bio };
      if (showPasswordChange && newPassword) {
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
        setCurrentPassword('');
        setNewPassword('');
        setShowPasswordChange(false);
      } else {
        setEditMessage(data.error || 'فشل في الحفظ');
      }
    } catch {
      setEditMessage('حدث خطأ');
    }
    setEditLoading(false);
    setTimeout(() => setEditMessage(''), 4000);
  };

  return (
    <div className="page-container bg-[#030711]">
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
      </div>

      <div className="page-content max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold gradient-text-subtle">الملف الشخصي</h1>
          <Link href="/chat" className="text-gray-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← العودة للدردشة</Link>
        </div>

        <div className="content-card p-8">
          {/* Avatar & info header */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/[0.04]">
            <div className="relative group">
              <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden border-2 border-white/[0.06] shadow-lg shadow-violet-500/5">
                {avatar ? (
                  <img src={avatar} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}>
                <span className="text-white text-xs font-medium">
                  {avatarLoading ? '...' : 'تغيير الصورة'}
                </span>
              </div>

              {avatar && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="حذف الصورة"
                >
                  ✕
                </button>
              )}

              {avatarMessage && (
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2.5 py-1 rounded-lg ${
                  avatarMessage.includes('نجاح') || avatarMessage.includes('حذف') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}>
                  {avatarMessage}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
              <span className="inline-block text-[11px] px-2 py-0.5 rounded-md font-medium" style={{
                backgroundColor: (user?.roleColor || '#808080') + '15',
                color: user?.roleColor || '#808080',
              }}>
                {user?.roleDisplayName || 'عضو'}
              </span>
              <p className="text-gray-600 text-xs mt-2" dir="ltr">{user?.email}</p>

              {/* Level & XP display */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/15">
                  <span className="text-sm">💎</span>
                  <span className="text-amber-400 text-xs font-bold">المستوى {level}</span>
                </div>
                <div className="flex-1 max-w-[140px]">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>{xp % 100} / 100 XP</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${(xp % 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">الاسم المعروض</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="اسم معروض (اختياري)"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">نبذة عنك</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={200}
                placeholder="اكتب نبذة مختصرة عنك..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all resize-none placeholder:text-gray-600"
                dir="auto"
              />
              <p className="text-[10px] text-gray-600 mt-1 text-left">{bio.length}/200</p>
            </div>

            {/* Password */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-violet-400 text-xs hover:text-violet-300 transition-colors font-medium"
              >
                {showPasswordChange ? '✕ إلغاء تغيير كلمة المرور' : '🔒 تغيير كلمة المرور'}
              </button>

              {showPasswordChange && (
                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-gray-600"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={editLoading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {editLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>

            {editMessage && (
              <div className={`text-center text-xs px-4 py-2.5 rounded-xl ${
                editMessage.includes('نجاح') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'
              }`}>
                {editMessage}
              </div>
            )}

            {/* Info fields */}
            <div className="pt-4 space-y-3 border-t border-white/[0.04]">
              {[
                { label: 'اسم المستخدم', value: user?.name },
                { label: 'البريد الإلكتروني', value: user?.email, dir: 'ltr' as const },
                { label: 'الرتبة', value: user?.roleDisplayName || 'عضو', color: user?.roleColor },
              ].map((field, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">{field.label}</p>
                  <p className="text-sm" dir={field.dir} style={field.color ? { color: field.color } : undefined}>
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
