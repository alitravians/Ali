'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="page-container bg-[#030711]">
      {/* Background */}
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[120px] bg-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[100px] bg-orb-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.012)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Nav */}
      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="text-lg font-black gradient-text-animated tracking-tight">ChatZone</Link>
          <div className="flex items-center gap-1">
            {[
              { href: '/rules', label: 'القوانين' },
              { href: '/chat-guide', label: 'الدليل' },
              { href: '/instructions', label: 'التعليمات' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-gray-500 hover:text-white text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="page-content max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/[0.06] border border-emerald-500/10 text-emerald-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            مرحباً بك
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">أهلاً وسهلاً بك!</h1>
          <p className="text-gray-500 text-lg">مرحباً بك في منصة ChatZone للدردشة الاحترافية</p>
        </div>

        {/* Welcome card */}
        <div className="content-card p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white mb-3">نحن سعداء بانضمامك!</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg mx-auto">
              ChatZone هي منصة دردشة احترافية مصممة لتوفير تجربة تواصل مميزة وآمنة. نحرص على توفير بيئة محترمة ومنظمة لجميع الأعضاء.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: '💬', title: 'دردشة لحظية', desc: 'تواصل مع الآخرين في الوقت الحقيقي', color: 'violet' },
              { icon: '🏠', title: 'غرف متنوعة', desc: 'انضم لغرف مختلفة حسب اهتماماتك', color: 'indigo' },
              { icon: '🛡️', title: 'بيئة آمنة', desc: 'فريق إشراف متخصص لحمايتك', color: 'emerald' },
            ].map((f, i) => (
              <div key={i} className={`rounded-xl p-5 text-center bg-${f.color}-500/[0.04] border border-${f.color}-500/[0.08] hover:border-${f.color}-500/20 transition-all`}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="content-card p-8 mb-8">
          <div className="section-header">
            <div className="section-icon bg-violet-500/[0.08] border border-violet-500/10">🚀</div>
            <div>
              <h2 className="text-lg font-bold text-white">خطوات البدء</h2>
              <p className="text-gray-500 text-xs">ابدأ استخدام المنصة في 4 خطوات بسيطة</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { num: '1', title: 'أنشئ حسابك', desc: 'سجل حساب جديد باسم مستخدم وبريد إلكتروني', icon: '📝' },
              { num: '2', title: 'اختر غرفة', desc: 'تصفح الغرف المتاحة وانضم للغرفة التي تناسبك', icon: '🏠' },
              { num: '3', title: 'ابدأ الدردشة', desc: 'اكتب رسالتك وتواصل مع الأعضاء الآخرين', icon: '💬' },
              { num: '4', title: 'التزم بالقوانين', desc: 'اقرأ القوانين واحترمها لتجربة أفضل للجميع', icon: '📋' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-4 rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/15">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm">{step.icon} {step.title}</h3>
                  <p className="text-gray-500 text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="content-card p-6 mb-8 border-amber-500/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-400">⚡</span>
            <h2 className="text-sm font-bold text-amber-400">نصائح مهمة</h2>
          </div>
          <div className="space-y-2">
            {[
              'احترم جميع الأعضاء وتعامل بأدب',
              'لا تشارك معلوماتك الشخصية مع الغرباء',
              'بلّغ عن أي سلوك مسيء عبر نظام البلاغات',
              'اقرأ قوانين الدردشة قبل البدء',
              'إذا واجهت أي مشكلة، تواصل مع فريق الإشراف',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-gray-400 text-sm">
                <span className="text-amber-500/60 mt-0.5 text-xs">●</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-10">
          {[
            { href: '/chat-guide', icon: '📖', label: 'دليل الدردشة' },
            { href: '/rules', icon: '📋', label: 'القوانين' },
            { href: '/instructions', icon: '📝', label: 'التعليمات' },
            { href: '/register', icon: '🚀', label: 'ابدأ الآن', highlight: true },
          ].map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className={`rounded-xl p-4 text-center transition-all border ${
                link.highlight
                  ? 'bg-gradient-to-b from-violet-500/[0.08] to-violet-500/[0.02] border-violet-500/15 hover:border-violet-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              <div className="text-xl mb-1.5">{link.icon}</div>
              <span className={`text-xs font-medium ${link.highlight ? 'text-violet-300' : 'text-gray-400'}`}>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
