import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameDashboard from './GameDashboard';
import { 
  GameState, 
  Direction, 
  Obstacle,
  GameSettings
} from '../../game/types';
import { 
  initializeGameState, 
  moveSnake, 
  isValidDirectionChange,
  updateMovingObstacles,
  isLevelCompleted
} from '../../game/gameEngine';
import { CITIES, LEVEL_OBSTACLES } from '../../game/constants';
import { playSoundIfEnabled } from '../../game/soundSystem';
import { initializeLevels } from '../../game/levelSystem';
import { Level } from '../../game/types';

interface GameProps {
  cityId: number;
  levelId: number;
  settings: GameSettings;
  highScore: number;
  gameSpeed?: number;
  onLevelComplete: (score: number) => void;
  onGameOver: (score: number) => void;
  onUpdateHighScore: (score: number) => void;
}

const Game: React.FC<GameProps> = ({
  cityId,
  levelId,
  settings,
  highScore,
  gameSpeed,
  onLevelComplete,
  onGameOver,
  onUpdateHighScore
}) => {
  const levelObstaclePattern = LEVEL_OBSTACLES[(levelId - 1) % LEVEL_OBSTACLES.length];
  const [levels] = useState<Level[]>(initializeLevels());
  
  const [gameState, setGameState] = useState<GameState>({
    ...initializeGameState(cityId, levelId, settings.difficulty, levelObstaclePattern, gameSpeed),
    language: settings.language
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>(levelObstaclePattern);
  const [gameLoopId, setGameLoopId] = useState<number | null>(null);
  
  const gameStateRef = useRef(gameState);
  const obstaclesRef = useRef(obstacles);
  const settingsRef = useRef(settings);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  const currentCity = CITIES.find(city => city.id === cityId) || CITIES[0];
  
  const handleDirectionChange = useCallback((newDirection: Direction) => {
    if (!gameState.gameOver && !gameState.paused) {
      setGameState(prevState => {
        if (isValidDirectionChange(prevState.direction, newDirection)) {
          playSoundIfEnabled('move', settingsRef.current);
          
          return {
            ...prevState,
            nextDirection: newDirection
          };
        }
        return prevState;
      });
    }
  }, [gameState.gameOver, gameState.paused]);
  
  const togglePause = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      paused: !prevState.paused
    }));
    
    playSoundIfEnabled('buttonClick', settingsRef.current);
  }, []);
  
  const restartGame = useCallback(() => {
    playSoundIfEnabled('buttonClick', settingsRef.current);
    
    setObstacles(levelObstaclePattern);
    
    setGameState({
      ...initializeGameState(
        cityId, 
        levelId, 
        settingsRef.current.difficulty, 
        levelObstaclePattern,
        gameSpeed
      ),
      language: settingsRef.current.language
    });
  }, [cityId, levelId, levelObstaclePattern]);
  
  const gameLoop = useCallback(() => {
    if (gameStateRef.current.gameOver || gameStateRef.current.paused) {
      return;
    }
    
    const updatedObstacles = updateMovingObstacles(obstaclesRef.current);
    setObstacles(updatedObstacles);
    
    const newGameState = moveSnake(gameStateRef.current, updatedObstacles);
    
    if (newGameState.score > gameStateRef.current.score) {
      playSoundIfEnabled('eat', settingsRef.current);
    }
    
    if (newGameState.gameOver && !gameStateRef.current.gameOver) {
      playSoundIfEnabled('collision', settingsRef.current);
      
      setTimeout(() => {
        playSoundIfEnabled('gameOver', settingsRef.current);
      }, 300);
      
      onGameOver(newGameState.score);
    }
    
    if (newGameState.score > highScore) {
      onUpdateHighScore(newGameState.score);
    }
    
    const currentLevel = levels.find(level => 
      level.cityId === cityId && level.id === (cityId - 1) * 10 + levelId
    );
    
    const requiredScore = currentLevel?.requiredScore || (10 + (levelId - 1) * 5);
    
    if (isLevelCompleted(newGameState.score, requiredScore) && !newGameState.gameOver) {
      playSoundIfEnabled('levelComplete', settingsRef.current);
      
      newGameState.levelCompleted = true;
      newGameState.paused = true;
      
      setTimeout(() => {
        onLevelComplete(newGameState.score);
      }, 2000);
    }
    
    setGameState(newGameState);
  }, [highScore, levelId, onGameOver, onLevelComplete, onUpdateHighScore]);
  
  useEffect(() => {
    if (gameLoopId !== null) {
      clearInterval(gameLoopId);
    }
    
    if (!gameState.gameOver && !gameState.paused) {
      const id = window.setInterval(
        gameLoop, 
        gameState.speed
      );
      setGameLoopId(id);
    } else {
      setGameLoopId(null);
    }
    
    return () => {
      if (gameLoopId !== null) {
        clearInterval(gameLoopId);
      }
    };
  }, [gameLoop, gameState.gameOver, gameState.paused, gameState.speed]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <GameBoard 
          gameState={gameState} 
          obstacles={obstacles}
          cityTheme={currentCity.theme}
        />
      </div>
      <div className="flex flex-col gap-4">
        <GameDashboard 
          score={gameState.score}
          level={levelId}
          city={currentCity.name}
          cityAr={currentCity.nameAr}
          highScore={highScore}
          language={settings.language}
          requiredScore={levels.find(level => 
            level.cityId === cityId && level.id === (cityId - 1) * 10 + levelId
          )?.requiredScore || (10 + (levelId - 1) * 5)}
        />
        <GameControls 
          onDirectionChange={handleDirectionChange}
          onPauseToggle={togglePause}
          onRestart={restartGame}
          isPaused={gameState.paused}
          isGameOver={gameState.gameOver}
          language={settings.language}
        />
      </div>
    </div>
  );
};

export default Game;
