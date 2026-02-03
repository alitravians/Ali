import React from 'react';
import { useTranslation } from 'react-i18next';

interface ArgumentDisplayProps {
  argument: string;
  speakerName: string;
  speakerColor: string;
  isVisible: boolean;
}

const ArgumentDisplay: React.FC<ArgumentDisplayProps> = ({ 
  argument, 
  speakerName, 
  speakerColor, 
  isVisible 
}) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className={`w-full max-w-2xl mx-auto transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Argument Card */}
      <div 
        className="relative bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2"
        style={{ borderColor: speakerColor }}
      >
        {/* Speaker Label */}
        <div 
          className="absolute -top-4 right-4 px-4 py-1 rounded-full text-white text-sm font-bold shadow-lg"
          style={{ backgroundColor: speakerColor }}
        >
          {speakerName}
        </div>
        
        {/* Quote Icon */}
        <div className="absolute top-4 left-4 text-4xl opacity-20" style={{ color: speakerColor }}>
          ❝
        </div>
        
        {/* Argument Text */}
        <div className="pt-4 text-center">
          <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">
            {argument}
          </p>
        </div>
        
        {/* Quote Icon End */}
        <div className="absolute bottom-4 right-4 text-4xl opacity-20" style={{ color: speakerColor }}>
          ❞
        </div>
        
        {/* Animated Border */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-30 animate-pulse"
          style={{ 
            boxShadow: `0 0 30px ${speakerColor}`,
          }}
        />
      </div>
      
      {/* Label */}
      <div className="text-center mt-3">
        <span className="text-gray-400 text-sm">{t('debate.currentArgument')}</span>
      </div>
    </div>
  );
};

export default ArgumentDisplay;
