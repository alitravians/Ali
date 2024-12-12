import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Update } from '@/types/updates';
import { eventBus } from '@/utils/eventBus';

export function Updates() {
  const [updates, setUpdates] = useLocalStorage<Update[]>('updates', []);

  useEffect(() => {
    const handleUpdatesChanged = (newUpdates: Update[]) => {
      setUpdates(newUpdates);
    };

    eventBus.on('updatesChanged', handleUpdatesChanged);
    return () => {
      eventBus.off('updatesChanged', handleUpdatesChanged);
    };
  }, [setUpdates]);

  if (updates.length === 0) {
    return (
      <div className="container mx-auto p-4" dir="rtl">
        <h2 className="text-2xl font-bold mb-4">التحديثات</h2>
        <p className="text-gray-500">لا توجد تحديثات حالياً</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-2xl font-bold mb-4">التحديثات</h2>
      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.id}>
            <CardHeader>
              <CardTitle>{update.title}</CardTitle>
              <CardDescription>{update.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{update.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
