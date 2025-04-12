
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Position = {
  x: number;
  y: number;
};

export type SnakePart = Position;

export type Food = Position & {
  value: number;
};

export type Obstacle = Position & {
  type: string;
};

export type City = {
  id: number;
  name: string;
  nameAr: string;
  theme: string;
  background: string;
  difficultyMultiplier: number;
  unlocked: boolean;
};

export type Level = {
  id: number;
  cityId: number;
  name: string;
  nameAr: string;
  obstacles: Obstacle[];
  requiredScore: number;
  completed: boolean;
  unlocked: boolean;
};

export type GameState = {
  snake: SnakePart[];
  food: Food | null;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  gameOver: boolean;
  paused: boolean;
  currentCity: number;
  currentLevel: number;
  speed: number;
  language?: Language;
  levelCompleted?: boolean;
};

export type Language = 'en' | 'ar';
export type DeviceMode = 'pc' | 'mobile';

export type GameSettings = {
  language: Language;
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  deviceMode: DeviceMode;
};

export type SaveData = {
  cities: City[];
  levels: Level[];
  highScores: Record<number, number>;
  settings: GameSettings;
  lastPlayed: {
    city: number;
    level: number;
  };
  timestamp?: number;
  updates?: Array<{
    content: string;
    date: string;
    id: string;
  }>;
  announcements?: Array<{
    content: string;
    author: string;
    date: string;
    id: string;
    duration: number;
  }>;
  gameStatus?: {
    isOpen: boolean;
    closureReason: string;
  };
};
