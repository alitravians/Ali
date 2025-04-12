import React, { useState } from 'react';
import { GameSettings, GameStatus } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';
import GameControlPanel from './GameControlPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import UpdatesPanel from './UpdatesPanel';

interface AdminDashboardProps {
  settings: GameSettings;
  gameStatus: GameStatus;
  onUpdateGameStatus: (status: GameStatus) => void;
  onUpdateAnnouncements: (announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => void;
  onUpdateUpdates: (updates: Array<{content: string, date: string, id: string}>) => void;
  announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>;
  updates: Array<{content: string, date: string, id: string}>;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  gameStatus,
  onUpdateGameStatus,
  onUpdateAnnouncements,
  onUpdateUpdates,
  announcements,
  updates,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'gameControl' | 'announcements' | 'updates'>('gameControl');
  
  const handleTabChange = (tab: 'gameControl' | 'announcements' | 'updates') => {
    setActiveTab(tab);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  return (
    <div className="admin-dashboard p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t('adminDashboard', settings.language)}
        </h1>
        <button 
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          {t('back', settings.language)}
        </button>
      </div>
      
      <div className="tabs flex border-b mb-6">
        <button
          className={`py-2 px-4 ${activeTab === 'gameControl' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => handleTabChange('gameControl')}
        >
          {t('gameControl', settings.language)}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'announcements' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => handleTabChange('announcements')}
        >
          {t('announcements', settings.language)}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'updates' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
          onClick={() => handleTabChange('updates')}
        >
          {t('updates', settings.language)}
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'gameControl' && (
          <GameControlPanel
            settings={settings}
            gameStatus={gameStatus}
            onUpdateGameStatus={onUpdateGameStatus}
          />
        )}
        
        {activeTab === 'announcements' && (
          <AnnouncementsPanel
            settings={settings}
            announcements={announcements}
            onUpdateAnnouncements={onUpdateAnnouncements}
          />
        )}
        
        {activeTab === 'updates' && (
          <UpdatesPanel
            settings={settings}
            updates={updates}
            onUpdateUpdates={onUpdateUpdates}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
