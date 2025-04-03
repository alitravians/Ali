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
import UserBanForm from './UserBanForm';
import UserFreezeForm from './UserFreezeForm';
import UserDetails from './UserDetails';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanForm, setShowBanForm] = useState(false);
  const [showFreezeForm, setShowFreezeForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('username')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ ...doc.data(), id: doc.id });
      });
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleBanUser = async (userId, banData) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        toast.error(t('user.notFound'));
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.role === 'admin') {
        toast.error(t('user.cannotBanAdmin'));
        return;
      }
      
      let expiresAt = null;
      if (banData.duration !== 'permanent') {
        expiresAt = new Date();
        const durationMinutes = parseInt(banData.duration, 10);
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      }
      
      const banInfo = {
        id: `ban_${Date.now()}`,
        reason: banData.reason,
        duration: banData.duration,
        bannedBy: currentUser.displayName,
        bannedById: currentUser.uid,
        bannedAt: serverTimestamp(),
        expiresAt: expiresAt
      };
      
      await updateDoc(doc(db, 'users', userId), {
        status: 'banned',
        banInfo
      });
      
      toast.success(t('user.banSuccess'));
      setShowBanForm(false);
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: 'banned',
          banInfo
        });
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(t('user.banError'));
    }
  };

  const handleFreezeUser = async (userId, freezeData) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        toast.error(t('user.notFound'));
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.role === 'admin') {
        toast.error(t('user.cannotFreezeAdmin'));
        return;
      }
      
      const freezeInfo = {
        id: `freeze_${Date.now()}`,
        reason: freezeData.reason,
        frozenBy: currentUser.displayName,
        frozenById: currentUser.uid,
        frozenAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'users', userId), {
        status: 'frozen',
        freezeInfo
      });
      
      toast.success(t('user.freezeSuccess'));
      setShowFreezeForm(false);
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: 'frozen',
          freezeInfo
        });
      }
    } catch (error) {
      console.error('Error freezing user:', error);
      toast.error(t('user.freezeError'));
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        toast.error(t('user.notFound'));
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.status !== 'banned') {
        toast.error(t('user.notBanned'));
        return;
      }
      
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        banInfo: null,
        unbannedBy: currentUser.displayName,
        unbannedAt: serverTimestamp()
      });
      
      toast.success(t('user.unbanSuccess'));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: 'active',
          banInfo: null
        });
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error(t('user.unbanError'));
    }
  };

  const handleUnfreezeUser = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        toast.error(t('user.notFound'));
        return;
      }
      
      const userData = userDoc.data();
      
      if (userData.status !== 'frozen') {
        toast.error(t('user.notFrozen'));
        return;
      }
      
      await updateDoc(doc(db, 'users', userId), {
        status: 'active',
        freezeInfo: null,
        unfrozenBy: currentUser.displayName,
        unfrozenAt: serverTimestamp()
      });
      
      toast.success(t('user.unfreezeSuccess'));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: 'active',
          freezeInfo: null
        });
      }
    } catch (error) {
      console.error('Error unfreezing user:', error);
      toast.error(t('user.unfreezeError'));
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter !== 'all' && user.status !== filter) {
      return false;
    }
    
    if (searchTerm && !user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
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
    <div className="user-management">
      <div className="section-header">
        <h2>{t('admin.users')}</h2>
        <div className="filter-controls">
          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-select">
            <label htmlFor="filter">{t('common.filter')}:</label>
            <select
              id="filter"
              className="form-control"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t('common.all')}</option>
              <option value="active">{t('user.active')}</option>
              <option value="banned">{t('user.banned')}</option>
              <option value="frozen">{t('user.frozen')}</option>
            </select>
          </div>
        </div>
      </div>
      
      {showBanForm && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('user.ban')}: {selectedUser.username}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowBanForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <UserBanForm 
                user={selectedUser}
                onSubmit={(data) => handleBanUser(selectedUser.id, data)}
                onCancel={() => setShowBanForm(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {showFreezeForm && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('user.freeze')}: {selectedUser.username}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowFreezeForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <UserFreezeForm 
                user={selectedUser}
                onSubmit={(data) => handleFreezeUser(selectedUser.id, data)}
                onCancel={() => setShowFreezeForm(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {showDetails && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{t('user.details')}: {selectedUser.username}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowDetails(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <UserDetails 
                user={selectedUser}
                onClose={() => setShowDetails(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{t('admin.usersList')}</h3>
        </div>
        <div className="admin-card-body">
          {filteredUsers.length === 0 ? (
            <p className="no-data">{t('user.noUsers')}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('user.username')}</th>
                    <th>{t('user.email')}</th>
                    <th>{t('user.role')}</th>
                    <th>{t('user.status')}</th>
                    <th>{t('user.country')}</th>
                    <th>{t('user.lastLogin')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      className={`user-row ${user.status} ${selectedUser?.id === user.id ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{t(`user.${user.role}`)}</td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {t(`user.${user.status}`)}
                        </span>
                      </td>
                      <td>{user.country || '-'}</td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-secondary dropdown-toggle">
                            {t('common.actions')}
                          </button>
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDetails(true);
                              }}
                            >
                              {t('common.view')}
                            </button>
                            
                            {user.status === 'active' && (
                              <>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowBanForm(true);
                                  }}
                                >
                                  {t('user.ban')}
                                </button>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowFreezeForm(true);
                                  }}
                                >
                                  {t('user.freeze')}
                                </button>
                              </>
                            )}
                            
                            {user.status === 'banned' && (
                              <button 
                                className="dropdown-item"
                                onClick={() => handleUnbanUser(user.id)}
                              >
                                {t('user.unban')}
                              </button>
                            )}
                            
                            {user.status === 'frozen' && (
                              <button 
                                className="dropdown-item"
                                onClick={() => handleUnfreezeUser(user.id)}
                              >
                                {t('user.unfreeze')}
                              </button>
                            )}
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

export default UserManagement;
