import React, { useState } from 'react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface UpdatesPanelProps {
  settings: GameSettings;
  updates: Array<{content: string, date: string, id: string}>;
  onUpdateUpdates: (updates: Array<{content: string, date: string, id: string}>) => void;
}

const UpdatesPanel: React.FC<UpdatesPanelProps> = ({
  settings,
  updates,
  onUpdateUpdates
}) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleAddUpdate = () => {
    if (!content.trim()) return;
    
    const newUpdate = {
      content,
      date,
      id: Date.now().toString()
    };
    
    const updatedUpdates = [newUpdate, ...updates];
    onUpdateUpdates(updatedUpdates);
    
    setContent('');
    setDate(new Date().toISOString().split('T')[0]);
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleDeleteUpdate = (id: string) => {
    const updatedUpdates = updates.filter(update => update.id !== id);
    onUpdateUpdates(updatedUpdates);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  return (
    <div className="updates-panel">
      <h2 className="text-xl font-bold mb-4">
        {t('updates', settings.language)}
      </h2>
      
      <div className="add-update mb-6 bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">
          {t('addUpdate', settings.language)}
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {t('updateContent', settings.language)}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={5}
            placeholder={settings.language === 'en' ? 'Enter update content...' : 'أدخل محتوى التحديث...'}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {t('updateDate', settings.language)}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <button
          onClick={handleAddUpdate}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {t('addUpdate', settings.language)}
        </button>
      </div>
      
      <div className="updates-list space-y-4">
        <h3 className="font-bold mb-2">
          {settings.language === 'en' ? 'Current Updates' : 'التحديثات الحالية'}
        </h3>
        
        {updates.length > 0 ? (
          updates.map((update) => (
            <div 
              key={update.id} 
              className="update-item bg-white p-4 rounded shadow flex justify-between"
            >
              <div>
                <div className="update-date text-sm text-gray-500 mb-2">
                  {update.date}
                </div>
                <div className="update-content whitespace-pre-wrap">
                  {update.content}
                </div>
              </div>
              <button
                onClick={() => handleDeleteUpdate(update.id)}
                className="text-red-500 hover:text-red-700"
              >
                {settings.language === 'en' ? 'Delete' : 'حذف'}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {settings.language === 'en' 
              ? 'No updates available yet.' 
              : 'لا توجد تحديثات متاحة حتى الآن.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesPanel;
