import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModeratorForm = ({ users, onSubmit, onCancel }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const { t } = useTranslation();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      return;
    }
    onSubmit(selectedUserId);
  };
  
  return (
    <form onSubmit={handleSubmit} className="moderator-form">
      <div className="admin-form-group">
        <label htmlFor="userId">{t('moderator.selectUser')}</label>
        <select
          id="userId"
          className="admin-form-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
        >
          <option value="">{t('common.select')}</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </div>
      
      <div className="admin-form-group">
        <p className="form-info">
          {t('moderator.promotionInfo')}
        </p>
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
          className="btn btn-primary"
          disabled={!selectedUserId}
        >
          {t('moderator.add')}
        </button>
      </div>
    </form>
  );
};

export default ModeratorForm;
