import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { X } from 'lucide-react';
import { GameSettings, SaveData } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import AnnouncementsPanel from './AnnouncementsPanel';
import GameControlPanel from './GameControlPanel';
import UpdatesManager from './UpdatesManager';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  saveData: SaveData;
  onUpdateAnnouncements: (announcements: any[]) => void;
  onUpdateGameStatus: (isOpen: boolean, closureReason: string) => void;
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
  const [activeTab, setActiveTab] = useState('announcements');
  const isRtl = isRTL(settings.language);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-4xl max-h-[90vh] overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>{t('gameControlPanel', settings.language)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            {t('adminDashboardDescription', settings.language) || 'Manage game settings, announcements, and updates'}
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="announcements">
                {t('announcements', settings.language) || 'Announcements'}
              </TabsTrigger>
              <TabsTrigger value="gameControl">
                {t('gameControl', settings.language) || 'Game Control'}
              </TabsTrigger>
              <TabsTrigger value="updates">
                {t('updatesPage', settings.language)}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            <TabsContent value="announcements" className="mt-0">
              <AnnouncementsPanel 
                settings={settings}
                announcements={saveData.announcements || []}
                onUpdateAnnouncements={onUpdateAnnouncements}
              />
            </TabsContent>
            
            <TabsContent value="gameControl" className="mt-0">
              <GameControlPanel 
                settings={settings}
                gameStatus={saveData.gameStatus || { isOpen: true, closureReason: '' }}
                onUpdateGameStatus={onUpdateGameStatus}
              />
            </TabsContent>
            
            <TabsContent value="updates" className="mt-0">
              <UpdatesManager
                settings={settings}
                onUpdateGameUpdates={onUpdateGameUpdates}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminDashboard;
