'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1120] via-[#0d1526]/20 to-[#0b1120] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-4xl font-bold gradient-text">ChatZone</Link>
          <div className="mt-6 text-6xl">👋</div>
          <h1 className="text-3xl font-bold text-white mt-4">أهلاً وسهلاً بك!</h1>
          <p className="text-gray-400 mt-3 text-lg">مرحباً بك في منصة ChatZone للدردشة الاحترافية</p>
        </div>

        {/* Welcome Message */}
        <div className="glass rounded-2xl p-8 border border-cyan-500/20 mb-8">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 text-center">نحن سعداء بانضمامك!</h2>
          <p className="text-gray-300 leading-relaxed text-center mb-6">
            ChatZone هي منصة دردشة احترافية مصممة لتوفير تجربة تواصل مميزة وآمنة.
            نحرص على توفير بيئة محترمة ومنظمة لجميع الأعضاء.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-cyan-500/10 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-white font-semibold mb-1">دردشة لحظية</h3>
              <p className="text-gray-400 text-xs">تواصل مع الآخرين في الوقت الحقيقي</p>
            </div>
            <div className="bg-teal-500/10 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="text-white font-semibold mb-1">غرف متنوعة</h3>
              <p className="text-gray-400 text-xs">انضم لغرف مختلفة حسب اهتماماتك</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="text-white font-semibold mb-1">بيئة آمنة</h3>
              <p className="text-gray-400 text-xs">فريق إشراف متخصص لحمايتك</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="glass rounded-2xl p-8 border border-gray-700/30 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">خطوات البدء</h2>
          <div className="space-y-4">
            {[
              { num: '1', title: 'أنشئ حسابك', desc: 'سجل حساب جديد باسم مستخدم وبريد إلكتروني', icon: '📝' },
              { num: '2', title: 'اختر غرفة', desc: 'تصفح الغرف المتاحة وانضم للغرفة التي تناسبك', icon: '🏠' },
              { num: '3', title: 'ابدأ الدردشة', desc: 'اكتب رسالتك وتواصل مع الأعضاء الآخرين', icon: '💬' },
              { num: '4', title: 'التزم بالقوانين', desc: 'اقرأ القوانين واحترمها لتجربة أفضل للجميع', icon: '📋' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-4 bg-gray-800/30 rounded-xl p-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{step.icon} {step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="glass rounded-2xl p-6 border border-yellow-500/20 mb-8">
          <h2 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span>⚡</span> نصائح مهمة
          </h2>
          <ul className="space-y-2">
            {[
              'احترم جميع الأعضاء وتعامل بأدب',
              'لا تشارك معلوماتك الشخصية مع الغرباء',
              'بلّغ عن أي سلوك مسيء عبر نظام البلاغات',
              'اقرأ قوانين الدردشة قبل البدء',
              'إذا واجهت أي مشكلة، تواصل مع فريق الإشراف',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-yellow-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link href="/chat-guide" className="glass rounded-xl p-4 text-center hover:border-cyan-500/30 border border-transparent transition-all">
            <div className="text-2xl mb-1">📖</div>
            <span className="text-gray-300 text-sm">دليل الدردشة</span>
          </Link>
          <Link href="/rules" className="glass rounded-xl p-4 text-center hover:border-cyan-500/30 border border-transparent transition-all">
            <div className="text-2xl mb-1">📋</div>
            <span className="text-gray-300 text-sm">القوانين</span>
          </Link>
          <Link href="/instructions" className="glass rounded-xl p-4 text-center hover:border-cyan-500/30 border border-transparent transition-all">
            <div className="text-2xl mb-1">📝</div>
            <span className="text-gray-300 text-sm">التعليمات</span>
          </Link>
          <Link href="/register" className="glass rounded-xl p-4 text-center hover:border-cyan-500/30 border border-transparent transition-all bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
            <div className="text-2xl mb-1">🚀</div>
            <span className="text-indigo-300 text-sm font-semibold">ابدأ الآن</span>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-cyan-400 hover:text-indigo-300 transition-colors">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
