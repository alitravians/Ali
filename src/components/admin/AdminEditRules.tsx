import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { KEYS, isAdminAuthenticated } from '@/utils/localStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { eventBus } from '@/utils/eventBus';

export function AdminEditRules() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useLocalStorage<string | null>(KEYS.RULES_CONTENT, null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin');
      return;
    }

    try {
      const storedContent = savedContent || '';
      setContent(storedContent);
      console.log('Loaded initial content:', storedContent);
    } catch (error) {
      console.error('Error loading rules content:', error);
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

      console.log('Saving new content:', content);
      setSavedContent(content);
      eventBus.emit(KEYS.RULES_CONTENT, content);

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving rules content:', error);
      setError('حدث خطأ أثناء حفظ المحتوى');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">تعديل قوانين وكالة العاصي</CardTitle>
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
              onChange={handleContentChange}
              className="w-full h-64 p-4 rounded-md border text-right"
              placeholder="أدخل القوانين هنا..."
              disabled={isSaving}
              dir="rtl"
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
