import React from 'react';
import { Button } from '../../components/ui/button';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface DeviceToggleProps {
  settings: GameSettings;
  onToggleDevice: () => void;
}

const DeviceToggle: React.FC<DeviceToggleProps> = ({ settings, onToggleDevice }) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleDevice}
      title={t('toggleDevice', settings.language)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    </Button>
  );
};

export default DeviceToggle;
