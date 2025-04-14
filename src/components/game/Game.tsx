import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, SaveData, GameState, Direction, Level, City, Obstacle, SnakePart, Position, Food } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';
import LevelSelection from './LevelSelection';
import { 
  createGameState, 
  updateGameState, 
  changeDirection, 
  getBoardSize, 
  generateFood,
  isWallCollision,
  isSelfCollision,
  isObstacleCollision,
  initializeSnake
} from '../../game/gameEngine';
import { createDefaultSaveData } from '../../game/constants';

interface GameProps {
  settings: GameSettings;
  isMobileView: boolean;
  saveData: SaveData | null;
  onUpdateSaveData: (saveData: SaveData) => void;
  onReturnToMainMenu?: () => void;  // إضافة دالة للعودة إلى القائمة الرئيسية
}

const Game: React.FC<GameProps> = ({ 
  settings, 
  isMobileView, 
  saveData, 
  onUpdateSaveData,
  onReturnToMainMenu
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCity, setSelectedCity] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [requiredScore, setRequiredScore] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  
  // Initialize game component
  useEffect(() => {
    console.log('Game component initializing, saveData:', saveData ? 'exists' : 'null');
    
    if (!saveData) {
      console.log('Creating default save data');
      const defaultSaveData = createDefaultSaveData(settings);
      onUpdateSaveData(defaultSaveData);
    } else {
      console.log('Save data already exists');
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    
    if (saveData) {
      console.log('Initializing game state from saveData');
      const level = saveData.levels.find(
        lvl => lvl.cityId === selectedCity && lvl.id === selectedLevel
      );
      
      if (level) {
        setObstacles(level.obstacles);
        setRequiredScore(level.requiredScore);
        
        const initialGameState = createGameState(
          selectedLevel,
          selectedCity,
          settings.language,
          level.obstacles
        );
        
        console.log('Created initial game state:', initialGameState);
        setGameState(initialGameState);
        setIsPlaying(true);
      }
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [saveData, settings, onUpdateSaveData, selectedCity, selectedLevel]);
  
  // Set obstacles and required score when level changes
  useEffect(() => {
    if (!saveData) return;
    
    const level = saveData.levels.find(
      lvl => lvl.cityId === selectedCity && lvl.id === selectedLevel
    );
    
    if (level) {
      setObstacles(level.obstacles);
      setRequiredScore(level.requiredScore);
    }
  }, [selectedCity, selectedLevel, saveData]);
  
  useEffect(() => {
    if (!isPlaying || !gameState) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.paused || gameState.gameOver) return;
      
      let newDirection: Direction | null = null;
      
      console.log('مفتاح مضغوط:', e.key);
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDirection = 'UP';
          playSoundIfEnabled('move', settings); // إضافة صوت للحركة
          e.preventDefault(); // منع التمرير الافتراضي - Prevent default scrolling
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDirection = 'DOWN';
          playSoundIfEnabled('move', settings);
          e.preventDefault(); // منع التمرير الافتراضي - Prevent default scrolling
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDirection = 'LEFT';
          playSoundIfEnabled('move', settings);
          e.preventDefault(); // منع التمرير الافتراضي - Prevent default scrolling
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDirection = 'RIGHT';
          playSoundIfEnabled('move', settings);
          e.preventDefault(); // منع التمرير الافتراضي - Prevent default scrolling
          break;
        case 'p':
        case 'P':
          setGameState(prev => prev ? { ...prev, paused: !prev.paused } : null);
          playSoundIfEnabled('buttonClick', settings);
          e.preventDefault(); // منع التمرير الافتراضي - Prevent default scrolling
          break;
      }
      
      if (newDirection && gameState) {
        console.log('تغيير اتجاه الثعبان من', gameState.direction, 'إلى', newDirection);
        setGameState(prev => {
          if (!prev) return null;
          
          const nextDir = changeDirection(prev.direction, newDirection as Direction);
          console.log('الاتجاه النهائي بعد التحقق:', nextDir);
          
          return {
            ...prev,
            nextDirection: nextDir
          };
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, gameState, settings]);
  
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState) {
      console.error('Game loop called with null gameState - حلقة اللعبة تم استدعاؤها بحالة لعبة فارغة');
      return;
    }
    
    console.log('=== GAME LOOP DEBUG INFO ===');
    console.log(`Game state exists: ${!!gameState}`);
    console.log(`Snake length: ${gameState.snake.length}`);
    console.log(`Snake head: (${gameState.snake[0]?.x || 'N/A'}, ${gameState.snake[0]?.y || 'N/A'})`);
    console.log(`Direction: ${gameState.direction}, Next Direction: ${gameState.nextDirection}`);
    console.log(`Move count: ${gameState.moveCount || 0}`);
    console.log(`Last move time: ${gameState.lastMoveTime || 'N/A'}`);
    console.log(`Current timestamp: ${timestamp}`);
    console.log('===========================');
    
    const deltaTime = timestamp - lastTimeRef.current;
    const gameSpeed = gameState?.speed || 150;
    
    if (deltaTime >= gameSpeed) {
      lastTimeRef.current = timestamp;
      
      const inGracePeriod = (gameState.moveCount || 0) < 200;
      const isFirstMove = (gameState.moveCount || 0) < 50;
      
      console.log(`حالة اللعبة: الحركة رقم ${gameState.moveCount}, في فترة السماح: ${inGracePeriod}, الحركة الأولى: ${isFirstMove}`);
      console.log(`رأس الثعبان: (${gameState.snake[0]?.x || 'N/A'}, ${gameState.snake[0]?.y || 'N/A'})`);
      
      let updatedGameState;
      
      if (isFirstMove) {
        console.log('في الحركات الأولى الحرجة - تجاهل جميع التصادمات تمامًا');
        
        updatedGameState = updateGameState(gameState, obstacles, requiredScore, settings);
        
        updatedGameState = {
          ...updatedGameState,
          gameOver: false,
          collisionType: undefined,
          firstTick: false // تعيين firstTick إلى false بعد الحركة الأولى
        };
        
        console.log('تم تحديث حالة اللعبة خلال الحركات الأولى:', 
          `رأس الثعبان: (${updatedGameState.snake[0]?.x || 'N/A'}, ${updatedGameState.snake[0]?.y || 'N/A'}), ` +
          `انتهاء اللعبة: ${updatedGameState.gameOver}, ` +
          `الحركة رقم: ${updatedGameState.moveCount}`
        );
      }
      else if (inGracePeriod) {
        console.log('في فترة السماح - استخدام updateGameState مع وضع الحماية');
        
        updatedGameState = updateGameState(gameState, obstacles, requiredScore, settings);
        
        updatedGameState = {
          ...updatedGameState,
          gameOver: false,
          collisionType: undefined
        };
        
        console.log('تم تحديث حالة اللعبة خلال فترة السماح:', 
          `رأس الثعبان: (${updatedGameState.snake[0]?.x || 'N/A'}, ${updatedGameState.snake[0]?.y || 'N/A'}), ` +
          `انتهاء اللعبة: ${updatedGameState.gameOver}, ` +
          `الحركة رقم: ${updatedGameState.moveCount}`
        );
      } else {
        updatedGameState = updateGameState(gameState, obstacles, requiredScore, settings);
        console.log('تم تحديث حالة اللعبة بعد فترة السماح:', 
          `رأس الثعبان: (${updatedGameState.snake[0]?.x || 'N/A'}, ${updatedGameState.snake[0]?.y || 'N/A'}), ` +
          `انتهاء اللعبة: ${updatedGameState.gameOver}, ` +
          `الحركة رقم: ${updatedGameState.moveCount}`
        );
      }
      
      if (updatedGameState.gameOver) {
        console.log('انتهاء اللعبة بسبب:', updatedGameState.collisionType);
        playSoundIfEnabled('gameOver', settings);
        setGameOver(true);
        setIsPlaying(false);
      } 
      else if (updatedGameState.levelCompleted) {
        console.log('اكتمال المستوى!');
        playSoundIfEnabled('levelComplete', settings);
        setLevelCompleted(true);
        setIsPlaying(false);
        
        if (saveData) {
          const updatedLevels = saveData.levels.map(level => {
            if (level.cityId === selectedCity && level.id === selectedLevel) {
              return { ...level, completed: true };
            }
            
            if (level.cityId === selectedCity && level.id === selectedLevel + 1) {
              return { ...level, unlocked: true };
            }
            
            if (level.cityId === selectedCity + 1 && level.id === (selectedCity * 10) + 1) {
              const allLevelsInCityCompleted = saveData.levels
                .filter(l => l.cityId === selectedCity)
                .every(l => l.completed);
              
              if (allLevelsInCityCompleted) {
                return { ...level, unlocked: true };
              }
            }
            
            return level;
          });
          
          const updatedCities = saveData.cities.map(city => {
            if (city.id === selectedCity + 1) {
              const allLevelsInPreviousCityCompleted = saveData.levels
                .filter(l => l.cityId === selectedCity)
                .every(l => l.completed);
              
              if (allLevelsInPreviousCityCompleted) {
                playSoundIfEnabled('cityUnlock', settings);
                return { ...city, unlocked: true };
              }
            }
            return city;
          });
          
          const updatedSaveData = {
            ...saveData,
            levels: updatedLevels,
            cities: updatedCities,
            highScores: {
              ...saveData.highScores,
              [`${selectedCity}-${selectedLevel}`]: Math.max(
                updatedGameState.score,
                (saveData.highScores as Record<string, number>)[`${selectedCity}-${selectedLevel}`] || 0
              )
            }
          };
          
          onUpdateSaveData(updatedSaveData);
        }
      } 
      else {
        if (updatedGameState.score > gameState.score) {
          playSoundIfEnabled('eat', settings);
        }
        
        setGameState(updatedGameState);
      }
    }
    
    if (!gameState.gameOver && !gameState.paused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, obstacles, requiredScore, settings, saveData, selectedCity, selectedLevel, onUpdateSaveData]);

  // Main game loop effect
  useEffect(() => {
    console.log('Game loop useEffect triggered with:', { 
      isPlaying, 
      gameState: gameState ? {
        snakeLength: gameState.snake?.length || 0,
        snakeHead: gameState.snake?.[0] || 'missing',
        gameOver: gameState.gameOver,
        paused: gameState.paused,
        moveCount: gameState.moveCount || 0,
        direction: gameState.direction,
        nextDirection: gameState.nextDirection,
        lastMoveTime: gameState.lastMoveTime || 'missing'
      } : null,
      gameOver,
      levelCompleted,
      showLevelSelection
    });
    
    console.log('Game board visibility check - showLevelSelection:', showLevelSelection, 'isPlaying:', isPlaying);
    
    if (!isPlaying || !gameState) {
      console.log('Game loop not starting: isPlaying or gameState is falsy');
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }
    
    if (!gameState.snake || gameState.snake.length === 0 || !gameState.snake[0]) {
      console.log('تصحيح حالة الثعبان المفقود - Correcting missing snake state');
      
      const boardSize = getBoardSize();
      const centerX = Math.floor(boardSize.width / 2);
      const centerY = Math.floor(boardSize.height / 2);
      
      const newSnake = initializeSnake(centerX, centerY);
      console.log('تم إنشاء ثعبان جديد - Created new snake:', newSnake);
      
      setGameState({
        ...gameState,
        snake: newSnake,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        firstTick: true,
        moveCount: 0,
        lastMoveTime: Date.now(),
        gameOver: false
      });
      return;
    }
    
    if (gameState.gameOver && (gameState.moveCount || 0) < 10) {
      console.log('تصحيح حالة انتهاء اللعبة المبكرة - Correcting early game over state');
      setGameState({
        ...gameState,
        gameOver: false,
        firstTick: true,
        moveCount: 0,
        lastMoveTime: Date.now()
      });
      return;
    }
    
    if (gameState.paused) {
      console.log('Game loop not starting: game is paused');
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }
    
    console.log('Game initialization - Game state:', gameState);
    console.log('Game initialization - Obstacles:', obstacles);
    console.log('Game initialization - Required score:', requiredScore);
    
    const head = gameState.snake[0];
    console.log('Game initialization - Snake head position:', head);
    
    if (gameState.gameOver) {
      console.log('إعادة تهيئة اللعبة بعد انتهائها');
      
      const boardSize = getBoardSize();
      const centerX = Math.floor(boardSize.width / 2);
      const centerY = Math.floor(boardSize.height / 2);
      
      const safeSnake = createGameState(
        selectedLevel, 
        selectedCity, 
        settings.language, 
        obstacles
      ).snake;
      
      console.log('تم إنشاء ثعبان جديد في موقع آمن:', safeSnake);
      
      setGameState({
        ...gameState,
        snake: safeSnake,
        gameOver: false,
        firstTick: true,
        moveCount: 0,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        score: 0,
        food: null, // سيتم إنشاء طعام جديد في الدورة التالية
        lastMoveTime: Date.now()
      });
      
      playSoundIfEnabled('buttonClick', settings);
      return;
    }
    
    setGameOver(false);
    
    const updatedGameState = updateGameState(
      gameState,
      obstacles,
      requiredScore,
      settings
    );
    
    console.log('Initial game state update:', updatedGameState);
    setGameState(updatedGameState);
    
    console.log('Starting game loop');
    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isPlaying, gameState, gameLoop, obstacles, requiredScore, settings]);
  
  const handleSelectLevel = (cityId: number, levelId: number) => {
    console.log('handleSelectLevel called with cityId:', cityId, 'levelId:', levelId);
    setSelectedCity(cityId);
    setSelectedLevel(levelId);
    setShowLevelSelection(false);
    
    setGameOver(false);
    setLevelCompleted(false);
    
    const level = saveData?.levels.find(
      lvl => lvl.cityId === cityId && lvl.id === levelId
    );
    
    if (level) {
      setObstacles(level.obstacles);
      setRequiredScore(level.requiredScore);
      console.log('Level found:', level);
    } else {
      console.log('Level not found in saveData');
    }
    
    const safeObstacles = level?.obstacles || [];
    console.log('Initializing game with obstacles:', safeObstacles);
    
    const boardSize = getBoardSize();
    const centerX = Math.floor(boardSize.width / 2);
    const centerY = Math.floor(boardSize.height / 2);
    
    const safeSnake: SnakePart[] = [];
    
    let safeX = centerX;
    let safeY = centerY;
    
    const hasObstacleInCenter = safeObstacles.some(
      obstacle => Math.abs(obstacle.x - centerX) < 8 && Math.abs(obstacle.y - centerY) < 8
    );
    
    if (hasObstacleInCenter) {
      console.log('Obstacles found in center, moving snake to safe position');
      safeX = Math.floor(boardSize.width / 4);
      safeY = Math.floor(boardSize.height / 4);
    }
    
    for (let i = 0; i < 3; i++) {
      safeSnake.push({
        x: Math.max(10, Math.min(boardSize.width - 10, safeX - i)),
        y: Math.max(10, Math.min(boardSize.height - 10, safeY))
      });
    }
    
    const hasNearbyObstacle = safeObstacles.some(
      obstacle => safeSnake.some(
        part => Math.abs(obstacle.x - part.x) < 5 && Math.abs(obstacle.y - part.y) < 5
      )
    );
    
    if (hasNearbyObstacle) {
      console.log('Obstacles found near snake, adjusting position');
      const safeY2 = Math.floor(boardSize.height / 3);
      for (let i = 0; i < safeSnake.length; i++) {
        safeSnake[i] = {
          x: Math.max(10, Math.min(boardSize.width - 10, boardSize.width / 3 - i)),
          y: Math.max(10, Math.min(boardSize.height - 10, safeY2))
        };
      }
    }
    
    console.log('Creating safe snake at position:', safeSnake[0]);
    
    const safeFood = generateFood(safeSnake, safeObstacles);
    
    const finalGameState: GameState = {
      snake: safeSnake,
      food: safeFood,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      score: 0,
      gameOver: false, // تأكيد أن اللعبة لم تنتهي عند البدء - Ensure game is not over at start
      paused: false,
      currentCity: cityId,
      currentLevel: levelId,
      speed: 150 - (levelId * 5) - (cityId * 10),
      language: settings.language,
      firstTick: true, // تعيين أول حركة لتفعيل فترة السماح - Set first tick to enable grace period
      moveCount: 0, // عداد للحركات لتتبع فترة السماح الأولية - Counter for tracking initial grace period
      lastMoveTime: Date.now() // وقت آخر حركة للثعبان - Time of last snake movement
    };
    
    console.log('حالة اللعبة النهائية قبل البدء:', finalGameState);
    console.log('Final game state before setting:', finalGameState);
    
    setGameState(finalGameState);
    
    setIsPlaying(true);
    console.log('Game started with isPlaying=true');
    console.log('تم بدء اللعبة بنجاح - Game started successfully');
    
    playSoundIfEnabled('buttonClick', settings);
    
    console.log('Game initialized with safe snake position:', safeSnake[0]);
  };
  
  const handleRestartGame = () => {
    console.log('handleRestartGame called');
    
    setGameOver(false);
    setLevelCompleted(false);
    
    const level = saveData?.levels.find(
      lvl => lvl.cityId === selectedCity && lvl.id === selectedLevel
    );
    const safeObstacles = level?.obstacles || [];
    
    const boardSize = getBoardSize();
    const centerX = Math.floor(boardSize.width / 2);
    const centerY = Math.floor(boardSize.height / 2);
    
    const safeSnake: SnakePart[] = [];
    
    let safeX = centerX;
    let safeY = centerY;
    
    const hasObstacleInCenter = safeObstacles.some(
      obstacle => Math.abs(obstacle.x - centerX) < 8 && Math.abs(obstacle.y - centerY) < 8
    );
    
    if (hasObstacleInCenter) {
      console.log('Obstacles found in center, moving snake to safe position');
      safeX = Math.floor(boardSize.width / 4);
      safeY = Math.floor(boardSize.height / 4);
    }
    
    for (let i = 0; i < 3; i++) {
      safeSnake.push({
        x: Math.max(10, Math.min(boardSize.width - 10, safeX - i)),
        y: Math.max(10, Math.min(boardSize.height - 10, safeY))
      });
    }
    
    const hasNearbyObstacle = safeObstacles.some(
      obstacle => safeSnake.some(
        part => Math.abs(obstacle.x - part.x) < 5 && Math.abs(obstacle.y - part.y) < 5
      )
    );
    
    if (hasNearbyObstacle) {
      console.log('Obstacles found near snake, adjusting position');
      const safeY2 = Math.floor(boardSize.height / 3);
      for (let i = 0; i < safeSnake.length; i++) {
        safeSnake[i] = {
          x: Math.max(10, Math.min(boardSize.width - 10, boardSize.width / 3 - i)),
          y: Math.max(10, Math.min(boardSize.height - 10, safeY2))
        };
      }
    }
    
    console.log('Creating safe snake at position:', safeSnake[0]);
    
    const safeFood = generateFood(safeSnake, safeObstacles);
    
    const finalGameState: GameState = {
      snake: safeSnake,
      food: safeFood,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      score: 0,
      gameOver: false, // تأكيد أن اللعبة لم تنتهي عند البدء - Ensure game is not over at start
      paused: false,
      currentCity: selectedCity,
      currentLevel: selectedLevel,
      speed: 150 - (selectedLevel * 5) - (selectedCity * 10),
      language: settings.language,
      firstTick: true, // تعيين أول حركة لتفعيل فترة السماح - Set first tick to enable grace period
      moveCount: 0, // عداد للحركات لتتبع فترة السماح الأولية - Counter for tracking initial grace period
      lastMoveTime: Date.now() // وقت آخر حركة للثعبان - Time of last snake movement
    };
    
    console.log('حالة اللعبة النهائية قبل البدء:', finalGameState);
    console.log('Final game state before setting:', finalGameState);
    
    setGameState(finalGameState);
    
    setIsPlaying(true);
    console.log('Game started with isPlaying=true');
    console.log('تم بدء اللعبة بنجاح - Game started successfully');
    
    playSoundIfEnabled('buttonClick', settings);
    console.log('Game restarted with safe snake position:', safeSnake[0]);
  };
  
  const handleReturnToLevelSelection = () => {
    setShowLevelSelection(true);
    setGameState(null);
    setIsPlaying(false);
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleNextLevel = () => {
    let nextLevelId = selectedLevel + 1;
    let nextCityId = selectedCity;
    
    if (nextLevelId > 10) {
      nextLevelId = 1;
      nextCityId += 1;
    }
    
    setSelectedCity(nextCityId);
    setSelectedLevel(nextLevelId);
    
    const level = saveData?.levels.find(
      lvl => lvl.cityId === nextCityId && lvl.id === nextLevelId
    );
    
    if (level && level.unlocked) {
      handleSelectLevel(nextCityId, nextLevelId);
    } else {
      handleReturnToLevelSelection();
    }
  };
  
  if (isLoading) {
    return (
      <div className="loading-screen flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold mb-4">{t('loading', settings.language)}</div>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (showLevelSelection && saveData) {
    return (
      <div className="level-selection-container p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {t('selectLevel', settings.language)}
        </h2>
        
        <LevelSelection
          settings={settings}
          cities={saveData.cities}
          levels={saveData.levels}
          onSelectLevel={handleSelectLevel}
        />
        
        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={onReturnToMainMenu}
          >
            {t('mainMenu', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
  if (gameOver && gameState) {
    return (
      <div className="game-over-screen flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-3xl font-bold mb-4 text-red-600">
          {t('gameOver', settings.language)}
        </h2>
        
        <div className="text-xl mb-6">
          {t('score', settings.language)}: {gameState.score}
        </div>
        
        <div className="flex space-x-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleRestartGame}
          >
            {t('tryAgain', settings.language)}
          </button>
          
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleReturnToLevelSelection}
          >
            {t('selectLevel', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
  if (levelCompleted && gameState) {
    return (
      <div className="level-completed-screen flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-3xl font-bold mb-4 text-green-600">
          {t('levelCompleted', settings.language)}
        </h2>
        
        <div className="text-xl mb-6">
          {t('score', settings.language)}: {gameState.score}
        </div>
        
        <div className="flex space-x-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleNextLevel}
          >
            {t('nextLevel', settings.language)}
          </button>
          
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleReturnToLevelSelection}
          >
            {t('selectLevel', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="game-container p-4">
      <div className="game-header flex justify-between items-center mb-4">
        <div className="game-info">
          <div className="text-lg font-bold">
            {t('level', settings.language)}: {selectedLevel}
          </div>
          <div className="text-lg font-bold">
            {t('score', settings.language)}: {gameState?.score || 0}
          </div>
        </div>
        
        <div className="game-actions">
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded mr-2"
            onClick={handleReturnToLevelSelection}
          >
            {t('back', settings.language)}
          </button>
        </div>
      </div>
      
      {/* Game Board Container - حاوية لوحة اللعبة */}
      {gameState && (
        <div 
          className="game-board border-8 border-red-600 rounded-md mx-auto shadow-2xl"
          style={{
            width: `${getBoardSize().width * 20}px`,
            height: `${getBoardSize().height * 20}px`,
            backgroundColor: '#e0f2f1',
            display: 'block',
            visibility: 'visible',
            position: 'relative',
            overflow: 'visible',
            zIndex: 10,
            margin: '20px auto',
            boxShadow: '0 0 50px rgba(255,0,0,0.9)',
            opacity: 1,
            minHeight: '400px',
            maxWidth: '100%'
          }}>
          {/* Debug information */}
          <div className="absolute top-0 left-0 bg-white p-2 text-xs z-50">
            Snake Length: {gameState.snake.length}
            <br />
            Head Position: ({gameState.snake[0]?.x || 'N/A'}, {gameState.snake[0]?.y || 'N/A'})
            <br />
            Move Count: {gameState.moveCount || 0}
            <br />
            Last Move Time: {gameState.lastMoveTime ? new Date(gameState.lastMoveTime).toLocaleTimeString() : 'N/A'}
            <br />
            Game Over: {gameState.gameOver ? 'Yes' : 'No'}
          </div>
          
          {/* Snake - تحسين عرض الثعبان مع تأكيد الرؤية - Enhanced snake display with visibility confirmation */}
          {gameState.snake.map((part, index) => {
            console.log(`Rendering snake part ${index} at (${part.x}, ${part.y})`);
            return (
              <div
                key={`snake-${index}`}
                className={`absolute ${index === 0 ? 'bg-red-600' : 'bg-green-600'} rounded-md`}
                style={{
                  width: '24px', // زيادة الحجم أكثر لتحسين الرؤية - Further increased size for better visibility
                  height: '24px', // زيادة الحجم أكثر لتحسين الرؤية - Further increased size for better visibility
                  left: `${part.x * 20 - 2}px`, // تعديل الموضع لتعويض الحجم الزائد - Adjust position to compensate for increased size
                  top: `${part.y * 20 - 2}px`, // تعديل الموضع لتعويض الحجم الزائد - Adjust position to compensate for increased size
                  zIndex: 9999, // زيادة z-index أكثر للتأكد من أن الثعبان فوق جميع العناصر الأخرى - Further increase z-index
                  border: index === 0 ? '4px solid yellow' : '3px solid black',
                  boxShadow: index === 0 ? '0 0 15px rgba(255,0,0,1)' : '0 0 10px rgba(0,255,0,0.9)',
                  display: 'block',
                  visibility: 'visible',
                  transform: 'translate3d(0,0,0) scale(1.1)', // تحسين الأداء وزيادة الحجم - Performance improvement and size increase
                  transition: 'all 0.1s ease', // إضافة انتقال سلس - Add smooth transition
                  pointerEvents: 'none',
                  position: 'absolute'
                }}
              />
            );
          })}
          
          {/* Debug Snake Head Marker - علامة رأس الثعبان للتصحيح */}
          {gameState.snake[0] && (
            <div
              className="absolute bg-yellow-500 rounded-full"
              style={{
                width: '30px',
                height: '30px',
                left: `${gameState.snake[0].x * 20 - 5}px`,
                top: `${gameState.snake[0].y * 20 - 5}px`,
                zIndex: 10000,
                border: '4px solid black',
                boxShadow: '0 0 20px rgba(255,255,0,1)',
                display: 'block',
                visibility: 'visible',
                position: 'absolute',
                opacity: 0.8,
                pointerEvents: 'none'
              }}
            />
          )}
          
          {/* Debug Markers - علامات التصحيح */}
          <div 
            className="absolute bg-blue-500 rounded-full" 
            style={{ 
              width: '10px', 
              height: '10px', 
              left: '0px', 
              top: '0px', 
              zIndex: 1000 
            }} 
            title="Top-Left Corner"
          />
          <div 
            className="absolute bg-red-500 rounded-full" 
            style={{ 
              width: '10px', 
              height: '10px', 
              right: '0px', 
              top: '0px', 
              zIndex: 1000 
            }} 
            title="Top-Right Corner"
          />
          <div 
            className="absolute bg-yellow-500 rounded-full" 
            style={{ 
              width: '10px', 
              height: '10px', 
              left: '0px', 
              bottom: '0px', 
              zIndex: 1000 
            }} 
            title="Bottom-Left Corner"
          />
          <div 
            className="absolute bg-purple-500 rounded-full" 
            style={{ 
              width: '10px', 
              height: '10px', 
              right: '0px', 
              bottom: '0px', 
              zIndex: 1000 
            }} 
            title="Bottom-Right Corner"
          />
          
          {/* Food */}
          {gameState.food && (
            <div
              className="absolute bg-yellow-400 rounded-full"
              style={{
                width: '16px',
                height: '16px',
                left: `${gameState.food.x * 20 + 2}px`,
                top: `${gameState.food.y * 20 + 2}px`,
                zIndex: 5
              }}
            />
          )}
          
          {/* Obstacles */}
          {obstacles.map((obstacle, index) => (
            <div
              key={`obstacle-${index}`}
              className="absolute bg-gray-700 rounded-sm"
              style={{
                width: '20px',
                height: '20px',
                left: `${obstacle.x * 20}px`,
                top: `${obstacle.y * 20}px`,
                zIndex: 10,
                display: 'block',
                visibility: 'visible'
              }}
            />
          ))}
        </div>
      )}
      
      <div className="game-controls flex justify-center space-x-4 mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            if (gameState) {
              setGameState(prev => prev ? { ...prev, paused: !prev.paused } : null);
              playSoundIfEnabled('buttonClick', settings);
            }
          }}
        >
          {gameState?.paused ? t('resume', settings.language) : t('pause', settings.language)}
        </button>
        
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          onClick={handleReturnToLevelSelection}
        >
          {t('mainMenu', settings.language)}
        </button>
      </div>
    </div>
  );
};

export default Game;
