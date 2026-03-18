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
  members: TeamMember[];
}

const rankLabels: Record<string, string> = {
  admin: "إداري",
  moderator: "مشرف",
  vip: "VIP",
  teacher: "معلم",
  tester: "مختبر",
  member: "عضو",
};

const rankColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  moderator: "bg-blue-100 text-blue-700 border-blue-200",
  vip: "bg-amber-100 text-amber-700 border-amber-200",
  teacher: "bg-green-100 text-green-700 border-green-200",
  tester: "bg-purple-100 text-purple-700 border-purple-200",
  member: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function TeamPage() {
  const [departments, setDepartments] = useState<TeamDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data.filter((d: TeamDepartment) => d.members.length > 0));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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
          <div className="max-w-6xl mx-auto px-4">
            {departments.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">لا يوجد أعضاء في فريق العمل حالياً</p>
              </div>
            ) : (
              <div className="space-y-12">
                {departments.map((dept) => (
                  <div key={dept.id}>
                    {/* Department Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{dept.nameAr}</h2>
                      <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full"></div>
                    </div>

                    {/* Members Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {dept.members.map((member) => (
                        <div
                          key={member.id}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-300 cursor-pointer group"
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="p-6 text-center">
                            {/* Avatar */}
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary-100 group-hover:border-primary-300 transition-colors shadow-md">
                              {member.user.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={member.user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                                  {member.user.name.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Name */}
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{member.user.name}</h3>

                            {/* Role/Responsibility */}
                            <p className="text-primary-600 font-medium text-sm mb-3">
                              {member.roleAr || member.role || "عضو فريق"}
                            </p>

                            {/* Rank Badge */}
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${rankColors[member.user.chatRank] || rankColors.member}`}>
                              {rankLabels[member.user.chatRank] || "عضو"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto mb-5 rounded-full overflow-hidden border-4 border-primary-200 shadow-lg">
                  {selectedMember.user.avatar ? (
                    <img
                      src={selectedMember.user.avatar}
                      alt={selectedMember.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-5xl font-bold">
                      {selectedMember.user.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedMember.user.name}</h3>

                {/* Role */}
                <p className="text-primary-600 font-medium text-base mb-2">
                  {selectedMember.roleAr || selectedMember.role || "عضو فريق"}
                </p>

                {/* Rank Badge */}
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium border ${rankColors[selectedMember.user.chatRank] || rankColors.member}`}>
                  {rankLabels[selectedMember.user.chatRank] || "عضو"}
                </span>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="mt-6 block w-full text-center py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
