import React, { useState, useEffect } from 'react';
import './App.css';
import { GameSettings, GameStatus, Language, SaveData } from './game/types';
import { t } from './game/localization';
import GameHeader from './components/game/GameHeader';
import Game from './components/game/Game';
import UpdatesPage from './components/game/UpdatesPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAccessButton from './components/admin/AdminAccessButton';
import AdminAccessPage from './components/admin/AdminAccessPage';
import GameClosureMessage from './components/game/GameClosureMessage';
import { playSoundIfEnabled } from './game/soundSystem';

function App() {
  const [settings, setSettings] = useState<GameSettings>({
    language: 'en',
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'normal'
  });
  
  const [showUpdatesPage, setShowUpdatesPage] = useState(false);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    isOpen: true,
    closureReason: ''
  });
  const [isMobileView, setIsMobileView] = useState(false);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{content: string, author: string, date: string, id: string, duration?: number}>>([]);
  const [updates, setUpdates] = useState<Array<{content: string, date: string, id: string}>>([]);
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('snakeGameSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    fetchGameStatus();
    
    const savedData = localStorage.getItem('snakeGameSaveData');
    if (savedData) {
      setSaveData(JSON.parse(savedData));
    }
    
    const savedAnnouncements = localStorage.getItem('snakeGameAnnouncements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    }
    
    const savedUpdates = localStorage.getItem('snakeGameUpdates');
    if (savedUpdates) {
      setUpdates(JSON.parse(savedUpdates));
    }
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobileView(isMobile);
    
    const statusInterval = setInterval(() => {
      fetchGameStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);
  
  const fetchGameStatus = async () => {
    try {
      const response = await fetch('/api/gameStatus');
      if (response.ok) {
        const data = await response.json();
        setGameStatus(data);
        
        localStorage.setItem('snakeGameStatus', JSON.stringify(data));
      } else {
        console.error('Failed to fetch game status');
        
        const savedStatus = localStorage.getItem('snakeGameStatus');
        if (savedStatus) {
          try {
            setGameStatus(JSON.parse(savedStatus));
          } catch (parseError) {
            console.error('Error parsing saved game status:', parseError);
            resetGameStatus();
          }
        } else {
          resetGameStatus();
        }
      }
    } catch (error) {
      console.error('Error fetching game status:', error);
      
      const savedStatus = localStorage.getItem('snakeGameStatus');
      if (savedStatus) {
        try {
          setGameStatus(JSON.parse(savedStatus));
        } catch (parseError) {
          console.error('Error parsing saved game status:', parseError);
          resetGameStatus();
        }
      } else {
        resetGameStatus();
      }
    }
  };
  
  const resetGameStatus = () => {
    const defaultStatus = {
      isOpen: true,
      closureReason: '',
      lastUpdated: Date.now()
    };
    setGameStatus(defaultStatus);
    localStorage.setItem('snakeGameStatus', JSON.stringify(defaultStatus));
    console.log('Game status reset to default values');
  };
  
  const toggleSound = () => {
    const newSettings = {
      ...settings,
      soundEnabled: !settings.soundEnabled
    };
    setSettings(newSettings);
    localStorage.setItem('snakeGameSettings', JSON.stringify(newSettings));
    
    if (newSettings.soundEnabled) {
      playSoundIfEnabled('buttonClick', newSettings);
    }
  };
  
  const toggleLanguage = () => {
    const newLanguage: Language = settings.language === 'en' ? 'ar' : 'en';
    const newSettings = {
      ...settings,
      language: newLanguage
    };
    setSettings(newSettings);
    localStorage.setItem('snakeGameSettings', JSON.stringify(newSettings));
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const toggleDevice = () => {
    setIsMobileView(!isMobileView);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const changeDifficulty = (difficulty: 'easy' | 'normal' | 'hard') => {
    const newSettings = {
      ...settings,
      difficulty
    };
    setSettings(newSettings);
    localStorage.setItem('snakeGameSettings', JSON.stringify(newSettings));
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleOpenUpdatesPage = () => {
    setShowUpdatesPage(true);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleCloseUpdatesPage = () => {
    setShowUpdatesPage(false);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleAdminAccess = () => {
    setShowAdminAccess(true);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleAdminAccessClose = () => {
    setShowAdminAccess(false);
  };
  
  const handleAdminAuthentication = (authenticated: boolean) => {
    setIsAdminAuthenticated(authenticated);
    setShowAdminAccess(false);
  };
  
  const handleUpdateGameStatus = async (status: GameStatus) => {
    try {
      const response = await fetch('/api/gameStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      });
      
      if (response.ok) {
        const updatedStatus = await response.json();
        setGameStatus(updatedStatus);
        localStorage.setItem('snakeGameStatus', JSON.stringify(updatedStatus));
        console.log('Game status updated successfully:', updatedStatus);
      } else {
        console.error('Failed to update game status on server');
        setGameStatus(status);
        localStorage.setItem('snakeGameStatus', JSON.stringify(status));
      }
    } catch (error) {
      console.error('Error updating game status:', error);
      setGameStatus(status);
      localStorage.setItem('snakeGameStatus', JSON.stringify(status));
    }
  };
  
  const handleUpdateAnnouncements = (newAnnouncements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => {
    setAnnouncements(newAnnouncements);
    localStorage.setItem('snakeGameAnnouncements', JSON.stringify(newAnnouncements));
  };
  
  const handleUpdateUpdates = (newUpdates: Array<{content: string, date: string, id: string}>) => {
    setUpdates(newUpdates);
    localStorage.setItem('snakeGameUpdates', JSON.stringify(newUpdates));
  };
  
  return (
    <div className="App">
      {showUpdatesPage ? (
        <UpdatesPage 
          settings={settings}
          updates={updates}
          onClose={handleCloseUpdatesPage}
        />
      ) : isAdminAuthenticated ? (
        <AdminDashboard 
          settings={settings}
          gameStatus={gameStatus}
          onUpdateGameStatus={handleUpdateGameStatus}
          onUpdateAnnouncements={handleUpdateAnnouncements}
          onUpdateUpdates={handleUpdateUpdates}
          announcements={announcements}
          updates={updates}
          onClose={() => setIsAdminAuthenticated(false)}
        />
      ) : (
        <>
          <GameHeader 
            settings={settings}
            onToggleSound={toggleSound}
            onToggleLanguage={toggleLanguage}
            onToggleDevice={toggleDevice}
            onChangeDifficulty={changeDifficulty}
            onOpenUpdatesPage={handleOpenUpdatesPage}
          />
          
          {gameStatus.isOpen ? (
            <Game 
              settings={settings}
              isMobileView={isMobileView}
              saveData={saveData}
              onUpdateSaveData={setSaveData}
            />
          ) : (
            <GameClosureMessage 
              settings={settings}
              closureReason={gameStatus.closureReason}
            />
          )}
          
          <div className="fixed bottom-4 right-4 z-50">
            <AdminAccessButton 
              settings={settings}
              onClick={handleAdminAccess}
            />
          </div>
          
          <AdminAccessPage
            isOpen={showAdminAccess}
            onClose={handleAdminAccessClose}
            onAuthenticate={handleAdminAuthentication}
            settings={settings}
          />
        </>
      )}
    </div>
  );
}

export default App;
