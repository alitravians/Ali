import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Megaphone, Check, Trash, Clock } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface Announcement {
  content: string;
  author: string;
  date: string;
  id: string;
  duration?: number;
}

interface AnnouncementsPanelProps {
  settings: GameSettings;
  announcements: Announcement[];
  onUpdateAnnouncements: (announcements: Announcement[]) => void;
}

const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({
  settings,
  announcements,
  onUpdateAnnouncements
}) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [duration, setDuration] = useState(200); // Default 200 seconds
  const [savedMessage, setSavedMessage] = useState('');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  
  const isRtl = isRTL(settings.language);
  
  const handleSaveAnnouncement = () => {
    if (!content || !author) return;
    
    const newAnnouncement = {
      content,
      author,
      date: new Date().toISOString(),
      id: Date.now().toString(),
      duration
    };
    
    const updatedAnnouncements = [newAnnouncement, ...announcements];
    
    onUpdateAnnouncements(updatedAnnouncements);
    
    setContent('');
    setAuthor('');
    setDuration(200);
    setSelectedAnnouncementId(null);
    
    setSavedMessage(t('saveSuccess', settings.language));
    
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  const handleDeleteAnnouncement = () => {
    if (!selectedAnnouncementId) return;
    
    const updatedAnnouncements = announcements.filter(
      announcement => announcement.id !== selectedAnnouncementId
    );
    
    onUpdateAnnouncements(updatedAnnouncements);
    
    setSelectedAnnouncementId(null);
    setContent('');
    setAuthor('');
    setDuration(200);
    
    setSavedMessage(t('updateDeleted', settings.language));
    
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  const handleSelectAnnouncement = (id: string) => {
    const selectedAnnouncement = announcements.find(
      announcement => announcement.id === id
    );
    
    if (selectedAnnouncement) {
      setContent(selectedAnnouncement.content);
      setAuthor(selectedAnnouncement.author);
      setDuration(selectedAnnouncement.duration || 200);
      setSelectedAnnouncementId(id);
    }
  };
  
  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="announcementSelector">{t('selectUpdate', settings.language)}</Label>
          {selectedAnnouncementId && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteAnnouncement}
              className="flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              {t('deleteUpdate', settings.language)}
            </Button>
          )}
        </div>
        
        <Select
          value={selectedAnnouncementId || ''}
          onValueChange={handleSelectAnnouncement}
        >
          <SelectTrigger id="announcementSelector" className="w-full">
            <SelectValue placeholder={t('selectUpdatePlaceholder', settings.language)} />
          </SelectTrigger>
          <SelectContent>
            {announcements.map((announcement) => (
              <SelectItem key={announcement.id} value={announcement.id}>
                {new Date(announcement.date).toLocaleDateString()} - {announcement.content.substring(0, 30)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="announcementContent">{t('announcements', settings.language)}</Label>
        <Textarea
          id="announcementContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('updatesPagePlaceholder', settings.language)}
          rows={4}
          dir={isRtl ? 'rtl' : 'ltr'}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="authorName">{t('author', settings.language) || 'Author'}</Label>
          <Input
            id="authorName"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('authorPlaceholder', settings.language) || 'Enter author name'}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">{t('duration', settings.language) || 'Duration (seconds)'}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 200)}
              min={10}
              max={600}
            />
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 items-center">
        <Button 
          onClick={handleSaveAnnouncement} 
          disabled={!content || !author}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {t('saveUpdate', settings.language)}
        </Button>
        
        {savedMessage && (
          <span className="text-green-600 ml-2 animate-pulse">
            {savedMessage}
          </span>
        )}
      </div>
      
      {announcements.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-2">{t('announcements', settings.language)}</h3>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-blue-600">{announcement.author}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{announcement.content}</p>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{announcement.duration} {t('seconds', settings.language) || 'seconds'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPanel;
