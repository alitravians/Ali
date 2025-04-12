import { GameStatus, SaveData } from '../game/types';

export const API_POLL_INTERVAL = 5000;

const getLocalSaveData = (): SaveData | null => {
  try {
    const savedData = localStorage.getItem('snakeCitySaveData');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return null;
};

const saveLocalData = (data: SaveData): boolean => {
  try {
    localStorage.setItem('snakeCitySaveData', JSON.stringify(data));
    console.log('Data saved to localStorage successfully');
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const updateLocalGameStatus = (isOpen: boolean, closureReason: string): boolean => {
  try {
    console.log('Updating game status in localStorage (fallback):', isOpen ? 'Open' : 'Closed');
    const savedData = getLocalSaveData();
    if (savedData) {
      savedData.gameStatus = {
        isOpen,
        closureReason,
        lastUpdated: Date.now()
      };
      saveLocalData(savedData);
      console.log('Game status saved to localStorage (fallback) successfully');
      return true;
    }
    console.warn('No saved data found in localStorage for fallback update');
    return false;
  } catch (error) {
    console.error('Error updating local game status:', error);
    return false;
  }
};

export const fetchGameStatus = async (): Promise<GameStatus | null> => {
  try {
    console.log('Fetching game status from server...');
    const response = await fetch('/api/gameStatus');
    if (response.ok) {
      const data = await response.json();
      console.log('Server game status received:', data.isOpen ? 'Open' : 'Closed');
      
      const savedData = getLocalSaveData();
      if (savedData && (
          savedData.gameStatus?.isOpen !== data.isOpen || 
          savedData.gameStatus?.closureReason !== data.closureReason
        )) {
        console.log('Updating localStorage with latest server game status');
        savedData.gameStatus = data;
        saveLocalData(savedData);
      }
      
      return data;
    }
    console.warn('Server returned non-OK response when fetching game status');
    return null;
  } catch (error) {
    console.error('Error fetching game status from server:', error);
    
    console.log('Falling back to localStorage for game status');
    const savedData = getLocalSaveData();
    if (savedData && savedData.gameStatus) {
      console.log('Using localStorage game status:', savedData.gameStatus.isOpen ? 'Open' : 'Closed');
      return savedData.gameStatus;
    }
    
    console.warn('No game status found in localStorage');
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
  
  console.log('Updating game status via API:', isOpen ? 'Open' : 'Closed', 'with reason:', closureReason || 'None');
  
  const savedData = getLocalSaveData();
  if (savedData) {
    savedData.gameStatus = gameStatus;
    saveLocalData(savedData);
    console.log('Game status saved to localStorage immediately');
  }
  
  try {
    console.log('Sending game status update to server...');
    const response = await fetch('/api/gameStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameStatus),
    });
    
    if (response.ok) {
      console.log('Server confirmed game status update');
      
      setTimeout(async () => {
        try {
          console.log('Verifying game status update...');
          const currentStatus = await fetchGameStatus();
          
          if (currentStatus && currentStatus.isOpen === isOpen) {
            console.log('Game status verification successful');
          } else {
            console.warn('Game status verification failed - server status does not match requested status');
            updateLocalGameStatus(isOpen, closureReason);
          }
        } catch (e) {
          console.error('Error verifying game status update:', e);
        }
      }, 500); // Increased timeout for more reliable verification
      
      return true;
    }
    
    console.warn('Server returned non-OK response when updating game status');
    return true; // Still return true since localStorage was updated
  } catch (error) {
    console.error('Error updating game status via API:', error);
    
    return true; // Still return true since localStorage was updated
  }
};
