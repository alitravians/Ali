import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModeratorPenaltyForm = ({ moderator, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    severity: 'minor'
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
    <form onSubmit={handleSubmit} className="penalty-form">
      <div className="admin-form-group">
        <label htmlFor="moderator-name">{t('moderator.name')}</label>
        <input
          type="text"
          id="moderator-name"
          className="admin-form-control"
          value={moderator.username}
          disabled
        />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="reason">{t('moderator.penaltyReason')}</label>
        <select
          id="reason"
          name="reason"
          className="admin-form-select"
          value={formData.reason}
          onChange={handleChange}
          required
        >
          <option value="">{t('common.select')}</option>
          <option value="rule_violation">{t('moderator.ruleViolation')}</option>
          <option value="abuse_of_power">{t('moderator.abuseOfPower')}</option>
          <option value="inappropriate_behavior">{t('moderator.inappropriateBehavior')}</option>
          <option value="negligence">{t('moderator.negligence')}</option>
          <option value="other">{t('common.other')}</option>
        </select>
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="description">{t('moderator.penaltyDescription')}</label>
        <textarea
          id="description"
          name="description"
          className="admin-form-textarea"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
        />
      </div>
      
      <div className="admin-form-group">
        <label htmlFor="severity">{t('moderator.penaltySeverity')}</label>
        <select
          id="severity"
          name="severity"
          className="admin-form-select"
          value={formData.severity}
          onChange={handleChange}
          required
        >
          <option value="minor">{t('moderator.minor')}</option>
          <option value="moderate">{t('moderator.moderate')}</option>
          <option value="severe">{t('moderator.severe')}</option>
        </select>
        
        {formData.severity === 'severe' && (
          <div className="severity-warning">
            <p className="text-danger">
              {t('moderator.severeWarning')}
            </p>
          </div>
        )}
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
          disabled={!formData.reason || !formData.description}
        >
          {t('moderator.issuePenalty')}
        </button>
      </div>
    </form>
  );
};

export default ModeratorPenaltyForm;
