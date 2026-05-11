import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: { user: { select: { name: true } } },
  });
  if (!cert) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-8 relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-violet-50 dark:from-amber-900/20 dark:via-[#161235] dark:to-violet-900/20 border-amber-300/50 dark:border-amber-500/30 shadow-2xl">
        <div className="absolute inset-2 border-2 border-dashed border-amber-300/60 dark:border-amber-500/30 rounded-2xl pointer-events-none" />
        <div className="relative text-center py-8">
          <div className="text-6xl mb-2">🎓</div>
          <div className="uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300 text-sm font-bold">شهادة إنجاز</div>
          <h1 className="mt-3 text-3xl font-black text-violet-900 dark:text-violet-100">{cert.title}</h1>
          <div className="mt-6 text-violet-700 dark:text-violet-200">تُمنح هذه الشهادة إلى</div>
          <div className="mt-2 text-4xl font-black text-violet-900 dark:text-violet-100 border-b-2 border-amber-300/60 inline-block pb-1 px-4">
            {cert.user.name}
          </div>
          <div className="mt-6 text-violet-600 dark:text-violet-300 max-w-md mx-auto leading-relaxed">
            تقديراً لإتمامها بنجاح اختبارات هذا القسم في منصة <span className="font-bold">تفوّقي</span> — رياضيات الصف العاشر.
          </div>
          <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-md mx-auto text-sm">
            <div>
              <div className="text-xs text-amber-700 dark:text-amber-300">تاريخ الإصدار</div>
              <div className="font-bold text-violet-900 dark:text-violet-100 num">{new Date(cert.issuedAt).toLocaleDateString("ar-SY", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div>
              <div className="text-xs text-amber-700 dark:text-amber-300">رمز التحقق</div>
              <div className="font-bold text-violet-900 dark:text-violet-100 num" dir="ltr">{cert.code}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <button onClick={() => typeof window !== "undefined" && window.print()} className="btn-secondary">🖨️ طباعة الشهادة</button>
      </div>
    </div>
  );
}
