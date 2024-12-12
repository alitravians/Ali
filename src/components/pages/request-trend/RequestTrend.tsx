import { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { eventBus } from '../../../utils/eventBus';
import { KEYS } from '../../../utils/localStorage';

export function RequestTrend() {
  const [content] = useLocalStorage<string>(KEYS.TREND_REQUEST_CONTENT, '');
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

  useEffect(() => {
    const handleContentUpdate = (newContent: string) => {
      const date = new Date().toLocaleString('ar');
      const processed = newContent.replace(/{date}/g, date);
      setProcessedContent(processed);
    };

    eventBus.on(KEYS.TREND_REQUEST_CONTENT, handleContentUpdate);
    return () => {
      eventBus.off(KEYS.TREND_REQUEST_CONTENT, handleContentUpdate);
    };
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6 text-blue-600 text-center">طريقة طلب الترند</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="prose prose-lg max-w-none text-right">
          {isLoading ? (
            <p className="text-gray-600 mb-4">جاري التحميل...</p>
          ) : processedContent ? (
            <div className="whitespace-pre-wrap">{processedContent}</div>
          ) : (
            <p className="text-gray-600 mb-4">مرحباً بكم في صفحة طلب الترند. اكتشف كيفية تقديم طلب الترند الخاص بك.</p>
          )}
        </div>
      </div>
    </div>
  );
}
