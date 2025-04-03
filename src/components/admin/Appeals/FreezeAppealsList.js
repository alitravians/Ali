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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import AppealDetails from './AppealDetails';

const FreezeAppealsList = () => {
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'freezeAppeals'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appealsData = [];
      querySnapshot.forEach((doc) => {
        appealsData.push({ ...doc.data(), id: doc.id });
      });
      setAppeals(appealsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApproveAppeal = async (appealId) => {
    try {
      const appealDoc = await getDoc(doc(db, 'freezeAppeals', appealId));
      
      if (!appealDoc.exists()) {
        toast.error(t('appeal.notFound'));
        return;
      }
      
      const appealData = appealDoc.data();
      
      if (appealData.status !== 'pending') {
        toast.error(t('appeal.alreadyReviewed'));
        return;
      }
      
      await updateDoc(doc(db, 'freezeAppeals', appealId), {
        status: 'approved',
        reviewedBy: currentUser.displayName,
        reviewedById: currentUser.uid,
        reviewedAt: serverTimestamp(),
        response: t('appeal.approvedResponse')
      });
      
      const userDoc = await getDoc(doc(db, 'users', appealData.userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.status === 'frozen') {
          await updateDoc(doc(db, 'users', appealData.userId), {
            status: 'active',
            freezeInfo: null,
            unfrozenBy: currentUser.displayName,
            unfrozenAt: serverTimestamp(),
            unfrozenReason: 'appeal_approved'
          });
        }
      }
      
      toast.success(t('appeal.approveSuccess'));
      
      setSelectedAppeal({
        ...appealData,
        id: appealId,
        status: 'approved',
        reviewedBy: currentUser.displayName,
        reviewedAt: serverTimestamp(),
        response: t('appeal.approvedResponse')
      });
    } catch (error) {
      console.error('Error approving appeal:', error);
      toast.error(t('appeal.actionError'));
    }
  };

  const handleRejectAppeal = async (appealId, response) => {
    try {
      const appealDoc = await getDoc(doc(db, 'freezeAppeals', appealId));
      
      if (!appealDoc.exists()) {
        toast.error(t('appeal.notFound'));
        return;
      }
      
      const appealData = appealDoc.data();
      
      if (appealData.status !== 'pending') {
        toast.error(t('appeal.alreadyReviewed'));
        return;
      }
      
      await updateDoc(doc(db, 'freezeAppeals', appealId), {
        status: 'rejected',
        reviewedBy: currentUser.displayName,
        reviewedById: currentUser.uid,
        reviewedAt: serverTimestamp(),
        response: response || t('appeal.rejectedResponse')
      });
      
      toast.success(t('appeal.rejectSuccess'));
      
      setSelectedAppeal({
        ...appealData,
        id: appealId,
        status: 'rejected',
        reviewedBy: currentUser.displayName,
        reviewedAt: serverTimestamp(),
        response: response || t('appeal.rejectedResponse')
      });
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      toast.error(t('appeal.actionError'));
    }
  };

  const filteredAppeals = appeals.filter(appeal => {
    if (filter === 'all') return true;
    return appeal.status === filter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : '';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="appeals-management">
      <div className="section-header">
        <h2>{t('admin.freezeAppeals')}</h2>
        <div className="filter-controls">
          <label htmlFor="filter">{t('common.filter')}:</label>
          <select
            id="filter"
            className="form-control"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t('common.all')}</option>
            <option value="pending">{t('admin.pending')}</option>
            <option value="approved">{t('admin.approved')}</option>
            <option value="rejected">{t('admin.rejected')}</option>
          </select>
        </div>
      </div>
      
      <div className="appeals-container">
        <div className="appeals-list">
          {filteredAppeals.length === 0 ? (
            <p className="no-data">{t('appeal.noAppeals')}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('user.username')}</th>
                    <th>{t('appeal.timestamp')}</th>
                    <th>{t('appeal.status')}</th>
                    <th>{t('appeal.reviewedBy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppeals.map(appeal => (
                    <tr 
                      key={appeal.id} 
                      className={`appeal-row ${appeal.status} ${selectedAppeal?.id === appeal.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAppeal(appeal)}
                    >
                      <td>{appeal.username}</td>
                      <td>{formatDate(appeal.timestamp)}</td>
                      <td>
                        <span className={`status-badge ${appeal.status}`}>
                          {t(`admin.${appeal.status}`)}
                        </span>
                      </td>
                      <td>{appeal.reviewedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="appeal-details-panel">
          {selectedAppeal ? (
            <AppealDetails 
              appeal={selectedAppeal}
              appealType="freeze"
              onApprove={() => handleApproveAppeal(selectedAppeal.id)}
              onReject={(response) => handleRejectAppeal(selectedAppeal.id, response)}
            />
          ) : (
            <div className="no-selection">
              {t('appeal.selectAppeal')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreezeAppealsList;
