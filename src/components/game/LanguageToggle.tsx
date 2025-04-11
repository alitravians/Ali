import React from 'react';
import { Button } from '../ui/button';
import { Languages } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface LanguageToggleProps {
  settings: GameSettings;
  onToggleLanguage: () => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ settings, onToggleLanguage }) => {
  const currentLanguage = settings.language;
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onToggleLanguage}
      className="flex items-center gap-2"
      title={t(currentLanguage === 'en' ? 'arabic' : 'english', currentLanguage)}
    >
      <Languages className="h-4 w-4" />
      {currentLanguage === 'en' ? t('arabic', 'ar') : t('english', 'en')}
    </Button>
  );
};

export default LanguageToggle;
