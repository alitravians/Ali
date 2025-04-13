import React, { useState, useEffect, useCallback } from 'react';
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
    language: 'ar', // Default to Arabic
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadSavedData = () => {
    try {
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
      
      console.log('All saved data loaded successfully');
    } catch (e) {
      console.error('Error loading saved data:', e);
      setError('Failed to load saved data');
    }
  };

  useEffect(() => {
    console.log('App initializing...');
    
    try {
      const savedSettings = localStorage.getItem('snakeGameSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
        console.log('Settings loaded from localStorage');
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    
    const loadInitialData = async () => {
      try {
        await fetchGameStatus();
        loadSavedData();
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setIsMobileView(isMobile);
        console.log('Device type detected:', isMobile ? 'Mobile' : 'Desktop');
        
        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    const statusInterval = setInterval(() => {
      fetchGameStatus();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);
  
  const fetchGameStatus = useCallback(async () => {
    try {
      console.log('Fetching game status...');
      const response = await fetch('/api/gameStatus');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Game status received:', data);
        setGameStatus(data);
        localStorage.setItem('snakeGameStatus', JSON.stringify(data));
        return data; // Return data for async handling
      } else {
        console.error('Failed to fetch game status:', response.status);
        const fallbackData = fallbackToLocalGameStatus();
        return fallbackData; // Return fallback data
      }
    } catch (error) {
      console.error('Error fetching game status:', error);
      const fallbackData = fallbackToLocalGameStatus();
      return fallbackData; // Return fallback data
    }
  }, []);
  
  const fallbackToLocalGameStatus = () => {
    console.log('Using fallback game status from localStorage');
    const savedStatus = localStorage.getItem('snakeGameStatus');
    if (savedStatus) {
      try {
        const parsedStatus = JSON.parse(savedStatus);
        setGameStatus(parsedStatus);
        return parsedStatus;
      } catch (parseError) {
        console.error('Error parsing saved game status:', parseError);
        return resetGameStatus();
      }
    } else {
      return resetGameStatus();
    }
  };
  
  const resetGameStatus = () => {
    const defaultStatus = {
      isOpen: true,
      closureReason: '',
      lastUpdated: Date.now()
    };
    console.log('Resetting game status to default:', defaultStatus);
    setGameStatus(defaultStatus);
    localStorage.setItem('snakeGameStatus', JSON.stringify(defaultStatus));
    return defaultStatus;
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
      console.log('Updating game status to:', status);
      const response = await fetch('/api/gameStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      });
      
      if (response.ok) {
        const updatedStatus = await response.json();
        console.log('Game status updated successfully:', updatedStatus);
        setGameStatus(updatedStatus);
        localStorage.setItem('snakeGameStatus', JSON.stringify(updatedStatus));
        
        if (isAdminAuthenticated) {
          console.log('Admin authenticated, reloading to apply changes...');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
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
  
  const handleUpdateSaveData = (newSaveData: SaveData) => {
    setSaveData(newSaveData);
    localStorage.setItem('snakeGameSaveData', JSON.stringify(newSaveData));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            {t('loading', settings.language)}...
          </h2>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-4">{t('error', settings.language)}</h2>
          <p>{error}</p>
          <button 
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            {t('reload', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
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
              onUpdateSaveData={handleUpdateSaveData}
            />
          ) : (
            <GameClosureMessage 
              settings={settings}
              closureReason={gameStatus.closureReason}
            />
          )}
          
          {/* Admin access button with added CSS class for visibility */}
          <div className="admin-button" style={{ zIndex: 9999, position: 'fixed', bottom: '1rem', right: '1rem' }}>
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
