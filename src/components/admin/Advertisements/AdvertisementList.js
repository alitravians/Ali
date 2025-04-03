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
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import AdvertisementForm from './AdvertisementForm';
import AdvertisementPreview from './AdvertisementPreview';

const AdvertisementList = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { t } = useTranslation();

  useEffect(() => {
    const q = query(
      collection(db, 'advertisements'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const adsData = [];
      querySnapshot.forEach((doc) => {
        adsData.push({ ...doc.data(), id: doc.id });
      });
      setAdvertisements(adsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleToggleActive = async (adId, currentActive) => {
    try {
      await updateDoc(doc(db, 'advertisements', adId), {
        active: !currentActive,
        updatedAt: serverTimestamp()
      });
      
      toast.success(currentActive ? t('ad.deactivated') : t('ad.activated'));
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      toast.error(t('ad.updateError'));
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm(t('ad.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'advertisements', adId));
        toast.success(t('ad.deleteSuccess'));
      } catch (error) {
        console.error('Error deleting advertisement:', error);
        toast.error(t('ad.deleteError'));
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAd(null);
  };

  const filteredAds = advertisements.filter(ad => {
    if (filter === 'all') return true;
    if (filter === 'active') return ad.active;
    if (filter === 'inactive') return !ad.active;
    return true;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : '';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="advertisements-management">
      <div className="section-header">
        <h2>{t('admin.advertisements')}</h2>
        <div className="header-actions">
          <div className="filter-controls">
            <label htmlFor="filter">{t('common.filter')}:</label>
            <select
              id="filter"
              className="form-control"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t('common.all')}</option>
              <option value="active">{t('ad.active')}</option>
              <option value="inactive">{t('ad.inactive')}</option>
            </select>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedAd(null);
              setShowForm(true);
            }}
          >
            {t('ad.create')}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{selectedAd ? t('ad.edit') : t('ad.create')}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => {
                  setShowForm(false);
                  setSelectedAd(null);
                }}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <AdvertisementForm 
                onSuccess={handleFormSuccess}
                editAd={selectedAd}
              />
            </div>
          </div>
        </div>
      )}
      
      {showPreview && selectedAd && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('ad.preview')}: {selectedAd.name}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => {
                  setShowPreview(false);
                }}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <AdvertisementPreview 
                advertisement={selectedAd}
                onClose={() => setShowPreview(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{t('admin.advertisementsList')}</h3>
        </div>
        <div className="admin-card-body">
          {filteredAds.length === 0 ? (
            <p className="no-data">{t('ad.noAds')}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('ad.name')}</th>
                    <th>{t('ad.type')}</th>
                    <th>{t('ad.duration')}</th>
                    <th>{t('ad.status')}</th>
                    <th>{t('ad.updatedAt')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map(ad => (
                    <tr key={ad.id} className={`ad-row ${ad.active ? 'active' : 'inactive'}`}>
                      <td>{ad.name}</td>
                      <td>{t(`ad.${ad.type}`)}</td>
                      <td>{ad.duration} {t('ad.seconds')}</td>
                      <td>
                        <span className={`status-badge ${ad.active ? 'active' : 'inactive'}`}>
                          {ad.active ? t('ad.active') : t('ad.inactive')}
                        </span>
                      </td>
                      <td>{formatDate(ad.updatedAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-info"
                            onClick={() => {
                              setSelectedAd(ad);
                              setShowPreview(true);
                            }}
                            title={t('ad.preview')}
                          >
                            <FiEye />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedAd(ad);
                              setShowForm(true);
                            }}
                            title={t('ad.edit')}
                          >
                            <FiEdit />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleToggleActive(ad.id, ad.active)}
                            title={ad.active ? t('ad.deactivate') : t('ad.activate')}
                          >
                            {ad.active ? <FiEyeOff /> : <FiEye />}
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteAd(ad.id)}
                            title={t('ad.delete')}
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
        </div>
      </div>
    </div>
  );
};

export default AdvertisementList;
