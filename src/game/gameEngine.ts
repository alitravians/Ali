import { Direction, Food, GameState, Obstacle, Position, SnakePart } from './types';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
const INITIAL_SNAKE_LENGTH = 3;
const INITIAL_GRACE_PERIOD = 5; // عدد الحركات الأولية التي لا يتم فيها فحص التصادم

export const createGameState = (level = 1, city = 1, language: 'en' | 'ar' = 'ar', obstacles: Obstacle[] = []): GameState => {
  const centerX = Math.floor(BOARD_WIDTH / 2);
  const centerY = Math.floor(BOARD_HEIGHT / 2);
  
  const snake: SnakePart[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: centerX - i, y: centerY });
  }
  
  const hasInitialCollision = snake.some(part => 
    obstacles.some(obstacle => obstacle.x === part.x && obstacle.y === part.y)
  );
  
  if (hasInitialCollision) {
    console.log('تم اكتشاف تصادم أولي، تعديل موضع الثعبان');
    snake.forEach(part => {
      part.y = Math.max(1, part.y - 1);
    });
  }
  
  snake.forEach(part => {
    part.x = Math.max(2, Math.min(BOARD_WIDTH - 3, part.x));
    part.y = Math.max(2, Math.min(BOARD_HEIGHT - 3, part.y));
  });
  
  const food = generateFood(snake, obstacles);
  
  console.log('تهيئة حالة اللعبة مع الثعبان:', snake, 'العوائق:', obstacles);
  
  return {
    snake,
    food,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameOver: false,
    paused: false,
    currentCity: city,
    currentLevel: level,
    speed: calculateSpeed(level, city),
    language,
    firstTick: true,
    moveCount: 0 // عداد للحركات لتتبع فترة السماح الأولية
  };
};

export const generateFood = (snake: SnakePart[], obstacles: Obstacle[]): Food => {
  let position: Position;
  let attempts = 0;
  const maxAttempts = 100; // تجنب الحلقة اللانهائية
  
  do {
    position = {
      x: Math.floor(Math.random() * (BOARD_WIDTH - 2)) + 1, // تجنب وضع الطعام على الحواف
      y: Math.floor(Math.random() * (BOARD_HEIGHT - 2)) + 1
    };
    attempts++;
    
    if (attempts >= maxAttempts) {
      position = {
        x: Math.floor(BOARD_WIDTH / 2),
        y: Math.floor(BOARD_HEIGHT / 2) + 3
      };
      break;
    }
  } while (
    snake.some(part => part.x === position.x && part.y === position.y) ||
    obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y)
  );
  
  return { ...position, value: 1 };
};

export const calculateSpeed = (level: number, city: number): number => {
  const baseSpeed = 150; // slower speed = higher value (in milliseconds)
  const levelFactor = 5;
  const cityFactor = 0.2;
  
  const levelReduction = (level - 1) * levelFactor;
  const cityReduction = (city - 1) * cityFactor * baseSpeed;
  
  return Math.max(70, baseSpeed - levelReduction - cityReduction); // minimum speed
};

export const isWallCollision = (position: Position): boolean => {
  return (
    position.x < 0 ||
    position.x >= BOARD_WIDTH ||
    position.y < 0 ||
    position.y >= BOARD_HEIGHT
  );
};

export const isSelfCollision = (head: Position, snake: SnakePart[]): boolean => {
  return snake.slice(1).some(part => part.x === head.x && part.y === head.y);
};

export const isObstacleCollision = (head: Position, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
};

export const isFoodCollision = (head: Position, food: Food | null): boolean => {
  if (!food) return false;
  return head.x === food.x && head.y === food.y;
};

export const isLevelCompleted = (score: number, requiredScore: number): boolean => {
  return score >= requiredScore;
};

export const getNextHeadPosition = (head: Position, direction: Direction): Position => {
  switch (direction) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
  }
};

export const updateGameState = (
  gameState: GameState,
  obstacles: Obstacle[],
  requiredScore: number
): GameState => {
  if (gameState.gameOver || gameState.paused) {
    return gameState;
  }
  
  const { snake, food, nextDirection, score, firstTick, moveCount = 0 } = gameState;
  
  if (firstTick) {
    console.log('First tick, skipping collision detection');
    return {
      ...gameState,
      firstTick: false,
      moveCount: 1
    };
  }
  
  const direction = nextDirection;
  const head = snake[0];
  const newHead = getNextHeadPosition(head, direction);
  
  const inGracePeriod = moveCount < INITIAL_GRACE_PERIOD;
  
  const adjustedNewHead = inGracePeriod ? {
    x: Math.max(1, Math.min(BOARD_WIDTH - 2, newHead.x)),
    y: Math.max(1, Math.min(BOARD_HEIGHT - 2, newHead.y))
  } : newHead;
  
  if (!inGracePeriod && isWallCollision(newHead)) {
    console.log('تصادم مع الحائط:', newHead);
    return { ...gameState, gameOver: true, collisionType: 'wall' };
  }
  
  if (!inGracePeriod && snake.length > INITIAL_SNAKE_LENGTH + 2 && isSelfCollision(newHead, snake)) {
    console.log('تصادم مع الثعبان نفسه:', newHead, snake);
    return { ...gameState, gameOver: true, collisionType: 'self' };
  }
  
  if (!inGracePeriod && isObstacleCollision(newHead, obstacles)) {
    console.log('تصادم مع عائق:', newHead, obstacles);
    return { ...gameState, gameOver: true, collisionType: 'obstacle' };
  }
  
  const headToUse = inGracePeriod ? adjustedNewHead : newHead;
  const newSnake = [headToUse, ...snake];
  
  const ateFood = isFoodCollision(headToUse, food);
  let newFood = food;
  let newScore = score;
  
  if (ateFood) {
    newScore += food ? food.value : 1;
    newFood = generateFood(newSnake, obstacles);
  } else {
    newSnake.pop();
  }
  
  const levelCompleted = isLevelCompleted(newScore, requiredScore);
  
  return {
    ...gameState,
    snake: newSnake,
    food: newFood,
    score: newScore,
    direction,
    levelCompleted,
    moveCount: moveCount + 1
  };
};

export const changeDirection = (currentDirection: Direction, newDirection: Direction): Direction => {
  if (
    (currentDirection === 'UP' && newDirection === 'DOWN') ||
    (currentDirection === 'DOWN' && newDirection === 'UP') ||
    (currentDirection === 'LEFT' && newDirection === 'RIGHT') ||
    (currentDirection === 'RIGHT' && newDirection === 'LEFT')
  ) {
    return currentDirection;
  }
  
  return newDirection;
};

export const getBoardSize = (): { width: number; height: number } => {
  return { width: BOARD_WIDTH, height: BOARD_HEIGHT };
};
