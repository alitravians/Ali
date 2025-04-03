import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const UserBanForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    reason: '',
    duration: '60' // Default 60 minutes
  });
  const { t } = useTranslation();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="ban-form">
      <div className="admin-form-group">
        <label htmlFor="user-name">{t('user.username')}</label>
        <input
          type="text"
          id="user-name"
          className="admin-form-control"
          value={user.username}
          disabled
        />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="reason">{t('ban.reason')}</label>
        <select
          id="reason"
          name="reason"
          className="admin-form-select"
          value={formData.reason}
          onChange={handleChange}
          required
        >
          <option value="">{t('common.select')}</option>
          <option value="spam">{t('report.spam')}</option>
          <option value="harassment">{t('report.harassment')}</option>
          <option value="inappropriate_content">{t('report.inappropriateContent')}</option>
          <option value="hate_speech">{t('report.hateSpeech')}</option>
          <option value="violence">{t('report.violence')}</option>
          <option value="repeated_violations">{t('user.repeatedViolations')}</option>
          <option value="other">{t('common.other')}</option>
        </select>
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="duration">{t('ban.duration')}</label>
        <select
          id="duration"
          name="duration"
          className="admin-form-select"
          value={formData.duration}
          onChange={handleChange}
          required
        >
          <option value="10">{t('ban.minutes', { count: 10 })}</option>
          <option value="30">{t('ban.minutes', { count: 30 })}</option>
          <option value="60">{t('ban.hours', { count: 1 })}</option>
          <option value="360">{t('ban.hours', { count: 6 })}</option>
          <option value="720">{t('ban.hours', { count: 12 })}</option>
          <option value="1440">{t('ban.days', { count: 1 })}</option>
          <option value="4320">{t('ban.days', { count: 3 })}</option>
          <option value="10080">{t('ban.days', { count: 7 })}</option>
          <option value="permanent">{t('ban.permanent')}</option>
        </select>
      </div>
      
      <div className="admin-form-group">
        <div className="ban-warning">
          <p>
            {formData.duration === 'permanent' 
              ? t('user.permanentBanWarning') 
              : t('user.temporaryBanWarning')}
          </p>
        </div>
      </div>
      
      <div className="admin-modal-footer">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </button>
        <button 
          type="submit" 
          className="btn btn-danger"
          disabled={!formData.reason}
        >
          {t('user.ban')}
        </button>
      </div>
    </form>
  );
};

export default UserBanForm;
