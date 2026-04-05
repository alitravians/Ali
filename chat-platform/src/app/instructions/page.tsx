'use client';

import Link from 'next/link';

export default function InstructionsPage() {
  const instructions = [
    {
      icon: '📝',
      title: 'إنشاء حساب',
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
      steps: [
        'اضغط على "تسجيل الدخول" من الصفحة الرئيسية',
        'أدخل البريد الإلكتروني وكلمة المرور',
        'اضغط "تسجيل الدخول" للوصول إلى الدردشة',
      ],
    },
    {
      icon: '💬',
      title: 'استخدام الدردشة',
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
      steps: [
        'ستصلك إشعارات عند صدور تحذيرات أو عقوبات',
        'يمكنك الوصول للإشعارات من صفحة الإشعارات',
        'اضغط "تحديد الكل كمقروء" لمسح جميع الإشعارات',
      ],
    },
    {
      icon: '👤',
      title: 'الملف الشخصي',
      steps: [
        'اضغط على اسمك في أعلى الصفحة للوصول لملفك الشخصي',
        'يعرض الملف الشخصي اسمك وبريدك ورتبتك',
        'رتبتك تحدد صلاحياتك في المنصة',
      ],
    },
    {
      icon: '⚠️',
      title: 'التبليغ عن مخالفة',
      steps: [
        'اضغط على زر التبليغ بجانب الرسالة المخالفة',
        'اختر سبب التبليغ واكتب تفاصيل إضافية',
        'سيتم إرسال البلاغ لفريق الإشراف للمراجعة',
        'ستصلك إشعار عند معالجة بلاغك',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="text-3xl font-bold gradient-text">ChatZone</Link>
          <h1 className="text-2xl font-bold text-white mt-4">تعليمات الاستخدام</h1>
          <p className="text-gray-400 mt-2">دليلك الشامل لاستخدام منصة ChatZone</p>
        </div>

        <div className="space-y-6">
          {instructions.map((section, index) => (
            <div key={index} className="glass rounded-2xl p-6 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{section.icon}</span>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>
              <ol className="space-y-3 pr-4">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {stepIndex + 1}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
