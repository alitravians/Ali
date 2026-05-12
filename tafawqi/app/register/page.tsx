import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

async function isRegistrationOpen(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "registration_open" },
    });
    // Treat anything other than the explicit string "false" as open, so a
    // missing row defaults to open (matches the API behaviour).
    return setting?.value !== "false";
  } catch {
    // If the DB read fails, fail open so existing users can still register
    // rather than silently locking the form. The API endpoint is the
    // authoritative gate, so this is safe.
    return true;
  }
}

export default async function RegisterPage() {
  const open = await isRegistrationOpen();

  if (!open) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="card p-8 animate-fade-in text-center">
          <div className="text-5xl mb-3">🚪</div>
          <h1 className="text-2xl font-extrabold text-violet-900 dark:text-violet-100">
            التسجيل مغلق حاليّاً
          </h1>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-3 leading-relaxed">
            عذراً، إنشاء حسابات جديدة غير متاح في الوقت الحالي.
            <br />
            إن كان لديكِ حساب من قبل، يمكنكِ متابعة الدخول بشكل طبيعي.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className="btn-primary text-base py-3">
              تسجيل الدخول
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-violet-600 dark:text-violet-300/80 hover:underline"
            >
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <RegisterForm />;
}
