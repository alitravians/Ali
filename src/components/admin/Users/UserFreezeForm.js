import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const UserFreezeForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    reason: ''
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
    <form onSubmit={handleSubmit} className="freeze-form">
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
        <label htmlFor="reason">{t('freeze.reason')}</label>
        <select
          id="reason"
          name="reason"
          className="admin-form-select"
          value={formData.reason}
          onChange={handleChange}
          required
        >
          <option value="">{t('common.select')}</option>
          <option value="suspicious_activity">{t('user.suspiciousActivity')}</option>
          <option value="security_concern">{t('user.securityConcern')}</option>
          <option value="policy_violation">{t('user.policyViolation')}</option>
          <option value="account_compromised">{t('user.accountCompromised')}</option>
          <option value="investigation">{t('user.underInvestigation')}</option>
          <option value="other">{t('common.other')}</option>
        </select>
      </div>
      
      <div className="admin-form-group">
        <div className="freeze-warning">
          <p>{t('user.freezeWarning')}</p>
          <p>{t('user.freezeInfo')}</p>
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
          {t('user.freeze')}
        </button>
      </div>
    </form>
  );
};

export default UserFreezeForm;
