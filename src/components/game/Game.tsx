import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, SaveData, GameState, Direction, Level, City, Obstacle } from '../../game/types';
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
  
  useEffect(() => {
    if (!isPlaying || !gameState || gameState.paused || gameState.gameOver) {
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
    
    const initialWallCollision = isWallCollision(head);
    const initialSelfCollision = isSelfCollision(head, gameState.snake);
    const initialObstacleCollision = isObstacleCollision(head, obstacles);
    
    console.log('Game initialization - Initial collision checks:', {
      wall: initialWallCollision,
      self: initialSelfCollision,
      obstacle: initialObstacleCollision
    });
    
    if (initialWallCollision || initialSelfCollision || initialObstacleCollision) {
      console.warn('Initial collision detected! Adjusting snake position...');
      
      const adjustedSnake = [...gameState.snake];
      adjustedSnake[0] = { x: Math.floor(getBoardSize().width / 2), y: Math.floor(getBoardSize().height / 2) };
      
      setGameState({
        ...gameState,
        snake: adjustedSnake
      });
      
      console.log('Snake position adjusted to:', adjustedSnake[0]);
    }
    
    let lastTime = 0;
    const gameSpeed = gameState.speed;
    
    setTimeout(() => {
      console.log('Game loop starting after initialization delay');
    }, 500);
    
    const gameLoop = (timestamp: number) => {
      if (!gameState) return;
      
      const deltaTime = timestamp - lastTime;
      
      if (deltaTime >= gameSpeed) {
        lastTime = timestamp;
        
        const updatedGameState = updateGameState(gameState, obstacles, requiredScore);
        
        if (updatedGameState.gameOver) {
          playSoundIfEnabled('gameOver', settings);
          setGameOver(true);
          setIsPlaying(false);
        } else if (updatedGameState.levelCompleted) {
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
        } else {
          if (updatedGameState.score > gameState.score) {
            playSoundIfEnabled('eat', settings);
          }
          
          setGameState(updatedGameState);
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameState, obstacles, requiredScore, saveData, selectedCity, selectedLevel, settings, onUpdateSaveData]);
  
  const handleSelectLevel = (cityId: number, levelId: number) => {
    setSelectedCity(cityId);
    setSelectedLevel(levelId);
    setShowLevelSelection(false);
    
    const level = saveData?.levels.find(
      lvl => lvl.cityId === cityId && lvl.id === levelId
    );
    
    if (level) {
      setObstacles(level.obstacles);
    }
    
    const newGameState = createGameState(levelId, cityId, settings.language, level?.obstacles || []);
    setGameState(newGameState);
    setIsPlaying(true);
    setGameOver(false);
    setLevelCompleted(false);
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleRestartGame = () => {
    const newGameState = createGameState(selectedLevel, selectedCity, settings.language);
    setGameState(newGameState);
    setIsPlaying(true);
    setGameOver(false);
    setLevelCompleted(false);
    
    playSoundIfEnabled('buttonClick', settings);
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
    
    const newGameState = createGameState(nextLevelId, nextCityId, settings.language);
    setGameState(newGameState);
    setIsPlaying(true);
    setGameOver(false);
    setLevelCompleted(false);
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            {t('loading', settings.language)}...
          </h2>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (showLevelSelection && saveData) {
    return (
      <div className="game-container p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {t('gameTitle', settings.language)}
          </h1>
          <p className="text-lg mb-6">
            {t('selectLevel', settings.language)}
          </p>
        </div>
        
        <LevelSelection
          settings={settings}
          cities={saveData.cities}
          levels={saveData.levels}
          onSelectLevel={handleSelectLevel}
        />
      </div>
    );
  }
  
  if (gameOver) {
    return (
      <div className="game-container p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-red-600">
            {t('gameOver', settings.language)}
          </h1>
          <p className="text-lg mb-6">
            {t('score', settings.language)}: {gameState?.score || 0}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleRestartGame}
          >
            {t('retry', settings.language)}
          </button>
          
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleReturnToLevelSelection}
          >
            {t('mainMenu', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
  if (levelCompleted) {
    return (
      <div className="game-container p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-green-600">
            {t('levelCompleted', settings.language)}
          </h1>
          <p className="text-lg mb-6">
            {t('score', settings.language)}: {gameState?.score || 0}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
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
            {t('mainMenu', settings.language)}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="game-container p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={onReturnToMainMenu}
          >
            {t('mainMenu', settings.language)}
          </button>
          
          <h2 className="text-xl font-bold">
            {saveData?.cities.find(city => city.id === selectedCity)
              ? settings.language === 'ar'
                ? saveData.cities.find(city => city.id === selectedCity)?.nameAr
                : saveData.cities.find(city => city.id === selectedCity)?.name
              : ''} - 
            {saveData?.levels.find(level => level.id === selectedLevel)
              ? settings.language === 'ar'
                ? saveData.levels.find(level => level.id === selectedLevel)?.nameAr
                : saveData.levels.find(level => level.id === selectedLevel)?.name
              : ''}
          </h2>
        </div>
        <p className="text-lg">
          {t('score', settings.language)}: {gameState?.score || 0}
        </p>
      </div>
      
      <div className="game-board-container flex justify-center mb-4" style={{ display: 'flex', visibility: 'visible', minHeight: '400px' }}>
        {gameState && (
          <div 
            className="game-board border-2 border-gray-400 relative"
            style={{
              width: `${getBoardSize().width * 20}px`,
              height: `${getBoardSize().height * 20}px`,
              backgroundColor: saveData?.cities.find(city => city.id === selectedCity)?.background || 'green',
              display: 'block', // تأكد من أن اللوحة مرئية دائمًا
              visibility: 'visible'
            }}
          >
            {/* Snake */}
            {gameState.snake.map((part, index) => (
              <div
                key={`snake-${index}`}
                className={`absolute ${index === 0 ? 'bg-red-600' : 'bg-green-600'} rounded-sm`}
                style={{
                  width: '18px',
                  height: '18px',
                  left: `${part.x * 20}px`,
                  top: `${part.y * 20}px`,
                  zIndex: 10
                }}
              />
            ))}
            
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
                className="absolute bg-gray-800 rounded-sm"
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
      </div>
      
      {/* Mobile controls */}
      {isMobileView && gameState && (
        <div className="mobile-controls grid grid-cols-3 gap-2 max-w-xs mx-auto">
          <div className="col-start-2">
            <button
              className="w-full bg-gray-300 p-4 rounded-t-lg"
              onClick={() => {
                if (gameState && !gameState.paused && !gameState.gameOver) {
                  setGameState(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      nextDirection: changeDirection(prev.direction, 'UP')
                    };
                  });
                  playSoundIfEnabled('move', settings);
                }
              }}
            >
              ▲
            </button>
          </div>
          <div className="col-start-1">
            <button
              className="w-full bg-gray-300 p-4 rounded-l-lg"
              onClick={() => {
                if (gameState && !gameState.paused && !gameState.gameOver) {
                  setGameState(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      nextDirection: changeDirection(prev.direction, 'LEFT')
                    };
                  });
                  playSoundIfEnabled('move', settings);
                }
              }}
            >
              ◄
            </button>
          </div>
          <div className="col-start-3">
            <button
              className="w-full bg-gray-300 p-4 rounded-r-lg"
              onClick={() => {
                if (gameState && !gameState.paused && !gameState.gameOver) {
                  setGameState(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      nextDirection: changeDirection(prev.direction, 'RIGHT')
                    };
                  });
                  playSoundIfEnabled('move', settings);
                }
              }}
            >
              ►
            </button>
          </div>
          <div className="col-start-2">
            <button
              className="w-full bg-gray-300 p-4 rounded-b-lg"
              onClick={() => {
                if (gameState && !gameState.paused && !gameState.gameOver) {
                  setGameState(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      nextDirection: changeDirection(prev.direction, 'DOWN')
                    };
                  });
                  playSoundIfEnabled('move', settings);
                }
              }}
            >
              ▼
            </button>
          </div>
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
