import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { GameSettings, GameStatus } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface GameControlPanelProps {
  settings: GameSettings;
  gameStatus: GameStatus;
  onUpdateGameStatus: (isOpen: boolean, closureReason: string) => void;
}

const GameControlPanel: React.FC<GameControlPanelProps> = ({
  settings,
  gameStatus,
  onUpdateGameStatus
}) => {
  const [isOpen, setIsOpen] = useState(gameStatus.isOpen);
  const [closureReason, setClosureReason] = useState(gameStatus.closureReason || '');
  const isRtl = isRTL(settings.language);
  
  const handleToggleGameStatus = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSaveChanges = () => {
    onUpdateGameStatus(isOpen, closureReason);
  };
  
  return (
    <Card className={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('gameControlPanel', settings.language) || 'Game Control Panel'}</CardTitle>
        <CardDescription>
          {t('gameControlDescription', settings.language) || 'Control the game status and closure settings'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="game-status">
              {t('gameStatus', settings.language) || 'Game Status'}
            </Label>
            <p className="text-sm text-gray-500">
              {isOpen 
                ? (t('gameOpen', settings.language) || 'Game is currently open') 
                : (t('gameClosed', settings.language) || 'Game is currently closed')}
            </p>
          </div>
          <Switch
            id="game-status"
            checked={isOpen}
            onCheckedChange={handleToggleGameStatus}
          />
        </div>
        
        {!isOpen && (
          <div className="space-y-2">
            <Label htmlFor="closure-reason">
              {t('closureReason', settings.language) || 'Closure Reason'}
            </Label>
            <Input
              id="closure-reason"
              placeholder={t('enterClosureReason', settings.language) || 'Enter reason for game closure'}
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <p className="text-sm text-gray-500">
              {t('closureReasonDescription', settings.language) || 'This message will be displayed to players when they try to access the game'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges}>
          {t('saveChanges', settings.language) || 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameControlPanel;
