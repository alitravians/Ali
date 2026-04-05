'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  // Avatar state
  const [avatar, setAvatar] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch avatar on load
  useEffect(() => {
    if (status !== 'authenticated') return;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1120] via-[#0d1526] to-[#0b1120] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold gradient-text">الملف الشخصي</h1>
          <Link href="/chat" className="text-gray-400 hover:text-white text-sm">← العودة للدردشة</Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-6 mb-8">
            {/* Avatar with hover upload */}
            <div className="relative group">
              <div className="w-[150px] h-[150px] rounded-lg overflow-hidden border-4 border-white/20 shadow-lg">
                {avatar ? (
                  <img src={avatar} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-5xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* Hover overlay with change button */}
              <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}>
                <span className="text-white text-sm font-medium">
                  {avatarLoading ? '...' : 'تغيير الصورة'}
                </span>
              </div>

              {/* Delete button (shown on hover only if avatar exists) */}
              {avatar && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -top-2 -left-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="حذف الصورة"
                >
                  ✕
                </button>
              )}

              {/* Success/error message */}
              {avatarMessage && (
                <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-3 py-1.5 rounded-lg shadow-lg ${
                  avatarMessage.includes('نجاح') || avatarMessage.includes('حذف') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {avatarMessage}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: (user?.roleColor || '#808080') + '20', color: user?.roleColor || '#808080' }}>
                  {user?.roleDisplayName || 'عضو'}
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-gray-500 text-xs mb-1">اسم المستخدم</p>
              <p className="text-white">{user?.name}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-gray-500 text-xs mb-1">البريد الإلكتروني</p>
              <p className="text-white" dir="ltr">{user?.email}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-gray-500 text-xs mb-1">الرتبة</p>
              <p style={{ color: user?.roleColor }}>{user?.roleDisplayName || 'عضو'}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-gray-500 text-xs mb-1">مستوى الصلاحيات</p>
              <p className="text-white">{user?.roleLevel || 10}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
