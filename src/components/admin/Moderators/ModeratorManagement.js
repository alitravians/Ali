import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import ModeratorForm from './ModeratorForm';
import ModeratorPenaltyForm from './ModeratorPenaltyForm';
import ModeratorLogs from './ModeratorLogs';

const ModeratorManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const moderatorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'moderator'),
      orderBy('username')
    );

    const unsubscribeModerators = onSnapshot(moderatorsQuery, (querySnapshot) => {
      const moderatorsData = [];
      querySnapshot.forEach((doc) => {
        moderatorsData.push({ ...doc.data(), id: doc.id });
      });
      setModerators(moderatorsData);
      setLoading(false);
    });

    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'user'),
      where('status', '==', 'active'),
      orderBy('username')
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ ...doc.data(), id: doc.id });
      });
      setUsers(usersData);
    });

    return () => {
      unsubscribeModerators();
      unsubscribeUsers();
    };
  }, []);

  const handleAddModerator = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        toast.error(t('moderator.userNotFound'));
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.role === 'admin') {
        toast.error(t('moderator.cannotModifyAdmin'));
        return;
      }
      
      if (userData.role === 'moderator') {
        toast.info(t('moderator.alreadyModerator'));
        return;
      }
      
      await updateDoc(doc(db, 'users', userId), {
        role: 'moderator',
        promotedBy: currentUser.uid,
        promotedAt: serverTimestamp()
      });
      
      await setDoc(doc(collection(db, 'moderatorLogs')), {
        type: 'promotion',
        moderatorId: userId,
        moderatorName: userData.username,
        performedBy: currentUser.displayName,
        performedById: currentUser.uid,
        timestamp: serverTimestamp()
      });
      
      toast.success(t('moderator.addSuccess'));
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding moderator:', error);
      toast.error(t('moderator.addError'));
    }
  };

  const handleRemoveModerator = async (moderatorId) => {
    try {
      const moderatorDoc = await getDoc(doc(db, 'users', moderatorId));
      
      if (!moderatorDoc.exists()) {
        toast.error(t('moderator.userNotFound'));
        return;
      }
      
      const moderatorData = moderatorDoc.data();
      
      if (moderatorData.role !== 'moderator') {
        toast.error(t('moderator.notModerator'));
        return;
      }
      
      await updateDoc(doc(db, 'users', moderatorId), {
        role: 'user',
        demotedBy: currentUser.uid,
        demotedAt: serverTimestamp()
      });
      
      await setDoc(doc(collection(db, 'moderatorLogs')), {
        type: 'demotion',
        moderatorId: moderatorId,
        moderatorName: moderatorData.username,
        performedBy: currentUser.displayName,
        performedById: currentUser.uid,
        timestamp: serverTimestamp(),
        reason: 'Admin decision'
      });
      
      toast.success(t('moderator.removeSuccess'));
      setSelectedModerator(null);
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast.error(t('moderator.removeError'));
    }
  };

  const handleAddPenalty = async (moderatorId, penaltyData) => {
    try {
      const moderatorDoc = await getDoc(doc(db, 'users', moderatorId));
      
      if (!moderatorDoc.exists()) {
        toast.error(t('moderator.userNotFound'));
        return;
      }
      
      const moderatorData = moderatorDoc.data();
      
      if (moderatorData.role !== 'moderator') {
        toast.error(t('moderator.notModerator'));
        return;
      }
      
      const penaltyRef = doc(collection(db, 'moderatorPenalties'));
      await setDoc(penaltyRef, {
        moderatorId: moderatorId,
        moderatorName: moderatorData.username,
        reason: penaltyData.reason,
        description: penaltyData.description,
        severity: penaltyData.severity,
        issuedBy: currentUser.displayName,
        issuedById: currentUser.uid,
        timestamp: serverTimestamp(),
        status: 'active'
      });
      
      await setDoc(doc(collection(db, 'moderatorLogs')), {
        type: 'penalty',
        moderatorId: moderatorId,
        moderatorName: moderatorData.username,
        performedBy: currentUser.displayName,
        performedById: currentUser.uid,
        timestamp: serverTimestamp(),
        penaltyId: penaltyRef.id,
        reason: penaltyData.reason,
        severity: penaltyData.severity
      });
      
      if (penaltyData.severity === 'severe') {
        await updateDoc(doc(db, 'users', moderatorId), {
          role: 'user',
          demotedBy: currentUser.uid,
          demotedAt: serverTimestamp(),
          demotionReason: penaltyData.reason
        });
        
        toast.info(t('moderator.demotedDueToPenalty'));
      }
      
      toast.success(t('moderator.penaltySuccess'));
      setShowPenaltyForm(false);
    } catch (error) {
      console.error('Error adding penalty:', error);
      toast.error(t('moderator.penaltyError'));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="moderator-management">
      <div className="section-header">
        <h2>{t('admin.moderators')}</h2>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            {t('moderator.add')}
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('moderator.add')}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowAddForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <ModeratorForm 
                users={users}
                onSubmit={handleAddModerator}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {showPenaltyForm && selectedModerator && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('moderator.penalty')}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowPenaltyForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <ModeratorPenaltyForm 
                moderator={selectedModerator}
                onSubmit={(data) => handleAddPenalty(selectedModerator.id, data)}
                onCancel={() => setShowPenaltyForm(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {showLogs && selectedModerator && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('moderator.logs')}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowLogs(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <ModeratorLogs 
                moderatorId={selectedModerator.id}
                onClose={() => setShowLogs(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{t('admin.moderatorsList')}</h3>
        </div>
        <div className="admin-card-body">
          {moderators.length === 0 ? (
            <p className="no-data">{t('moderator.noModerators')}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('user.username')}</th>
                    <th>{t('user.email')}</th>
                    <th>{t('moderator.promotedAt')}</th>
                    <th>{t('moderator.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {moderators.map(moderator => (
                    <tr 
                      key={moderator.id} 
                      className={selectedModerator?.id === moderator.id ? 'selected' : ''}
                      onClick={() => setSelectedModerator(moderator)}
                    >
                      <td>{moderator.username}</td>
                      <td>{moderator.email}</td>
                      <td>{formatDate(moderator.promotedAt)}</td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-secondary dropdown-toggle">
                            {t('common.actions')}
                          </button>
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item"
                              onClick={() => handleRemoveModerator(moderator.id)}
                            >
                              {t('moderator.remove')}
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedModerator(moderator);
                                setShowLogs(true);
                              }}
                            >
                              {t('moderator.review')}
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedModerator(moderator);
                                setShowPenaltyForm(true);
                              }}
                            >
                              {t('moderator.penalty')}
                            </button>
                          </div>
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

export default ModeratorManagement;
