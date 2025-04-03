import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';

const ChatSettings = () => {
  const [settings, setSettings] = useState({
    isOpen: true,
    maintenanceMode: false,
    closedReason: '',
    maintenanceReason: '',
    maintenanceEndTime: new Date(Date.now() + 3600000), // Default 1 hour from now
    lastUpdatedBy: '',
    lastUpdatedAt: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'chatSettings', 'settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const endTime = data.maintenanceEndTime ? data.maintenanceEndTime.toDate() : new Date(Date.now() + 3600000);
          setSettings({
            ...data,
            maintenanceEndTime: endTime
          });
        }
      } catch (error) {
        console.error('Error fetching chat settings:', error);
        toast.error(t('settings.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (date) => {
    setSettings(prev => ({
      ...prev,
      maintenanceEndTime: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateDoc(doc(db, 'chatSettings', 'settings'), {
        ...settings,
        lastUpdatedBy: currentUser.displayName,
        lastUpdatedAt: serverTimestamp()
      });
      
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      console.error('Error saving chat settings:', error);
      toast.error(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : timestamp.toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="chat-settings">
      <div className="section-header">
        <h2>{t('admin.chatControl')}</h2>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{t('settings.chatStatus')}</h3>
          {settings.lastUpdatedAt && (
            <div className="last-updated">
              {t('settings.lastUpdated')}: {formatDate(settings.lastUpdatedAt)} 
              {settings.lastUpdatedBy && ` ${t('common.by')} ${settings.lastUpdatedBy}`}
            </div>
          )}
        </div>
        
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="status-options">
              <div className="admin-form-group">
                <div className="form-check">
                  <input
                    type="radio"
                    id="status-open"
                    name="maintenanceMode"
                    className="form-check-input"
                    checked={!settings.maintenanceMode && settings.isOpen}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      isOpen: true,
                      maintenanceMode: false
                    }))}
                  />
                  <label htmlFor="status-open" className="form-check-label">
                    {t('settings.open')}
                  </label>
                </div>
                
                <div className="form-check">
                  <input
                    type="radio"
                    id="status-closed"
                    name="maintenanceMode"
                    className="form-check-input"
                    checked={!settings.maintenanceMode && !settings.isOpen}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      isOpen: false,
                      maintenanceMode: false
                    }))}
                  />
                  <label htmlFor="status-closed" className="form-check-label">
                    {t('settings.closed')}
                  </label>
                </div>
                
                <div className="form-check">
                  <input
                    type="radio"
                    id="status-maintenance"
                    name="maintenanceMode"
                    className="form-check-input"
                    checked={settings.maintenanceMode}
                    onChange={() => setSettings(prev => ({
                      ...prev,
                      isOpen: false,
                      maintenanceMode: true
                    }))}
                  />
                  <label htmlFor="status-maintenance" className="form-check-label">
                    {t('settings.maintenance')}
                  </label>
                </div>
              </div>
            </div>
            
            {!settings.isOpen && !settings.maintenanceMode && (
              <div className="admin-form-group">
                <label htmlFor="closedReason">{t('settings.closedReason')}</label>
                <textarea
                  id="closedReason"
                  name="closedReason"
                  className="admin-form-textarea"
                  value={settings.closedReason}
                  onChange={handleChange}
                  required={!settings.isOpen && !settings.maintenanceMode}
                  rows={3}
                />
              </div>
            )}
            
            {settings.maintenanceMode && (
              <>
                <div className="admin-form-group">
                  <label htmlFor="maintenanceReason">{t('settings.maintenanceReason')}</label>
                  <textarea
                    id="maintenanceReason"
                    name="maintenanceReason"
                    className="admin-form-textarea"
                    value={settings.maintenanceReason}
                    onChange={handleChange}
                    required={settings.maintenanceMode}
                    rows={3}
                  />
                </div>
                
                <div className="admin-form-group">
                  <label htmlFor="maintenanceEndTime">{t('settings.maintenanceEndTime')}</label>
                  <div className="datetime-picker-container">
                    <DateTimePicker
                      onChange={handleDateChange}
                      value={settings.maintenanceEndTime}
                      className="admin-datetime-picker"
                      minDate={new Date()}
                      required={settings.maintenanceMode}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="admin-card-footer">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? t('common.saving') : t('settings.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{t('settings.chatControls')}</h3>
        </div>
        
        <div className="admin-card-body">
          <div className="chat-controls">
            <div className="control-item">
              <h4>{t('settings.quickActions')}</h4>
              <div className="action-buttons">
                <button 
                  className="btn btn-success"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    isOpen: true,
                    maintenanceMode: false
                  }))}
                  disabled={settings.isOpen && !settings.maintenanceMode}
                >
                  {t('settings.openChat')}
                </button>
                
                <button 
                  className="btn btn-danger"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    isOpen: false,
                    maintenanceMode: false,
                    closedReason: t('settings.temporarilyClosed')
                  }))}
                  disabled={!settings.isOpen && !settings.maintenanceMode}
                >
                  {t('settings.closeChat')}
                </button>
                
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    const endTime = new Date();
                    endTime.setMinutes(endTime.getMinutes() + 30);
                    
                    setSettings(prev => ({
                      ...prev,
                      isOpen: false,
                      maintenanceMode: true,
                      maintenanceReason: t('settings.scheduledMaintenance'),
                      maintenanceEndTime: endTime
                    }));
                  }}
                  disabled={settings.maintenanceMode}
                >
                  {t('settings.maintenance30Min')}
                </button>
              </div>
            </div>
            
            <div className="control-item">
              <h4>{t('settings.currentStatus')}</h4>
              <div className="status-display">
                <div className="status-indicator">
                  <span className={`status-badge ${settings.maintenanceMode ? 'maintenance' : (settings.isOpen ? 'open' : 'closed')}`}>
                    {settings.maintenanceMode 
                      ? t('settings.maintenance') 
                      : (settings.isOpen ? t('settings.open') : t('settings.closed'))}
                  </span>
                </div>
                
                {settings.maintenanceMode && settings.maintenanceEndTime && (
                  <div className="end-time">
                    {t('settings.endsAt')}: {settings.maintenanceEndTime.toLocaleString()}
                  </div>
                )}
                
                {!settings.isOpen && !settings.maintenanceMode && settings.closedReason && (
                  <div className="reason">
                    {t('settings.reason')}: {settings.closedReason}
                  </div>
                )}
                
                {settings.maintenanceMode && settings.maintenanceReason && (
                  <div className="reason">
                    {t('settings.reason')}: {settings.maintenanceReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
