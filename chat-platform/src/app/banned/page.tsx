'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BannedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'لم يتم تحديد السبب';
  const expires = searchParams.get('expires');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="glass rounded-2xl p-10 border border-red-500/20">
          <div className="text-6xl mb-6">&#x1F6AB;</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">تم حظر حسابك</h1>
          <p className="text-gray-400 mb-6">لا يمكنك الوصول إلى المنصة حالياً</p>

          <div className="bg-red-500/10 rounded-xl p-4 mb-6 text-right">
            <p className="text-gray-500 text-xs mb-1">سبب الحظر:</p>
            <p className="text-red-300 text-sm">{reason}</p>

            {expires && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">ينتهي في:</p>
                <p className="text-yellow-400 text-sm">{new Date(expires).toLocaleString('ar-SA')}</p>
              </div>
            )}

            {!expires && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">مدة الحظر:</p>
                <p className="text-red-300 text-sm font-semibold">حظر دائم</p>
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-6">
            إذا كنت تعتقد أن هذا الحظر كان خطأ، يمكنك التواصل مع الإدارة.
          </p>

          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950"><span className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>}>
      <BannedContent />
    </Suspense>
  );
}
