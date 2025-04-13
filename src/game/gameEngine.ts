import { Direction, Food, GameState, Obstacle, Position, SnakePart } from './types';

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
const INITIAL_SNAKE_LENGTH = 3;
const GRACE_PERIOD = 15; // فترة سماح موحدة لتجنب الاصطدام في بداية اللعبة
const SAFE_MARGIN = 3; // هامش أمان للثعبان
const DEBUG_MODE = true; // وضع التصحيح لطباعة رسائل التصحيح

export const createGameState = (level = 1, city = 1, language: 'en' | 'ar' = 'ar', obstacles: Obstacle[] = []): GameState => {
  const centerX = Math.floor(BOARD_WIDTH / 2);
  const centerY = Math.floor(BOARD_HEIGHT / 2);
  
  const snake: SnakePart[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ 
      x: Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, centerX - i)),
      y: Math.max(SAFE_MARGIN, Math.min(BOARD_HEIGHT - SAFE_MARGIN, centerY))
    });
  }
  
  const hasInitialCollision = snake.some(part => 
    obstacles.some(obstacle => 
      Math.abs(obstacle.x - part.x) < 3 && Math.abs(obstacle.y - part.y) < 3
    )
  );
  
  if (hasInitialCollision) {
    console.log('تم اكتشاف تصادم أولي، تعديل موضع الثعبان');
    const safeY = Math.floor(BOARD_HEIGHT / 3);
    snake.forEach((part, index) => {
      part.x = Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, centerX - index));
      part.y = safeY;
    });
  }
  
  snake.forEach(part => {
    part.x = Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, part.x));
    part.y = Math.max(SAFE_MARGIN, Math.min(BOARD_HEIGHT - SAFE_MARGIN, part.y));
  });
  
  const stillHasCollision = snake.some(part => 
    obstacles.some(obstacle => 
      Math.abs(obstacle.x - part.x) < 2 && Math.abs(obstacle.y - part.y) < 2
    )
  );
  
  if (stillHasCollision) {
    console.log('لا يزال هناك تصادم، نقل الثعبان إلى موقع آمن آخر');
    const safeY = Math.floor(BOARD_HEIGHT / 4);
    snake.forEach((part, index) => {
      part.x = Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, BOARD_WIDTH / 4 - index));
      part.y = safeY;
    });
  }
  
  const food = generateFood(snake, obstacles);
  
  console.log('تهيئة حالة اللعبة مع الثعبان:', snake, 'العوائق:', obstacles);
  
  return {
    snake,
    food,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameOver: false, // تأكيد أن اللعبة لم تنتهي عند البدء
    paused: false,
    currentCity: city,
    currentLevel: level,
    speed: calculateSpeed(level, city),
    language,
    firstTick: true, // تعيين أول حركة لتفعيل فترة السماح
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
  console.log('updateGameState called with gameState:', 
    { 
      snakeLength: gameState.snake.length,
      snakeHead: gameState.snake[0],
      direction: gameState.direction,
      nextDirection: gameState.nextDirection,
      score: gameState.score,
      gameOver: gameState.gameOver,
      paused: gameState.paused,
      moveCount: gameState.moveCount || 0
    }
  );

  if (gameState.gameOver || gameState.paused) {
    console.log('Game is over or paused, not updating state');
    return gameState;
  }
  
  const { snake, food, nextDirection, score, firstTick, moveCount = 0 } = gameState;
  
  let safeSnake: SnakePart[] = [];
  
  if (snake.length > 0) {
    safeSnake = [...snake];
    console.log('استخدام الثعبان الحالي:', safeSnake);
  } else {
    const centerX = Math.floor(BOARD_WIDTH / 2);
    const centerY = Math.floor(BOARD_HEIGHT / 2);
    
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      safeSnake.push({
        x: Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, centerX - i)),
        y: Math.max(SAFE_MARGIN, Math.min(BOARD_HEIGHT - SAFE_MARGIN, centerY))
      });
    }
    
    console.log('إنشاء ثعبان جديد:', safeSnake);
  }
  
  safeSnake.forEach(part => {
    part.x = Math.max(2, Math.min(BOARD_WIDTH - 2, part.x));
    part.y = Math.max(2, Math.min(BOARD_HEIGHT - 2, part.y));
  });
  
  console.log('موقع الثعبان بعد التأكد من الحدود:', JSON.stringify(safeSnake));
  
  const safeFood = food || generateFood(safeSnake, obstacles);
  
  if (firstTick || moveCount < GRACE_PERIOD) {
    console.log('في فترة السماح الأولية:', moveCount);
    
    const fixedSnake: SnakePart[] = [];
    const centerX = Math.floor(BOARD_WIDTH / 2);
    const centerY = Math.floor(BOARD_HEIGHT / 2);
    
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      fixedSnake.push({
        x: Math.max(5, Math.min(BOARD_WIDTH - 5, centerX - i)),
        y: Math.max(5, Math.min(BOARD_HEIGHT - 5, centerY))
      });
    }
    
    console.log('تهيئة اللعبة بثعبان في موقع آمن:', fixedSnake);
    
    return {
      ...gameState,
      firstTick: false,
      moveCount: moveCount + 1,
      snake: fixedSnake,
      food: safeFood,
      gameOver: false,
      direction: 'RIGHT',
      nextDirection: 'RIGHT'
    };
  }
  
  const direction = nextDirection;
  const head = snake[0];
  const newHead = getNextHeadPosition(head, direction);
  
  const inGracePeriod = moveCount < GRACE_PERIOD;
  console.log('Move count:', moveCount, 'In grace period:', inGracePeriod);
  
  let safeHead = {
    x: Math.max(3, Math.min(BOARD_WIDTH - 3, newHead.x)),
    y: Math.max(3, Math.min(BOARD_HEIGHT - 3, newHead.y))
  };
  
  const hasNearbyObstacle = obstacles.some(
    obstacle => Math.abs(obstacle.x - safeHead.x) < 3 && Math.abs(obstacle.y - safeHead.y) < 3
  );
  
  if (hasNearbyObstacle) {
    console.log('تعديل موقع الثعبان لتفادي العوائق القريبة');
    safeHead = {
      x: Math.max(3, Math.min(BOARD_WIDTH - 3, safeHead.x + 3)),
      y: Math.max(3, Math.min(BOARD_HEIGHT - 3, safeHead.y + 3))
    };
  }
  
  if (inGracePeriod) {
    console.log('في فترة السماح - تجاهل التصادمات:', moveCount);
    
    const safeHeadPosition = {
      x: Math.max(2, Math.min(BOARD_WIDTH - 2, safeHead.x)),
      y: Math.max(2, Math.min(BOARD_HEIGHT - 2, safeHead.y))
    };
    
    console.log('موقع رأس الثعبان بعد التعديل:', safeHeadPosition);
    
    const ateFood = isFoodCollision(safeHeadPosition, food);
    let newFood = food;
    let newScore = score;
    
    if (ateFood) {
      newScore += food ? food.value : 1;
      newFood = generateFood([safeHeadPosition, ...snake], obstacles);
      console.log('أكل الطعام! طعام جديد في:', newFood);
      
      return {
        ...gameState,
        snake: [safeHeadPosition, ...snake],
        food: newFood,
        score: newScore,
        direction,
        moveCount: moveCount + 1,
        gameOver: false,
        firstTick: false
      };
    }
    
    return {
      ...gameState,
      snake: [safeHeadPosition, ...snake.slice(0, -1)],
      food: newFood,
      score: newScore,
      direction,
      moveCount: moveCount + 1,
      gameOver: false,
      firstTick: false
    };
  }
  
  if (!inGracePeriod) {
    if (isWallCollision(newHead)) {
      console.log('تصادم مع الحائط:', newHead);
      return { ...gameState, gameOver: true, collisionType: 'wall' };
    }
    
    if (snake.length > INITIAL_SNAKE_LENGTH + 5 && isSelfCollision(newHead, snake)) {
      console.log('تصادم مع الثعبان نفسه:', newHead, snake);
      return { ...gameState, gameOver: true, collisionType: 'self' };
    }
    
    if (isObstacleCollision(newHead, obstacles)) {
      console.log('تصادم مع عائق:', newHead, obstacles);
      return { ...gameState, gameOver: true, collisionType: 'obstacle' };
    }
  }
  
  const headToUse = newHead;
  const newSnake = [headToUse, ...snake];
  
  console.log('Current snake position:', newSnake[0]);
  
  const ateFood = isFoodCollision(headToUse, food);
  let newFood = food;
  let newScore = score;
  
  if (ateFood) {
    newScore += food ? food.value : 1;
    newFood = generateFood(newSnake, obstacles);
    console.log('Food eaten! New food at:', newFood);
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
