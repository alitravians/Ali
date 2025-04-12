import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { GameSettings, SaveData } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import AnnouncementsPanel from './AnnouncementsPanel';
import GameControlPanel from './GameControlPanel';
import UpdatesPanel from './UpdatesPanel';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  saveData: SaveData;
  onUpdateAnnouncements: (announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => void;
  onUpdateGameStatus: (isOpen: boolean, closureReason: string) => Promise<boolean>;
  onUpdateGameUpdates: (updates: Array<{content: string, date: string, id: string}>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  settings,
  saveData,
  onUpdateAnnouncements,
  onUpdateGameStatus,
  onUpdateGameUpdates
}) => {
  const isRtl = isRTL(settings.language);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl ${isRtl ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('adminDashboard', settings.language)}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="gameControl" className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="gameControl">
              {t('gameControl', settings.language)}
            </TabsTrigger>
            <TabsTrigger value="announcements">
              {t('announcements', settings.language) || 'Announcements'}
            </TabsTrigger>
            <TabsTrigger value="updates">
              {t('updatesPage', settings.language)}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gameControl" className="mt-4">
            <GameControlPanel 
              settings={settings}
              gameStatus={saveData.gameStatus || { isOpen: true, closureReason: '' }}
              onUpdateGameStatus={onUpdateGameStatus}
            />
          </TabsContent>
          
          <TabsContent value="announcements" className="mt-4">
            <AnnouncementsPanel 
              settings={settings}
              announcements={saveData.announcements || []}
              onUpdateAnnouncements={onUpdateAnnouncements}
            />
          </TabsContent>
          
          <TabsContent value="updates" className="mt-4">
            <UpdatesPanel 
              settings={settings}
              updates={saveData.updates || []}
              onUpdateUpdates={onUpdateGameUpdates}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDashboard;
