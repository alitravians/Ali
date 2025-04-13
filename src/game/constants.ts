import { City, Level, Obstacle, SaveData, GameSettings } from './types';

export const DEFAULT_CITIES: City[] = [
  {
    id: 1,
    name: 'Serpent Valley',
    nameAr: 'وادي الثعبان',
    theme: 'classic',
    background: 'green',
    difficultyMultiplier: 1,
    unlocked: true
  },
  {
    id: 2,
    name: 'Desert Dunes',
    nameAr: 'كثبان الصحراء',
    theme: 'desert',
    background: 'sandybrown',
    difficultyMultiplier: 1.2,
    unlocked: false
  },
  {
    id: 3,
    name: 'Frozen Peaks',
    nameAr: 'القمم المتجمدة',
    theme: 'ice',
    background: 'lightblue',
    difficultyMultiplier: 1.4,
    unlocked: false
  },
  {
    id: 4,
    name: 'Lava Fields',
    nameAr: 'حقول الحمم',
    theme: 'fire',
    background: 'darkred',
    difficultyMultiplier: 1.6,
    unlocked: false
  },
  {
    id: 5,
    name: 'Neon City',
    nameAr: 'مدينة النيون',
    theme: 'cyberpunk',
    background: 'purple',
    difficultyMultiplier: 1.8,
    unlocked: false
  },
  {
    id: 6,
    name: 'Ethereal Void',
    nameAr: 'الفراغ الأثيري',
    theme: 'space',
    background: 'black',
    difficultyMultiplier: 2,
    unlocked: false
  }
];

export const createDefaultLevels = (): Level[] => {
  const levels: Level[] = [];
  
  for (let cityId = 1; cityId <= 6; cityId++) {
    for (let levelNum = 1; levelNum <= 10; levelNum++) {
      const levelId = (cityId - 1) * 10 + levelNum;
      
      const obstacles: Obstacle[] = [];
      
      if (levelNum > 1) {
        for (let i = 0; i < levelNum * 2; i++) {
          obstacles.push({
            x: (i * 2) % 20,
            y: (i * 3) % 20,
            type: 'wall'
          });
        }
      }
      
      levels.push({
        id: levelId,
        cityId,
        name: `Level ${levelNum}`,
        nameAr: `المستوى ${levelNum}`,
        obstacles,
        requiredScore: levelNum * 5 * cityId,
        completed: false,
        unlocked: cityId === 1 ? levelNum === 1 || levelNum <= 3 : false
      });
    }
  }
  
  return levels;
};

export const createDefaultSaveData = (settings: GameSettings): SaveData => {
  return {
    cities: DEFAULT_CITIES,
    levels: createDefaultLevels(),
    highScores: {},
    settings,
    lastPlayed: {
      city: 1,
      level: 1
    },
    timestamp: Date.now()
  };
};
