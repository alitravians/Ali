import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import AnnouncementForm from './AnnouncementForm';
import { useAuth } from '../../../contexts/AuthContext';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcementsData = [];
      querySnapshot.forEach((doc) => {
        announcementsData.push({ ...doc.data(), id: doc.id });
      });
      setAnnouncements(announcementsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleActive = async (announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        isActive: !announcement.isActive,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.displayName
      });
      
      toast.success(
        announcement.isActive 
          ? t('announcement.deactivated') 
          : t('announcement.activated')
      );
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      toast.error(t('announcement.updateError'));
    }
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm(t('announcement.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        toast.success(t('announcement.deleteSuccess'));
      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast.error(t('announcement.deleteError'));
      }
    }
  };

  const editAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowForm(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="announcement-list">
      <div className="section-header">
        <h2>{t('admin.announcements')}</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setSelectedAnnouncement(null);
            setShowForm(true);
          }}
        >
          {t('announcement.create')}
        </button>
      </div>
      
      {announcements.length === 0 ? (
        <p className="no-data">{t('announcement.noAnnouncements')}</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>{t('announcement.title')}</th>
                <th>{t('announcement.type')}</th>
                <th>{t('announcement.duration')}</th>
                <th>{t('announcement.status')}</th>
                <th>{t('announcement.createdAt')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(announcement => (
                <tr key={announcement.id} className={announcement.isActive ? 'active-row' : ''}>
                  <td>{announcement.title}</td>
                  <td>{t(`announcement.type${announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}`)}</td>
                  <td>{announcement.duration} {t('common.seconds')}</td>
                  <td>
                    <span className={`status-badge ${announcement.isActive ? 'active' : 'inactive'}`}>
                      {announcement.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>{formatDate(announcement.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => editAnnouncement(announcement)}
                        title={t('common.edit')}
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => toggleActive(announcement)}
                        title={announcement.isActive ? t('common.deactivate') : t('common.activate')}
                      >
                        {announcement.isActive ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => deleteAnnouncement(announcement.id)}
                        title={t('common.delete')}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showForm && (
        <AnnouncementForm 
          announcement={selectedAnnouncement} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
          }}
        />
      )}
    </div>
  );
};

export default AnnouncementList;
