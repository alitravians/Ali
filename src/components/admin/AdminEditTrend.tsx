import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KEYS, isAdminAuthenticated, setTrendRequestContent } from '@/utils/localStorage';

export function AdminEditTrend() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useLocalStorage<string>(KEYS.TREND_REQUEST_CONTENT, '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin');
      return;
    }

    try {
      setContent(savedContent);
    } catch (error) {
      console.error('Error loading trend request content:', error);
      setError('حدث خطأ أثناء تحميل المحتوى');
    }
  }, [savedContent, navigate]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('المحتوى لا يمكن أن يكون فارغاً');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const date = new Date().toLocaleString('ar');
      const processedContent = content.replace(/{date}/g, date);
      setSavedContent(processedContent);
      setTrendRequestContent(processedContent);

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving trend request content:', error);
      setError('حدث خطأ أثناء حفظ المحتوى');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">تعديل طريقة طلب الترند</CardTitle>
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
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              className="w-full h-64 p-4 rounded-md border text-right"
              placeholder="أدخل شروط وطريقة طلب الترند هنا..."
              dir="rtl"
              disabled={isSaving}
            />
            <div className="flex gap-4">
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