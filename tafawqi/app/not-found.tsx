import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4" aria-hidden>
        🧭
      </div>
      <h1 className="text-3xl font-black text-violet-900 dark:text-violet-100 mb-2">
        الصفحة غير موجودة
      </h1>
      <p className="text-violet-600 dark:text-violet-300 mb-8">
        الرابط الذي فتحتِه غير صحيح أو تمّت إزالته.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href="/" className="btn-primary px-5 py-2.5">
          الصفحة الرئيسية
        </Link>
        <Link href="/chapters" className="btn-secondary px-5 py-2.5">
          📘 الفصول
        </Link>
        <Link href="/dashboard" className="btn-secondary px-5 py-2.5">
          👩‍🎓 لوحتي
        </Link>
      </div>
    </div>
  );
}
