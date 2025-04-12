import React, { useState } from 'react';
import { GameSettings } from '../../game/types';
import { t } from '../../game/localization';
import { playSoundIfEnabled } from '../../game/soundSystem';

interface AnnouncementsPanelProps {
  settings: GameSettings;
  announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>;
  onUpdateAnnouncements: (announcements: Array<{content: string, author: string, date: string, id: string, duration?: number}>) => void;
}

const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({
  settings,
  announcements,
  onUpdateAnnouncements
}) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [duration, setDuration] = useState('200');
  
  const handleAddAnnouncement = () => {
    if (!content.trim() || !author.trim()) return;
    
    const newAnnouncement = {
      content,
      author,
      date: new Date().toLocaleDateString(),
      id: Date.now().toString(),
      duration: parseInt(duration) || 200
    };
    
    const updatedAnnouncements = [newAnnouncement, ...announcements];
    onUpdateAnnouncements(updatedAnnouncements);
    
    setContent('');
    setAuthor('');
    setDuration('200');
    
    playSoundIfEnabled('buttonClick', settings);
  };
  
  const handleDeleteAnnouncement = (id: string) => {
    const updatedAnnouncements = announcements.filter(announcement => announcement.id !== id);
    onUpdateAnnouncements(updatedAnnouncements);
    playSoundIfEnabled('buttonClick', settings);
  };
  
  return (
    <div className="announcements-panel">
      <h2 className="text-xl font-bold mb-4">
        {t('announcements', settings.language)}
      </h2>
      
      <div className="add-announcement mb-6 bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">
          {t('addAnnouncement', settings.language)}
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {t('announcementContent', settings.language)}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
            placeholder={settings.language === 'en' ? 'Enter announcement content...' : 'أدخل محتوى الإعلان...'}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {t('announcementAuthor', settings.language)}
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder={settings.language === 'en' ? 'Enter author name...' : 'أدخل اسم الكاتب...'}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            {settings.language === 'en' ? 'Duration (seconds)' : 'المدة (بالثواني)'}
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
          />
        </div>
        
        <button
          onClick={handleAddAnnouncement}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {t('addAnnouncement', settings.language)}
        </button>
      </div>
      
      <div className="announcements-list space-y-4">
        <h3 className="font-bold mb-2">
          {settings.language === 'en' ? 'Current Announcements' : 'الإعلانات الحالية'}
        </h3>
        
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="announcement-item bg-white p-4 rounded shadow flex justify-between"
            >
              <div>
                <div className="announcement-content mb-2">
                  {announcement.content}
                </div>
                <div className="announcement-meta text-sm text-gray-500">
                  <span className="font-bold" style={{ color: `#${Math.floor(Math.random()*16777215).toString(16)}` }}>
                    {announcement.author}
                  </span> - {announcement.date}
                  {announcement.duration && (
                    <span> - {announcement.duration} {settings.language === 'en' ? 'seconds' : 'ثانية'}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteAnnouncement(announcement.id)}
                className="text-red-500 hover:text-red-700"
              >
                {settings.language === 'en' ? 'Delete' : 'حذف'}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {settings.language === 'en' 
              ? 'No announcements available yet.' 
              : 'لا توجد إعلانات متاحة حتى الآن.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPanel;
