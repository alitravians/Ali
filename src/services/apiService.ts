
const API_ENDPOINT = '/api';
export const API_POLL_INTERVAL = 5000;

export interface GameStatusResponse {
  isOpen: boolean;
  closureReason: string;
  lastUpdated: number;
}

export async function fetchGameStatus(): Promise<GameStatusResponse | null> {
  try {
    const response = await fetch(`${API_ENDPOINT}/gameStatus`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch game status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching game status:', error);
    return null;
  }
}

export async function updateGameStatus(status: {
  isOpen: boolean;
  closureReason: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_ENDPOINT}/gameStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...status,
        lastUpdated: Date.now(),
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating game status:', error);
    return false;
  }
}
