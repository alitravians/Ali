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
      <div className="min-h-screen flex items-center justify-center bg-[#030711]">
        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container bg-[#030711]" dir="rtl">
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.012)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="text-lg font-black gradient-text-animated tracking-tight">ChatZone</Link>
          <Link href="/" className="text-gray-500 hover:text-white text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">← الرئيسية</Link>
        </div>
      </nav>

      <div className="page-content max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/[0.06] border border-violet-500/10 text-violet-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            فريق العمل
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">فريق العمل</h1>
          <p className="text-gray-500 text-sm">تعرّف على الفريق المسؤول عن إدارة وتطوير المنصة</p>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-gray-500">لا يوجد أعضاء في فريق العمل حالياً</p>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map((dept) => (
              <div key={dept.id} className="content-card overflow-hidden">
                {/* Department header */}
                <div className="px-6 py-3.5 border-b border-white/[0.04]" style={{ background: `linear-gradient(135deg, ${dept.color}15, ${dept.color}08)` }}>
                  <h2 className="text-base font-bold" style={{ color: dept.color }}>{dept.nameAr}</h2>
                </div>

                {/* Members table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[40%]">الاسم</th>
                        <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[30%]">المنصب</th>
                        <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[30%]">الأفتار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.members.length > 0 ? (
                        dept.members.map((member) => {
                          const highestRole = getHighestRole(member);
                          return (
                            <tr key={member.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${member.user.status === 'ONLINE' ? 'bg-emerald-400 online-indicator' : 'bg-gray-600'}`} />
                                  <span className="text-sm font-semibold text-white">{member.user.username}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{
                                    backgroundColor: highestRole.color + '15',
                                    color: highestRole.color,
                                  }}>
                                    {highestRole.displayName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xs font-medium text-violet-400">{member.roleAr || member.role || 'عضو فريق'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/[0.08]">
                                    {member.user.avatar ? (
                                      <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
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
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-600 text-sm">لا يوجد أعضاء في هذا القسم حالياً</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="text-center py-10 text-gray-600 text-xs">
          ChatZone © {new Date().getFullYear()} - جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  );
}
