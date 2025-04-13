import React from 'react';
import { Button } from '../../components/ui/button';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface AdminAccessButtonProps {
  settings: GameSettings;
  onClick: () => void;
}

const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({ settings, onClick }) => {
  return (
    <button 
      className="admin-access-button p-3 rounded-full bg-white dark:bg-gray-800 shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
      onClick={onClick}
      style={{ 
        display: 'flex', 
        visibility: 'visible', 
        opacity: 1,
        zIndex: 9999,
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
        width: '60px',
        height: '60px',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '3px solid #3b82f6'
      }}
      aria-label={t('adminAccess', settings.language)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-8 h-8 text-blue-600"
      >
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

export default AdminAccessButton;
