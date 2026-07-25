"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  createdAt: string;
  _count: { certificates: number; testResults: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`هل تريد تغيير دور المستخدم إلى ${newRole === "admin" ? "مسؤول" : "مستخدم"}؟`)) return;
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
              <p className="text-sm text-gray-500">{users.length} مستخدم</p>
            </div>
            <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-500">لا يوجد مستخدمين</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">المستخدم</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">البريد</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">الدور</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">النقاط</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">الاختبارات</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">الشهادات</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">التسجيل</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500" dir="ltr">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${user.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {user.role === "admin" ? "مسؤول" : "مستخدم"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-700">{user.points}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{user._count.testResults}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{user._count.certificates}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString("ar")}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleRole(user.id, user.role)} className="btn-secondary text-xs">
                        {user.role === "admin" ? "إزالة الإدارة" : "ترقية لمسؤول"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
