import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { GameSettings, Language } from '../../game/types';
import { Settings, Volume2, VolumeX, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { t, isRTL } from '../../game/localization';

interface SettingsPanelProps {
  settings: GameSettings;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onChangeDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onToggleSound,
  onToggleLanguage,
  onChangeDifficulty,
  language,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  
  const isRtl = isRTL(language);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-md ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            {t('settings', language)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-green-500" />
              ) : (
                <VolumeX className="h-5 w-5 text-red-500" />
              )}
              <Label htmlFor="sound-toggle">{t('sound', language)}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {settings.soundEnabled ? t('on', language) : t('off', language)}
              </span>
              <Switch 
                id="sound-toggle"
                checked={settings.soundEnabled}
                onCheckedChange={onToggleSound}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <Label htmlFor="language-toggle">{t('language', language)}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {language === 'en' ? t('english', language) : t('arabic', language)}
              </span>
              <Switch 
                id="language-toggle"
                checked={language === 'ar'}
                onCheckedChange={onToggleLanguage}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty-select">{t('difficulty', language)}</Label>
            <Select
              value={settings.difficulty}
              onValueChange={(value) => onChangeDifficulty(value as 'easy' | 'normal' | 'hard')}
            >
              <SelectTrigger id="difficulty-select">
                <SelectValue placeholder={t('normal', language)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t('easy', language)}</SelectItem>
                <SelectItem value="normal">{t('normal', language)}</SelectItem>
                <SelectItem value="hard">{t('hard', language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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

export default SettingsPanel;
