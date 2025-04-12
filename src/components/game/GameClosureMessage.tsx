import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import AdminAccessButton from '../admin/AdminAccessButton';
import LanguageToggle from './LanguageToggle';

interface GameClosureMessageProps {
  settings: GameSettings;
  closureReason: string;
  onAdminAccessGranted?: () => void;
}

const GameClosureMessage: React.FC<GameClosureMessageProps> = ({
  settings,
  closureReason,
  onAdminAccessGranted
}) => {
  const isRtl = isRTL(settings.language);
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-2xl p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            {t('gameClosedTitle', settings.language)}
          </h1>
          <div className="h-1 w-24 bg-red-500 mx-auto mb-6"></div>
          
          <p className="text-xl font-medium text-gray-800 mb-6">
            {t('gameClosedMessage', settings.language)}
          </p>
          
          {closureReason && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                {t('closureReason', settings.language)}:
              </h2>
              <p className="text-lg text-gray-900">{closureReason}</p>
            </div>
          )}
          
          <p className="text-gray-600 mt-8">
            {t('checkBackLater', settings.language)}
          </p>
        </div>
        
        <div className="mt-12">
          <div className="flex items-center justify-center gap-4">
            {/* Language toggle */}
            <LanguageToggle 
              settings={settings} 
              onToggleLanguage={() => window.location.reload()} 
            />
            
            {/* Admin access button */}
            {onAdminAccessGranted && (
              <AdminAccessButton
                settings={settings}
                onAccessGranted={onAdminAccessGranted}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameClosureMessage;
