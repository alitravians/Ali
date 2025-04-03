import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

const AnnouncementForm = ({ announcement = null, onClose, onSuccess }) => {
  const initialFormData = announcement ? {
    title: announcement.title || '',
    content: announcement.content || '',
    type: announcement.type || 'news',
    duration: announcement.duration || 130,
    isActive: announcement.isActive !== undefined ? announcement.isActive : true
  } : {
    title: '',
    content: '',
    type: 'news',
    duration: 130,
    isActive: true
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('common.requiredFields'));
      return;
    }
    
    setLoading(true);
    
    try {
      if (announcement) {
        await updateDoc(doc(db, 'announcements', announcement.id), {
          ...formData,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.displayName
        });
        
        toast.success(t('announcement.updateSuccess'));
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...formData,
          createdAt: serverTimestamp(),
          createdBy: currentUser.displayName,
          updatedAt: null,
          updatedBy: null
        });
        
        toast.success(t('announcement.createSuccess'));
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(t('announcement.saveError'));
    }
    
    setLoading(false);
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <div className="popup-header">
          <h2 className="popup-title">
            {announcement 
              ? t('announcement.edit') 
              : t('announcement.create')}
          </h2>
          <button className="popup-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="popup-body">
            <div className="form-group">
              <label htmlFor="title">{t('announcement.title')}</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">{t('announcement.content')}</label>
              <textarea
                id="content"
                name="content"
                className="form-control"
                value={formData.content}
                onChange={handleChange}
                rows="5"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="type">{t('announcement.type')}</label>
                <select
                  id="type"
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="news">{t('announcement.typeNews')}</option>
                  <option value="alert">{t('announcement.typeAlert')}</option>
                  <option value="update">{t('announcement.typeUpdate')}</option>
                  <option value="maintenance">{t('announcement.typeMaintenance')}</option>
                </select>
              </div>
              
              <div className="form-group col-md-6">
                <label htmlFor="duration">{t('announcement.duration')} ({t('common.seconds')})</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className="form-control"
                  value={formData.duration}
                  onChange={handleChange}
                  min="10"
                  max="600"
                  required
                />
              </div>
            </div>
            
            <div className="form-group form-check">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                className="form-check-input"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="isActive">
                {t('announcement.isActive')}
              </label>
            </div>
          </div>
          
          <div className="popup-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;
