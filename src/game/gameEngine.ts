/**
 * محرك لعبة الثعبان - Snake Game Engine
 * 
 * هذا الملف يحتوي على جميع الوظائف الأساسية لمحرك لعبة الثعبان
 * بما في ذلك إنشاء حالة اللعبة، وتحديث حالة اللعبة، وكشف التصادمات
 * 
 * This file contains all the core functions for the Snake game engine
 * including creating game state, updating game state, and collision detection
 */

import { Direction, Food, GameState, Obstacle, Position, SnakePart } from './types';
import { playSoundIfEnabled } from './soundSystem';

// ثوابت اللعبة - Game Constants
export const BOARD_WIDTH = 30;
export const BOARD_HEIGHT = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const GRACE_PERIOD = 20; // زيادة فترة السماح - Increased grace period
export const SAFE_MARGIN = 5; // هامش الأمان للثعبان - Safety margin for snake
export const DEBUG_MODE = true; // وضع التصحيح لطباعة رسائل التصحيح - Debug mode for debugging messages
export const CELL_SIZE = 20; // حجم الخلية بالبكسل - Cell size in pixels
export const MOVEMENT_DELAY = 150; // التأخير الافتراضي للحركة (مللي ثانية) - Default movement delay (ms)
export const INITIAL_DIRECTION: Direction = 'RIGHT'; // الاتجاه الأولي للثعبان - Initial snake direction
export const MIN_MOVEMENT_INTERVAL = 80; // الحد الأدنى للفاصل الزمني بين الحركات - Minimum interval between moves

/**
 * تهيئة الثعبان الأولي - Initialize initial snake
 */
export const initializeSnake = (centerX: number, centerY: number): SnakePart[] => {
  const snake: SnakePart[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ 
      x: centerX - i,
      y: centerY
    });
  }
  return snake;
};

/**
 * إنشاء حالة اللعبة الأولية - Create initial game state
 */
export const createGameState = (
  level = 1, 
  city = 1, 
  language: 'en' | 'ar' = 'ar', 
  obstacles: Obstacle[] = []
): GameState => {
  if (DEBUG_MODE) {
    console.log(`[${language}] إنشاء حالة اللعبة الأولية - Creating initial game state`, { level, city });
  }
  
  // تحديد موضع الثعبان في وسط اللوحة - Position snake in center of board
  const centerX = Math.floor(BOARD_WIDTH / 2);
  const centerY = Math.floor(BOARD_HEIGHT / 2);
  
  // إنشاء جسم الثعبان - Create snake body
  const snake = initializeSnake(centerX, centerY);
  
  if (DEBUG_MODE) {
    console.log(`[${language}] الثعبان الأولي - Initial snake:`, snake);
  }
  
  // التحقق من وجود عوائق في موضع الثعبان - Check for obstacles at snake position
  const hasInitialCollision = obstacles.some(obstacle => 
    snake.some(part => 
      Math.abs(obstacle.x - part.x) < 3 && Math.abs(obstacle.y - part.y) < 3
    )
  );
  
  // تعديل موضع الثعبان إذا كان هناك تصادم - Adjust snake position if collision exists
  let safeSnake = [...snake];
  if (hasInitialCollision) {
    if (DEBUG_MODE) {
      console.log(`[${language}] تصادم أولي، تعديل موضع الثعبان - Initial collision, adjusting snake position`);
    }
    
    const safeY = Math.floor(BOARD_HEIGHT / 3);
    
    for (let i = 0; i < snake.length; i++) {
      safeSnake[i] = {
        x: centerX - i,
        y: safeY
      };
    }
  }
  
  // التأكد من أن الثعبان ضمن حدود اللوحة - Ensure snake is within board boundaries
  for (let i = 0; i < safeSnake.length; i++) {
    safeSnake[i] = {
      x: Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, safeSnake[i].x)),
      y: Math.max(SAFE_MARGIN, Math.min(BOARD_HEIGHT - SAFE_MARGIN, safeSnake[i].y))
    };
  }
  
  // توليد طعام أولي - Generate initial food
  const food = generateFood(safeSnake, obstacles);
  
  if (DEBUG_MODE) {
    console.log(`[${language}] تم تهيئة الثعبان في الموضع - Snake initialized at position:`, safeSnake[0]);
    console.log(`[${language}] تم توليد الطعام في الموضع - Food generated at position:`, food);
  }
  
  // إرجاع حالة اللعبة الأولية - Return initial game state
  return {
    snake: safeSnake,
    food,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    score: 0,
    gameOver: false,
    paused: false,
    currentCity: city,
    currentLevel: level,
    speed: calculateSpeed(level, city),
    language,
    firstTick: true,
    moveCount: 0,
    lastMoveTime: Date.now()
  };
};

