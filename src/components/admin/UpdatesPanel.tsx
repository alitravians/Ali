import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Trash, Plus } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface UpdatesPanelProps {
  settings: GameSettings;
  updates: Array<{content: string, date: string, id: string}>;
  onUpdateUpdates: (updates: Array<{content: string, date: string, id: string}>) => void;
}

const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  settings,
  updates,
  onUpdateUpdates
}) => {
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isRtl = isRTL(settings.language);
  
  const handleAddUpdate = () => {
    if (!newContent.trim()) return;
    
    const newUpdate = {
      content: newContent.trim(),
      date: new Date().toISOString().split('T')[0],
      id: Date.now().toString()
    };
    
    const updatedUpdates = [...updates, newUpdate];
    handleSaveUpdates(updatedUpdates);
    
    setNewContent('');
  };
  
  const handleRemoveUpdate = (id: string) => {
    const updatedUpdates = updates.filter(u => u.id !== id);
    handleSaveUpdates(updatedUpdates);
  };
  
  const handleSaveUpdates = (updatedUpdates: Array<{content: string, date: string, id: string}>) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      onUpdateUpdates(updatedUpdates);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving updates:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('updatesPanel', settings.language) || 'Updates Panel'}</CardTitle>
        <CardDescription>
          {t('updatesPanelDescription', settings.language) || 'Manage game updates that will be displayed on the updates page'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="update-content">
              {t('updateContent', settings.language) || 'Update Content'}
            </Label>
            <Textarea
              id="update-content"
              placeholder={t('enterUpdateContent', settings.language) || 'Enter update content'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </div>
          
          <Button 
            onClick={handleAddUpdate}
            disabled={!newContent.trim() || isSaving}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addUpdate', settings.language) || 'Add Update'}
          </Button>
        </div>
        
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">
            {t('currentUpdates', settings.language) || 'Current Updates'}
          </h3>
          
          {updates.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('noUpdates', settings.language) || 'No updates yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div 
                  key={update.id} 
                  className="p-4 border rounded-md flex justify-between items-start"
                >
                  <div>
                    <p className="whitespace-pre-wrap">{update.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {update.date}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveUpdate(update.id)}
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

export default UpdatesPanel;
