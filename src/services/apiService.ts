import { GameStatus } from '../game/types';

export const API_POLL_INTERVAL = 5000; // 5 seconds

export const fetchGameStatus = async (): Promise<GameStatus | null> => {
  try {
    const response = await fetch('/api/gameStatus');
    if (response.ok) {
      const data = await response.json();
      return data as GameStatus;
    }
    return null;
  } catch (error) {
    console.error('Error fetching game status:', error);
    return null;
  }
};

export const updateGameStatus = async (
  isOpen: boolean, 
  closureReason: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/gameStatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isOpen,
        closureReason,
        lastUpdated: Date.now()
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating game status:', error);
    return false;
  }
};
