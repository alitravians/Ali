'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Pages that admins can always access
const ADMIN_BYPASS_PATHS = ['/admin', '/api', '/login', '/register'];

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [checked, setChecked] = useState(false);

  const isAdmin = session?.user && (session.user as any).roleLevel >= 90;
  const isAdminPath = ADMIN_BYPASS_PATHS.some(p => pathname?.startsWith(p));

  useEffect(() => {
    fetch('/api/site-status')
      .then(res => res.json())
      .then(data => {
        setMaintenanceMode(data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [pathname]);

  // Don't block until we've checked
  if (!checked) return <>{children}</>;

  // Admins bypass maintenance mode
  if (isAdmin || isAdminPath) return <>{children}</>;

  // Show maintenance page
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1120] via-[#0d1526] to-[#0b1120] flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative max-w-lg w-full text-center">
          <div className="glass rounded-3xl p-10 border border-yellow-500/20">
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">الموقع تحت الصيانة</h1>
            {maintenanceMessage ? (
              <p className="text-gray-300 text-lg leading-relaxed mb-6 whitespace-pre-line">{maintenanceMessage}</p>
            ) : (
              <p className="text-gray-400 text-lg mb-6">نقوم حالياً بتحديث المنصة. سنعود قريباً إن شاء الله.</p>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span>جاري العمل على التحديثات...</span>
            </div>
          </div>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 text-sm transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            لوحة التحكم
          </a>
          <p className="text-gray-600 text-xs mt-3">ChatZone — نعود قريباً</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
