import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Share2, Check, Trash } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface Update {
  content: string;
  date: string;
  id: string;
}

interface UpdatesManagerProps {
  settings: GameSettings;
  onUpdateGameUpdates: (updates: Update[]) => void;
}

const UpdatesManager: React.FC<UpdatesManagerProps> = ({
  settings,
  onUpdateGameUpdates
}) => {
  const [updateContent, setUpdateContent] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  
  const isRtl = isRTL(settings.language);
  
  useEffect(() => {
    const savedUpdates = localStorage.getItem('gameUpdates');
    if (savedUpdates) {
      try {
        const parsedUpdates = JSON.parse(savedUpdates);
        setUpdates(parsedUpdates);
        
        if (parsedUpdates.length > 0) {
          setSelectedUpdateId(parsedUpdates[0].id);
        }
      } catch (error) {
        console.error('Failed to parse saved updates', error);
      }
    }
  }, []);
  
  const handleSaveUpdate = () => {
    if (!updateContent) return;
    
    const newUpdate = {
      content: updateContent,
      date: new Date().toISOString().split('T')[0],
      id: Date.now().toString()
    };
    
    const updatedUpdates = [newUpdate, ...updates];
    
    localStorage.setItem('gameUpdates', JSON.stringify(updatedUpdates));
    
    setUpdates(updatedUpdates);
    setSelectedUpdateId(newUpdate.id);
    setUpdateContent('');
    
    onUpdateGameUpdates(updatedUpdates);
    
    setSavedMessage(t('updatesSaved', settings.language));
    
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  const handleDeleteUpdate = () => {
    if (!selectedUpdateId) return;
    
    const updatedUpdates = updates.filter(update => update.id !== selectedUpdateId);
    
    localStorage.setItem('gameUpdates', JSON.stringify(updatedUpdates));
    
    setUpdates(updatedUpdates);
    setSelectedUpdateId(updatedUpdates.length > 0 ? updatedUpdates[0].id : null);
    
    onUpdateGameUpdates(updatedUpdates);
    
    setSavedMessage(t('updateDeleted', settings.language));
    
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  const handleSelectUpdate = (id: string) => {
    setSelectedUpdateId(id);
    
    const selectedUpdate = updates.find(update => update.id === id);
    if (selectedUpdate) {
      setUpdateContent(selectedUpdate.content);
    }
  };
  
  const handleShareUpdate = () => {
    if (!updateContent) return;
    
    const shareText = encodeURIComponent(updateContent);
    const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
    
    window.open(shareUrl, '_blank');
  };
  
  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="updateSelector">{t('selectUpdate', settings.language)}</Label>
          {selectedUpdateId && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteUpdate}
              className="flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              {t('deleteUpdate', settings.language)}
            </Button>
          )}
        </div>
        
        <Select
          value={selectedUpdateId || ''}
          onValueChange={handleSelectUpdate}
        >
          <SelectTrigger id="updateSelector" className="w-full">
            <SelectValue placeholder={t('selectUpdatePlaceholder', settings.language)} />
          </SelectTrigger>
          <SelectContent>
            {updates.map((update) => (
              <SelectItem key={update.id} value={update.id}>
                {update.date} - {update.content.substring(0, 30)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="updateContent">{t('updatesPage', settings.language)}</Label>
        <Textarea
          id="updateContent"
          value={updateContent}
          onChange={(e) => setUpdateContent(e.target.value)}
          placeholder={t('updatesPagePlaceholder', settings.language)}
          rows={6}
          dir={isRtl ? 'rtl' : 'ltr'}
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <Button 
          onClick={handleSaveUpdate} 
          disabled={!updateContent}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {t('saveUpdate', settings.language)}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleShareUpdate}
          disabled={!updateContent}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          {t('shareUpdate', settings.language)}
        </Button>
        
        {savedMessage && (
          <span className="text-green-600 ml-2 animate-pulse">
            {savedMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default UpdatesManager;
