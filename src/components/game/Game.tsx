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
  isObstacleCollision
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
  const [showLevelSelection, setShowLevelSelection] = useState(true);
  
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
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [saveData, settings, onUpdateSaveData]);
  
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
  
  // Handle keyboard input
  useEffect(() => {
    if (!isPlaying || !gameState) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.paused || gameState.gameOver) return;
      
      let newDirection: Direction | null = null;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDirection = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDirection = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDirection = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDirection = 'RIGHT';
          break;
        case 'p':
        case 'P':
          setGameState(prev => prev ? { ...prev, paused: !prev.paused } : null);
          break;
      }
      
      if (newDirection && gameState) {
        setGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            nextDirection: changeDirection(prev.direction, newDirection as Direction)
          };
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, gameState]);
  
  // Game loop function
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState) {
      console.log('Game loop called with null gameState');
      return;
    }
    
    const deltaTime = timestamp - lastTimeRef.current;
    const gameSpeed = gameState?.speed || 150;
    
    if (deltaTime >= gameSpeed) {
      lastTimeRef.current = timestamp;
      
      const inGracePeriod = (gameState.moveCount || 0) < 10;
      console.log('Move count:', gameState.moveCount, 'In grace period:', inGracePeriod);
      
      let updatedGameState;
      
      if (inGracePeriod) {
        console.log('في فترة السماح، تعطيل التصادمات تمامًا:', gameState.moveCount);
        
        const head = gameState.snake[0];
        const direction = gameState.nextDirection;
        
        let newHead = { ...head };
        if (direction === 'UP') newHead.y = Math.max(0, head.y - 1);
        if (direction === 'DOWN') newHead.y = Math.min(getBoardSize().height - 1, head.y + 1);
        if (direction === 'LEFT') newHead.x = Math.max(0, head.x - 1);
        if (direction === 'RIGHT') newHead.x = Math.min(getBoardSize().width - 1, head.x + 1);
        
        const newSnake = [newHead, ...gameState.snake.slice(0, -1)];
        
        updatedGameState = {
          ...gameState,
          snake: newSnake,
          direction: gameState.nextDirection,
          moveCount: (gameState.moveCount || 0) + 1,
          gameOver: false
        };
        
        if (gameState.food && newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
          updatedGameState.score += gameState.food.value || 1;
          updatedGameState.snake = [newHead, ...gameState.snake];
          updatedGameState.food = generateFood(updatedGameState.snake, obstacles);
        }
      } else {
        updatedGameState = updateGameState(gameState, obstacles, requiredScore);
      }
      
      if (inGracePeriod) {
        console.log('تأكيد عدم انتهاء اللعبة خلال فترة السماح:', gameState.moveCount);
        
        updatedGameState = {
          ...updatedGameState,
          gameOver: false,
          moveCount: (gameState.moveCount || 0) + 1
        };
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
        snakeLength: gameState.snake.length,
        snakeHead: gameState.snake[0],
        gameOver: gameState.gameOver,
        paused: gameState.paused,
        moveCount: gameState.moveCount
      } : null,
      gameOver,
      levelCompleted
    });
    
    if (!isPlaying || !gameState) {
      console.log('Game loop not starting: isPlaying or gameState is falsy');
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
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
      console.log('Forcing game to not be in game over state');
      setGameState({
        ...gameState,
        gameOver: false,
        firstTick: true,
        moveCount: 0
      });
      return;
    }
    
    setGameOver(false);
    
    console.log('Starting game loop');
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isPlaying, gameState, gameLoop, obstacles, requiredScore]);
  
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
      obstacle => Math.abs(obstacle.x - centerX) < 5 && Math.abs(obstacle.y - centerY) < 5
    );
    
    if (hasObstacleInCenter) {
      console.log('Obstacles found in center, moving snake to safe position');
      safeX = Math.floor(boardSize.width / 4);
      safeY = Math.floor(boardSize.height / 4);
    }
    
    for (let i = 0; i < 3; i++) {
      safeSnake.push({
        x: Math.max(5, Math.min(boardSize.width - 5, safeX - i)),
        y: Math.max(5, Math.min(boardSize.height - 5, safeY))
      });
    }
    
    const hasNearbyObstacle = safeObstacles.some(
      obstacle => safeSnake.some(
        part => Math.abs(obstacle.x - part.x) < 3 && Math.abs(obstacle.y - part.y) < 3
      )
    );
    
    if (hasNearbyObstacle) {
      console.log('Obstacles found near snake, adjusting position');
      const safeY2 = Math.floor(boardSize.height / 3);
      for (let i = 0; i < safeSnake.length; i++) {
        safeSnake[i] = {
          x: Math.max(5, Math.min(boardSize.width - 5, boardSize.width / 3 - i)),
          y: Math.max(5, Math.min(boardSize.height - 5, safeY2))
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
      gameOver: false, // تأكيد أن اللعبة لم تنتهي عند البدء
      paused: false,
      currentCity: cityId,
      currentLevel: levelId,
      speed: 150 - (levelId * 5) - (cityId * 10),
      language: settings.language,
      firstTick: true, // تعيين أول حركة لتفعيل فترة السماح
      moveCount: 0 // عداد للحركات لتتبع فترة السماح الأولية
    };
    
    console.log('Final game state before setting:', finalGameState);
    
    setGameState(finalGameState);
    setIsPlaying(true);
    setGameOver(false);
    setLevelCompleted(false);
    
    playSoundIfEnabled('buttonClick', settings);
    
    console.log('Game initialized with safe snake position:', safeSnake[0]);
    
    setTimeout(() => {
      console.log('Game state after initialization:', gameState);
    }, 100);
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
      obstacle => Math.abs(obstacle.x - centerX) < 10 && Math.abs(obstacle.y - centerY) < 10
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
    
    console.log('Creating safe snake at position:', safeSnake[0]);
    
    const safeFood = generateFood(safeSnake, safeObstacles);
    
    const finalGameState: GameState = {
      snake: safeSnake,
      food: safeFood,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      score: 0,
      gameOver: false,
      paused: false,
      currentCity: selectedCity,
      currentLevel: selectedLevel,
      speed: 150 - (selectedLevel * 5) - (selectedCity * 10),
      language: settings.language,
      firstTick: true,
      moveCount: 0
    };
    
    console.log('Final game state before setting:', finalGameState);
    
    setGameState(finalGameState);
    
    setTimeout(() => {
      setIsPlaying(true);
      console.log('Game started with isPlaying=true');
    }, 100);
    
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
      
      {gameState && (
        <div 
          className="game-board border-2 border-gray-400 relative mx-auto"
          style={{
            width: `${getBoardSize().width * 20}px`,
            height: `${getBoardSize().height * 20}px`,
            backgroundColor: saveData?.cities.find(city => city.id === selectedCity)?.background || 'green',
            display: 'block', // تأكد من أن اللوحة مرئية دائمًا
            visibility: 'visible'
          }}
        >
          {/* Debug information */}
          <div className="absolute top-0 left-0 bg-white p-2 text-xs z-50">
            Snake Length: {gameState.snake.length}
            <br />
            Head Position: ({gameState.snake[0]?.x || 'N/A'}, {gameState.snake[0]?.y || 'N/A'})
            <br />
            Move Count: {gameState.moveCount || 0}
          </div>
          
          {/* Snake - تحسين عرض الثعبان مع زيادة الوضوح */}
          {gameState.snake.map((part, index) => {
            console.log(`Rendering snake part ${index} at position:`, part);
            return (
              <div
                key={`snake-${index}`}
                className={`absolute ${index === 0 ? 'bg-red-600' : 'bg-green-600'} rounded-sm`}
                style={{
                  width: '30px', // زيادة حجم الثعبان للوضوح
                  height: '30px', // زيادة حجم الثعبان للوضوح
                  left: `${part.x * 20}px`,
                  top: `${part.y * 20}px`,
                  zIndex: 999, // زيادة z-index لضمان ظهور الثعبان فوق كل شيء
                  border: index === 0 ? '3px solid yellow' : '2px solid black',
                  boxShadow: index === 0 ? '0 0 15px rgba(255,0,0,0.9)' : '0 0 10px rgba(0,255,0,0.8)',
                }}
              />
            );
          })}
          
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
                zIndex: 5
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
