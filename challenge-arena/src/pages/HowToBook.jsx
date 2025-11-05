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
          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-white">{t('howToBook')}</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            خطوات حجز التحدي
          </h2>

          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{step.number}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle className="text-green-500" size={24} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">ملاحظات هامة:</h3>
          <ul className="space-y-2 text-white">
            <li>• يجب تقديم الطلب قبل موعد التحدي بوقت كافٍ</li>
            <li>• تأكد من صحة جميع البيانات المدخلة</li>
            <li>• احتفظ بكود المراجعة في مكان آمن</li>
            <li>• يمكنك متابعة حالة طلبك في أي وقت</li>
            <li>• النتائج النهائية يتم اعتمادها من قبل الإدارة فقط</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onNavigate('submit')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
          >
            قدم طلب تحدي الآن
          </button>
          <button
            onClick={() => onNavigate('status')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            تحقق من حالة طلبك
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToBook;
