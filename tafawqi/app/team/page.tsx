// Public team page. Renders every visible department as a table with three
// columns: الاسم، الصلاحية، الافتار. Empty departments still show the table
// header row so visitors see the section structure. RTL Arabic. Server-only.
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

      {departments.length === 0 ? (
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
        <div className="space-y-8">
          {departments.map((dept) => (
            <DepartmentTable key={dept.id} department={dept} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentTable({ department }: { department: DepartmentWithMembers }) {
  const color = department.color;
  return (
    <section
      className="rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <table className="w-full border-collapse text-right">
        <thead>
          <tr>
            <th
              colSpan={3}
              className="px-5 py-3 text-white text-lg font-extrabold text-center"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              {department.nameAr}
              <span className="text-white/85 text-sm font-medium mr-2">
                ({department.members.length})
              </span>
            </th>
          </tr>
          <tr
            className="text-sm font-bold"
            style={{ background: `${color}1a`, color }}
          >
            <th className="px-4 py-2.5 w-1/2">الاسم</th>
            <th className="px-4 py-2.5 w-1/3">الصلاحية</th>
            <th className="px-4 py-2.5 w-32 text-center">الافتار</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900/40">
          {department.members.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-4 py-6 text-center text-sm text-violet-600/80 dark:text-violet-300/70"
              >
                لم يُضَف أعضاء بعد في هذا القسم.
              </td>
            </tr>
          ) : (
            department.members.map((m) => (
              <MemberRow key={m.id} member={m} accentColor={color} />
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

function MemberRow({
  member,
  accentColor,
}: {
  member: MemberWithUser;
  accentColor: string;
}) {
  const firstChar = member.user.name.trim().charAt(0) || "👤";
  const roleLabel =
    member.roleAr ||
    (member.user.role === "admin" ? "مشرفة" : "—");
  return (
    <tr className="border-t border-violet-100 dark:border-violet-900/40 hover:bg-violet-50/40 dark:hover:bg-violet-900/20 transition-colors">
      <td className="px-4 py-3 font-bold text-violet-900 dark:text-violet-100">
        {member.user.name}
      </td>
      <td className="px-4 py-3 text-violet-700 dark:text-violet-200/90">
        {roleLabel}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <div
            className="w-12 h-12 rounded-full overflow-hidden grid place-items-center text-white text-lg font-bold shadow ring-2 ring-white dark:ring-slate-900"
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
        </div>
      </td>
    </tr>
  );
}
