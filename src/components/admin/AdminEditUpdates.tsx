import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Update } from '@/types/updates';
import { eventBus } from '@/utils/eventBus';

export function AdminEditUpdates() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [updates, setUpdates] = useLocalStorage<Update[]>('updates', []);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage('الرجاء تعبئة جميع الحقول');
      return;
    }

    const newUpdate: Update = {
      id: uuidv4(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleDateString('ar-SA')
    };

    setUpdates([newUpdate, ...updates]);
    eventBus.emit('updatesChanged', [newUpdate, ...updates]);
    setTitle('');
    setContent('');
    setMessage('تم إضافة التحديث بنجاح');
  };

  const handleDelete = (id: string) => {
    const updatedList = updates.filter(update => update.id !== id);
    setUpdates(updatedList);
    eventBus.emit('updatesChanged', updatedList);
    setMessage('تم حذف التحديث بنجاح');
  };

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-4">إدارة التحديثات</h2>

      {message && (
        <div className={`p-4 mb-4 ${message.includes('الرجاء') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} rounded-lg`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">عنوان التحديث</label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="أدخل عنوان التحديث"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">محتوى التحديث</label>
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="أدخل محتوى التحديث"
            className="w-full h-32"
          />
        </div>

        <Button type="submit" className="w-full">
          إضافة تحديث جديد
        </Button>
      </form>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold">التحديثات الحالية</h3>
        {updates.map((update) => (
          <Card key={update.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold">{update.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{update.date}</p>
                  <p className="mt-2">{update.content}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(update.id)}
                  className="absolute top-2 left-2"
                >
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
