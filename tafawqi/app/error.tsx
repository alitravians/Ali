"use client";

// Global error boundary. Next.js renders this when an unhandled error occurs
// anywhere in the app tree (server or client). Keeps the user out of a blank
// screen and gives them a way back.

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface error to the console for debugging. In a production setup this
    // is where we'd hook into Sentry / external observability.
    // eslint-disable-next-line no-console
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4" aria-hidden>
        ⚠️
      </div>
      <h1 className="text-2xl font-black text-violet-900 dark:text-violet-100 mb-2">
        حدث خطأ غير متوقع
      </h1>
      <p className="text-violet-600 dark:text-violet-300 mb-6">
        نأسف للإزعاج. يمكنكِ إعادة المحاولة، وإن استمرت المشكلة عودي للصفحة الرئيسية.
      </p>
      {error.digest ? (
        <p className="text-xs text-violet-400 dark:text-violet-500 mb-6 num">
          رمز الخطأ: {error.digest}
        </p>
      ) : null}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={reset}
          className="btn-primary px-5 py-2.5"
        >
          إعادة المحاولة
        </button>
        <Link href="/" className="btn-secondary px-5 py-2.5">
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
