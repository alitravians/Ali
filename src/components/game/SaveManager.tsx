import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SaveData, Language } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import { AlertTriangle, Save, Trash2, RotateCcw } from 'lucide-react';

interface SaveManagerProps {
  saveData: SaveData;
  onResetProgress: () => void;
  onClose: () => void;
  language: Language;
}

const SaveManager: React.FC<SaveManagerProps> = ({ 
  saveData, 
  onResetProgress, 
  onClose,
  language 
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const isRtl = isRTL(language);
  
  
  const getCompletedLevelsCount = (): number => {
    return saveData.levels.filter(level => level.completed).length;
  };
  
  const getUnlockedCitiesCount = (): number => {
    return saveData.cities.filter(city => city.unlocked).length;
  };
  
  const getTotalHighScore = (): number => {
    return Object.values(saveData.highScores).reduce((total, score) => total + score, 0);
  };
  
  const handleResetConfirm = () => {
    setShowConfirmReset(false);
    onResetProgress();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Save className="mr-2 h-5 w-5" />
            {t('saveManager', language)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="font-semibold mb-2">{t('gameProgress', language)}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>{t('completedLevels', language)}:</div>
              <div className="text-right">{getCompletedLevelsCount()} / {saveData.levels.length}</div>
              
              <div>{t('unlockedCities', language)}:</div>
              <div className="text-right">{getUnlockedCitiesCount()} / {saveData.cities.length}</div>
              
              <div>{t('totalHighScore', language)}:</div>
              <div className="text-right">{getTotalHighScore()}</div>
              
              <div>{t('lastPlayed', language)}:</div>
              <div className="text-right">
                {t('city', language)} {saveData.lastPlayed.city}, {t('level', language)} {saveData.lastPlayed.level}
              </div>
            </div>
          </div>
          
          {!showConfirmReset ? (
            <Button 
              variant="destructive" 
              className="w-full flex items-center justify-center"
              onClick={() => setShowConfirmReset(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('resetProgress', language)}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="bg-red-100 p-2 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  {t('resetWarning', language)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleResetConfirm}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('confirmReset', language)}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowConfirmReset(false)}
                >
                  {t('cancel', language)}
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={onClose}
          >
            {t('close', language)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaveManager;
