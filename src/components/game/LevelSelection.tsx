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
    <div className="level-selection">
      <div className="cities-container space-y-6">
        {cities.map(city => (
          <div
            key={city.id}
            className={`city-card p-4 border-2 rounded-lg ${
              city.unlocked 
                ? 'bg-white dark:bg-gray-800 border-blue-400 shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 opacity-70'
            }`}
          >
            <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">
              {settings.language === 'ar' ? city.nameAr : city.name}
            </h3>
            
            <div className="city-theme text-sm text-gray-600 dark:text-gray-300 mb-2">
              {t('theme', settings.language)}: {city.theme}
            </div>
            
            <div className="difficulty-multiplier text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('difficultyMultiplier', settings.language)}: x{city.difficultyMultiplier}
            </div>
            
            {!city.unlocked && (
              <div className="city-locked text-center p-2 bg-gray-200 dark:bg-gray-600 rounded">
                {t('locked', settings.language)}
              </div>
            )}
            
            {city.unlocked && (
              <div className="levels-grid grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {levels
                  .filter(level => level.cityId === city.id)
                  .map(level => (
                    <button
                      key={level.id}
                      className={`level-button p-2 rounded-lg text-center transition-all duration-200 transform hover:scale-105 ${
                        level.unlocked
                          ? level.completed
                            ? 'bg-green-200 hover:bg-green-300 dark:bg-green-700 dark:hover:bg-green-600'
                            : 'bg-blue-200 hover:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed'
                      }`}
                      disabled={!level.unlocked}
                      onClick={() => handleLevelClick(city.id, level.id)}
                    >
                      <span className="block font-medium">
                        {settings.language === 'ar' ? level.nameAr : level.name}
                      </span>
                      {level.completed && (
                        <span className="text-xs block mt-1 text-green-700 dark:text-green-300">✓</span>
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
