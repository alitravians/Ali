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

export const BOARD_WIDTH = 30;
export const BOARD_HEIGHT = 20; // تقليل ارتفاع اللوحة ليناسب الشاشة - Reduced board height to fit screen
export const INITIAL_SNAKE_LENGTH = 3;
export const GRACE_PERIOD = 500; // زيادة فترة السماح لتجنب الاصطدام في بداية اللعبة - Increased grace period
export const SAFE_MARGIN = 15; // زيادة هامش الأمان للثعبان - Increased safety margin
export const DEBUG_MODE = true; // وضع التصحيح لطباعة رسائل التصحيح - Debug mode enabled
export const CRITICAL_MOVES = 150; // زيادة عدد الحركات الحرجة في بداية اللعبة - Increased critical moves
export const INITIAL_SAFE_ZONE = 5; // منطقة آمنة حول الثعبان عند بدء اللعبة - Safe zone around snake at game start

/**
 * إنشاء حالة اللعبة الأولية
 * Create initial game state
 */
export const createGameState = (
  level = 1, 
  city = 1, 
  language: 'en' | 'ar' = 'ar', 
  obstacles: Obstacle[] = []
): GameState => {
  if (DEBUG_MODE) {
    console.log('بدء إنشاء حالة اللعبة الأولية - Starting to create initial game state', { 
      level, 
      city, 
      language,
      obstaclesCount: obstacles.length
    });
  }
  
  const centerX = Math.floor(BOARD_WIDTH / 2);
  const centerY = Math.floor(BOARD_HEIGHT / 2);
  
  const snake: SnakePart[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ 
      x: centerX - i,
      y: centerY
    });
  }
  
  if (DEBUG_MODE) {
    console.log('تم إنشاء الثعبان الأولي - Initial snake created:', 
      snake.map(part => `(${part.x},${part.y})`).join(' -> ')
    );
  }
  
  const hasInitialCollision = obstacles.some(obstacle => 
    snake.some(part => 
      Math.abs(obstacle.x - part.x) < 5 && Math.abs(obstacle.y - part.y) < 5
    )
  );
  
  if (hasInitialCollision) {
    if (DEBUG_MODE) {
      console.log('تم اكتشاف تصادم أولي، تعديل موضع الثعبان - Initial collision detected, adjusting snake position');
    }
    
    const safeY = Math.floor(BOARD_HEIGHT / 3);
    
    for (let i = 0; i < snake.length; i++) {
      snake[i] = {
        x: centerX - i,
        y: safeY
      };
    }
    
    if (DEBUG_MODE) {
      console.log('تم تعديل موضع الثعبان - Snake position adjusted:', 
        snake.map(part => `(${part.x},${part.y})`).join(' -> ')
      );
    }
  }
  
  for (let i = 0; i < snake.length; i++) {
    snake[i] = {
      x: Math.max(SAFE_MARGIN, Math.min(BOARD_WIDTH - SAFE_MARGIN, snake[i].x)),
      y: Math.max(SAFE_MARGIN, Math.min(BOARD_HEIGHT - SAFE_MARGIN, snake[i].y))
    };
  }
  
  if (DEBUG_MODE) {
    console.log('تم ضبط موضع الثعبان داخل الحدود الآمنة - Snake position adjusted within safe boundaries:', 
      snake.map(part => `(${part.x},${part.y})`).join(' -> ')
    );
  }
  
  const food = generateFood(snake, obstacles);
  
  if (DEBUG_MODE) {
    console.log('تهيئة حالة اللعبة - Game state initialized:', { 
      snake: snake.map(part => `(${part.x},${part.y})`), 
      food: food ? `(${food.x},${food.y})` : 'none',
      obstacles: obstacles.length
    });
  }
  
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
    moveCount: 0
  };
};

/**
 * توليد طعام جديد في موقع عشوائي
 * Generate new food at random position
 */
export const generateFood = (snake: SnakePart[], obstacles: Obstacle[]): Food => {
  let position: Position;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    position = {
      x: Math.floor(Math.random() * (BOARD_WIDTH - 2 * SAFE_MARGIN)) + SAFE_MARGIN,
      y: Math.floor(Math.random() * (BOARD_HEIGHT - 2 * SAFE_MARGIN)) + SAFE_MARGIN
    };
    attempts++;
    
    if (attempts >= maxAttempts) {
      if (DEBUG_MODE) console.log('تجاوز الحد الأقصى لمحاولات توليد الطعام، استخدام موقع آمن محدد');
      position = {
        x: Math.floor(BOARD_WIDTH / 2),
        y: Math.floor(BOARD_HEIGHT / 2) + 5
      };
      break;
    }
  } while (
    snake.some(part => part.x === position.x && part.y === position.y) ||
    obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y)
  );
  
  if (DEBUG_MODE) console.log('تم توليد طعام جديد في الموقع:', position);
  
  return { ...position, value: 1 };
};

