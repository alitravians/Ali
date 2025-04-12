import { GameStatus, SaveData } from '../game/types';

export const API_POLL_INTERVAL = 5000; // 5 seconds
export const SAVE_DATA_KEY = 'snakeGameSaveData';

export const getLocalSaveData = (): SaveData | null => {
  try {
    const savedData = localStorage.getItem(SAVE_DATA_KEY);
    if (savedData) {
      return JSON.parse(savedData) as SaveData;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return null;
};

export const saveLocalData = (data: SaveData): boolean => {
  try {
    localStorage.setItem(SAVE_DATA_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const fetchGameStatus = async (): Promise<GameStatus | null> => {
  try {
    const response = await fetch('/api/gameStatus');
    if (response.ok) {
      const data = await response.json();
      return data as GameStatus;
    }
    
    const savedData = getLocalSaveData();
    if (savedData && savedData.gameStatus) {
      return savedData.gameStatus;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching game status:', error);
    
    const savedData = getLocalSaveData();
    if (savedData && savedData.gameStatus) {
      return savedData.gameStatus;
    }
    
    return null;
  }
};

export const updateGameStatus = async (
  isOpen: boolean, 
  closureReason: string
): Promise<boolean> => {
  const gameStatus = {
    isOpen,
    closureReason,
    lastUpdated: Date.now()
  };
  
  try {
    const response = await fetch('/api/gameStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameStatus),
    });
    
    if (response.ok) {
      const savedData = getLocalSaveData();
      if (savedData) {
        savedData.gameStatus = gameStatus;
        saveLocalData(savedData);
      }
      return true;
    }
    
    return updateLocalGameStatus(isOpen, closureReason);
  } catch (error) {
    console.error('Error updating game status via API:', error);
    
    return updateLocalGameStatus(isOpen, closureReason);
  }
};

const updateLocalGameStatus = (isOpen: boolean, closureReason: string): boolean => {
  try {
    const savedData = getLocalSaveData();
    if (savedData) {
      savedData.gameStatus = {
        isOpen,
        closureReason,
        lastUpdated: Date.now()
      };
      return saveLocalData(savedData);
    }
    
    const newSaveData: Partial<SaveData> = {
      gameStatus: {
        isOpen,
        closureReason,
        lastUpdated: Date.now()
      }
    };
    return saveLocalData(newSaveData as SaveData);
  } catch (error) {
    console.error('Error updating game status in localStorage:', error);
    return false;
  }
};
