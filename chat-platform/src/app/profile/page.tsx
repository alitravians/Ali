'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold gradient-text">الملف الشخصي</h1>
          <Link href="/chat" className="text-gray-400 hover:text-white text-sm">← العودة للدردشة</Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: (user?.roleColor || '#808080') + '20', color: user?.roleColor || '#808080' }}>
                  {user?.roleDisplayName || 'عضو'}
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">اسم المستخدم</p>
              <p className="text-white">{user?.name}</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">البريد الإلكتروني</p>
              <p className="text-white" dir="ltr">{user?.email}</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">الرتبة</p>
              <p style={{ color: user?.roleColor }}>{user?.roleDisplayName || 'عضو'}</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">مستوى الصلاحيات</p>
              <p className="text-white">{user?.roleLevel || 10}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
