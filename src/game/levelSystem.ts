import { City, Level, SaveData, GameSettings } from './types';
import { CITIES, LEVEL_OBSTACLES } from './constants';
import { playSoundIfEnabled } from './soundSystem';

export const initializeCities = (): City[] => {
  return CITIES.map((city, index) => ({
    ...city,
    unlocked: index === 0 // Only the first city is initially unlocked
  }));
};

export const initializeLevels = (): Level[] => {
  const levels: Level[] = [];
  
  CITIES.forEach(city => {
    for (let i = 1; i <= 10; i++) {
      levels.push({
        id: (city.id - 1) * 10 + i,
        cityId: city.id,
        name: `Level ${i}`,
        nameAr: `المستوى ${i}`,
        obstacles: LEVEL_OBSTACLES[(i - 1) % LEVEL_OBSTACLES.length],
        requiredScore: 10 + (i - 1) * 5, // Simple formula for required score
        completed: false,
        unlocked: city.id === 1 && i === 1 // Only the first level of the first city is initially unlocked
      });
    }
  });
  
  return levels;
};

export const initializeSaveData = (settings: GameSettings): SaveData => {
  return {
    cities: initializeCities(),
    levels: initializeLevels(),
    highScores: {},
    settings,
    lastPlayed: {
      city: 1,
      level: 1
    }
  };
};

export const isLevelCompleted = (score: number, requiredScore: number): boolean => {
  return score >= requiredScore;
};

export const unlockNextLevel = (saveData: SaveData, currentCityId: number, currentLevelId: number, settings: GameSettings): SaveData => {
  const updatedSaveData = { ...saveData };
  const currentLevelIndex = updatedSaveData.levels.findIndex(
    level => level.cityId === currentCityId && level.id === (currentCityId - 1) * 10 + currentLevelId
  );
  
  if (currentLevelIndex !== -1) {
    updatedSaveData.levels[currentLevelIndex].completed = true;
    
    const nextLevelId = currentLevelId + 1;
    
    if (nextLevelId <= 10) {
      const nextLevelIndex = updatedSaveData.levels.findIndex(
        level => level.cityId === currentCityId && level.id === (currentCityId - 1) * 10 + nextLevelId
      );
      
      if (nextLevelIndex !== -1) {
        updatedSaveData.levels[nextLevelIndex].unlocked = true;
      }
    } else {
      const nextCityId = currentCityId + 1;
      
      if (nextCityId <= CITIES.length) {
        const allLevelsCompleted = updatedSaveData.levels
          .filter(level => level.cityId === currentCityId)
          .every(level => level.completed);
        
        if (allLevelsCompleted) {
          const nextCityIndex = updatedSaveData.cities.findIndex(city => city.id === nextCityId);
          
          if (nextCityIndex !== -1) {
            updatedSaveData.cities[nextCityIndex].unlocked = true;
            
            const firstLevelOfNextCityIndex = updatedSaveData.levels.findIndex(
              level => level.cityId === nextCityId && level.id === (nextCityId - 1) * 10 + 1
            );
            
            if (firstLevelOfNextCityIndex !== -1) {
              updatedSaveData.levels[firstLevelOfNextCityIndex].unlocked = true;
              
              playSoundIfEnabled('cityUnlock', settings);
            }
          }
        }
      }
    }
  }
  
  return updatedSaveData;
};

export const getAvailableLevelsForCity = (saveData: SaveData, cityId: number): Level[] => {
  return saveData.levels.filter(level => level.cityId === cityId && level.unlocked);
};

export const getUnlockedCities = (saveData: SaveData): City[] => {
  return saveData.cities.filter(city => city.unlocked);
};

export const updateHighScore = (saveData: SaveData, levelId: number, score: number): SaveData => {
  const updatedSaveData = { ...saveData };
  
  if (!updatedSaveData.highScores[levelId] || score > updatedSaveData.highScores[levelId]) {
    updatedSaveData.highScores[levelId] = score;
  }
  
  return updatedSaveData;
};

export const saveGameProgress = (saveData: SaveData): boolean => {
  try {
    const saveDataWithTimestamp = {
      ...saveData,
      timestamp: Date.now()
    };
    
    localStorage.setItem('snakeGameSaveData', JSON.stringify(saveDataWithTimestamp));
    return true;
  } catch (error) {
    console.error('Failed to save game progress:', error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Trying to clear some space...');
      
      try {
        const minimalSaveData = {
          cities: saveData.cities.map(city => ({
            id: city.id,
            unlocked: city.unlocked
          })),
          levels: saveData.levels.map(level => ({
            id: level.id,
            cityId: level.cityId,
            completed: level.completed,
            unlocked: level.unlocked
          })),
          highScores: saveData.highScores,
          settings: saveData.settings,
          lastPlayed: saveData.lastPlayed,
          timestamp: Date.now()
        };
        
        localStorage.setItem('snakeGameSaveData', JSON.stringify(minimalSaveData));
        return true;
      } catch (innerError) {
        console.error('Failed to save minimal game progress:', innerError);
        return false;
      }
    }
    
    return false;
  }
};

export const loadGameProgress = (defaultSettings: GameSettings): SaveData => {
  try {
    const savedData = localStorage.getItem('snakeGameSaveData');
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      if (!parsedData.cities || !parsedData.levels || !parsedData.settings) {
        console.warn('Saved data is missing required properties, initializing new save data');
        return initializeSaveData(defaultSettings);
      }
      
      return parsedData as SaveData;
    }
  } catch (error) {
    console.error('Failed to load game progress:', error);
  }
  
  return initializeSaveData(defaultSettings);
};

export const resetGameProgress = (defaultSettings: GameSettings): SaveData => {
  const newSaveData = initializeSaveData(defaultSettings);
  saveGameProgress(newSaveData);
  return newSaveData;
};

export const hasSaveData = (): boolean => {
  return localStorage.getItem('snakeGameSaveData') !== null;
};

export const calculateGameSpeed = (
  baseSpeed: number, 
  cityDifficultyMultiplier: number
): number => {
  return Math.floor(baseSpeed / cityDifficultyMultiplier);
};
