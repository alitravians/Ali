import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface Update {
  content: string;
  date: string;
  id: string;
}

interface UpdatesPanelProps {
  settings: GameSettings;
  updates: Update[];
  onUpdateUpdates: (updates: Update[]) => void;
}

const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  settings,
  updates,
  onUpdateUpdates
}) => {
  const [newUpdate, setNewUpdate] = useState('');
  const isRtl = isRTL(settings.language);
  
  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    
    const update: Update = {
      content: newUpdate,
      date: new Date().toISOString().split('T')[0],
      id: Date.now().toString()
    };
    
    onUpdateUpdates([update, ...updates]);
    setNewUpdate('');
  };
  
  const handleDeleteUpdate = (id: string) => {
    onUpdateUpdates(updates.filter(update => update.id !== id));
  };
  
  return (
    <Card className={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('updatesPanel', settings.language) || 'Updates Panel'}</CardTitle>
        <CardDescription>
          {t('updatesPanelDescription', settings.language) || 'Manage game updates and announcements'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Textarea
            placeholder={t('enterNewUpdate', settings.language) || 'Enter new update content...'}
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            rows={4}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <Button onClick={handleAddUpdate} className="mt-2">
            {t('addUpdate', settings.language) || 'Add Update'}
          </Button>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t('currentUpdates', settings.language) || 'Current Updates'}
          </h3>
          
          {updates.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t('noUpdates', settings.language) || 'No updates available'}
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">{update.date}</p>
                      <p className="whitespace-pre-wrap">{update.content}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteUpdate(update.id)}
                    >
                      {t('delete', settings.language) || 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdatesPanel;
