'use client';

import Link from 'next/link';
import { useSiteName } from '@/hooks/useSiteName';

export default function InstructionsPage() {
  const siteName = useSiteName();
  const instructions = [
    {
      icon: '📝',
      title: 'إنشاء حساب',
      color: 'violet',
      steps: [
        'اضغط على "إنشاء حساب جديد" من الصفحة الرئيسية',
        'أدخل اسم المستخدم (3-20 حرف)',
        'أدخل البريد الإلكتروني الصحيح',
        'أدخل كلمة مرور قوية وأكدها',
        'اضغط "إنشاء حساب" وسيتم تسجيل دخولك تلقائياً',
      ],
    },
    {
      icon: '🔑',
      title: 'تسجيل الدخول',
      color: 'indigo',
      steps: [
        'اضغط على "تسجيل الدخول" من الصفحة الرئيسية',
        'أدخل البريد الإلكتروني وكلمة المرور',
        'اضغط "تسجيل الدخول" للوصول إلى الدردشة',
      ],
    },
    {
      icon: '💬',
      title: 'استخدام الدردشة',
      color: 'emerald',
      steps: [
        'بعد تسجيل الدخول ستنتقل تلقائياً لصفحة الدردشة',
        'اختر غرفة من الشريط الجانبي',
        'اكتب رسالتك في حقل الإدخال واضغط Enter أو زر الإرسال',
        'يمكنك الرد على رسالة بالضغط على زر الرد بجانبها',
        'يمكنك تعديل أو حذف رسائلك الخاصة',
      ],
    },
    {
      icon: '🏠',
      title: 'الغرف',
      color: 'blue',
      steps: [
        'الغرف العامة متاحة لجميع الأعضاء',
        'يمكنك التنقل بين الغرف بالضغط على اسم الغرفة',
        'كل غرفة تعرض عدد الرسائل غير المقروءة',
        'بعض الغرف قد تكون مجمدة من قبل الإدارة (للقراءة فقط)',
      ],
    },
    {
      icon: '🔔',
      title: 'الإشعارات',
      color: 'amber',
      steps: [
        'ستصلك إشعارات عند صدور تحذيرات أو عقوبات',
        'يمكنك الوصول للإشعارات من صفحة الإشعارات',
        'اضغط "تحديد الكل كمقروء" لمسح جميع الإشعارات',
      ],
    },
    {
      icon: '👤',
      title: 'الملف الشخصي',
      color: 'pink',
      steps: [
        'اضغط على اسمك في أعلى الصفحة للوصول لملفك الشخصي',
        'يعرض الملف الشخصي اسمك وبريدك ورتبتك',
        'رتبتك تحدد صلاحياتك في المنصة',
      ],
    },
    {
      icon: '⚠️',
      title: 'التبليغ عن مخالفة',
      color: 'red',
      steps: [
        'اضغط على زر التبليغ بجانب الرسالة المخالفة',
        'اختر سبب التبليغ واكتب تفاصيل إضافية',
        'سيتم إرسال البلاغ لفريق الإشراف للمراجعة',
        'ستصلك إشعار عند معالجة بلاغك',
      ],
    },
  ];

  return (
    <div className="page-container bg-[#030711]">
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.012)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="text-lg font-black gradient-text-animated tracking-tight">{siteName}</Link>
          <div className="flex items-center gap-1">
            {[
              { href: '/welcome', label: 'الترحيب' },
              { href: '/rules', label: 'القوانين' },
              { href: '/chat-guide', label: 'الدليل' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-gray-500 hover:text-white text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="page-content max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/[0.06] border border-violet-500/10 text-violet-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            دليل شامل
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">تعليمات الاستخدام</h1>
          <p className="text-gray-500 text-sm">دليلك الشامل لاستخدام منصة {siteName}</p>
        </div>

        <div className="space-y-4">
          {instructions.map((section, index) => (
            <div key={index} className="content-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${section.color}-500/[0.08] border border-${section.color}-500/10 flex items-center justify-center text-xl`}>
                  {section.icon}
                </div>
                <h2 className="text-base font-bold text-white">{section.title}</h2>
              </div>
              <div className="space-y-2.5 pr-2">
                {section.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-5 h-5 bg-${section.color}-500/[0.08] text-${section.color}-400 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5`}>
                      {stepIndex + 1}
                    </span>
                    <span className="text-gray-400 text-sm leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