/**
 * توليد طعام جديد في موقع عشوائي - Generate new food at random position
 */
export const generateFood = (snake: SnakePart[], obstacles: Obstacle[]): Food => {
  let position: Position;
  let attempts = 0;
  const maxAttempts = 100;
  
  // محاولة إيجاد موقع خالٍ من الثعبان والعوائق - Try to find position free of snake and obstacles
  do {
    position = {
      x: Math.floor(Math.random() * (BOARD_WIDTH - 2 * SAFE_MARGIN)) + SAFE_MARGIN,
      y: Math.floor(Math.random() * (BOARD_HEIGHT - 2 * SAFE_MARGIN)) + SAFE_MARGIN
    };
    attempts++;
    
    // إذا تجاوزنا الحد الأقصى للمحاولات، استخدم موقعًا آمنًا محددًا - If exceeded max attempts, use predefined safe position
    if (attempts >= maxAttempts) {
      if (DEBUG_MODE) console.log('تجاوز الحد الأقصى لمحاولات توليد الطعام - Max food generation attempts exceeded');
      position = {
        x: Math.floor(BOARD_WIDTH / 3),
        y: Math.floor(BOARD_HEIGHT / 3)
      };
      break;
    }
  } while (
    snake.some(part => part.x === position.x && part.y === position.y) ||
    obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y)
  );
  
  if (DEBUG_MODE) console.log('طعام جديد - New food:', position);
  
  return { ...position, value: 1 };
};

/**
 * حساب سرعة اللعبة بناءً على المستوى والمدينة - Calculate game speed based on level and city
 */
export const calculateSpeed = (level: number, city: number): number => {
  const baseSpeed = 200; // السرعة الأساسية (مللي ثانية) - Base speed (ms)
  const levelFactor = 5; // عامل المستوى - Level factor
  const cityFactor = 10; // عامل المدينة - City factor
  
  // أعلى سرعة (أقل تأخير) هي 100 مللي ثانية - Fastest speed (lowest delay) is 100ms
  return Math.max(100, baseSpeed - (level * levelFactor) - (city * cityFactor));
};

/**
 * التحقق من التصادم مع الجدران - Check for wall collision
 */
export const isWallCollision = (position: Position): boolean => {
  return (
    position.x < 0 ||
    position.x >= BOARD_WIDTH ||
    position.y < 0 ||
    position.y >= BOARD_HEIGHT
  );
};

/**
 * التحقق من التصادم مع الثعبان نفسه - Check for self collision
 */
export const isSelfCollision = (head: Position, snake: SnakePart[]): boolean => {
  // التحقق فقط من الأجزاء بعد الرأس والرقبة - Only check parts after head and neck
  return snake.slice(2).some(part => part.x === head.x && part.y === head.y);
};

/**
 * التحقق من التصادم مع العوائق - Check for obstacle collision
 */
export const isObstacleCollision = (head: Position, obstacles: Obstacle[]): boolean => {
  return obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
};

/**
 * التحقق من التصادم مع الطعام - Check for food collision
 */
export const isFoodCollision = (head: Position, food: Food | null): boolean => {
  if (!food) return false;
  return head.x === food.x && head.y === food.y;
};

/**
 * التحقق من اكتمال المستوى - Check if level is completed
 */
export const isLevelCompleted = (score: number, requiredScore: number): boolean => {
  return score >= requiredScore;
};

/**
 * الحصول على موقع الرأس التالي بناءً على الاتجاه - Get next head position based on direction
 */
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

/**
 * التحقق مما إذا كان الوقت قد حان للتحرك - Check if it's time to move
 */
export const isTimeToMove = (lastMoveTime: number, speed: number): boolean => {
  const now = Date.now();
  const timeSinceLastMove = now - lastMoveTime;
  return timeSinceLastMove >= Math.max(MIN_MOVEMENT_INTERVAL, speed);
};

/**
 * تحديث حالة اللعبة - Update game state
 */
