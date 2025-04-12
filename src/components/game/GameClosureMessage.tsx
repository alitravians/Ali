import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface GameClosureMessageProps {
  settings: GameSettings;
  closureReason: string;
}

const GameClosureMessage: React.FC<GameClosureMessageProps> = ({
  settings,
  closureReason
}) => {
  const isRtl = isRTL(settings.language);
  
  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      <Card className={`w-full max-w-md pointer-events-auto ${isRtl ? 'rtl' : 'ltr'}`}>
        <CardHeader className="bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-700">
              {t('gameClosedTitle', settings.language)}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-center text-lg font-medium">
            {t('gameClosedMessage', settings.language)}
          </p>
          
          {closureReason && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-700 font-medium mb-1">
                {t('closureReason', settings.language)}:
              </p>
              <p className="text-gray-900">{closureReason}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 text-center mt-4">
            {t('checkBackLater', settings.language)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameClosureMessage;
