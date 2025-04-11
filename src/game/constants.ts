
export const GRID_SIZE = 20; // Size of the game grid (20x20)
export const CELL_SIZE = 20; // Size of each cell in pixels
export const GAME_SPEED = {
  EASY: 200,
  NORMAL: 150,
  HARD: 100
};

export const CITIES: Array<{
  id: number;
  name: string;
  nameAr: string;
  theme: string;
  background: string;
  difficultyMultiplier: number;
}> = [
  {
    id: 1,
    name: 'Kuwait City',
    nameAr: 'مدينة الكويت',
    theme: 'desert',
    background: '#f5d76e',
    difficultyMultiplier: 1.0
  },
  {
    id: 2,
    name: 'Riyadh',
    nameAr: 'الرياض',
    theme: 'modern',
    background: '#d2d7d3',
    difficultyMultiplier: 1.2
  },
  {
    id: 3,
    name: 'Dubai',
    nameAr: 'دبي',
    theme: 'luxury',
    background: '#f9bf3b',
    difficultyMultiplier: 1.4
  },
  {
    id: 4,
    name: 'Cairo',
    nameAr: 'القاهرة',
    theme: 'ancient',
    background: '#e9d460',
    difficultyMultiplier: 1.6
  },
  {
    id: 5,
    name: 'Beirut',
    nameAr: 'بيروت',
    theme: 'coastal',
    background: '#6bb9f0',
    difficultyMultiplier: 1.8
  },
  {
    id: 6,
    name: 'Paris',
    nameAr: 'باريس',
    theme: 'european',
    background: '#bdc3c7',
    difficultyMultiplier: 2.0
  }
];

export const LEVEL_OBSTACLES = [
  [], // Level 1: No obstacles
  [{ x: 5, y: 5, type: 'wall' }, { x: 15, y: 15, type: 'wall' }], // Level 2
  [{ x: 10, y: 5, type: 'wall' }, { x: 10, y: 15, type: 'wall' }], // Level 3
  [{ x: 5, y: 10, type: 'wall' }, { x: 15, y: 10, type: 'wall' }], // Level 4
  [{ x: 5, y: 5, type: 'wall' }, { x: 15, y: 5, type: 'wall' }, { x: 5, y: 15, type: 'wall' }, { x: 15, y: 15, type: 'wall' }], // Level 5
  [{ x: 10, y: 0, type: 'wall' }, { x: 10, y: 19, type: 'wall' }], // Level 6
  [{ x: 0, y: 10, type: 'wall' }, { x: 19, y: 10, type: 'wall' }], // Level 7
  [{ x: 5, y: 5, type: 'moving' }, { x: 15, y: 15, type: 'moving' }], // Level 8
  [{ x: 10, y: 5, type: 'moving' }, { x: 10, y: 15, type: 'moving' }], // Level 9
  [{ x: 5, y: 5, type: 'moving' }, { x: 15, y: 5, type: 'moving' }, { x: 5, y: 15, type: 'moving' }, { x: 15, y: 15, type: 'moving' }] // Level 10
];

export const DEFAULT_SETTINGS = {
  language: 'en' as const,
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal' as const
};

export const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];

export const INITIAL_DIRECTION = 'RIGHT' as const;

export const KEY_MAPPINGS = {
  ARROW_UP: 'UP',
  ARROW_DOWN: 'DOWN',
  ARROW_LEFT: 'LEFT',
  ARROW_RIGHT: 'RIGHT',
  W: 'UP',
  S: 'DOWN',
  A: 'LEFT',
  D: 'RIGHT'
};
