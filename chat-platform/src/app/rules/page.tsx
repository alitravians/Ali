'use client';

import Link from 'next/link';
import { useSiteName } from '@/hooks/useSiteName';

export default function RulesPage() {
  const siteName = useSiteName();
  const generalRules = [
    { icon: '🤝', title: 'الاحترام المتبادل', desc: 'يجب احترام جميع الأعضاء والمشرفين. لا يُسمح بالإهانة أو التنمر أو التحرش بأي شكل من الأشكال.', severity: 'critical' },
    { icon: '🚫', title: 'المحتوى المناسب', desc: 'يُمنع نشر أي محتوى غير لائق أو إباحي أو عنيف أو مخالف للآداب العامة.', severity: 'critical' },
    { icon: '📵', title: 'عدم الإزعاج والسبام', desc: 'يُمنع إرسال رسائل متكررة أو إغراق الدردشة برسائل عشوائية أو روابط مزعجة أو تكرار نفس الرسالة.', severity: 'high' },
    { icon: '🔒', title: 'احترام الخصوصية', desc: 'يُمنع نشر أو طلب معلومات شخصية للآخرين مثل الأرقام أو العناوين أو الصور الشخصية بدون إذنهم.', severity: 'critical' },
    { icon: '👮', title: 'الالتزام بتوجيهات الإدارة', desc: 'يجب الالتزام بتعليمات المشرفين والإداريين في جميع الأوقات. عدم الاستجابة قد يؤدي لعقوبات.', severity: 'high' },
    { icon: '📢', title: 'عدم الإعلان', desc: 'يُمنع الإعلان عن مواقع أو خدمات أو قنوات خارجية بدون إذن مسبق من الإدارة.', severity: 'medium' },
    { icon: '💬', title: 'استخدام اللغة المناسبة', desc: 'يُفضل استخدام اللغة العربية أو الإنجليزية. يُمنع استخدام الألفاظ النابية أو الجارحة أو العنصرية.', severity: 'high' },
    { icon: '🏠', title: 'قوانين الغرف الخاصة', desc: 'عند الانضمام لغرفة خاصة يجب الالتزام بقوانينها الخاصة بالإضافة للقوانين العامة للمنصة.', severity: 'medium' },
    { icon: '🚨', title: 'الإبلاغ عن المخالفات', desc: 'في حال رؤية أي مخالفة، يُرجى استخدام زر البلاغ أو التواصل مع أحد المشرفين فوراً.', severity: 'info' },
    { icon: '🚷', title: 'انتحال الشخصية', desc: 'يُمنع انتحال شخصية أي عضو أو مشرف أو إداري أو ادعاء صلاحيات لا تملكها.', severity: 'critical' },
  ];

  const punishmentLevels = [
    { level: 'المستوى 1', action: 'تحذير', desc: 'تنبيه رسمي يسجل في ملفك', color: 'amber', icon: '⚠️' },
    { level: 'المستوى 2', action: 'كتم مؤقت', desc: 'منع من الكتابة لمدة محددة', color: 'orange', icon: '🔇' },
    { level: 'المستوى 3', action: 'حظر مؤقت', desc: 'منع من دخول المنصة لمدة محددة', color: 'red', icon: '⛔' },
    { level: 'المستوى 4', action: 'حظر دائم', desc: 'منع نهائي من دخول المنصة', color: 'red', icon: '🚫' },
  ];

  const severityConfig: Record<string, { label: string; dotColor: string; borderColor: string }> = {
    critical: { label: 'حرج', dotColor: 'bg-red-400', borderColor: 'border-r-red-500/40' },
    high: { label: 'مهم', dotColor: 'bg-orange-400', borderColor: 'border-r-orange-500/40' },
    medium: { label: 'متوسط', dotColor: 'bg-amber-400', borderColor: 'border-r-amber-500/40' },
    info: { label: 'معلومة', dotColor: 'bg-blue-400', borderColor: 'border-r-blue-500/40' },
  };

  return (
    <div className="page-container bg-[#030711]">
      <div className="page-bg">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-violet-600/[0.04] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.012)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="text-lg font-black gradient-text-animated tracking-tight">{siteName}</Link>
          <div className="flex items-center gap-1">
            {[
              { href: '/welcome', label: 'الترحيب' },
              { href: '/chat-guide', label: 'الدليل' },
              { href: '/instructions', label: 'التعليمات' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-gray-500 hover:text-white text-[13px] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="page-content max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/[0.06] border border-red-500/10 text-red-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            مهم للجميع
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">قوانين المنصة</h1>
          <p className="text-gray-500 text-sm">الالتزام بهذه القوانين يضمن تجربة ممتعة وآمنة للجميع</p>
        </div>

        {/* Intro */}
        <div className="content-card p-6 mb-8 text-center">
          <p className="text-gray-400 text-sm leading-relaxed">
            مرحباً بك في <span className="text-violet-400 font-semibold">{siteName}</span>. لضمان بيئة آمنة ومريحة ومحترمة لجميع الأعضاء،
            يرجى قراءة والالتزام بالقوانين التالية. مخالفة هذه القوانين ستؤدي لعقوبات تتدرج حسب شدة المخالفة.
          </p>
        </div>

        {/* Severity legend */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Object.entries(severityConfig).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${val.dotColor}`} />
              {val.label}
            </div>
          ))}
        </div>

        {/* Rules */}
        <div className="space-y-3 mb-12">
          {generalRules.map((rule, i) => (
            <div key={i} className={`content-card p-5 border-r-[3px] ${severityConfig[rule.severity].borderColor}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{rule.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-white/[0.04] text-gray-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="text-white font-bold text-sm">{rule.title}</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.03] text-[10px] text-gray-500">
                      <span className={`w-1 h-1 rounded-full ${severityConfig[rule.severity].dotColor}`} />
                      {severityConfig[rule.severity].label}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed pr-7">{rule.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Punishments */}
        <div className="content-card p-6 mb-8">
          <div className="section-header">
            <div className="section-icon bg-red-500/[0.08] border border-red-500/10">⚖️</div>
            <div>
              <h2 className="text-lg font-bold text-white">مستويات العقوبات</h2>
              <p className="text-gray-500 text-xs">العقوبات تتدرج حسب شدة المخالفة وتكرارها</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {punishmentLevels.map((p, i) => (
              <div key={i} className={`rounded-xl p-4 text-center bg-${p.color}-500/[0.04] border border-${p.color}-500/[0.08]`}>
                <div className="text-2xl mb-2">{p.icon}</div>
                <div className="text-[10px] text-gray-500 mb-0.5">{p.level}</div>
                <h3 className={`text-${p.color}-400 font-bold text-sm mb-1`}>{p.action}</h3>
                <p className="text-gray-500 text-[11px]">{p.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-600 text-[11px] text-center mt-4">
            المخالفات الخطيرة قد تؤدي مباشرة للحظر الدائم. القرار النهائي يعود لفريق الإدارة.
          </p>
        </div>

        {/* Footer note */}
        <div className="content-card p-4 mb-10 text-center">
          <p className="text-gray-500 text-xs">
            ⚡ الإدارة تحتفظ بالحق في تعديل أو إضافة قوانين جديدة في أي وقت.
          </p>
        </div>

        {/* Nav links */}
        <div className="flex items-center justify-center gap-4 text-sm">
          {[
            { href: '/chat-guide', label: 'دليل الدردشة' },
            { href: '/instructions', label: 'التعليمات' },
            { href: '/welcome', label: 'الترحيب' },
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
