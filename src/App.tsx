import { useState, useEffect } from 'react';
import Game from './components/game/Game';
import LevelSelection from './components/game/LevelSelection';
import GameHeader from './components/game/GameHeader';
import SaveManager from './components/game/SaveManager';
import UpdatesPage from './components/game/UpdatesPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAccessButton from './components/admin/AdminAccessButton';
import GameClosureMessage from './components/game/GameClosureMessage';
import { GameSettings, SaveData } from './game/types';
import { DEFAULT_SETTINGS, GAME_SPEED } from './game/constants';
import { initSoundSystem, playSoundIfEnabled } from './game/soundSystem';
import { 
  initializeSaveData, 
  loadGameProgress, 
  saveGameProgress, 
  unlockNextLevel,
  updateHighScore,
  calculateGameSpeed,
  resetGameProgress
} from './game/levelSystem';
import { t, getDirection } from './game/localization';
import './App.css';

function App() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saveData, setSaveData] = useState<SaveData>(initializeSaveData(DEFAULT_SETTINGS));
  const [currentCity, setCurrentCity] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showUpdatesPage, setShowUpdatesPage] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  useEffect(() => {
    initSoundSystem();
    const loadedData = loadGameProgress(DEFAULT_SETTINGS);
    setSaveData(loadedData);
    setCurrentCity(loadedData.lastPlayed.city);
    setCurrentLevel(loadedData.lastPlayed.level);
  }, []);
  
  useEffect(() => {
    const success = saveGameProgress(saveData);
    if (!success) {
      console.error(t('saveLoadError', settings.language));
    }
  }, [saveData, settings.language]);
  
  const handleLevelComplete = (score: number) => {
    const updatedSaveData = unlockNextLevel(saveData, currentCity, currentLevel, settings);
    
    const levelId = (currentCity - 1) * 10 + currentLevel;
    const updatedSaveDataWithScore = updateHighScore(updatedSaveData, levelId, score);
    
    setSaveData(updatedSaveDataWithScore);
    
    setGameStarted(false);
    setShowLevelSelection(true);
    
    playSoundIfEnabled('levelComplete', settings);
  };
  
  const handleGameOver = (score: number) => {
    const levelId = (currentCity - 1) * 10 + currentLevel;
    const updatedSaveData = updateHighScore(saveData, levelId, score);
    setSaveData(updatedSaveData);
  };
  
  const handleUpdateHighScore = (score: number) => {
    const levelId = (currentCity - 1) * 10 + currentLevel;
    const updatedSaveData = updateHighScore(saveData, levelId, score);
    setSaveData(updatedSaveData);
  };
  
  const startGame = () => {
    setGameStarted(true);
    setShowLevelSelection(false);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleSelectLevel = (cityId: number, levelId: number) => {
    setCurrentCity(cityId);
    setCurrentLevel(levelId);
    setGameStarted(true);
    setShowLevelSelection(false);
    
    setSaveData({
      ...saveData,
      lastPlayed: {
        city: cityId,
        level: levelId
      }
    });
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const toggleLanguage = () => {
    setSettings({
      ...settings,
      language: settings.language === 'en' ? 'ar' : 'en'
    });
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const toggleSound = () => {
    setSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled
    });
    if (!settings.soundEnabled) {
      const audio = new Audio('/sounds/button-click.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Failed to play sound', error);
      });
    }
  };
  
  const toggleDevice = () => {
    setSettings({
      ...settings,
      deviceMode: settings.deviceMode === 'pc' ? 'mobile' : 'pc'
    });
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const currentCityData = saveData.cities.find(city => city.id === currentCity);
  const difficultyMultiplier = currentCityData ? currentCityData.difficultyMultiplier : 1.0;
  
  const baseSpeed = GAME_SPEED[settings.difficulty.toUpperCase() as keyof typeof GAME_SPEED];
  const gameSpeed = calculateGameSpeed(baseSpeed, difficultyMultiplier);
  
  const currentLevelId = (currentCity - 1) * 10 + currentLevel;
  const currentHighScore = saveData.highScores[currentLevelId] || 0;
  
  const handleChangeDifficulty = (difficulty: 'easy' | 'normal' | 'hard') => {
    setSettings({
      ...settings,
      difficulty
    });
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleResetProgress = () => {
    const newSaveData = resetGameProgress(settings);
    setSaveData(newSaveData);
    setCurrentCity(1);
    setCurrentLevel(1);
    setGameStarted(false);
    setShowLevelSelection(false);
    setShowSaveManager(false);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleAdminAccess = () => {
    setShowAdminDashboard(true);
  };
  
  const handleUpdateGameStatus = (isOpen: boolean, closureReason: string) => {
    const updatedSaveData = {
      ...saveData,
      gameStatus: {
        isOpen,
        closureReason
      }
    };
    
    setSaveData(updatedSaveData);
    saveGameProgress(updatedSaveData);
  };
  
  const handleUpdateAnnouncements = (announcements: any[]) => {
    const updatedSaveData = {
      ...saveData,
      announcements
    };
    
    setSaveData(updatedSaveData);
    saveGameProgress(updatedSaveData);
  };
  
  const handleUpdateGameUpdates = (updates: Array<{content: string, date: string, id: string}>) => {
    const updatedSaveData = {
      ...saveData,
      updates
    };
    
    setSaveData(updatedSaveData);
    saveGameProgress(updatedSaveData);
  };

  const language = settings.language;
  const direction = getDirection(language);
  
  return (
    <div className={`container mx-auto px-4 py-8 ${direction}`}>
      <GameHeader 
        settings={settings}
        onToggleSound={toggleSound}
        onToggleLanguage={toggleLanguage}
        onToggleDevice={toggleDevice}
        onChangeDifficulty={handleChangeDifficulty}
        onOpenSaveManager={() => setShowSaveManager(true)}
        onOpenUpdatesPage={() => setShowUpdatesPage(true)}
      />
      
      <div className="absolute top-4 right-4">
        <AdminAccessButton 
          settings={settings}
          onAccessGranted={handleAdminAccess}
        />
      </div>
      
      {!gameStarted && !showLevelSelection ? (
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg mb-4 text-center">
            {t('pressToStart', language)}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={startGame}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {t('startGame', language)}
            </button>
            <button 
              onClick={() => setShowLevelSelection(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('selectLevel', language)}
            </button>
          </div>
        </div>
      ) : showLevelSelection ? (
        <LevelSelection 
          cities={saveData.cities}
          levels={saveData.levels}
          currentCity={currentCity}
          currentLevel={currentLevel}
          language={language}
          highScores={saveData.highScores}
          onSelectLevel={handleSelectLevel}
        />
      ) : (
        <Game 
          cityId={currentCity}
          levelId={currentLevel}
          settings={settings}
          highScore={currentHighScore}
          gameSpeed={gameSpeed}
          onLevelComplete={handleLevelComplete}
          onGameOver={handleGameOver}
          onUpdateHighScore={handleUpdateHighScore}
        />
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          {t('copyright', language)}
        </p>
      </div>
      
      {showSaveManager && (
        <SaveManager 
          saveData={saveData}
          onResetProgress={handleResetProgress}
          onClose={() => setShowSaveManager(false)}
          language={language}
        />
      )}
      
      {showUpdatesPage && (
        <UpdatesPage
          language={language}
          onClose={() => setShowUpdatesPage(false)}
        />
      )}
      
      {showAdminDashboard && (
        <AdminDashboard
          isOpen={showAdminDashboard}
          onClose={() => setShowAdminDashboard(false)}
          settings={settings}
          saveData={saveData}
          onUpdateAnnouncements={handleUpdateAnnouncements}
          onUpdateGameStatus={handleUpdateGameStatus}
          onUpdateGameUpdates={handleUpdateGameUpdates}
        />
      )}
      
      {saveData.gameStatus && !saveData.gameStatus.isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setShowAdminDashboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('adminDashboard', language)}
            </button>
          </div>
          <GameClosureMessage 
            settings={settings}
            closureReason={saveData.gameStatus.closureReason || ''}
          />
        </div>
      )}
    </div>
  );
}

export default App;
