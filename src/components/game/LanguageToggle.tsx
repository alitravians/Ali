import React from 'react';
import { Button } from '../../components/ui/button';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface LanguageToggleProps {
  settings: GameSettings;
  onToggleLanguage: () => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ settings, onToggleLanguage }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleLanguage}
      title={t('language', settings.language)}
    >
      <span className="text-sm font-semibold">
        {settings.language === 'en' ? 'العربية' : 'EN'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
