import React from 'react';

interface DebaterProps {
  name: string;
  color: string;
  isActive: boolean;
  isSpeaking: boolean;
  score: number;
  side: 'left' | 'right';
  customImage?: string | null;
}

const Debater: React.FC<DebaterProps> = ({ name, color, isActive, isSpeaking, score, side, customImage }) => {
  // Skin tone colors
  const skinTone = '#e0b89d';
  const skinShadow = '#c9a080';
  const hairColor = side === 'left' ? '#2c1810' : '#1a1a2e';
  
  return (
    <div className={`flex flex-col items-center transition-all duration-500 ${isActive ? 'scale-105' : 'scale-100 opacity-70'}`}>
      {/* Score Badge */}
      <div 
        className="mb-4 px-5 py-2 rounded-full text-white font-bold text-xl shadow-xl"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 4px 20px ${color}80`
        }}
      >
        {score}
      </div>
      
      {/* 3D Character */}
      <div className={`relative ${isSpeaking ? '' : ''}`} style={{ perspective: '1000px' }}>
        {/* Glow effect when speaking */}
        {isSpeaking && (
          <div 
            className="absolute -inset-4 rounded-full blur-2xl opacity-40"
            style={{ 
              backgroundColor: color,
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        )}
        
        {/* Human Figure */}
        <div className="relative" style={{ transform: 'rotateY(0deg)', transformStyle: 'preserve-3d' }}>
          
          {/* Custom Image or Default Head */}
          {customImage ? (
            /* Custom uploaded image as face */
            <div className="relative">
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto overflow-hidden border-4"
                style={{ 
                  borderColor: color,
                  boxShadow: `0 8px 25px rgba(0,0,0,0.3), 0 0 20px ${color}40`
                }}
              >
                <img 
                  src={customImage} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Speaking indicator overlay */}
              {isSpeaking && (
                <div 
                  className="absolute inset-0 rounded-full border-4 animate-pulse"
                  style={{ borderColor: color }}
                />
              )}
            </div>
          ) : (
            /* Default generated face */
            <>
              {/* Hair */}
              <div 
                className="absolute w-20 h-10 md:w-24 md:h-12 rounded-t-full"
                style={{ 
                  backgroundColor: hairColor,
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.3)'
                }}
              />
              
              {/* Head */}
              <div 
                className="relative w-16 h-20 md:w-20 md:h-24 rounded-[40%] mx-auto"
                style={{ 
                  background: `linear-gradient(135deg, ${skinTone} 0%, ${skinShadow} 100%)`,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3), inset -3px -3px 10px rgba(0,0,0,0.1)'
                }}
              >
                {/* Face features */}
                {/* Eyes */}
                <div className="absolute top-6 md:top-8 left-1/2 transform -translate-x-1/2 flex gap-3 md:gap-4">
                  <div className="w-2.5 h-3 md:w-3 md:h-4 bg-white rounded-full relative overflow-hidden">
                    <div className={`absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full top-1 ${isSpeaking ? 'animate-pulse' : ''}`} 
                         style={{ left: side === 'left' ? '2px' : '4px' }} />
                  </div>
                  <div className="w-2.5 h-3 md:w-3 md:h-4 bg-white rounded-full relative overflow-hidden">
                    <div className={`absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full top-1 ${isSpeaking ? 'animate-pulse' : ''}`}
                         style={{ left: side === 'left' ? '2px' : '4px' }} />
                  </div>
                </div>
                
                {/* Eyebrows */}
                <div className="absolute top-4 md:top-6 left-1/2 transform -translate-x-1/2 flex gap-4 md:gap-5">
                  <div className="w-3 h-0.5 md:w-4 md:h-1 rounded-full" style={{ backgroundColor: hairColor }} />
                  <div className="w-3 h-0.5 md:w-4 md:h-1 rounded-full" style={{ backgroundColor: hairColor }} />
                </div>
                
                {/* Nose */}
                <div 
                  className="absolute top-10 md:top-12 left-1/2 transform -translate-x-1/2 w-1.5 h-3 md:w-2 md:h-4"
                  style={{ 
                    background: `linear-gradient(to right, ${skinShadow}, ${skinTone})`,
                    borderRadius: '50%'
                  }}
                />
                
                {/* Mouth */}
                <div 
                  className={`absolute top-14 md:top-16 left-1/2 transform -translate-x-1/2 rounded-full ${isSpeaking ? 'h-2 md:h-3' : 'h-1'}`}
                  style={{ 
                    width: isSpeaking ? '12px' : '16px',
                    backgroundColor: isSpeaking ? '#8b4513' : '#c97878',
                    transition: 'all 0.2s ease',
                    boxShadow: isSpeaking ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : 'none'
                  }}
                />
              </div>
            </>
          )}
          
          {/* Neck */}
          <div 
            className="w-6 h-4 md:w-8 md:h-5 mx-auto"
            style={{ 
              background: `linear-gradient(to bottom, ${skinShadow}, ${skinTone})`,
              borderRadius: '0 0 50% 50%'
            }}
          />
          
          {/* Body/Torso with Suit */}
          <div className="relative">
            {/* Shoulders and Suit */}
            <div 
              className="w-28 h-16 md:w-36 md:h-20 mx-auto rounded-t-3xl relative"
              style={{ 
                background: `linear-gradient(180deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
                boxShadow: `0 10px 30px ${color}40, inset 0 -10px 20px rgba(0,0,0,0.2)`
              }}
            >
              {/* Suit lapels */}
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '20px solid white'
                }}
              />
              
              {/* Tie */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <div className="w-3 h-2 bg-gray-800 rounded-sm" />
                <div 
                  className="w-4 h-8 md:w-5 md:h-10"
                  style={{
                    background: side === 'left' ? 'linear-gradient(180deg, #1e3a5f, #0f1f33)' : 'linear-gradient(180deg, #4a1942, #2d0f29)',
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 50% 85%, 0% 100%)'
                  }}
                />
              </div>
              
              {/* Arms */}
              <div 
                className="absolute -left-3 top-2 w-6 h-14 md:w-8 md:h-16 rounded-full"
                style={{ 
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                  transform: 'rotate(-15deg)'
                }}
              />
              <div 
                className="absolute -right-3 top-2 w-6 h-14 md:w-8 md:h-16 rounded-full"
                style={{ 
                  background: `linear-gradient(-90deg, ${color}99, ${color})`,
                  transform: 'rotate(15deg)'
                }}
              />
              
              {/* Hands */}
              <div 
                className="absolute -left-2 top-14 md:top-16 w-4 h-4 md:w-5 md:h-5 rounded-full"
                style={{ backgroundColor: skinTone }}
              />
              <div 
                className="absolute -right-2 top-14 md:top-16 w-4 h-4 md:w-5 md:h-5 rounded-full"
                style={{ backgroundColor: skinTone }}
              />
            </div>
            
            {/* Desk/Table */}
            <div 
              className="w-36 h-4 md:w-44 md:h-5 mx-auto rounded-lg"
              style={{ 
                background: 'linear-gradient(180deg, #4a4a5a 0%, #2a2a3a 100%)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.4)'
              }}
            />
            <div 
              className="w-32 h-8 md:w-40 md:h-10 mx-auto"
              style={{ 
                background: 'linear-gradient(180deg, #3a3a4a 0%, #1a1a2a 100%)',
                borderRadius: '0 0 10px 10px'
              }}
            />
          </div>
        </div>
        
        {/* Speaking indicator - speech bubbles */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-4 flex gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-bounce opacity-80" style={{ animationDelay: '0ms' }} />
            <span className="w-3 h-3 rounded-full bg-white animate-bounce opacity-90" style={{ animationDelay: '150ms' }} />
            <span className="w-4 h-4 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
      
      {/* Name Label */}
      <div 
        className="mt-4 px-6 py-2 rounded-xl text-white font-bold text-sm md:text-base shadow-xl"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 4px 15px ${color}60`
        }}
      >
        {name}
      </div>
    </div>
  );
};

export default Debater;
