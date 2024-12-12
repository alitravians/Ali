import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KEYS, isAdminAuthenticated } from '@/utils/localStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { eventBus } from '@/utils/eventBus';

interface WelcomeContent {
  title: string;
  description: string;
  requirements: string[];
}

export function AdminEditWelcome() {
  const navigate = useNavigate();
  const [content, setContent] = useState<WelcomeContent>({
    title: '',
    description: '',
    requirements: []
  });
  const [savedContent, setSavedContent] = useLocalStorage<WelcomeContent>(KEYS.WELCOME_CONTENT, {
    title: 'مرحباً بكم في وكالة العاصي',
    description: 'نحن طرف ثالث بين المضيف والشركة لتسليم الراتب حسب التارجت المحقق',
    requirements: [
      'مطلوب 3 ساعات يومياً (30 ساعة شهرياً)',
      'يمكن العمل بشكل منقطع',
      'نوفر الدعم المستمر للمضيفين'
    ]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin');
      return;
    }

    try {
      if (savedContent) {
        setContent(savedContent);
      }
    } catch (error) {
      console.error('Error loading welcome content:', error);
      setError('حدث خطأ أثناء تحميل المحتوى');
    }
  }, [savedContent, navigate]);

  const handleSave = async () => {
    if (!content.title.trim() || !content.description.trim() || content.requirements.length === 0) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      setSavedContent(content);
      eventBus.emit(KEYS.WELCOME_CONTENT, content);

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving welcome content:', error);
      setError('حدث خطأ أثناء حفظ المحتوى');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequirementChange = (index: number, value: string): void => {
    const newRequirements = [...content.requirements];
    newRequirements[index] = value;
    setContent((prev: WelcomeContent) => ({ ...prev, requirements: newRequirements }));
    setError(null);
  };

  const addRequirement = (): void => {
    setContent((prev: WelcomeContent) => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number): void => {
    setContent((prev: WelcomeContent) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i: number) => i !== index)
    }));
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">تعديل صفحة الترحيب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {saveSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                تم حفظ التغييرات بنجاح
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-right mb-2">عنوان الترحيب</label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => setContent((prev: WelcomeContent) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded text-right"
                  placeholder="أدخل عنوان الترحيب..."
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-right mb-2">وصف الوكالة</label>
                <textarea
                  value={content.description}
                  onChange={(e) => setContent((prev: WelcomeContent) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded text-right"
                  placeholder="أدخل وصف الوكالة..."
                  rows={3}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-right mb-2">متطلبات العمل</label>
                {content.requirements.map((req: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                      disabled={content.requirements.length <= 1}
                    >
                      حذف
                    </Button>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded text-right"
                      placeholder="أدخل متطلب..."
                      dir="rtl"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRequirement}
                  className="w-full mt-2"
                >
                  إضافة متطلب جديد
                </Button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1"
                disabled={isSaving}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
