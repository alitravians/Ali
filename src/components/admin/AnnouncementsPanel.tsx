import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Trash, Plus } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface AnnouncementsPanelProps {
  settings: GameSettings;
  announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>;
  onUpdateAnnouncements: (announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => void;
}

const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({
  settings,
  announcements,
  onUpdateAnnouncements
}) => {
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDuration, setNewDuration] = useState('200');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isRtl = isRTL(settings.language);
  
  const handleAddAnnouncement = () => {
    if (!newContent.trim() || !newAuthor.trim()) return;
    
    const newAnnouncement = {
      content: newContent.trim(),
      author: newAuthor.trim(),
      date: new Date().toISOString(),
      id: Date.now().toString(),
      duration: parseInt(newDuration) || 200
    };
    
    const updatedAnnouncements = [...announcements, newAnnouncement];
    handleSaveAnnouncements(updatedAnnouncements);
    
    setNewContent('');
    setNewAuthor('');
    setNewDuration('200');
  };
  
  const handleRemoveAnnouncement = (id: string) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    handleSaveAnnouncements(updatedAnnouncements);
  };
  
  const handleSaveAnnouncements = (updatedAnnouncements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      onUpdateAnnouncements(updatedAnnouncements);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving announcements:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('announcementsPanel', settings.language) || 'Announcements Panel'}</CardTitle>
        <CardDescription>
          {t('announcementsPanelDescription', settings.language) || 'Manage announcements that will be displayed to players'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-content">
              {t('announcementContent', settings.language) || 'Announcement Content'}
            </Label>
            <Input
              id="announcement-content"
              placeholder={t('enterAnnouncementContent', settings.language) || 'Enter announcement content'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="announcement-author">
              {t('announcementAuthor', settings.language) || 'Author'}
            </Label>
            <Input
              id="announcement-author"
              placeholder={t('enterAuthorName', settings.language) || 'Enter author name'}
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="announcement-duration">
              {t('announcementDuration', settings.language) || 'Duration (seconds)'}
            </Label>
            <Input
              id="announcement-duration"
              type="number"
              placeholder="200"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              dir="ltr"
            />
          </div>
          
          <Button 
            onClick={handleAddAnnouncement}
            disabled={!newContent.trim() || !newAuthor.trim() || isSaving}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addAnnouncement', settings.language) || 'Add Announcement'}
          </Button>
        </div>
        
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">
            {t('currentAnnouncements', settings.language) || 'Current Announcements'}
          </h3>
          
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('noAnnouncements', settings.language) || 'No announcements yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="p-4 border rounded-md flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{announcement.content}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-primary">{announcement.author}</span> - 
                      {new Date(announcement.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('duration', settings.language) || 'Duration'}: {announcement.duration || 200} {t('seconds', settings.language) || 'seconds'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveAnnouncement(announcement.id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {saveSuccess && (
          <span className="text-sm text-green-600 animate-pulse">
            {t('saveSuccess', settings.language) || 'Changes saved successfully!'}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default AnnouncementsPanel;
