'use client';

import Link from 'next/link';

export default function ChatGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060B18] via-[#0A1128]/20 to-[#060B18] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="text-3xl font-bold gradient-text">ChatZone</Link>
          <h1 className="text-2xl font-bold text-white mt-4">📖 دليل استخدام الدردشة</h1>
          <p className="text-gray-400 mt-2">تعرف على جميع مميزات الدردشة وكيفية استخدامها</p>
        </div>

        {/* Section 1: Interface Overview */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-6">
          <h2 className="text-xl font-bold text-violet-400 mb-4 flex items-center gap-2">
            <span>🖥️</span> واجهة الدردشة
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800/40 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">الشريط الجانبي</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• قائمة الغرف المتاحة</li>
                <li>• عدد الرسائل غير المقروءة</li>
                <li>• التنقل بين الغرف بضغطة واحدة</li>
                <li>• يمكن إخفاؤه على الجوال</li>
              </ul>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">منطقة الرسائل</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• عرض جميع الرسائل بالترتيب الزمني</li>
                <li>• التمرير لأعلى لتحميل المزيد</li>
                <li>• عرض اسم المرسل ورتبته</li>
                <li>• مؤشر الكتابة للمستخدمين الآخرين</li>
              </ul>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">حقل الإدخال</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• اكتب رسالتك واضغط Enter</li>
                <li>• أو اضغط زر الإرسال</li>
                <li>• يظهر حالة الكتم إن كنت مكتوماً</li>
                <li>• يدعم الرد على رسالة محددة</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: Messaging Features */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <span>💬</span> مميزات الرسائل
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4">
              <span className="text-2xl">📨</span>
              <div>
                <h3 className="text-white font-semibold">إرسال الرسائل</h3>
                <p className="text-gray-400 text-sm">اكتب رسالتك واضغط Enter أو زر الإرسال. الرسائل تظهر فوراً لجميع المتواجدين في الغرفة.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4">
              <span className="text-2xl">↩️</span>
              <div>
                <h3 className="text-white font-semibold">الرد على رسالة</h3>
                <p className="text-gray-400 text-sm">اضغط على زر الرد بجانب أي رسالة للرد عليها مباشرة. سيظهر اقتباس من الرسالة الأصلية فوق ردك.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="text-white font-semibold">تعديل الرسالة</h3>
                <p className="text-gray-400 text-sm">يمكنك تعديل رسائلك الخاصة بالضغط على زر التعديل. ستظهر علامة &quot;معدّلة&quot; بجانب الرسالة.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4">
              <span className="text-2xl">🗑️</span>
              <div>
                <h3 className="text-white font-semibold">حذف الرسالة</h3>
                <p className="text-gray-400 text-sm">يمكنك حذف رسائلك الخاصة. المشرفون والإداريون يمكنهم حذف أي رسالة مخالفة.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="text-white font-semibold">التبليغ عن رسالة</h3>
                <p className="text-gray-400 text-sm">إذا رأيت رسالة مخالفة، اضغط زر التبليغ واختر السبب. سيتم إرسال البلاغ لفريق الإشراف.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Rooms */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-6">
          <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <span>🏠</span> الغرف
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">أنواع الغرف</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <strong className="text-green-400">عامة:</strong> متاحة لجميع الأعضاء
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <strong className="text-yellow-400">خاصة:</strong> تتطلب دعوة أو إذن
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <strong className="text-blue-400">إعلانات:</strong> للإعلانات الإدارية فقط
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">حالات الغرفة</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <strong className="text-green-400">نشطة:</strong> يمكن إرسال واستقبال الرسائل
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <strong className="text-blue-400">مجمدة:</strong> للقراءة فقط (يحددها المشرف)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Roles */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <span>⭐</span> نظام الرتب
          </h2>
          <p className="text-gray-400 text-sm mb-4">لكل عضو رتبة تحدد صلاحياته في المنصة. الرتب مرتبة من الأعلى للأقل:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <div key={role.name} className="bg-gray-800/40 rounded-xl p-3 text-center">
                <div className="font-bold text-sm mb-1" style={{ color: role.color }}>{role.name}</div>
                <div className="text-gray-500 text-xs">المستوى {role.level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Bold Messages */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-6">
          <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
            <span>✨</span> مميزات خاصة
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-1">الكتابة بالخط العريض (المشرفين والإداريين)</h3>
              <p className="text-gray-400 text-sm">
                يمكن للمشرفين والإداريين كتابة رسائل بخط عريض ومميز عبر وضع رمز <code className="bg-gray-700 px-1 rounded text-yellow-400">$</code> قبل النص.
                مثال: <code className="bg-gray-700 px-1 rounded text-yellow-400">$مرحباً بالجميع</code>
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-1">مؤشر الكتابة</h3>
              <p className="text-gray-400 text-sm">عندما يكتب شخص ما في الغرفة، سترى اسمه مع مؤشر &quot;يكتب...&quot; أسفل الرسائل.</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-1">حالة الاتصال</h3>
              <p className="text-gray-400 text-sm">يمكنك رؤية من متصل حالياً ومن غير متصل من خلال مؤشرات الحالة بجانب الأسماء.</p>
            </div>
          </div>
        </div>

        {/* Section 6: Punishments */}
        <div className="glass rounded-2xl p-6 border border-red-500/20 mb-8">
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <span>⛔</span> نظام العقوبات
          </h2>
          <p className="text-gray-400 text-sm mb-4">في حال مخالفة القوانين، قد تتعرض لإحدى العقوبات التالية:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/10">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="text-yellow-400 font-semibold text-sm">تحذير</h3>
                <p className="text-gray-400 text-xs">تنبيه رسمي يسجل في ملفك. لا يمنعك من الكتابة لكنه ينذرك.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-orange-500/5 rounded-xl p-3 border border-orange-500/10">
              <span className="text-xl">🔇</span>
              <div>
                <h3 className="text-orange-400 font-semibold text-sm">كتم مؤقت</h3>
                <p className="text-gray-400 text-xs">يمنعك من إرسال الرسائل لمدة محددة. ستظهر لك مدة الكتم المتبقية.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-500/5 rounded-xl p-3 border border-red-500/10">
              <span className="text-xl">🚫</span>
              <div>
                <h3 className="text-red-400 font-semibold text-sm">حظر</h3>
                <p className="text-gray-400 text-xs">يمنعك من دخول المنصة لمدة محددة أو بشكل دائم. ستظهر لك صفحة الحظر مع السبب والمدة.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-x-4 space-x-reverse">
          <Link href="/rules" className="text-violet-400 hover:text-indigo-300 transition-colors text-sm">
            قوانين الدردشة
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/instructions" className="text-violet-400 hover:text-indigo-300 transition-colors text-sm">
            التعليمات
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="text-violet-400 hover:text-indigo-300 transition-colors text-sm">
            ← الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
