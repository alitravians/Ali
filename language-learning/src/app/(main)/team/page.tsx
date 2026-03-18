"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface TeamMember {
  id: string;
  role: string;
  roleAr: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    chatRank: string;
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
    fetch("/api/team")
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
    // Auto-refresh every 5 seconds to pick up admin changes
    const interval = setInterval(fetchTeamData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <section className="gradient-bg text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-3">فريق العمل</h1>
            <p className="text-primary-200 text-lg">تعرّف على الفريق المسؤول عن إدارة وتطوير المنصة</p>
          </div>
        </section>

        {/* Team Departments */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            {departments.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">لا يوجد أعضاء في فريق العمل حالياً</p>
              </div>
            ) : (
              <div className="space-y-10">
                {departments.map((dept) => (
                  <div key={dept.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Department Name Header */}
                    <div className="px-6 py-4" style={{ backgroundColor: dept.color || "#2563eb" }}>
                      <h2 className="text-xl font-bold text-white text-center">{dept.nameAr}</h2>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {/* Table Header */}
                        <thead>
                          <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="px-6 py-4 text-right text-sm font-bold text-primary-700 w-[45%]">الاسم</th>
                            <th className="px-6 py-4 text-center text-sm font-bold text-primary-700 w-[30%]">الصلاحية</th>
                            <th className="px-6 py-4 text-center text-sm font-bold text-primary-700 w-[25%]">الأفتار</th>
                          </tr>
                        </thead>

                            {/* Table Body */}
                            <tbody>
                              {dept.members.length > 0 ? (
                                dept.members.map((member, idx) => (
                                  <tr
                                    key={member.id}
                                    className={`border-b border-gray-100 hover:bg-primary-50/50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                                  >
                                    {/* Name Column */}
                                    <td className="px-6 py-4">
                                      <span className="text-base font-semibold text-gray-900">
                                        {member.user.name}
                                      </span>
                                    </td>

                                    {/* Responsibility Column */}
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-sm font-medium text-primary-600">
                                        {member.roleAr || member.role || "عضو فريق"}
                                      </span>
                                    </td>

                                    {/* Avatar Column */}
                                    <td className="px-6 py-4">
                                      <div className="flex justify-center">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-200 shadow-sm">
                                          {member.user.avatar ? (
                                            <img
                                              src={member.user.avatar}
                                              alt={member.user.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold">
                                              {member.user.name.charAt(0)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-sm">
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
      </main>
      <Footer />
    </div>
  );
}
