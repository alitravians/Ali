"use client";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  avatarSeed: string;
};

type Member = {
  id: string;
  roleAr: string;
  isVisible: boolean;
  order: number;
  user: User;
};

type Department = {
  id: string;
  nameAr: string;
  color: string;
  isVisible: boolean;
  order: number;
  members: Member[];
};

const DEFAULT_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0d9488", "#0284c7", "#4f46e5",
];

export default function TeamTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Create-department form
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState(DEFAULT_COLORS[0]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
        setUsers(data.users || []);
      } else {
        setNotice({ ok: false, text: data.error || "فشل في التحميل" });
      }
    } catch {
      setNotice({ ok: false, text: "فشل في الاتصال بالخادم" });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function flash(ok: boolean, text: string) {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 3000);
  }

  async function callAdmin(payload: Record<string, unknown>): Promise<{ ok: boolean; data: { error?: string } }> {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { error: "فشل في الاتصال بالخادم" } };
    } finally {
      setBusy(false);
    }
  }

  async function createDepartment() {
    if (!newDeptName.trim()) return;
    const { ok, data } = await callAdmin({
      action: "create_department",
      nameAr: newDeptName.trim(),
      color: newDeptColor,
    });
    if (ok) {
      setNewDeptName("");
      await load();
      flash(true, "تم إنشاء القسم");
    } else {
      flash(false, data.error || "فشل في إنشاء القسم");
    }
  }

  async function updateDepartment(id: string, patch: Record<string, unknown>) {
    const { ok, data } = await callAdmin({ action: "update_department", id, ...patch });
    if (ok) {
      await load();
      flash(true, "تم الحفظ");
    } else {
      flash(false, data.error || "فشل في الحفظ");
    }
  }

  async function deleteDepartment(id: string, nameAr: string) {
    if (!confirm(`هل تريدين حذف قسم "${nameAr}"؟ سيُحذف معه كلّ أعضائه.`)) return;
    const { ok, data } = await callAdmin({ action: "delete_department", id });
    if (ok) {
      await load();
      flash(true, "تم حذف القسم");
    } else {
      flash(false, data.error || "فشل في الحذف");
    }
  }

  async function addMember(departmentId: string, userId: string, roleAr: string) {
    const { ok, data } = await callAdmin({ action: "add_member", departmentId, userId, roleAr });
    if (ok) {
      await load();
      flash(true, "تم إضافة العضوة");
    } else {
      flash(false, data.error || "فشل في الإضافة");
    }
  }

  async function updateMember(id: string, patch: Record<string, unknown>) {
    const { ok, data } = await callAdmin({ action: "update_member", id, ...patch });
    if (ok) {
      await load();
    } else {
      flash(false, data.error || "فشل في الحفظ");
    }
  }

  async function removeMember(id: string, name: string) {
    if (!confirm(`إزالة "${name}" من هذا القسم؟`)) return;
    const { ok, data } = await callAdmin({ action: "remove_member", id });
    if (ok) {
      await load();
      flash(true, "تم إزالة العضوة");
    } else {
      flash(false, data.error || "فشل في الإزالة");
    }
  }

  if (loading) return <div className="text-violet-600">تحميل…</div>;

  return (
    <div className="space-y-5">
      {notice && (
        <div
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            notice.ok
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Create-department form */}
      <div className="card p-5">
        <div className="font-bold text-violet-900 dark:text-violet-100 mb-3">إنشاء قسم جديد</div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-violet-500 mb-1">اسم القسم</label>
            <input
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="مثال: الإدارة"
              className="input w-full"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs text-violet-500 mb-1">لون القسم</label>
            <div className="flex gap-1.5">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewDeptColor(c)}
                  className={`w-7 h-7 rounded-lg border-2 ${newDeptColor === c ? "border-violet-900 dark:border-white scale-110" : "border-transparent"} transition`}
                  style={{ background: c }}
                  aria-label={`لون ${c}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={createDepartment}
            disabled={busy || !newDeptName.trim()}
            className="btn-primary"
          >
            إضافة القسم
          </button>
        </div>
      </div>

      {/* Departments list */}
      {departments.length === 0 && (
        <div className="card p-6 text-center text-violet-500">
          لا توجد أقسام بعد. ابدئي بإنشاء قسم في الأعلى.
        </div>
      )}

      {departments.map((dept) => (
        <DepartmentEditor
          key={dept.id}
          dept={dept}
          users={users}
          busy={busy}
          onUpdate={(patch) => updateDepartment(dept.id, patch)}
          onDelete={() => deleteDepartment(dept.id, dept.nameAr)}
          onAddMember={(userId, roleAr) => addMember(dept.id, userId, roleAr)}
          onUpdateMember={(id, patch) => updateMember(id, patch)}
          onRemoveMember={(id, name) => removeMember(id, name)}
        />
      ))}
    </div>
  );
}

function DepartmentEditor({
  dept,
  users,
  busy,
  onUpdate,
  onDelete,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}: {
  dept: Department;
  users: User[];
  busy: boolean;
  onUpdate: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
  onAddMember: (userId: string, roleAr: string) => void;
  onUpdateMember: (id: string, patch: Record<string, unknown>) => void;
  onRemoveMember: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(dept.nameAr);
  const [color, setColor] = useState(dept.color);
  const [newUserId, setNewUserId] = useState("");
  const [newRoleAr, setNewRoleAr] = useState("");

  const usedUserIds = new Set(dept.members.map((m) => m.user.id));
  const availableUsers = users.filter((u) => !usedUserIds.has(u.id));

  return (
    <div className="card overflow-hidden">
      <div
        className="px-5 py-3 text-white flex items-center justify-between flex-wrap gap-2"
        style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}cc)` }}
      >
        {editing ? (
          <div className="flex gap-2 items-center flex-wrap flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input bg-white/20 text-white placeholder-white/60 border-white/30 w-44"
              maxLength={80}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer bg-transparent"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onUpdate({ nameAr: name.trim(), color });
                setEditing(false);
              }}
              className="text-xs bg-white text-violet-700 px-3 py-1.5 rounded-lg font-bold"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => {
                setName(dept.nameAr);
                setColor(dept.color);
                setEditing(false);
              }}
              className="text-xs bg-white/30 px-3 py-1.5 rounded-lg"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <div className="font-extrabold text-lg">
            {dept.nameAr}
            <span className="text-white/80 text-sm font-medium mr-2">
              ({dept.members.length})
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate({ isVisible: !dept.isVisible })}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
            title={dept.isVisible ? "إخفاء القسم من الصفحة العامّة" : "إظهار القسم"}
          >
            {dept.isVisible ? "👁️ ظاهر" : "🚫 مخفي"}
          </button>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
            >
              ✏️ تعديل
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="text-xs bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg"
          >
            🗑️ حذف
          </button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {dept.members.length === 0 && (
          <div className="text-sm text-violet-500 text-center py-3">
            لا يوجد أعضاء بعد في هذا القسم.
          </div>
        )}
        {dept.members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            departmentColor={dept.color}
            busy={busy}
            onUpdate={(patch) => onUpdateMember(m.id, patch)}
            onRemove={() => onRemoveMember(m.id, m.user.name)}
          />
        ))}

        {/* Add-member form */}
        {availableUsers.length > 0 ? (
          <div className="border-t border-violet-100 dark:border-violet-900/40 pt-3 mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-violet-500 mb-1">اختاري عضوة</label>
              <select
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="input w-full"
              >
                <option value="">— اختاري —</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-violet-500 mb-1">المسمّى (اختياري)</label>
              <input
                value={newRoleAr}
                onChange={(e) => setNewRoleAr(e.target.value)}
                placeholder="مثال: مديرة عامة"
                className="input w-full"
                maxLength={80}
              />
            </div>
            <button
              type="button"
              disabled={busy || !newUserId}
              onClick={() => {
                if (!newUserId) return;
                onAddMember(newUserId, newRoleAr.trim());
                setNewUserId("");
                setNewRoleAr("");
              }}
              className="btn-primary"
            >
              إضافة
            </button>
          </div>
        ) : (
          <div className="border-t border-violet-100 dark:border-violet-900/40 pt-3 mt-3 text-xs text-violet-500 text-center">
            كلّ المستخدمات أُضفن إلى هذا القسم.
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  departmentColor,
  busy,
  onUpdate,
  onRemove,
}: {
  member: Member;
  departmentColor: string;
  busy: boolean;
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [roleAr, setRoleAr] = useState(member.roleAr);
  const firstChar = member.user.name.trim().charAt(0) || "👤";

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-violet-50/60 dark:bg-violet-900/20 rounded-xl">
      <div
        className="w-12 h-12 rounded-xl overflow-hidden grid place-items-center text-white text-xl font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${departmentColor}, ${departmentColor}dd)` }}
      >
        {member.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.user.avatarUrl}
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
        {editingRole ? (
          <div className="flex gap-1 items-center mt-1">
            <input
              value={roleAr}
              onChange={(e) => setRoleAr(e.target.value)}
              placeholder="المسمّى"
              className="input text-sm py-1 flex-1"
              maxLength={80}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onUpdate({ roleAr: roleAr.trim() });
                setEditingRole(false);
              }}
              className="text-xs bg-violet-600 text-white px-2 py-1 rounded-md"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleAr(member.roleAr);
                setEditingRole(false);
              }}
              className="text-xs bg-violet-100 dark:bg-violet-900/40 px-2 py-1 rounded-md"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingRole(true)}
            className="text-sm text-violet-600/90 dark:text-violet-300/80 hover:text-violet-700 dark:hover:text-violet-100 mt-0.5 text-right"
            title="انقري للتعديل"
          >
            {member.roleAr || <span className="text-violet-400 italic">+ أضيفي مسمّى</span>}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate({ isVisible: !member.isVisible })}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161235] border border-violet-100 dark:border-violet-900/40"
        >
          {member.isVisible ? "👁️ ظاهر" : "🚫 مخفي"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-200"
        >
          إزالة
        </button>
      </div>
    </div>
  );
}
