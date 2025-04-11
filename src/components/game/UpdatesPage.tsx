import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Language } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import { X } from 'lucide-react';

interface UpdatesPageProps {
  language: Language;
  onClose: () => void;
}

const UpdatesPage: React.FC<UpdatesPageProps> = ({ language, onClose }) => {
  const isRtl = isRTL(language);

  const updates = [
    {
      version: '1.0.0',
      date: '2025-04-12',
      changes: [
        'initialRelease',
        'coreGameMechanics',
        'tenGameLevels',
        'sixCityThemes',
        'progressiveDifficulty',
        'gameControlPanel',
        'bilingualSupport',
        'saveGameProgress',
        'soundSystem'
      ]
    },
    {
      version: '0.9.0',
      date: '2025-04-12',
      changes: [
        'betaRelease',
        'levelSelection',
        'cityThemes',
        'soundEffects',
        'languageToggle'
      ]
    },
    {
      version: '0.8.0',
      date: '2025-04-12',
      changes: [
        'alphaRelease',
        'basicGameplay',
        'snakeMovement',
        'collisionDetection',
        'foodGeneration'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>{t('updatesPage', language)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {updates.map((update, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                  {t('version', language)} {update.version}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(update.date).toLocaleDateString(
                    language === 'en' ? 'en-US' : 'ar-SA'
                  )}
                </span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                {update.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="text-sm">
                    {t(change as any, language)}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-2">{t('upcomingFeatures', language)}</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li className="text-sm">{t('multiplayerMode', language)}</li>
              <li className="text-sm">{t('customizableSnake', language)}</li>
              <li className="text-sm">{t('achievementSystem', language)}</li>
              <li className="text-sm">{t('leaderboards', language)}</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t text-center">
            <h3 className="font-semibold mb-2">{t('copyright', language)}</h3>
            <div className="developer-credit">
              <p className="text-sm">
                <div className="flex flex-wrap justify-center items-center gap-1">
                  {language === 'en' 
                    ? 'Developed by Ali'.split('').map((letter, index) => (
                        <span 
                          key={index} 
                          className="letter-animation"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {letter}
                        </span>
                      ))
                    : 'تم التطوير بواسطة علي'.split(' ').map((word, wordIndex) => (
                        <div key={`word-${wordIndex}`} className="flex mx-1" style={{ direction: 'rtl' }}>
                          {word.split('').map((letter, letterIndex) => (
                            <span 
                              key={`${wordIndex}-${letterIndex}`} 
                              className="letter-animation"
                              style={{ 
                                animationDelay: `${(wordIndex * 5 + letterIndex) * 0.1}s`,
                                marginLeft: '1px',
                                marginRight: '1px'
                              }}
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                      ))
                  }
                </div>
              </p>
              {/* Animation is defined in CSS */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatesPage;
