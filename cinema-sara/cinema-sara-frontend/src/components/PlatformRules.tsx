import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Shield, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

interface PlatformRulesProps {
  navigateTo: (screen: Screen) => void
}

export default function PlatformRules({ navigateTo }: PlatformRulesProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigateTo('home')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          رجوع
        </Button>

        <Card dir="rtl">
          <CardHeader>
            <CardTitle className="text-3xl">قوانين المنصة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">نظام الحجز</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• يجب تقديم طلب حجز قبل موعد المشاهدة بوقت كافٍ</li>
                    <li>• سيتم مراجعة جميع الطلبات من قبل الإدارة</li>
                    <li>• عند الموافقة، سيتم إرسال كود دخول خاص بك</li>
                    <li>• الكود صالح لمدة 7 أيام من تاريخ الإصدار</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">المشاهدة الجماعية</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• كل كود يسمح بدخول 5 مستخدمين كحد أقصى</li>
                    <li>• يمكنك دعوة حتى 10 أصدقاء عبر البريد أو ديسكورد أو انستغرام</li>
                    <li>• المشاهدة تبدأ تلقائياً بعد دقيقة واحدة من الدخول</li>
                    <li>• تأكد من دخول جميع الأصدقاء قبل بدء العد التنازلي</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">مواعيد المشاهدة</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• يجب الالتزام بالموعد المحدد في طلب الحجز</li>
                    <li>• الدخول متاح قبل الموعد بـ 15 دقيقة</li>
                    <li>• يبدأ الفيلم تلقائياً بعد دقيقة من دخولك</li>
                    <li>• لا يمكن إيقاف أو إعادة تشغيل الفيلم بعد البدء</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">قواعد السلوك</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• احترم تجربة المشاهدة للآخرين</li>
                    <li>• لا تشارك كود الدخول مع أكثر من 5 أشخاص</li>
                    <li>• ممنوع تسجيل أو نسخ المحتوى</li>
                    <li>• أي انتهاك للقواعد قد يؤدي إلى حظر دائم</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">جودة المشاهدة</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• جميع الأفلام متوفرة بجودة HD</li>
                    <li>• تأكد من سرعة إنترنت جيدة (5 ميجابت على الأقل)</li>
                    <li>• استخدم متصفح حديث للحصول على أفضل تجربة</li>
                    <li>• في حالة وجود مشاكل تقنية، تواصل مع الدعم</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <p className="text-center text-gray-600">
                بالحجز والمشاهدة، أنت توافق على جميع القوانين والشروط المذكورة أعلاه
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
