import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AnnouncementPopup from '../../chat/AnnouncementPopup';

const AnnouncementPreview = ({ announcement }) => {
  const [showPreview, setShowPreview] = useState(false);
  const { t } = useTranslation();
  
  if (!announcement) return null;
  
  const previewAnnouncement = {
    ...announcement,
    createdAt: {
      toDate: () => new Date()
    }
  };
  
  return (
    <div className="announcement-preview">
      <button 
        className="btn btn-outline-primary"
        onClick={() => setShowPreview(true)}
      >
        {t('announcement.preview')}
      </button>
      
      {showPreview && (
        <AnnouncementPopup 
          announcement={previewAnnouncement} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};

export default AnnouncementPreview;
