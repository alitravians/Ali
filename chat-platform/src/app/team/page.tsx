import Link from 'next/link';

export default function TeamPage() {
  const teamMembers = [
    { name: 'المالك', role: 'المالك', roleColor: '#FFD700', desc: 'مؤسس ومالك المنصة' },
  ];

  const roles = [
    { name: 'المالك', color: '#FFD700', desc: 'صلاحيات كاملة - إدارة جميع جوانب المنصة', icon: '👑' },
    { name: 'مدير', color: '#FF4444', desc: 'صلاحيات إدارية شاملة - إدارة الغرف والمستخدمين والإعدادات', icon: '🛡️' },
    { name: 'رئيس المشرفين', color: '#FF8800', desc: 'إشراف متقدم - قيادة فريق المشرفين ومراجعة الإجراءات', icon: '⭐' },
    { name: 'مشرف', color: '#00AA00', desc: 'إشراف عام - مراقبة الدردشة وتطبيق العقوبات ومراجعة البلاغات', icon: '🔰' },
    { name: 'مساعد مشرف', color: '#00CCCC', desc: 'مساعدة في الإشراف - حذف الرسائل وإصدار تحذيرات', icon: '💠' },
    { name: 'عضو', color: '#808080', desc: 'عضو عادي - المشاركة في الدردشة والغرف العامة', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gradient-text">فريق العمل</h1>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← الرئيسية</Link>
        </div>

        {/* Team Members */}
        <div className="glass rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">أعضاء الفريق</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-5 text-center hover:bg-gray-800/50 transition-colors">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl font-bold">
                  👑
                </div>
                <h3 className="text-white font-semibold">{member.name}</h3>
                <p className="text-sm mt-1" style={{ color: member.roleColor }}>{member.role}</p>
                <p className="text-gray-500 text-xs mt-1">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">نظام الرتب</h2>
          <div className="space-y-3">
            {roles.map((role, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-4 flex items-center gap-4 border-r-4 transition-colors hover:bg-gray-800/50" style={{ borderColor: role.color }}>
                <div className="text-2xl">{role.icon}</div>
                <div>
                  <h3 className="font-semibold" style={{ color: role.color }}>{role.name}</h3>
                  <p className="text-gray-400 text-sm">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
