'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserOption {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
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
  color: string;
  order: number;
  isVisible: boolean;
  members: TeamMemberData[];
}

const colorPresets = [
  { name: 'أزرق', value: '#2563eb' },
  { name: 'أحمر', value: '#dc2626' },
  { name: 'أخضر', value: '#16a34a' },
  { name: 'برتقالي', value: '#ea580c' },
  { name: 'بنفسجي', value: '#9333ea' },
  { name: 'وردي', value: '#db2777' },
  { name: 'ذهبي', value: '#ca8a04' },
  { name: 'فيروزي', value: '#0891b2' },
  { name: 'رمادي', value: '#4b5563' },
  { name: 'أسود', value: '#1f2937' },
];

export default function AdminTeamPage() {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentData | null>(null);
  const [deptNameAr, setDeptNameAr] = useState('');
  const [deptColor, setDeptColor] = useState('#2563eb');

  // Member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberDeptId, setMemberDeptId] = useState('');
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRoleAr, setMemberRoleAr] = useState('');

  // Edit member
  const [editMember, setEditMember] = useState<TeamMemberData | null>(null);

  const showMsg = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchData = () => {
    fetch('/api/admin/team')
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
    if (!deptNameAr.trim()) return;
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_department', nameAr: deptNameAr.trim(), color: deptColor }),
    });
    if (res.ok) {
      showMsg('تم إنشاء القسم بنجاح', 'success');
      setDeptNameAr(''); setDeptColor('#2563eb'); setShowDeptForm(false);
      fetchData();
    }
  };

  const handleUpdateDept = async () => {
    if (!editDept) return;
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_department', id: editDept.id, nameAr: deptNameAr.trim(), color: deptColor }),
    });
    showMsg('تم تحديث القسم', 'success');
    setEditDept(null); setDeptNameAr(''); setDeptColor('#2563eb');
    fetchData();
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('هل تريد حذف هذا القسم وجميع أعضائه؟')) return;
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_department', id }),
    });
    showMsg('تم حذف القسم', 'success');
    fetchData();
  };

  const handleToggleDeptVisibility = async (dept: DepartmentData) => {
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_department', id: dept.id, isVisible: !dept.isVisible }),
    });
    showMsg(dept.isVisible ? 'تم إخفاء القسم' : 'تم إظهار القسم', 'success');
    fetchData();
  };

  const handleAddMember = async () => {
    if (!memberUserId || !memberDeptId) return;
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_member',
        userId: memberUserId,
        departmentId: memberDeptId,
        roleAr: memberRoleAr.trim(),
      }),
    });
    if (res.ok) {
      showMsg('تم إضافة العضو بنجاح', 'success');
      setMemberUserId(''); setMemberRoleAr(''); setShowMemberForm(false); setMemberDeptId('');
      fetchData();
    } else {
      const data = await res.json();
      showMsg(data.error || 'فشل في إضافة العضو', 'error');
    }
  };

  const handleUpdateMember = async () => {
    if (!editMember) return;
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_member',
        id: editMember.id,
        roleAr: memberRoleAr.trim(),
      }),
    });
    showMsg('تم تحديث العضو', 'success');
    setEditMember(null); setMemberRoleAr('');
    fetchData();
  };

  const handleToggleMemberVisibility = async (member: TeamMemberData) => {
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_member', id: member.id, isVisible: !member.isVisible }),
    });
    fetchData();
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('هل تريد إزالة هذا العضو من القسم؟')) return;
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_member', id }),
    });
    showMsg('تم إزالة العضو', 'success');
    fetchData();
  };

  const handleMoveDept = async (dept: DepartmentData, direction: 'up' | 'down') => {
    const idx = departments.findIndex((d) => d.id === dept.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= departments.length) return;
    const swapDept = departments[swapIdx];
    await Promise.all([
      fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_department', id: dept.id, order: swapDept.order }),
      }),
      fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_department', id: swapDept.id, order: dept.order }),
      }),
    ]);
    fetchData();
  };

  const handleMoveMember = async (member: TeamMemberData, dept: DepartmentData, direction: 'up' | 'down') => {
    const idx = dept.members.findIndex((m) => m.id === member.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dept.members.length) return;
    const swapMember = dept.members[swapIdx];
    await Promise.all([
      fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_member', id: member.id, order: swapMember.order }),
      }),
      fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_member', id: swapMember.id, order: member.order }),
      }),
    ]);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950" dir="rtl">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${
          message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>{message.text}</div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">لوحة التحكم</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium text-sm">إدارة فريق العمل</span>
          <Link href="/team" className="mr-auto text-cyan-400 hover:text-indigo-300 text-sm" target="_blank">معاينة الصفحة ↗</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header + Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة فريق العمل</h1>
            <p className="text-gray-500 text-sm mt-1">إنشاء أقسام وإضافة أعضاء لصفحة فريق العمل</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowMemberForm(true); setMemberDeptId(departments[0]?.id || ''); }}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={departments.length === 0}
            >
              + إضافة عضو
            </button>
            <button
              onClick={() => { setShowDeptForm(true); setDeptNameAr(''); setDeptColor('#2563eb'); }}
              className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
            >
              + قسم جديد
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{departments.length}</p>
            <p className="text-gray-500 text-sm">قسم</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{departments.reduce((sum, d) => sum + d.members.length, 0)}</p>
            <p className="text-gray-500 text-sm">عضو</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{departments.filter((d) => d.isVisible).length}</p>
            <p className="text-gray-500 text-sm">قسم ظاهر</p>
          </div>
        </div>

        {/* Departments List */}
        {departments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">لا توجد أقسام بعد</p>
            <p className="text-sm">أنشئ قسماً جديداً للبدء</p>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map((dept, deptIdx) => (
              <div key={dept.id} className="glass rounded-2xl overflow-hidden">
                {/* Department Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${dept.color}30, ${dept.color}10)`, borderBottom: `2px solid ${dept.color}40` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dept.color }} />
                    <h3 className="text-lg font-bold text-white">{dept.nameAr}</h3>
                    <span className="text-xs text-gray-500">({dept.members.length} عضو)</span>
                    {!dept.isVisible && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">مخفي</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deptIdx > 0 && (
                      <button onClick={() => handleMoveDept(dept, 'up')} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg" title="تحريك لأعلى">▲</button>
                    )}
                    {deptIdx < departments.length - 1 && (
                      <button onClick={() => handleMoveDept(dept, 'down')} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg" title="تحريك لأسفل">▼</button>
                    )}
                    <button onClick={() => handleToggleDeptVisibility(dept)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${dept.isVisible ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {dept.isVisible ? 'إخفاء' : 'إظهار'}
                    </button>
                    <button onClick={() => { setEditDept(dept); setDeptNameAr(dept.nameAr); setDeptColor(dept.color); }} className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium">تعديل</button>
                    <button onClick={() => { setShowMemberForm(true); setMemberDeptId(dept.id); }} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">+ عضو</button>
                    <button onClick={() => handleDeleteDept(dept.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">حذف</button>
                  </div>
                </div>

                {/* Members Table */}
                {dept.members.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400">الأفتار</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400">الاسم</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400">البريد</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400">المنصب</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400">الحالة</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.members.map((member, memberIdx) => (
                        <tr key={member.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-6 py-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                              {member.user.avatar ? (
                                <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                              ) : (
                                member.user.username.charAt(0).toUpperCase()
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-white text-sm font-medium">{member.user.username}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs">{member.user.email}</td>
                          <td className="px-6 py-3 text-cyan-400 text-sm">{member.roleAr || 'عضو فريق'}</td>
                          <td className="px-6 py-3 text-center">
                            {member.isVisible ? (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">ظاهر</span>
                            ) : (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">مخفي</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {memberIdx > 0 && (
                                <button onClick={() => handleMoveMember(member, dept, 'up')} className="p-1 text-gray-600 hover:text-white" title="أعلى">▲</button>
                              )}
                              {memberIdx < dept.members.length - 1 && (
                                <button onClick={() => handleMoveMember(member, dept, 'down')} className="p-1 text-gray-600 hover:text-white" title="أسفل">▼</button>
                              )}
                              <button onClick={() => handleToggleMemberVisibility(member)} className="p-1 text-gray-500 hover:text-yellow-400" title={member.isVisible ? 'إخفاء' : 'إظهار'}>
                                {member.isVisible ? '👁' : '👁‍🗨'}
                              </button>
                              <button onClick={() => { setEditMember(member); setMemberRoleAr(member.roleAr); }} className="p-1 text-gray-500 hover:text-cyan-400" title="تعديل">✏️</button>
                              <button onClick={() => handleRemoveMember(member.id)} className="p-1 text-gray-500 hover:text-red-400" title="إزالة">🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-600 text-sm">لا يوجد أعضاء في هذا القسم</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showDeptForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeptForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">قسم جديد</h3>
            <input
              value={deptNameAr}
              onChange={e => setDeptNameAr(e.target.value)}
              placeholder="اسم القسم بالعربي"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-4"
              autoFocus
            />
            <p className="text-gray-400 text-xs mb-2">لون القسم:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {colorPresets.map(c => (
                <button
                  key={c.value}
                  onClick={() => setDeptColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${deptColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="color" value={deptColor} onChange={e => setDeptColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <input value={deptColor} onChange={e => setDeptColor(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
            </div>
            <div className="rounded-xl p-4 mb-4 text-center" style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}dd)` }}>
              <span className="text-white font-bold">{deptNameAr || 'معاينة القسم'}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreateDept} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium">إنشاء</button>
              <button onClick={() => setShowDeptForm(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditDept(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تعديل القسم</h3>
            <input
              value={deptNameAr}
              onChange={e => setDeptNameAr(e.target.value)}
              placeholder="اسم القسم بالعربي"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-4"
              autoFocus
            />
            <p className="text-gray-400 text-xs mb-2">لون القسم:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {colorPresets.map(c => (
                <button
                  key={c.value}
                  onClick={() => setDeptColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${deptColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="color" value={deptColor} onChange={e => setDeptColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <input value={deptColor} onChange={e => setDeptColor(e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono" />
            </div>
            <div className="rounded-xl p-4 mb-4 text-center" style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}dd)` }}>
              <span className="text-white font-bold">{deptNameAr || 'معاينة القسم'}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdateDept} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium">حفظ</button>
              <button onClick={() => setEditDept(null)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMemberForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">إضافة عضو</h3>
            <select
              value={memberDeptId}
              onChange={e => setMemberDeptId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-3"
            >
              <option value="">اختر القسم</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
            </select>
            <select
              value={memberUserId}
              onChange={e => setMemberUserId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-3"
            >
              <option value="">اختر المستخدم</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
            </select>
            <input
              value={memberRoleAr}
              onChange={e => setMemberRoleAr(e.target.value)}
              placeholder="المنصب (مثال: المدير العام، مشرف دردشة)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleAddMember} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm text-white font-medium">إضافة</button>
              <button onClick={() => setShowMemberForm(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditMember(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تعديل عضو - {editMember.user.username}</h3>
            <input
              value={memberRoleAr}
              onChange={e => setMemberRoleAr(e.target.value)}
              placeholder="المنصب بالعربي"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateMember} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium">حفظ</button>
              <button onClick={() => setEditMember(null)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
