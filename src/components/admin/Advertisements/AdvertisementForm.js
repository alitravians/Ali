import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, storage } from '../../../firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';

const AdvertisementForm = ({ onSuccess, editAd = null }) => {
  const initialState = editAd ? {
    ...editAd,
    image: null
  } : {
    name: '',
    type: 'announcement',
    content: '',
    duration: 130,
    active: true,
    image: null,
    imageUrl: ''
  };
  
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (formData.image) {
        const storageRef = ref(storage, `advertisements/${Date.now()}_${formData.image.name}`);
        await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const adId = editAd ? editAd.id : `ad_${Date.now()}`;
      const adData = {
        id: adId,
        name: formData.name,
        type: formData.type,
        content: formData.content,
        duration: parseInt(formData.duration, 10),
        active: formData.active,
        imageUrl: imageUrl,
        createdBy: editAd ? editAd.createdBy : currentUser.displayName,
        createdAt: editAd ? editAd.createdAt : serverTimestamp(),
        updatedBy: currentUser.displayName,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'advertisements', adId), adData);
      
      toast.success(editAd ? t('ad.updateSuccess') : t('ad.createSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error(t('ad.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ad-form">
      <div className="admin-form-group">
        <label htmlFor="name">{t('ad.name')}</label>
        <input
          type="text"
          id="name"
          name="name"
          className="admin-form-control"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="type">{t('ad.type')}</label>
        <select
          id="type"
          name="type"
          className="admin-form-select"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="announcement">{t('ad.announcement')}</option>
          <option value="promotion">{t('ad.promotion')}</option>
          <option value="event">{t('ad.event')}</option>
          <option value="news">{t('ad.news')}</option>
          <option value="update">{t('ad.update')}</option>
        </select>
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="content">{t('ad.content')}</label>
        <textarea
          id="content"
          name="content"
          className="admin-form-textarea"
          value={formData.content}
          onChange={handleChange}
          rows="4"
          required
        />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="image">{t('ad.image')}</label>
        <input
          type="file"
          id="image"
          name="image"
          className="admin-form-control"
          onChange={handleChange}
          accept="image/*"
        />
        {formData.imageUrl && !formData.image && (
          <div className="current-image">
            <p>{t('ad.currentImage')}:</p>
            <img 
              src={formData.imageUrl} 
              alt={formData.name} 
              className="ad-image-preview" 
            />
          </div>
        )}
        {formData.image && (
          <div className="image-preview">
            <p>{t('ad.newImage')}:</p>
            <img 
              src={URL.createObjectURL(formData.image)} 
              alt={formData.name} 
              className="ad-image-preview" 
            />
          </div>
        )}
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="duration">{t('ad.duration')} ({t('ad.seconds')})</label>
        <input
          type="number"
          id="duration"
          name="duration"
          className="admin-form-control"
          value={formData.duration}
          onChange={handleChange}
          min="10"
          max="600"
          required
        />
        <small className="form-text">{t('ad.durationHelp')}</small>
      </div>
      
      <div className="admin-form-group">
        <div className="form-check">
          <input
            type="checkbox"
            id="active"
            name="active"
            className="form-check-input"
            checked={formData.active}
            onChange={handleChange}
          />
          <label htmlFor="active" className="form-check-label">
            {t('ad.active')}
          </label>
        </div>
      </div>
      
      <div className="admin-form-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onSuccess}
          disabled={loading}
        >
          {t('common.cancel')}
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? t('common.saving') : (editAd ? t('common.update') : t('common.create'))}
        </button>
      </div>
    </form>
  );
};

export default AdvertisementForm;
