import Link from 'next/link';

export default function RulesPage() {
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
    { level: 'المستوى 1', action: 'تحذير', desc: 'تنبيه رسمي يسجل في ملفك', color: 'yellow', icon: '⚠️' },
    { level: 'المستوى 2', action: 'كتم مؤقت', desc: 'منع من الكتابة لمدة محددة', color: 'orange', icon: '🔇' },
    { level: 'المستوى 3', action: 'حظر مؤقت', desc: 'منع من دخول المنصة لمدة محددة', color: 'red', icon: '⛔' },
    { level: 'المستوى 4', action: 'حظر دائم', desc: 'منع نهائي من دخول المنصة', color: 'red', icon: '🚫' },
  ];

  const severityColors: Record<string, string> = {
    critical: 'border-red-500/50',
    high: 'border-orange-500/50',
    medium: 'border-yellow-500/50',
    info: 'border-blue-500/50',
  };

  const severityLabels: Record<string, { text: string; color: string }> = {
    critical: { text: 'حرج', color: 'text-red-400 bg-red-500/10' },
    high: { text: 'مهم', color: 'text-orange-400 bg-orange-500/10' },
    medium: { text: 'متوسط', color: 'text-yellow-400 bg-yellow-500/10' },
    info: { text: 'معلومة', color: 'text-blue-400 bg-blue-500/10' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-bold gradient-text">ChatZone</Link>
          <h1 className="text-2xl font-bold text-white mt-4">📋 قوانين المنصة</h1>
          <p className="text-gray-400 mt-2">الالتزام بهذه القوانين يضمن تجربة ممتعة وآمنة للجميع</p>
        </div>

        {/* Intro */}
        <div className="glass rounded-2xl p-6 border border-indigo-500/20 mb-8 text-center">
          <p className="text-gray-300 leading-relaxed">
            مرحباً بك في <span className="text-indigo-400 font-bold">ChatZone</span>. لضمان بيئة آمنة ومريحة ومحترمة لجميع الأعضاء،
            يرجى قراءة والالتزام بالقوانين التالية. مخالفة هذه القوانين ستؤدي لعقوبات تتدرج حسب شدة المخالفة.
          </p>
        </div>

        {/* Severity Legend */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {Object.entries(severityLabels).map(([key, val]) => (
            <span key={key} className={`${val.color} px-3 py-1 rounded-full text-xs font-semibold`}>
              {val.text}
            </span>
          ))}
        </div>

        {/* Rules */}
        <div className="space-y-4 mb-10">
          {generalRules.map((rule, i) => (
            <div key={i} className={`glass rounded-xl p-5 border-r-4 ${severityColors[rule.severity]} hover:bg-gray-800/30 transition-all`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{rule.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="text-white font-bold">{rule.title}</h3>
                    <span className={`${severityLabels[rule.severity].color} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>
                      {severityLabels[rule.severity].text}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed pr-8">{rule.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Punishment Levels */}
        <div className="glass rounded-2xl p-6 border border-red-500/20 mb-8">
          <h2 className="text-xl font-bold text-red-400 mb-6 text-center flex items-center justify-center gap-2">
            <span>⚖️</span> مستويات العقوبات
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {punishmentLevels.map((p, i) => (
              <div key={i} className={`bg-${p.color}-500/5 border border-${p.color}-500/20 rounded-xl p-4 text-center`}>
                <div className="text-3xl mb-2">{p.icon}</div>
                <div className="text-xs text-gray-500 mb-1">{p.level}</div>
                <h3 className={`text-${p.color}-400 font-bold mb-1`}>{p.action}</h3>
                <p className="text-gray-400 text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs text-center mt-4">
            العقوبات تتدرج حسب شدة المخالفة وتكرارها. المخالفات الخطيرة قد تؤدي مباشرة للحظر الدائم.
          </p>
        </div>

        {/* Admin Rights */}
        <div className="glass rounded-2xl p-6 border border-gray-700/30 mb-8 text-center">
          <p className="text-gray-400 text-sm">
            ⚡ الإدارة تحتفظ بالحق في تعديل أو إضافة قوانين جديدة في أي وقت.
            <br />
            المخالفات المتكررة تؤدي لعقوبات أشد. القرار النهائي يعود لفريق الإدارة.
          </p>
        </div>

        {/* Navigation */}
        <div className="text-center space-x-4 space-x-reverse">
          <Link href="/chat-guide" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            دليل الدردشة
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/instructions" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            التعليمات
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/welcome" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            صفحة الترحيب
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm">
            ← الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
