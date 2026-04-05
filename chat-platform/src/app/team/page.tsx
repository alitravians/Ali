'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  role: string;
  roleAr: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    status: string;
    lastActive: string | null;
    userRoles: { role: { name: string; displayName: string; color: string; level: number } }[];
  };
}

interface TeamDepartment {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  members: TeamMember[];
}

export default function TeamPage() {
  const [departments, setDepartments] = useState<TeamDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = () => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeamData();
    const interval = setInterval(fetchTeamData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getHighestRole = (member: TeamMember) => {
    if (!member.user.userRoles || member.user.userRoles.length === 0) {
      return { displayName: 'عضو', color: '#808080', level: 0 };
    }
    return member.user.userRoles.reduce(
      (h, ur) => (ur.role.level > h.level ? ur.role : h),
      { displayName: 'عضو', color: '#808080', level: 0, name: 'member' }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060B18] via-[#0A1128]/20 to-[#060B18]">
        <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060B18] via-[#0A1128]/20 to-[#060B18]" dir="rtl">
      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold gradient-text-animated">ChatZone</h1>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← الرئيسية</Link>
      </nav>

      {/* Page Title */}
      <section className="text-center py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-3">فريق العمل</h1>
          <p className="text-gray-400 text-lg">تعرّف على الفريق المسؤول عن إدارة وتطوير المنصة</p>
        </div>
      </section>

      {/* Team Departments */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {departments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-gray-500 text-xl">لا يوجد أعضاء في فريق العمل حالياً</p>
            </div>
          ) : (
            <div className="space-y-8">
              {departments.map((dept) => (
                <div key={dept.id} className="glass rounded-2xl overflow-hidden">
                  {/* Department Name Header */}
                  <div className="px-6 py-4 text-center" style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}dd)` }}>
                    <h2 className="text-xl font-bold text-white">{dept.nameAr}</h2>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-6 py-4 text-right text-sm font-bold text-gray-300 w-[40%]">الاسم</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-300 w-[30%]">المنصب</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-300 w-[30%]">الأفتار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dept.members.length > 0 ? (
                          dept.members.map((member, idx) => {
                            const highestRole = getHighestRole(member);
                            return (
                              <tr
                                key={member.id}
                                className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${member.user.status === 'ONLINE' ? 'bg-emerald-400 online-indicator' : 'bg-gray-600'}`} />
                                    <span className="text-base font-semibold text-white">
                                      {member.user.username}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{
                                      backgroundColor: highestRole.color + '20',
                                      color: highestRole.color,
                                    }}>
                                      {highestRole.displayName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-medium text-violet-400">
                                    {member.roleAr || member.role || 'عضو فريق'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg">
                                      {member.user.avatar ? (
                                        <img
                                          src={member.user.avatar}
                                          alt={member.user.username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                          {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                              لا يوجد أعضاء في هذا القسم حالياً
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm border-t border-white/[0.04]">
        ChatZone © {new Date().getFullYear()} - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
