import { 
  GameState, 
  Direction, 
  Position, 
  Food, 
  Obstacle 
} from './types';
import { 
  GRID_SIZE, 
  INITIAL_SNAKE, 
  INITIAL_DIRECTION, 
  GAME_SPEED 
} from './constants';

export const initializeGameState = (
  cityId: number = 1, 
  levelId: number = 1, 
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  obstacles: Obstacle[] = [],
  customSpeed?: number
): GameState => {
  return {
    snake: [...INITIAL_SNAKE],
    food: generateFood(INITIAL_SNAKE, obstacles),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    score: 0,
    gameOver: false,
    paused: false,
    currentCity: cityId,
    currentLevel: levelId,
    speed: customSpeed || GAME_SPEED[difficulty.toUpperCase() as keyof typeof GAME_SPEED]
  };
};

export const generateFood = (snake: Position[], obstacles: Obstacle[]): Food => {
  let position: Position = {
    x: 0,
    y: 0
  };
  let isValidPosition = false;
  
  while (!isValidPosition) {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    const onSnake = snake.some(segment => 
      segment.x === position.x && segment.y === position.y
    );
    
    const onObstacle = obstacles.some(obstacle => 
      obstacle.x === position.x && obstacle.y === position.y
    );
    
    isValidPosition = !onSnake && !onObstacle;
  }
  
  return {
    ...position,
    value: 1 // Basic food value
  };
};

export const isOnSnake = (position: Position, snake: Position[]): boolean => {
  return snake.some(segment => 
    segment.x === position.x && segment.y === position.y
  );
};

export const isOnObstacle = (position: Position, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obstacle => 
    obstacle.x === position.x && obstacle.y === position.y
  );
};

export const isOnFood = (position: Position, food: Food | null): boolean => {
  if (!food) return false;
  return position.x === food.x && position.y === food.y;
};

export const getNextHeadPosition = (head: Position, direction: Direction): Position => {
  switch (direction) {
    case 'UP':
      return { x: head.x, y: (head.y - 1 + GRID_SIZE) % GRID_SIZE };
    case 'DOWN':
      return { x: head.x, y: (head.y + 1) % GRID_SIZE };
    case 'LEFT':
      return { x: (head.x - 1 + GRID_SIZE) % GRID_SIZE, y: head.y };
    case 'RIGHT':
      return { x: (head.x + 1) % GRID_SIZE, y: head.y };
    default:
      return head;
  }
};

export const isValidDirectionChange = (
  currentDirection: Direction, 
  newDirection: Direction
): boolean => {
  if (
    (currentDirection === 'UP' && newDirection === 'DOWN') ||
    (currentDirection === 'DOWN' && newDirection === 'UP') ||
    (currentDirection === 'LEFT' && newDirection === 'RIGHT') ||
    (currentDirection === 'RIGHT' && newDirection === 'LEFT')
  ) {
    return false;
  }
  return true;
};

export const moveSnake = (gameState: GameState, obstacles: Obstacle[]): GameState => {
  if (gameState.gameOver || gameState.paused) {
    return gameState;
  }
  
  const newState = { ...gameState };
  
  if (isValidDirectionChange(newState.direction, newState.nextDirection)) {
    newState.direction = newState.nextDirection;
  }
  
  const head = { ...newState.snake[0] };
  const newHead = getNextHeadPosition(head, newState.direction);
  
  if (isOnSnake(newHead, newState.snake.slice(0, -1))) {
    newState.gameOver = true;
    return newState;
  }
  
  if (isOnObstacle(newHead, obstacles)) {
    newState.gameOver = true;
    return newState;
  }
  
  const eatFood = isOnFood(newHead, newState.food);
  
  const newSnake = [newHead, ...newState.snake];
  
  if (!eatFood) {
    newSnake.pop();
  } else {
    newState.score += newState.food?.value || 1;
    newState.food = generateFood(newSnake, obstacles);
  }
  
  newState.snake = newSnake;
  return newState;
};

export const updateMovingObstacles = (obstacles: Obstacle[]): Obstacle[] => {
  return obstacles.map(obstacle => {
    if (obstacle.type !== 'moving') return obstacle;
    
    const direction = Math.floor(Math.random() * 4);
    let newX = obstacle.x;
    let newY = obstacle.y;
    
    switch (direction) {
      case 0: // Up
        newY = (newY - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 1: // Down
        newY = (newY + 1) % GRID_SIZE;
        break;
      case 2: // Left
        newX = (newX - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 3: // Right
        newX = (newX + 1) % GRID_SIZE;
        break;
    }
    
    return { ...obstacle, x: newX, y: newY };
  });
};

export const isLevelCompleted = (score: number, requiredScore: number): boolean => {
  return score >= requiredScore;
};

export const resetGameForLevel = (
  cityId: number,
  levelId: number,
  difficulty: 'easy' | 'normal' | 'hard',
  obstacles: Obstacle[],
  customSpeed?: number
): GameState => {
  return initializeGameState(cityId, levelId, difficulty, obstacles, customSpeed);
};
