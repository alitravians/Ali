import React from 'react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';

interface UpdatesPageProps {
  settings: GameSettings;
  updates: Array<{content: string, date: string, id: string}>;
  onClose: () => void;
}

const UpdatesPage: React.FC<UpdatesPageProps> = ({ settings, updates, onClose }) => {
  return (
    <div className="updates-page p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t('updatesPageTitle', settings.language)}
        </h1>
        <button 
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
        >
          {t('back', settings.language)}
        </button>
      </div>
      
      <div className="updates-list space-y-4">
        {updates.length > 0 ? (
          updates.map((update) => (
            <div 
              key={update.id} 
              className="update-item bg-white p-4 rounded shadow"
            >
              <div className="update-date text-sm text-gray-500 mb-2">
                {update.date}
              </div>
              <div className="update-content whitespace-pre-wrap">
                {update.content}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {settings.language === 'en' 
              ? 'No updates available yet.' 
              : 'لا توجد تحديثات متاحة حتى الآن.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesPage;
