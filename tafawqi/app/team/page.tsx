// Public team page. Renders visible departments + members from the DB. RTL
// Arabic layout. Cards-based (per user's stated preference for team views).
// Server component — no client JS needed for the read-only public view.
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MemberWithUser = {
  id: string;
  roleAr: string;
  user: { id: string; name: string; avatar: string; avatarSeed: string; role: string };
};

type DepartmentWithMembers = {
  id: string;
  nameAr: string;
  color: string;
  members: MemberWithUser[];
};

async function getTeam(): Promise<DepartmentWithMembers[]> {
  try {
    return await prisma.teamDepartment.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      include: {
        members: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                avatarSeed: true,
                role: true,
              },
            },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const departments = await getTeam();
  const visible = departments.filter((d) => d.members.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-violet-900 dark:text-violet-100 mb-2">
          👥 فريق العمل
        </h1>
        <p className="text-violet-600/90 dark:text-violet-300/80 max-w-2xl mx-auto">
          الأشخاص الذين يقفون خلف تفوّقي ويعملون على تطوير المنصّة وخدمة الطالبات.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🌱</div>
          <div className="font-bold text-violet-900 dark:text-violet-100">
            لم يُضَف أعضاء بعد
          </div>
          <p className="text-sm text-violet-600/90 dark:text-violet-300/80 mt-1">
            ستظهر هنا فِرق العمل بمجرّد إضافتها من لوحة الإدارة.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {visible.map((dept) => (
            <Department key={dept.id} department={dept} />
          ))}
        </div>
      )}
    </div>
  );
}

function Department({ department }: { department: DepartmentWithMembers }) {
  return (
    <section>
      <div
        className="rounded-2xl px-5 py-3 mb-5 text-white font-extrabold text-lg shadow-md"
        style={{ background: `linear-gradient(135deg, ${department.color}, ${department.color}cc)` }}
      >
        {department.nameAr}
        <span className="text-white/80 text-sm font-medium mr-2">
          ({department.members.length})
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {department.members.map((m) => (
          <MemberCard key={m.id} member={m} accentColor={department.color} />
        ))}
      </div>
    </section>
  );
}

function MemberCard({
  member,
  accentColor,
}: {
  member: MemberWithUser;
  accentColor: string;
}) {
  const firstChar = member.user.name.trim().charAt(0) || "👤";
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-xl overflow-hidden grid place-items-center text-white text-2xl font-bold shrink-0 shadow"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        {member.user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.user.avatar}
            alt={member.user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{firstChar}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-violet-900 dark:text-violet-100 truncate">
          {member.user.name}
        </div>
        {member.roleAr && (
          <div className="text-sm text-violet-600/90 dark:text-violet-300/80 truncate mt-0.5">
            {member.roleAr}
          </div>
        )}
        {!member.roleAr && member.user.role === "admin" && (
          <div className="text-xs text-violet-500 dark:text-violet-300/70 mt-0.5">
            مشرفة
          </div>
        )}
      </div>
    </div>
  );
}
