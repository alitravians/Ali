import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { Flag } from 'lucide-react';

interface ReportUserDialogProps {
  userId: number;
  username: string;
}

export function ReportUserDialog({ userId, username }: ReportUserDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          target_id: userId,
          report_type: 'user',
          reason,
          details
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }
      
      setIsOpen(false);
      setReason('');
      setDetails('');
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report User: {username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="explicit_content">Explicit Content</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide additional details about this report..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setReason('');
                setDetails('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!reason}>
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
