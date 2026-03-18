"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface TeamMemberData {
  id: string;
  userId: string;
  role: string;
  roleAr: string;
  order: number;
  isVisible: boolean;
  user: UserOption;
}

interface DepartmentData {
  id: string;
  name: string;
  nameAr: string;
  order: number;
  isVisible: boolean;
  members: TeamMemberData[];
}

export default function AdminTeamPage() {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentData | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptNameAr, setDeptNameAr] = useState("");

  // Member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberDeptId, setMemberDeptId] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberRoleAr, setMemberRoleAr] = useState("");

  // Edit member
  const [editMember, setEditMember] = useState<TeamMemberData | null>(null);

  const fetchData = () => {
    fetch("/api/admin/team")
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
        if (data.users) setUsers(data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateDept = async () => {
    if (!deptName.trim() || !deptNameAr.trim()) return;
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_department", name: deptName.trim(), nameAr: deptNameAr.trim() }),
    });
    if (res.ok) {
      setDeptName(""); setDeptNameAr(""); setShowDeptForm(false);
      fetchData();
    }
  };

  const handleUpdateDept = async () => {
    if (!editDept) return;
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_department", id: editDept.id, name: deptName.trim(), nameAr: deptNameAr.trim() }),
    });
    setEditDept(null); setDeptName(""); setDeptNameAr("");
    fetchData();
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("هل تريد حذف هذا القسم وجميع أعضائه؟")) return;
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_department", id }),
    });
    fetchData();
  };

  const handleToggleDeptVisibility = async (dept: DepartmentData) => {
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_department", id: dept.id, isVisible: !dept.isVisible }),
    });
    fetchData();
  };

  const handleAddMember = async () => {
    if (!memberUserId || !memberDeptId) return;
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_member",
        userId: memberUserId,
        departmentId: memberDeptId,
        role: memberRole.trim(),
        roleAr: memberRoleAr.trim(),
      }),
    });
    if (res.ok) {
      setMemberUserId(""); setMemberRole(""); setMemberRoleAr(""); setShowMemberForm(false); setMemberDeptId("");
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || "فشل في إضافة العضو");
    }
  };

  const handleUpdateMember = async () => {
    if (!editMember) return;
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_member",
        id: editMember.id,
        role: memberRole.trim(),
        roleAr: memberRoleAr.trim(),
      }),
    });
    setEditMember(null); setMemberRole(""); setMemberRoleAr("");
    fetchData();
  };

  const handleToggleMemberVisibility = async (member: TeamMemberData) => {
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_member", id: member.id, isVisible: !member.isVisible }),
    });
    fetchData();
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("هل تريد إزالة هذا العضو من القسم؟")) return;
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_member", id }),
    });
    fetchData();
  };

  const handleMoveDept = async (dept: DepartmentData, direction: "up" | "down") => {
    const idx = departments.findIndex((d) => d.id === dept.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= departments.length) return;
    const swapDept = departments[swapIdx];
    await Promise.all([
      fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_department", id: dept.id, order: swapDept.order }) }),
      fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_department", id: swapDept.id, order: dept.order }) }),
    ]);
    fetchData();
  };

  const handleMoveMember = async (member: TeamMemberData, dept: DepartmentData, direction: "up" | "down") => {
    const idx = dept.members.findIndex((m) => m.id === member.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dept.members.length) return;
    const swapMember = dept.members[swapIdx];
    await Promise.all([
      fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_member", id: member.id, order: swapMember.order }) }),
      fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_member", id: swapMember.id, order: member.order }) }),
    ]);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">لوحة التحكم</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium text-sm">إدارة فريق العمل</span>
          <Link href="/team" className="mr-auto text-blue-600 hover:text-blue-700 text-sm" target="_blank">معاينة الصفحة ←</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة فريق العمل</h1>
            <p className="text-gray-500 text-sm mt-1">إنشاء أقسام وإضافة أعضاء لصفحة فريق العمل</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowMemberForm(true); setMemberDeptId(departments[0]?.id || ""); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={departments.length === 0}
            >
              + إضافة عضو
            </button>
            <button
              onClick={() => { setShowDeptForm(true); setDeptName(""); setDeptNameAr(""); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              + قسم جديد
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border text-center">
            <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
            <p className="text-gray-500 text-sm">قسم</p>
          </div>
          <div className="bg-white rounded-xl p-4 border text-center">
            <p className="text-2xl font-bold text-green-600">{departments.reduce((sum, d) => sum + d.members.length, 0)}</p>
            <p className="text-gray-500 text-sm">عضو</p>
          </div>
          <div className="bg-white rounded-xl p-4 border text-center">
            <p className="text-2xl font-bold text-amber-600">{departments.filter((d) => d.isVisible).length}</p>
            <p className="text-gray-500 text-sm">قسم ظاهر</p>
          </div>
        </div>

        {/* Departments */}
        {departments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border">
            <p className="text-gray-400 text-lg mb-4">لم يتم إنشاء أي أقسام بعد</p>
            <button
              onClick={() => setShowDeptForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              إنشاء أول قسم
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map((dept, dIdx) => (
              <div key={dept.id} className={`bg-white rounded-xl border ${!dept.isVisible ? "opacity-60" : ""}`}>
                {/* Department Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleMoveDept(dept, "up")} disabled={dIdx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">&#9650;</button>
                    <button onClick={() => handleMoveDept(dept, "down")} disabled={dIdx === departments.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">&#9660;</button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{dept.nameAr}</h3>
                    <p className="text-gray-400 text-xs">{dept.name} - {dept.members.length} عضو</p>
                  </div>
                  {!dept.isVisible && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">مخفي</span>}
                  <button onClick={() => handleToggleDeptVisibility(dept)} className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    {dept.isVisible ? "إخفاء" : "إظهار"}
                  </button>
                  <button onClick={() => { setEditDept(dept); setDeptName(dept.name); setDeptNameAr(dept.nameAr); }} className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">
                    تعديل
                  </button>
                  <button onClick={() => handleDeleteDept(dept.id)} className="text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    حذف
                  </button>
                  <button
                    onClick={() => { setShowMemberForm(true); setMemberDeptId(dept.id); }}
                    className="text-sm bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded"
                  >
                    + عضو
                  </button>
                </div>

                {/* Members Table */}
                {dept.members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="py-3 px-4 text-right">ترتيب</th>
                          <th className="py-3 px-4 text-right">الصورة</th>
                          <th className="py-3 px-4 text-right">الاسم</th>
                          <th className="py-3 px-4 text-right">المسؤولية</th>
                          <th className="py-3 px-4 text-right">الحالة</th>
                          <th className="py-3 px-4 text-right">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dept.members.map((member, mIdx) => (
                          <tr key={member.id} className={`border-b last:border-0 hover:bg-gray-50 ${!member.isVisible ? "opacity-50" : ""}`}>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <button onClick={() => handleMoveMember(member, dept, "up")} disabled={mIdx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">&#9650;</button>
                                <button onClick={() => handleMoveMember(member, dept, "down")} disabled={mIdx === dept.members.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">&#9660;</button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                                {member.user.avatar ? (
                                  <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                    {member.user.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900 text-sm">{member.user.name}</p>
                              <p className="text-gray-400 text-xs">{member.user.email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-700">{member.roleAr || member.role || "—"}</p>
                            </td>
                            <td className="py-3 px-4">
                              {member.isVisible ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">ظاهر</span>
                              ) : (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">مخفي</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button onClick={() => handleToggleMemberVisibility(member)} className="text-xs text-gray-500 hover:text-gray-700">
                                  {member.isVisible ? "إخفاء" : "إظهار"}
                                </button>
                                <button onClick={() => { setEditMember(member); setMemberRole(member.role); setMemberRoleAr(member.roleAr); }} className="text-xs text-blue-600 hover:text-blue-700">
                                  تعديل
                                </button>
                                <button onClick={() => handleRemoveMember(member.id)} className="text-xs text-red-500 hover:text-red-700">
                                  إزالة
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    لا يوجد أعضاء في هذا القسم
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showDeptForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeptForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">إنشاء قسم جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم (إنجليزي)</label>
                <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Administration" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم (عربي)</label>
                <input type="text" value={deptNameAr} onChange={(e) => setDeptNameAr(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="مثال: الإدارة العامة" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateDept} disabled={!deptName.trim() || !deptNameAr.trim()} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50">إنشاء</button>
              <button onClick={() => setShowDeptForm(false)} className="px-4 py-2 text-gray-500 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditDept(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">تعديل القسم</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم (إنجليزي)</label>
                <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القسم (عربي)</label>
                <input type="text" value={deptNameAr} onChange={(e) => setDeptNameAr(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateDept} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">حفظ</button>
              <button onClick={() => setEditDept(null)} className="px-4 py-2 text-gray-500 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMemberForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة عضو جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <select value={memberDeptId} onChange={(e) => setMemberDeptId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستخدم</label>
                <select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">اختر مستخدماً...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي (إنجليزي)</label>
                <input type="text" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Chat Moderator" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي (عربي)</label>
                <input type="text" value={memberRoleAr} onChange={(e) => setMemberRoleAr(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="مثال: مشرف الدردشة" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddMember} disabled={!memberUserId || !memberDeptId} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-50">إضافة</button>
              <button onClick={() => setShowMemberForm(false)} className="px-4 py-2 text-gray-500 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditMember(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">تعديل بيانات العضو</h3>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                {editMember.user.avatar ? (
                  <img src={editMember.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {editMember.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{editMember.user.name}</p>
                <p className="text-gray-400 text-xs">{editMember.user.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي (إنجليزي)</label>
                <input type="text" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي (عربي)</label>
                <input type="text" value={memberRoleAr} onChange={(e) => setMemberRoleAr(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateMember} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">حفظ</button>
              <button onClick={() => setEditMember(null)} className="px-4 py-2 text-gray-500 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
