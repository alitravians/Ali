import { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { KEYS } from '@/utils/localStorage';

export function JoinModerators() {
  const [content] = useLocalStorage<string>(KEYS.MODERATOR_JOINING_CONTENT, '');
  const [isLoading, setIsLoading] = useState(true);
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    setIsLoading(false);
    if (content) {
      // Process date template if present
      const date = new Date().toLocaleString('ar');
      const processed = content.replace(/{date}/g, date);
      setProcessedContent(processed);
    }
  }, [content]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">طريقة الانضمام لفريق المشرفين</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="prose prose-lg max-w-none text-right">
          {isLoading ? (
            <p className="text-gray-600 mb-4">جاري التحميل...</p>
          ) : processedContent ? (
            <div className="whitespace-pre-wrap">{processedContent}</div>
          ) : (
            <p className="text-gray-600 mb-4">مرحباً بكم في صفحة الانضمام للمشرفين. اكتشف كيفية الانضمام إلى فريقنا.</p>
          )}
        </div>
      </div>
    </div>
  );
}