export const updateGameState = (
  gameState: GameState,
  obstacles: Obstacle[],
  requiredScore: number,
  settings: any
): GameState => {
  // إذا كانت اللعبة متوقفة مؤقتًا أو انتهت، أرجع الحالة كما هي - If game is paused or over, return state as is
  if (gameState.paused || gameState.gameOver) {
    return gameState;
  }
  
  const { 
    snake, 
    food, 
    direction, 
    nextDirection, 
    score, 
    moveCount = 0, 
    firstTick, 
    lastMoveTime = Date.now(),
    speed,
    language
  } = gameState;
  
  // التحقق من وقت الحركة الأخيرة - Check last move time
  const now = Date.now();
  const timeSinceLastMove = now - lastMoveTime;
  
  // إذا كانت هذه أول حركة، قم بإعداد الثعبان الأولي - If this is first tick, set up initial snake
  if (firstTick) {
    if (DEBUG_MODE) console.log(`[${language}] أول تحديث للعبة - First game update`);
    
    // توليد طعام جديد إذا لم يكن موجوداً - Generate new food if not exists
    const newFood = food || generateFood(snake, obstacles);
    
    return {
      ...gameState,
      food: newFood,
      firstTick: false,
      moveCount: 1,
      lastMoveTime: now
    };
  }
  
  // التحقق مما إذا كان الوقت قد حان للتحرك - Check if it's time to move
  if (!isTimeToMove(lastMoveTime, speed)) {
    return gameState; // لم يحن وقت الحركة بعد - Not time to move yet
  }
  
  const head = snake[0];
  
  // في فترة السماح الأولية - In initial grace period
  const inGracePeriod = moveCount < GRACE_PERIOD;
  
  // احصل على موضع الرأس التالي - Get next head position
  const newHead = getNextHeadPosition(head, nextDirection);
  
  if (DEBUG_MODE) {
    console.log(`[${language}] تحديث اللعبة: الحركة ${moveCount}, الاتجاه ${nextDirection}, الرأس التالي (${newHead.x},${newHead.y})`);
  }
  
  // التحقق من التصادمات - Check for collisions
  let gameOver = false;
  let collisionType: 'wall' | 'self' | 'obstacle' | undefined = undefined;
  
  // التحقق من التصادم مع الجدران - Check wall collision
  if (!inGracePeriod && isWallCollision(newHead)) {
    if (DEBUG_MODE) console.log(`[${language}] تصادم مع الجدار عند (${newHead.x},${newHead.y})`);
    playSoundIfEnabled('collision', settings);
    gameOver = true;
    collisionType = 'wall';
  }
  
  // التحقق من التصادم مع الثعبان نفسه - Check self collision
  if (!inGracePeriod && snake.length > 4 && isSelfCollision(newHead, snake)) {
    if (DEBUG_MODE) console.log(`[${language}] تصادم الثعبان مع نفسه عند (${newHead.x},${newHead.y})`);
    playSoundIfEnabled('collision', settings);
    gameOver = true;
    collisionType = 'self';
  }
  
  // التحقق من التصادم مع العوائق - Check obstacle collision
  if (!inGracePeriod && isObstacleCollision(newHead, obstacles)) {
    if (DEBUG_MODE) console.log(`[${language}] تصادم مع عائق عند (${newHead.x},${newHead.y})`);
    playSoundIfEnabled('collision', settings);
    gameOver = true;
    collisionType = 'obstacle';
  }
  
  // إذا انتهت اللعبة، أرجع حالة انتهاء اللعبة - If game over, return game over state
  if (gameOver) {
    return {
      ...gameState,
      gameOver: true,
      collisionType
    };
  }
  
  // إنشاء جسم الثعبان الجديد - Create new snake body
  const newSnake = [newHead, ...snake.slice(0, -1)];
  
  // التحقق من التصادم مع الطعام - Check food collision
  const ateFood = isFoodCollision(newHead, food);
  let newFood = food;
  let newScore = score;
  
  // إذا أكل الثعبان الطعام - If snake ate food
  if (ateFood) {
    newScore += food ? food.value : 1;
    newSnake.push(snake[snake.length - 1]); // إضافة ذيل جديد - Add new tail
    newFood = generateFood(newSnake, obstacles);
    playSoundIfEnabled('eat', settings);
    if (DEBUG_MODE) console.log(`[${language}] أكل الطعام! طعام جديد: (${newFood.x},${newFood.y})`);
  }
  
  // التحقق من اكتمال المستوى - Check level completion
  const levelCompleted = isLevelCompleted(newScore, requiredScore);
  
  // تشغيل صوت الحركة - Play movement sound
  if (!ateFood) {
    playSoundIfEnabled('move', settings);
  }
  
  // أرجع حالة اللعبة المحدثة - Return updated game state
  return {
    ...gameState,
    snake: newSnake,
    food: newFood,
    score: newScore,
    direction: nextDirection,
    levelCompleted,
    moveCount: moveCount + 1,
    lastMoveTime: now,
    gameOver: false
  };
};

/**
 * تغيير اتجاه الثعبان - Change snake direction
 */
export const changeDirection = (currentDirection: Direction, newDirection: Direction): Direction => {
  // منع الدوران 180 درجة - Prevent 180-degree turns
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

/**
 * الحصول على حجم لوحة اللعبة - Get board size
 */
export const getBoardSize = (): { width: number; height: number } => {
  return { width: BOARD_WIDTH, height: BOARD_HEIGHT };
};
