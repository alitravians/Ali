'use client';

import Link from 'next/link';

export default function ChatGuidePage() {
  return (
    <div className="page-container bg-[#030711]">
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/[0.04] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-violet-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.012)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="text-lg font-black gradient-text-animated tracking-tight">ChatZone</Link>
          <div className="flex items-center gap-1">
            {[
              { href: '/welcome', label: 'الترحيب' },
              { href: '/rules', label: 'القوانين' },
              { href: '/instructions', label: 'التعليمات' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-gray-500 hover:text-white text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="page-content max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/[0.06] border border-emerald-500/10 text-emerald-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            دليل شامل
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">دليل استخدام الدردشة</h1>
          <p className="text-gray-500 text-sm">تعرف على جميع مميزات الدردشة وكيفية استخدامها</p>
        </div>

        {/* Interface Overview */}
        <div className="content-card p-6 mb-4">
          <div className="section-header">
            <div className="section-icon bg-violet-500/[0.08] border border-violet-500/10">🖥️</div>
            <div>
              <h2 className="text-lg font-bold text-white">واجهة الدردشة</h2>
              <p className="text-gray-500 text-xs">تعرف على أجزاء واجهة الدردشة</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { title: 'الشريط الجانبي', items: ['قائمة الغرف المتاحة', 'عدد الرسائل غير المقروءة', 'التنقل بين الغرف بضغطة واحدة', 'يمكن إخفاؤه على الجوال'] },
              { title: 'منطقة الرسائل', items: ['عرض جميع الرسائل بالترتيب الزمني', 'التمرير لأعلى لتحميل المزيد', 'عرض اسم المرسل ورتبته', 'مؤشر الكتابة للمستخدمين الآخرين'] },
              { title: 'حقل الإدخال', items: ['اكتب رسالتك واضغط Enter', 'أو اضغط زر الإرسال', 'يظهر حالة الكتم إن كنت مكتوماً', 'يدعم الرد على رسالة محددة'] },
            ].map((col, i) => (
              <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-white font-semibold text-sm mb-3">{col.title}</h3>
                <div className="space-y-1.5">
                  {col.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-gray-500 text-xs">
                      <span className="text-violet-400/50 mt-0.5">●</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messaging Features */}
        <div className="content-card p-6 mb-4">
          <div className="section-header">
            <div className="section-icon bg-emerald-500/[0.08] border border-emerald-500/10">💬</div>
            <div>
              <h2 className="text-lg font-bold text-white">مميزات الرسائل</h2>
              <p className="text-gray-500 text-xs">كل ما تحتاج معرفته عن التعامل مع الرسائل</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: '📨', title: 'إرسال الرسائل', desc: 'اكتب رسالتك واضغط Enter أو زر الإرسال. الرسائل تظهر فوراً لجميع المتواجدين في الغرفة.' },
              { icon: '↩️', title: 'الرد على رسالة', desc: 'اضغط على زر الرد بجانب أي رسالة للرد عليها مباشرة. سيظهر اقتباس من الرسالة الأصلية فوق ردك.' },
              { icon: '✏️', title: 'تعديل الرسالة', desc: 'يمكنك تعديل رسائلك الخاصة بالضغط على زر التعديل. ستظهر علامة "معدّلة" بجانب الرسالة.' },
              { icon: '🗑️', title: 'حذف الرسالة', desc: 'يمكنك حذف رسائلك الخاصة. المشرفون والإداريون يمكنهم حذف أي رسالة مخالفة.' },
              { icon: '🚨', title: 'التبليغ عن رسالة', desc: 'إذا رأيت رسالة مخالفة، اضغط زر التبليغ واختر السبب. سيتم إرسال البلاغ لفريق الإشراف.' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all">
                <span className="text-xl flex-shrink-0">{feature.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        <div className="content-card p-6 mb-4">
          <div className="section-header">
            <div className="section-icon bg-indigo-500/[0.08] border border-indigo-500/10">🏠</div>
            <div>
              <h2 className="text-lg font-bold text-white">الغرف</h2>
              <p className="text-gray-500 text-xs">أنواع الغرف وحالاتها</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
              <h3 className="text-white font-semibold text-sm mb-3">أنواع الغرف</h3>
              <div className="space-y-2">
                {[
                  { dot: 'bg-emerald-400', label: 'عامة:', desc: 'متاحة لجميع الأعضاء', color: 'text-emerald-400' },
                  { dot: 'bg-amber-400', label: 'خاصة:', desc: 'تتطلب دعوة أو إذن', color: 'text-amber-400' },
                  { dot: 'bg-blue-400', label: 'إعلانات:', desc: 'للإعلانات الإدارية فقط', color: 'text-blue-400' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                    <span className={`font-semibold ${r.color}`}>{r.label}</span>
                    <span className="text-gray-500 text-xs">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
              <h3 className="text-white font-semibold text-sm mb-3">حالات الغرفة</h3>
              <div className="space-y-2">
                {[
                  { dot: 'bg-emerald-400', label: 'نشطة:', desc: 'يمكن إرسال واستقبال الرسائل', color: 'text-emerald-400' },
                  { dot: 'bg-blue-400', label: 'مجمدة:', desc: 'للقراءة فقط (يحددها المشرف)', color: 'text-blue-400' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                    <span className={`font-semibold ${r.color}`}>{r.label}</span>
                    <span className="text-gray-500 text-xs">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="content-card p-6 mb-4">
          <div className="section-header">
            <div className="section-icon bg-amber-500/[0.08] border border-amber-500/10">⭐</div>
            <div>
              <h2 className="text-lg font-bold text-white">نظام الرتب</h2>
              <p className="text-gray-500 text-xs">لكل عضو رتبة تحدد صلاحياته في المنصة</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: 'المالك', color: '#FFD700', level: 100 },
              { name: 'مدير', color: '#FF4444', level: 90 },
              { name: 'رئيس المشرفين', color: '#FF8800', level: 70 },
              { name: 'مشرف', color: '#00AA00', level: 50 },
              { name: 'مساعد مشرف', color: '#00CCCC', level: 30 },
              { name: 'عضو', color: '#808080', level: 10 },
              { name: 'مكتوم', color: '#666666', level: 5 },
              { name: 'محظور', color: '#333333', level: 0 },
            ].map((role) => (
              <div key={role.name} className="rounded-xl p-3 text-center bg-white/[0.02] border border-white/[0.04]">
                <div className="font-bold text-sm mb-0.5" style={{ color: role.color }}>{role.name}</div>
                <div className="text-gray-600 text-[10px]">المستوى {role.level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Special features */}
        <div className="content-card p-6 mb-4">
          <div className="section-header">
            <div className="section-icon bg-pink-500/[0.08] border border-pink-500/10">✨</div>
            <div>
              <h2 className="text-lg font-bold text-white">مميزات خاصة</h2>
              <p className="text-gray-500 text-xs">مميزات إضافية متاحة للمشرفين والإداريين</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { title: 'الكتابة بالخط العريض (المشرفين والإداريين)', desc: 'يمكن للمشرفين والإداريين كتابة رسائل بخط عريض ومميز عبر وضع رمز $ قبل النص. مثال: $مرحباً بالجميع' },
              { title: 'مؤشر الكتابة', desc: 'عندما يكتب شخص ما في الغرفة، سترى اسمه مع مؤشر "يكتب..." أسفل الرسائل.' },
              { title: 'حالة الاتصال', desc: 'يمكنك رؤية من متصل حالياً ومن غير متصل من خلال مؤشرات الحالة بجانب الأسماء.' },
            ].map((f, i) => (
              <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.03]">
                <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Punishments */}
        <div className="content-card p-6 mb-8">
          <div className="section-header">
            <div className="section-icon bg-red-500/[0.08] border border-red-500/10">⛔</div>
            <div>
              <h2 className="text-lg font-bold text-white">نظام العقوبات</h2>
              <p className="text-gray-500 text-xs">في حال مخالفة القوانين</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { icon: '⚠️', title: 'تحذير', desc: 'تنبيه رسمي يسجل في ملفك. لا يمنعك من الكتابة لكنه ينذرك.', color: 'amber' },
              { icon: '🔇', title: 'كتم مؤقت', desc: 'يمنعك من إرسال الرسائل لمدة محددة. ستظهر لك مدة الكتم المتبقية.', color: 'orange' },
              { icon: '🚫', title: 'حظر', desc: 'يمنعك من دخول المنصة لمدة محددة أو بشكل دائم. ستظهر لك صفحة الحظر مع السبب والمدة.', color: 'red' },
            ].map((p, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl p-3.5 bg-${p.color}-500/[0.03] border border-${p.color}-500/[0.06]`}>
                <span className="text-lg">{p.icon}</span>
                <div>
                  <h3 className={`text-${p.color}-400 font-semibold text-sm`}>{p.title}</h3>
                  <p className="text-gray-500 text-xs">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-center gap-4 text-sm">
          {[
            { href: '/rules', label: 'قوانين الدردشة' },
            { href: '/instructions', label: 'التعليمات' },
            { href: '/', label: '← الرئيسية' },
          ].map((l, i) => (
            <span key={l.href} className="flex items-center gap-4">
              {i > 0 && <span className="text-gray-700">·</span>}
              <Link href={l.href} className="text-gray-500 hover:text-white transition-colors">{l.label}</Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
