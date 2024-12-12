import { useState, useEffect } from 'react';
import { KEYS } from '@/utils/localStorage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { eventBus } from '@/utils/eventBus';

export function Rules() {
  const [content] = useLocalStorage<string | null>(KEYS.RULES_CONTENT, null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<string | null>(content);

  useEffect(() => {
    try {
      // Process date template if present
      const date = new Date().toLocaleString('ar');
      const processed = content ? content.replace(/{date}/g, date) : content;
      setLocalContent(processed);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in Rules component:', error);
      setError('حدث خطأ في تحميل المحتوى');
      setIsLoading(false);
    }
  }, [content]);

  useEffect(() => {
    const handleUpdate = (newValue: string) => {
      console.log('Rules received update:', newValue);
      // Process date template in updates too
      const date = new Date().toLocaleString('ar');
      const processed = newValue.replace(/{date}/g, date);
      setLocalContent(processed);
    };

    eventBus.on(KEYS.RULES_CONTENT, handleUpdate);
    return () => {
      eventBus.off(KEYS.RULES_CONTENT, handleUpdate);
    };
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">قوانين وكالة العاصي</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="prose prose-lg max-w-none text-right">
          {isLoading ? (
            <p className="text-gray-600 mb-4">جاري التحميل...</p>
          ) : error ? (
            <p className="text-red-600 mb-4">{error}</p>
          ) : localContent ? (
            <div className="whitespace-pre-wrap">{localContent}</div>
          ) : (
            <p className="text-gray-600 mb-4">مرحباً بكم في صفحة القوانين. يرجى الاطلاع على القوانين بعناية.</p>
          )}
        </div>
      </div>
    </div>
  );
}
