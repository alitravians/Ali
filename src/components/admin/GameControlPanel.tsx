import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { AlertTriangle, Check, Lock, Unlock, Settings } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface GameStatus {
  isOpen: boolean;
  closureReason: string;
}

interface GameControlPanelProps {
  settings: GameSettings;
  gameStatus: GameStatus;
  onUpdateGameStatus: (isOpen: boolean, closureReason: string) => void;
  onNavigateToAdmin?: () => void;
}

const GameControlPanel: React.FC<GameControlPanelProps> = ({
  settings,
  gameStatus,
  onUpdateGameStatus,
  onNavigateToAdmin
}) => {
  const [isOpen, setIsOpen] = useState(gameStatus.isOpen);
  const [closureReason, setClosureReason] = useState(gameStatus.closureReason || '');
  const [savedMessage, setSavedMessage] = useState('');
  const [showClosureForm, setShowClosureForm] = useState(!gameStatus.isOpen);
  
  const isRtl = isRTL(settings.language);
  
  const handleToggleGameStatus = () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    
    if (newStatus) {
      setClosureReason('');
      onUpdateGameStatus(true, '');
      setShowClosureForm(false);
    } else {
      setShowClosureForm(true);
    }
  };
  
  const handleSaveStatus = () => {
    if (!isOpen && !closureReason) {
      return;
    }
    
    onUpdateGameStatus(isOpen, closureReason);
    
    setSavedMessage(t('saveSuccess', settings.language));
    
    setTimeout(() => {
      setSavedMessage('');
      
      if (!isOpen && onNavigateToAdmin) {
        onNavigateToAdmin();
      }
    }, 1500);
  };
  
  const handleNavigateToAdmin = () => {
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };
  
  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="gameStatus">{t('gameControl', settings.language)}</Label>
          <div className="text-sm text-gray-500">
            {isOpen ? t('gameOpen', settings.language) : t('gameClosed', settings.language)}
          </div>
        </div>
        <Switch
          id="gameStatus"
          checked={isOpen}
          onCheckedChange={handleToggleGameStatus}
        />
      </div>
      
      {showClosureForm && !isOpen && (
        <div className="space-y-2">
          <Label htmlFor="closureReason">{t('closureReason', settings.language)}</Label>
          <Textarea
            id="closureReason"
            value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            placeholder={t('enterClosureReason', settings.language)}
            rows={3}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          
          <div className="flex items-center text-amber-600 text-sm mt-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{t('gameClosedWarning', settings.language)}</span>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 items-center flex-wrap">
        <Button 
          onClick={handleSaveStatus} 
          disabled={!isOpen && !closureReason && showClosureForm}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {isOpen ? t('openGame', settings.language) : t('closeGame', settings.language)}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleNavigateToAdmin}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {t('adminDashboard', settings.language) || 'Admin Dashboard'}
        </Button>
        
        {savedMessage && (
          <span className="text-green-600 ml-2 animate-pulse">
            {savedMessage}
          </span>
        )}
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex items-center mb-4">
          {isOpen ? (
            <div className="flex items-center text-green-600">
              <Unlock className="h-5 w-5 mr-2" />
              <span className="font-medium">{t('gameOpen', settings.language)}</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <Lock className="h-5 w-5 mr-2" />
              <span className="font-medium">{t('gameClosed', settings.language)}</span>
            </div>
          )}
        </div>
        
        {!isOpen && closureReason && (
          <div className="p-3 bg-gray-100 rounded-md">
            <Label className="text-sm text-gray-700">{t('closureReason', settings.language)}:</Label>
            <p className="mt-1">{closureReason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControlPanel;
