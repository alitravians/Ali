import React from 'react';
import { GameSettings, City, Level } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface LevelSelectionProps {
  settings: GameSettings;
  cities: City[];
  levels: Level[];
  onSelectLevel: (cityId: number, levelId: number) => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({
  settings,
  cities,
  levels,
  onSelectLevel
}) => {
  const handleLevelClick = (cityId: number, levelId: number) => {
    playSoundIfEnabled('buttonClick', settings);
    onSelectLevel(cityId, levelId);
  };
  
  return (
    <div className="level-selection mt-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {t('selectCity', settings.language)}
      </h2>
      
      <div className="cities-container grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cities.map(city => (
          <div
            key={city.id}
            className={`city-card p-4 border rounded-lg ${
              city.unlocked ? 'bg-white cursor-pointer' : 'bg-gray-200 opacity-70'
            }`}
          >
            <h3 className="text-xl font-bold mb-2">
              {settings.language === 'ar' ? city.nameAr : city.name}
            </h3>
            
            <div className="city-theme text-sm text-gray-600 mb-2">
              {t('theme', settings.language)}: {city.theme}
            </div>
            
            <div className="difficulty-multiplier text-sm text-gray-600 mb-4">
              {t('difficultyMultiplier', settings.language)}: x{city.difficultyMultiplier}
            </div>
            
            {!city.unlocked && (
              <div className="city-locked text-center p-2 bg-gray-300 rounded">
                {t('locked', settings.language)}
              </div>
            )}
            
            {city.unlocked && (
              <div className="levels-grid grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {levels
                  .filter(level => level.cityId === city.id)
                  .map(level => (
                    <button
                      key={level.id}
                      className={`level-button p-2 rounded-lg text-center ${
                        level.unlocked
                          ? level.completed
                            ? 'bg-green-200 hover:bg-green-300'
                            : 'bg-blue-200 hover:bg-blue-300'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                      disabled={!level.unlocked}
                      onClick={() => handleLevelClick(city.id, level.id)}
                    >
                      <span className="block">
                        {settings.language === 'ar' ? level.nameAr : level.name}
                      </span>
                      {level.completed && (
                        <span className="text-xs block mt-1">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelSelection;
