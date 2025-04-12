import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Lock, Globe } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface GameClosureMessageProps {
  settings: GameSettings;
  closureReason: string;
  onAdminAccessGranted: () => void;
  onToggleLanguage: () => void;
}

const GameClosureMessage: React.FC<GameClosureMessageProps> = ({
  settings,
  closureReason,
  onAdminAccessGranted,
  onToggleLanguage
}) => {
  const isRtl = isRTL(settings.language);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className={`w-full max-w-lg ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader className="bg-red-500 text-white">
          <CardTitle className="text-center">
            {t('gameClosed', settings.language) || 'Game Closed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CardDescription className="text-lg mb-6 text-center">
            {closureReason || t('defaultClosureReason', settings.language) || 'The game is currently closed for maintenance.'}
          </CardDescription>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleLanguage}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              <span>{settings.language === 'en' ? 'العربية' : 'English'}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAdminAccessGranted}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>{t('adminDashboard', settings.language) || 'Admin Dashboard'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameClosureMessage;
