"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  // Allow the login page to render without auth check
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/admin/login");
      return;
    }

    // Check admin role
    const role = (session.user as { role?: string }).role;
    if (role !== "admin") {
      router.replace("/admin/login");
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [session, status, router, isLoginPage, pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
