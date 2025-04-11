import React, { useRef, useEffect } from 'react';
import { GameState, Obstacle } from '../../game/types';
import { GRID_SIZE, CELL_SIZE } from '../../game/constants';
import CityTheme from './CityTheme';
import { t } from '../../game/localization';

interface GameBoardProps {
  gameState: GameState;
  obstacles: Obstacle[];
  cityTheme: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, obstacles, cityTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'desert':
        return { background: '#f5d76e', snake: '#d35400', food: '#27ae60', obstacle: '#7f8c8d' };
      case 'modern':
        return { background: '#d2d7d3', snake: '#2c3e50', food: '#e74c3c', obstacle: '#34495e' };
      case 'luxury':
        return { background: '#f9bf3b', snake: '#8e44ad', food: '#2ecc71', obstacle: '#2c3e50' };
      case 'ancient':
        return { background: '#e9d460', snake: '#c0392b', food: '#16a085', obstacle: '#7f8c8d' };
      case 'coastal':
        return { background: '#6bb9f0', snake: '#2980b9', food: '#f1c40f', obstacle: '#34495e' };
      case 'european':
        return { background: '#bdc3c7', snake: '#2c3e50', food: '#e74c3c', obstacle: '#7f8c8d' };
      default:
        return { background: '#ecf0f1', snake: '#2c3e50', food: '#e74c3c', obstacle: '#7f8c8d' };
    }
  };
  
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const colors = getThemeColors(cityTheme);
    
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    
    drawGrid(ctx);
    
    ctx.fillStyle = colors.snake;
    gameState.snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = colors.snake;
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        ctx.fillStyle = '#ffffff';
        const eyeSize = CELL_SIZE / 5;
        const eyeOffset = CELL_SIZE / 3;
        
        if (gameState.direction === 'RIGHT') {
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (gameState.direction === 'LEFT') {
          ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - eyeSize, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - eyeSize, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (gameState.direction === 'UP') {
          ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (gameState.direction === 'DOWN') {
          ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset, eyeSize, eyeSize);
        }
        
        ctx.fillStyle = colors.snake;
      } else {
        const segmentColor = index % 2 === 0 
          ? colors.snake 
          : adjustColor(colors.snake, -20);
        ctx.fillStyle = segmentColor;
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    });
    
    if (gameState.food) {
      ctx.fillStyle = colors.food;
      const food = gameState.food;
      const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = colors.obstacle;
    obstacles.forEach(obstacle => {
      if (obstacle.type === 'wall') {
        ctx.fillRect(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        ctx.strokeStyle = adjustColor(colors.obstacle, -30);
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x * CELL_SIZE + 2, obstacle.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      } else if (obstacle.type === 'moving') {
        ctx.fillStyle = adjustColor(colors.obstacle, 20);
        ctx.fillRect(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        ctx.fillStyle = adjustColor(colors.obstacle, -20);
        ctx.beginPath();
        ctx.moveTo(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE);
        ctx.lineTo(obstacle.x * CELL_SIZE + CELL_SIZE, obstacle.y * CELL_SIZE + CELL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(obstacle.x * CELL_SIZE + CELL_SIZE, obstacle.y * CELL_SIZE);
        ctx.lineTo(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE + CELL_SIZE);
        ctx.stroke();
      }
    });
    
  };
  
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
    }
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  };
  
  const adjustColor = (color: string, amount: number): string => {
    const colorObj = hexToRgb(color);
    if (!colorObj) return color;
    
    const { r, g, b } = colorObj;
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };
  
  const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  useEffect(() => {
    drawGame();
  }, [gameState, obstacles, cityTheme]);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 z-0">
        <CityTheme cityId={gameState.currentCity} language={gameState.language || 'en'} />
      </div>
      <div className="relative z-10">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border border-gray-300 rounded-md shadow-md bg-opacity-80"
        />
      </div>
      {gameState.gameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
          <div className="bg-white p-4 rounded-md shadow-lg text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              {t('gameOver', gameState.language || 'en')}
            </h2>
            <p className="text-gray-700">
              {t('score', gameState.language || 'en')}: {gameState.score}
            </p>
            <button 
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              {t('restart', gameState.language || 'en')}
            </button>
          </div>
        </div>
      )}
      {gameState.paused && !gameState.gameOver && !gameState.levelCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <h2 className="text-xl font-bold text-blue-600">{t('pause', gameState.language || 'en')}</h2>
          </div>
        </div>
      )}
      
      {gameState.levelCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
          <div className="bg-white p-4 rounded-md shadow-lg text-center">
            <h2 className="text-xl font-bold text-green-600 mb-2">
              {t('levelCompleted', gameState.language || 'en')}
            </h2>
            <p className="text-gray-700">
              {t('score', gameState.language || 'en')}: {gameState.score}
            </p>
            <div className="mt-3 text-sm text-blue-600">
              {t('continueToNextLevel', gameState.language || 'en')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
