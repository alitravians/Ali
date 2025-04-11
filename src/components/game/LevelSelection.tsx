import React from 'react';
import { City, Level, Language } from '../../game/types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle, Lock, Star } from 'lucide-react';
import { t, isRTL } from '../../game/localization';

interface LevelSelectionProps {
  cities: City[];
  levels: Level[];
  currentCity: number;
  currentLevel: number;
  language: Language;
  highScores: Record<number, number>;
  onSelectLevel: (cityId: number, levelId: number) => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({
  cities,
  levels,
  currentCity,
  currentLevel,
  language,
  highScores,
  onSelectLevel
}) => {
  const isRtl = isRTL(language);

  const selectedCity = cities.find(city => city.id === currentCity) || cities[0];
  const cityLevels = levels.filter(level => level.cityId === selectedCity.id);

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div>
        <h3 className="text-lg font-medium mb-3">{t('selectCity', language)}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cities.map(city => (
            <Button
              key={city.id}
              variant={city.id === selectedCity.id ? 'default' : 'outline'}
              onClick={() => city.unlocked ? onSelectLevel(city.id, 1) : null}
              className={`h-auto py-2 ${city.unlocked ? 'justify-start' : 'justify-between'} ${!city.unlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{
                backgroundColor: city.id === selectedCity.id ? city.background : undefined,
                color: city.id === selectedCity.id ? '#000' : undefined
              }}
              disabled={!city.unlocked}
            >
              <span>{language === 'en' ? city.name : city.nameAr}</span>
              {!city.unlocked && <Lock className="h-4 w-4 ml-2" />}
              {city.unlocked && (
                <div className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded ml-2">
                  {city.difficultyMultiplier.toFixed(1)}x
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">{t('selectLevel', language)}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cityLevels.map(level => {
            const levelNumber = level.id - (level.cityId - 1) * 10;
            const isLocked = !level.unlocked;
            const isCompleted = level.completed;
            const isCurrentLevel = level.cityId === currentCity && levelNumber === currentLevel;
            const levelHighScore = highScores[level.id] || 0;

            return (
              <Card 
                key={level.id} 
                className={`${isLocked ? 'opacity-60' : ''} ${isCurrentLevel ? 'border-2 border-primary' : ''}`}
              >
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>{language === 'en' ? level.name : level.nameAr}</span>
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  {!isLocked && (
                    <>
                      {levelHighScore > 0 && (
                        <div className="flex items-center text-xs mb-2">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span>{t('highScore', language)}: {levelHighScore}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => onSelectLevel(level.cityId, levelNumber)}
                      >
                        {isCurrentLevel ? t('continue', language) : t('play', language)}
                      </Button>
                    </>
                  )}
                  {isLocked && (
                    <div className="text-xs text-center py-1">{t('locked', language)}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelSelection;
