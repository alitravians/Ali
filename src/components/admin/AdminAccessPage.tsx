import React, { useState, useEffect } from 'react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface AdminAccessPageProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (authenticated: boolean) => void;
  settings: GameSettings;
}

const AdminAccessPage: React.FC<AdminAccessPageProps> = ({ 
  isOpen, 
  onClose, 
  onAuthenticate,
  settings
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!isOpen) {
      setAccessCode('');
      setError('');
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const correctCode = '3131';
    
    if (accessCode === correctCode) {
      playSoundIfEnabled('buttonClick', settings);
      onAuthenticate(true);
    } else {
      setError(t('accessDenied', settings.language));
      playSoundIfEnabled('collision', settings);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-center">
          {t('adminAccess', settings.language)}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              {t('enterAccessCode', settings.language)}
            </label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              {t('cancel', settings.language)}
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              {t('continue', settings.language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAccessPage;
