import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminClient from "./admin-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <div className="text-5xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-violet-900 dark:text-violet-100">غير مسموح</h1>
          <p className="text-violet-600 dark:text-violet-300/80 mt-2">هذه الصفحة للمشرفات فقط.</p>
        </div>
      </div>
    );
  }

  const [chapters, sections] = await Promise.all([
    prisma.chapter.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        sections: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.section.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        chapter: { select: { id: true, title: true } },
      },
    }),
  ]);

  return <AdminClient chapters={chapters} sections={sections} />;
}
