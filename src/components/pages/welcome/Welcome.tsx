import { useEffect } from 'react';
import { CountdownTimer } from '@/components/countdown/CountdownTimer';
import { Card } from "@/components/ui/card";
import { KEYS } from '@/utils/localStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { eventBus } from '@/utils/eventBus';

interface WelcomeContent {
  title: string;
  description: string;
  requirements: string[];
}

export function Welcome() {
  const [content, setContent] = useLocalStorage<WelcomeContent>(KEYS.WELCOME_CONTENT, {
    title: 'مرحباً بكم في وكالة العاصي',
    description: 'نحن طرف ثالث بين المضيف والشركة لتسليم الراتب حسب التارجت المحقق',
    requirements: [
      'مطلوب 3 ساعات يومياً (30 ساعة شهرياً)',
      'يمكن العمل بشكل منقطع',
      'نوفر الدعم المستمر للمضيفين'
    ]
  });

  useEffect(() => {
    const handleContentUpdate = (newContent: WelcomeContent) => {
      setContent(newContent);
    };

    eventBus.on(KEYS.WELCOME_CONTENT, handleContentUpdate);
    return () => {
      eventBus.off(KEYS.WELCOME_CONTENT, handleContentUpdate);
    };
  }, [setContent]);

  return (
    <div className="container mx-auto p-8">
      <CountdownTimer />

      <div className="mt-8 space-y-8">
        <Card className="p-6">
          <div className="space-y-6 text-right">
            <h1 className="text-4xl font-bold text-blue-600">{content.title}</h1>
            <p className="text-xl text-gray-700">
              {content.description}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6 text-right">
            <h2 className="text-2xl font-bold text-blue-600">متطلبات العمل</h2>
            <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 mr-4">
              {content.requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6 text-right">
            <h2 className="text-2xl font-bold text-blue-600">روابط سريعة</h2>
            <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 mr-4">
              <li>
                <a href="/rules" className="text-blue-500 hover:text-blue-700">
                  قوانين وكالة العاصي
                </a>
              </li>
              <li>
                <a href="/join-moderators" className="text-blue-500 hover:text-blue-700">
                  طريقة الانضمام لفريق المشرفين
                </a>
              </li>
              <li>
                <a href="/request-trend" className="text-blue-500 hover:text-blue-700">
                  طريقة طلب الترند
                </a>
              </li>
              <li>
                <a href="/team" className="text-blue-500 hover:text-blue-700">
                  فريق العمل
                </a>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
