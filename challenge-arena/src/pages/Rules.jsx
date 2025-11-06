import { useLanguage } from '../contexts/LanguageContext';

export default function Rules() {
  const { language } = useLanguage();

  const rulesAr = [
    'يجب على جميع اللاعبين التسجيل قبل المشاركة في أي بطولة',
    'الالتزام بالروح الرياضية واحترام جميع المشاركين',
    'عدم استخدام أي برامج غش أو تلاعب',
    'الالتزام بمواعيد المباريات المحددة',
    'في حالة الغياب بدون عذر، سيتم استبعاد اللاعب',
    'قرارات الحكام نهائية ولا يمكن الطعن فيها',
    'يجب على اللاعبين استخدام أسماء مناسبة ومحترمة',
    'التواصل مع الإدارة في حالة وجود أي مشاكل تقنية'
  ];

  const rulesEn = [
    'All players must register before participating in any tournament',
    'Maintain sportsmanship and respect all participants',
    'Do not use any cheating or manipulation software',
    'Adhere to scheduled match times',
    'In case of absence without excuse, the player will be disqualified',
    'Referee decisions are final and cannot be appealed',
    'Players must use appropriate and respectful names',
    'Contact administration in case of any technical issues'
  ];

  const rules = language === 'ar' ? rulesAr : rulesEn;

  return (
    <section className="container mx-auto px-4 mt-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          {language === 'ar' ? 'قواعد المشاركة' : 'Participation Rules'}
        </h2>
        
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div 
              key={index}
              className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-purple-600 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {rule}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {language === 'ar' 
              ? '💡 للمزيد من المعلومات أو الاستفسارات، يرجى التواصل مع الإدارة عبر صفحة التواصل.'
              : '💡 For more information or inquiries, please contact administration via the contact page.'}
          </p>
        </div>
      </div>
    </section>
  );
}
