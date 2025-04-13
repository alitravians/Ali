import React from 'react';
import { Button } from '../../components/ui/button';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface DeviceToggleProps {
  settings: GameSettings;
  onToggleDevice: () => void;
}

const DeviceToggle: React.FC<DeviceToggleProps> = ({ settings, onToggleDevice }) => {
  const handleClick = () => {
    onToggleDevice();
  };
  
  return (
    <button 
      className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
      onClick={handleClick}
      style={{ 
        display: 'flex', 
        visibility: 'visible', 
        opacity: 1,
        zIndex: 50,
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #3b82f6'
      }}
      aria-label={settings.language === 'en' ? 'Toggle Device View' : 'تبديل عرض الجهاز'}
    >
      {settings.language === 'en' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
          <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v9.75c0 .83.67 1.5 1.5 1.5h13.5c.83 0 1.5-.67 1.5-1.5V5.25c0-.83-.67-1.5-1.5-1.5H5.25c-.83 0-1.5.67-1.5 1.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
          <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
          <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default DeviceToggle;