/**
 * حساب سرعة اللعبة بناءً على المستوى والمدينة
 * Calculate game speed based on level and city
 */
export const calculateSpeed = (level: number, city: number): number => {
  const baseSpeed = 200; // سرعة أبطأ = قيمة أعلى (بالمللي ثانية) - زيادة السرعة الأساسية
  const levelFactor = 5;
  const cityFactor = 10;
  
  return Math.max(100, baseSpeed - (level * levelFactor) - (city * cityFactor));
};

/**
 * التحقق من التصادم مع الجدران
 * Check for wall collision
 */
export const isWallCollision = (position: Position, moveCount?: number): boolean => {
  if (moveCount !== undefined && moveCount < GRACE_PERIOD) {
    console.log(`تجاهل اصطدام الحائط خلال فترة السماح (${moveCount}/${GRACE_PERIOD})`);
    return false;
  }
  
  const isOutside = (
    position.x < 0 ||
    position.x >= BOARD_WIDTH ||
    position.y < 0 ||
    position.y >= BOARD_HEIGHT
  );
  
  if (isOutside) {
    console.log(`تم اكتشاف اصطدام بالحائط عند الموقع (${position.x}, ${position.y})`);
  }
  
  return isOutside;
};

/**
 * التحقق من التصادم مع الثعبان نفسه
 * Check for self collision
 */
export const isSelfCollision = (head: Position, snake: SnakePart[], moveCount?: number): boolean => {
  if (moveCount !== undefined && moveCount < GRACE_PERIOD) {
    if (DEBUG_MODE) console.log(`تجاهل تصادم الثعبان مع نفسه خلال فترة السماح (${moveCount}/${GRACE_PERIOD})`);
    return false;
  }
  
  const collision = snake.slice(2).some(part => part.x === head.x && part.y === head.y);
  
  if (collision && DEBUG_MODE) {
    console.log(`تم اكتشاف تصادم الثعبان مع نفسه عند الموقع (${head.x}, ${head.y})`);
  }
  
  return collision;
};

/**
 * التحقق من التصادم مع العوائق
 * Check for obstacle collision
 */
export const isObstacleCollision = (head: Position, obstacles: Obstacle[], moveCount?: number): boolean => {
  if (moveCount !== undefined && moveCount < GRACE_PERIOD) {
    if (DEBUG_MODE) console.log(`تجاهل تصادم العوائق خلال فترة السماح (${moveCount}/${GRACE_PERIOD})`);
    return false;
  }
  
  const collision = obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
  
  if (collision && DEBUG_MODE) {
    console.log(`تم اكتشاف تصادم مع عائق عند الموقع (${head.x}, ${head.y})`);
  }
  
  return collision;
};

/**
 * التحقق من التصادم مع الطعام
 * Check for food collision
 */
export const isFoodCollision = (head: Position, food: Food | null): boolean => {
  if (!food) return false;
  return head.x === food.x && head.y === food.y;
};

/**
 * التحقق من اكتمال المستوى
 * Check if level is completed
 */
export const isLevelCompleted = (score: number, requiredScore: number): boolean => {
  return score >= requiredScore;
};

/**
 * الحصول على موقع الرأس التالي بناءً على الاتجاه
 * Get next head position based on direction
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
 * تحديث حالة اللعبة
 * Update game state
 */
