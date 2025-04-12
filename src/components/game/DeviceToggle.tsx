import React from 'react';
import { Button } from '../ui/button';
import { Smartphone, Monitor } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface DeviceToggleProps {
  settings: GameSettings;
  onToggleDevice: () => void;
}

const DeviceToggle: React.FC<DeviceToggleProps> = ({ settings, onToggleDevice }) => {
  const isPC = settings.deviceMode === 'pc';
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleDevice}
      title={isPC ? t('switchToMobile', settings.language) : t('switchToPC', settings.language)}
      className="relative"
    >
      {isPC ? (
        <Smartphone className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isPC ? t('switchToMobile', settings.language) : t('switchToPC', settings.language)}
      </span>
    </Button>
  );
};

export default DeviceToggle;
