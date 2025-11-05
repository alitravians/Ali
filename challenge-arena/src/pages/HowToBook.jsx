import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, CheckCircle } from 'lucide-react';

function HowToBook({ onNavigate }) {
  const { t } = useLanguage();

  const steps = [
    {
      number: 1,
      title: 'املأ نموذج الطلب',
      description: 'قم بزيارة صفحة "التقدم بطلب تحدي رسمي" وأدخل أسماء الخصمين وتاريخ ووقت التحدي المطلوب'
    },
    {
      number: 2,
      title: 'احصل على كود المراجعة',
      description: 'بعد إرسال الطلب، ستحصل على كود مراجعة فريد. احتفظ بهذا الكود لمتابعة حالة طلبك'
    },
    {
      number: 3,
      title: 'انتظر المراجعة',
      description: 'ستقوم الإدارة بمراجعة طلبك والموافقة عليه أو رفضه. يمكنك التحقق من حالة الطلب باستخدام كود المراجعة'
    },
    {
      number: 4,
      title: 'متابعة التحدي',
      description: 'عند الموافقة على الطلب، سيظهر التحدي في سجل التحديات وصفحة العرض المباشر في الوقت المحدد'
    },
    {
      number: 5,
      title: 'النتيجة النهائية',
      description: 'بعد انتهاء التحدي، ستقوم الإدارة بإعلان النتيجة النهائية والفائز'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all shadow-lg border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-cyan-500 bg-clip-text text-transparent">{t('howToBook')}</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            خطوات حجز التحدي
          </h2>

          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all transform hover:scale-105 border-2 border-white/10 backdrop-blur-sm"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <span className="text-white font-bold text-2xl">{step.number}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle className="text-green-400" size={28} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-500/30">
          <h3 className="text-2xl font-bold text-white mb-6">ملاحظات هامة:</h3>
          <ul className="space-y-3 text-white text-lg">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>يجب تقديم الطلب قبل موعد التحدي بوقت كافٍ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>تأكد من صحة جميع البيانات المدخلة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>احتفظ بكود المراجعة في مكان آمن</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>يمكنك متابعة حالة طلبك في أي وقت</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>النتائج النهائية يتم اعتمادها من قبل الإدارة فقط</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => onNavigate('submit')}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/50 transform hover:scale-105"
          >
            قدم طلب تحدي الآن
          </button>
          <button
            onClick={() => onNavigate('status')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/50 transform hover:scale-105"
          >
            تحقق من حالة طلبك
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToBook;
