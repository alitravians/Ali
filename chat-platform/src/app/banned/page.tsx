'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BannedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'لم يتم تحديد السبب';
  const expires = searchParams.get('expires');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030711] px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="content-card p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/[0.08] border border-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">تم حظر حسابك</h1>
          <p className="text-gray-500 text-sm mb-8">لا يمكنك الوصول إلى المنصة حالياً</p>

          <div className="rounded-xl bg-red-500/[0.04] border border-red-500/[0.08] p-5 mb-6 text-right">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">سبب الحظر</p>
            <p className="text-red-300 text-sm">{reason}</p>

            {expires && (
              <div className="mt-4 pt-4 border-t border-red-500/[0.06]">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">ينتهي في</p>
                <p className="text-amber-400 text-sm font-medium">{new Date(expires).toLocaleString('ar-SA')}</p>
              </div>
            )}

            {!expires && (
              <div className="mt-4 pt-4 border-t border-red-500/[0.06]">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">مدة الحظر</p>
                <p className="text-red-400 text-sm font-semibold">حظر دائم</p>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-xs mb-6 leading-relaxed">
            إذا كنت تعتقد أن هذا الحظر كان خطأ، يمكنك التواصل مع الإدارة.
          </p>

          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm transition-colors font-medium">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#030711]"><span className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /></div>}>
      <BannedContent />
    </Suspense>
  );
}