export const updateGameState = (
  gameState: GameState,
  obstacles: Obstacle[],
  requiredScore: number
): GameState => {
  if (gameState.paused) {
    return gameState;
  }
  
  if (gameState.gameOver) {
    const moveCount = gameState.moveCount || 0;
    if (moveCount < CRITICAL_MOVES * 2) {
      if (DEBUG_MODE) {
        console.log('تجاهل حالة انتهاء اللعبة خلال الحركات الأولى الحرجة');
        console.log('Ignoring game over state during critical first moves');
      }
      
      return {
        ...gameState,
        gameOver: false,
        collisionType: undefined,
        firstTick: true,
        moveCount: 0
      };
    }
    return gameState;
  }
  
  const { snake, food, direction, nextDirection, score, firstTick, moveCount = 0 } = gameState;
  
  if (firstTick) {
    if (DEBUG_MODE) console.log('أول تحديث للعبة - إعداد الثعبان الأولي - First game update - setting up initial snake');
    
    const newFood = food || generateFood(snake, obstacles);
    
    const safeSnake = [...snake];
    const boardSize = getBoardSize();
    
    for (let i = 0; i < safeSnake.length; i++) {
      safeSnake[i] = {
        x: Math.max(5, Math.min(boardSize.width - 6, safeSnake[i].x)),
        y: Math.max(5, Math.min(boardSize.height - 6, safeSnake[i].y))
      };
    }
    
    const hasObstacleCollision = safeSnake.some(part => 
      obstacles.some(obstacle => 
        Math.abs(obstacle.x - part.x) < 3 && Math.abs(obstacle.y - part.y) < 3
      )
    );
    
    if (hasObstacleCollision && DEBUG_MODE) {
      console.log('تم اكتشاف تصادم مع عائق في الموضع الأولي، تعديل موضع الثعبان - Detected collision with obstacle in initial position, adjusting snake position');
      
      const centerX = Math.floor(boardSize.width / 2);
      const centerY = Math.floor(boardSize.height / 2);
      
      let safeX = centerX;
      let safeY = centerY;
      
      for (let j = 1; j <= SAFE_MARGIN; j++) {
        const potentialPositions = [
          { x: centerX + j, y: centerY },
          { x: centerX - j, y: centerY },
          { x: centerX, y: centerY + j },
          { x: centerX, y: centerY - j }
        ];
        
        const safePosition = potentialPositions.find(pos => 
          !obstacles.some(obs => 
            Math.abs(obs.x - pos.x) < 3 && Math.abs(obs.y - pos.y) < 3
          ) &&
          pos.x >= 5 && pos.x < boardSize.width - 5 &&
          pos.y >= 5 && pos.y < boardSize.height - 5
        );
        
        if (safePosition) {
          safeX = safePosition.x;
          safeY = safePosition.y;
          break;
        }
      }
      
      for (let i = 0; i < safeSnake.length; i++) {
        safeSnake[i] = { x: safeX - i, y: safeY };
      }
    }
    
    if (DEBUG_MODE) {
      console.log('تم تصحيح موضع الثعبان الأولي - Corrected initial snake position:', 
        safeSnake.map(part => `(${part.x},${part.y})`).join(' -> ')
      );
    }
    
    return {
      ...gameState,
      snake: safeSnake,
      firstTick: false,
      moveCount: 1,
      food: newFood,
      gameOver: false // تأكيد أن اللعبة لم تنتهي - Ensure game is not over
    };
  }
  
  const head = snake[0];
  const newHead = getNextHeadPosition(head, nextDirection);
  
  const inGracePeriod = moveCount < GRACE_PERIOD;
  const isFirstMove = moveCount < CRITICAL_MOVES; // الحركات الأولى تعتبر حرجة - First moves are critical
  
  if (DEBUG_MODE) {
    console.log(`حالة فترة السماح: ${inGracePeriod ? 'نشطة' : 'غير نشطة'}, الحركة رقم: ${moveCount}/${GRACE_PERIOD}`);
    console.log(`حركة رقم ${moveCount}, في فترة السماح: ${inGracePeriod}, الحركة الأولى: ${isFirstMove}`);
    console.log(`رأس الثعبان الحالي: (${head.x},${head.y}), الرأس التالي: (${newHead.x},${newHead.y})`);
  }
  
  if (isFirstMove) {
    if (DEBUG_MODE) console.log('في الحركات الأولى الحرجة - تجاهل جميع التصادمات تمامًا');
    
    const safeHead = {
      x: Math.max(5, Math.min(BOARD_WIDTH - 6, newHead.x)),
      y: Math.max(5, Math.min(BOARD_HEIGHT - 6, newHead.y))
    };
    
    if (DEBUG_MODE) {
      console.log(`تصحيح موضع الرأس للحركات الأولى من (${newHead.x},${newHead.y}) إلى (${safeHead.x},${safeHead.y})`);
    }
    
    newHead.x = safeHead.x;
    newHead.y = safeHead.y;
    
    const newSnake = [newHead, ...snake.slice(0, -1)];
    const ateFood = isFoodCollision(newHead, food);
    let newFood = food;
    let newScore = score;
    
    if (ateFood) {
      newScore += food ? food.value : 1;
      newSnake.push(snake[snake.length - 1]);
      newFood = generateFood(newSnake, obstacles);
      if (DEBUG_MODE) console.log(`تم أكل الطعام! طعام جديد في: (${newFood.x},${newFood.y})`);
    }
    
    return {
      ...gameState,
      snake: newSnake,
      food: newFood,
      score: newScore,
      direction: nextDirection,
      moveCount: moveCount + 1,
      gameOver: false
    };
  }
  else if (inGracePeriod) {
    if (DEBUG_MODE) console.log('في فترة السماح - تصحيح التصادمات بدلاً من إنهاء اللعبة');
    
    if (isWallCollision(newHead, moveCount) || 
        newHead.x < 2 || newHead.x >= BOARD_WIDTH - 2 || 
        newHead.y < 2 || newHead.y >= BOARD_HEIGHT - 2) {
      
      if (DEBUG_MODE) console.log(`تصادم مع الحائط عند (${newHead.x},${newHead.y})`);
      
      const correctedHead = {
        x: Math.max(3, Math.min(BOARD_WIDTH - 4, newHead.x)),
        y: Math.max(3, Math.min(BOARD_HEIGHT - 4, newHead.y))
      };
      
      if (DEBUG_MODE) {
        console.log(`تصحيح موضع الرأس من (${newHead.x},${newHead.y}) إلى (${correctedHead.x},${correctedHead.y})`);
      }
      
      newHead.x = correctedHead.x;
      newHead.y = correctedHead.y;
    }
    
    if (isSelfCollision(newHead, snake, moveCount)) {
      if (DEBUG_MODE) console.log('تجاهل تصادم الثعبان مع نفسه خلال فترة السماح');
    }
    
    if (isObstacleCollision(newHead, obstacles, moveCount)) {
      if (DEBUG_MODE) console.log(`تصادم مع عائق عند (${newHead.x},${newHead.y})`);
      
      const correctedHead = {
        x: Math.max(3, Math.min(BOARD_WIDTH - 4, head.x + (nextDirection === 'RIGHT' ? 3 : (nextDirection === 'LEFT' ? -3 : 0)))),
        y: Math.max(3, Math.min(BOARD_HEIGHT - 4, head.y + (nextDirection === 'DOWN' ? 3 : (nextDirection === 'UP' ? -3 : 0))))
      };
      
      if (DEBUG_MODE) {
        console.log(`تصحيح موضع الرأس لتجنب العوائق من (${newHead.x},${newHead.y}) إلى (${correctedHead.x},${correctedHead.y})`);
      }
      
      newHead.x = correctedHead.x;
      newHead.y = correctedHead.y;
    }
    
    const newSnake = [newHead, ...snake.slice(0, -1)];
    const ateFood = isFoodCollision(newHead, food);
    let newFood = food;
    let newScore = score;
    
    if (ateFood) {
      newScore += food ? food.value : 1;
      newSnake.push(snake[snake.length - 1]);
      newFood = generateFood(newSnake, obstacles);
      if (DEBUG_MODE) console.log(`تم أكل الطعام! طعام جديد في: (${newFood.x},${newFood.y})`);
    }
    
    return {
      ...gameState,
      snake: newSnake,
      food: newFood,
      score: newScore,
      direction: nextDirection,
      moveCount: moveCount + 1,
      gameOver: false
    };
  }
  else {
    if (isWallCollision(newHead, moveCount)) {
      if (DEBUG_MODE) console.log(`تصادم مع الحائط بعد فترة السماح عند (${newHead.x},${newHead.y})`);
      return { ...gameState, gameOver: true, collisionType: 'wall' };
    }
    
    if (snake.length > 4 && isSelfCollision(newHead, snake, moveCount)) {
      if (DEBUG_MODE) console.log(`تصادم مع الثعبان نفسه بعد فترة السماح عند (${newHead.x},${newHead.y})`);
      return { ...gameState, gameOver: true, collisionType: 'self' };
    }
    
    if (isObstacleCollision(newHead, obstacles, moveCount)) {
      if (DEBUG_MODE) console.log(`تصادم مع عائق بعد فترة السماح عند (${newHead.x},${newHead.y})`);
      return { ...gameState, gameOver: true, collisionType: 'obstacle' };
    }
  }
  
  const newSnake = [newHead, ...snake.slice(0, -1)];
  
  const ateFood = isFoodCollision(newHead, food);
  let newFood = food;
  let newScore = score;
  
  if (ateFood) {
    newScore += food ? food.value : 1;
    newSnake.push(snake[snake.length - 1]); // إضافة الذيل مرة أخرى - Add tail back
    newFood = generateFood(newSnake, obstacles);
    if (DEBUG_MODE) console.log(`تم أكل الطعام! طعام جديد في: (${newFood.x},${newFood.y})`);
  }
  
  const levelCompleted = isLevelCompleted(newScore, requiredScore);
  
  return {
    ...gameState,
    snake: newSnake,
    food: newFood,
    score: newScore,
    direction: nextDirection,
    levelCompleted,
    moveCount: moveCount + 1,
    gameOver: false // تأكيد أن اللعبة لم تنتهي - Ensure game is not over during normal play
  };
};

/**
 * تغيير اتجاه الثعبان
 * Change snake direction
 */
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

/**
 * الحصول على حجم لوحة اللعبة
 * Get board size
 */
export const getBoardSize = (): { width: number; height: number } => {
  return { width: BOARD_WIDTH, height: BOARD_HEIGHT };
};
