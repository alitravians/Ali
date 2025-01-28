import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';

export function ContentModeration() {
  const { user } = useAuth();
  const [selectedContent, setSelectedContent] = useState(null);
  const [moderationNote, setModerationNote] = useState('');

  const handleContentAction = async (action: 'block' | 'unblock') => {
    if (!selectedContent) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/moderation/content/${selectedContent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          action,
          moderationNote
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to moderate content');
      }
      
      setSelectedContent(null);
      setModerationNote('');
    } catch (error) {
      console.error('Error moderating content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Moderation Note</Label>
              <Textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder="Add a note about this moderation action..."
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => handleContentAction('block')}
                disabled={!selectedContent}
              >
                Block Content
              </Button>
              <Button
                variant="outline"
                onClick={() => handleContentAction('unblock')}
                disabled={!selectedContent}
              >
                Unblock Content
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
