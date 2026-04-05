import Link from 'next/link';

export default function RulesPage() {
  const rules = [
    { title: 'الاحترام المتبادل', desc: 'يجب احترام جميع الأعضاء والمشرفين. لا يُسمح بالإهانة أو التنمر أو التحرش بأي شكل.' },
    { title: 'المحتوى المناسب', desc: 'يُمنع نشر أي محتوى غير لائق أو إباحي أو عنيف أو مخالف للآداب العامة.' },
    { title: 'عدم الإزعاج', desc: 'يُمنع السبام (إرسال رسائل متكررة) أو إغراق الدردشة برسائل عشوائية أو روابط مزعجة.' },
    { title: 'احترام الخصوصية', desc: 'يُمنع نشر أو طلب معلومات شخصية للآخرين مثل الأرقام أو العناوين أو الصور الشخصية.' },
    { title: 'الالتزام بتوجيهات الإدارة', desc: 'يجب الالتزام بتعليمات المشرفين والإداريين. أي مخالفة قد تؤدي لعقوبات.' },
    { title: 'عدم الإعلان', desc: 'يُمنع الإعلان عن مواقع أو خدمات أو قنوات خارجية بدون إذن مسبق من الإدارة.' },
    { title: 'استخدام اللغة المناسبة', desc: 'يُفضل استخدام اللغة العربية أو الإنجليزية. يُمنع استخدام الألفاظ النابية أو الجارحة.' },
    { title: 'الغرف الخاصة', desc: 'عند الانضمام لغرفة خاصة يجب الالتزام بقوانينها الخاصة بالإضافة للقوانين العامة.' },
    { title: 'الإبلاغ عن المخالفات', desc: 'في حال رؤية أي مخالفة، يُرجى استخدام زر البلاغ أو التواصل مع أحد المشرفين.' },
    { title: 'العقوبات', desc: 'مخالفة القوانين تؤدي لعقوبات تتدرج من التحذير إلى الكتم المؤقت ثم الحظر المؤقت أو الدائم حسب شدة المخالفة.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gradient-text">قوانين المنصة</h1>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← الرئيسية</Link>
        </div>

        <div className="glass rounded-2xl p-8 mb-6">
          <p className="text-gray-300 leading-relaxed mb-6">
            نرحب بك في <span className="text-indigo-400 font-bold">ChatZone</span>. لضمان بيئة آمنة ومريحة للجميع، يرجى الالتزام بالقوانين التالية:
          </p>

          <div className="space-y-4">
            {rules.map((rule, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-4 border-r-4 border-indigo-500/50 hover:border-indigo-500 transition-colors">
                <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {rule.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm">
            الإدارة تحتفظ بالحق في تعديل القوانين في أي وقت. المخالفات المتكررة تؤدي لعقوبات أشد.
          </p>
        </div>
      </div>
    </div>
  );
}
