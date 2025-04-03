import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/LocalAuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ErrorBoundary from './ErrorBoundary';

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      console.log('AdminRoute - Auth state loaded');
      console.log('AdminRoute - currentUser:', currentUser ? 'Exists' : 'Null');
      console.log('AdminRoute - isAdmin function exists:', typeof isAdmin === 'function');
      
      if (currentUser && typeof isAdmin === 'function') {
        try {
          const adminStatus = isAdmin();
          console.log('AdminRoute - isAdmin():', adminStatus);
          setAuthChecked(true);
        } catch (err) {
          console.error('Error checking admin status:', err);
          setError(err);
          toast.error(t('admin.authError'));
          setAuthChecked(true);
        }
      } else {
        setAuthChecked(true);
      }
    }
  }, [currentUser, isAdmin, loading, t]);

  if (loading) {
    return <div className="loading-screen">{t('common.loading')}</div>;
  }

  if (error) {
    console.error('AdminRoute - Authentication error:', error);
    return (
      <div className="auth-error">
        <h3>{t('admin.authError')}</h3>
        <p>{t('common.pleaseRefresh')}</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="btn btn-primary"
        >
          {t('auth.login')}
        </button>
      </div>
    );
  }

  try {
    if (!authChecked) {
      console.log('AdminRoute - Auth check not completed yet');
      return <div className="loading-screen">{t('common.loading')}</div>;
    }
    
    if (!currentUser) {
      console.log('AdminRoute - Access denied: No user');
      return <Navigate to="/login" />;
    }
    
    if (!isAdmin || !isAdmin()) {
      console.log('AdminRoute - Access denied: User is not admin');
      return <Navigate to="/login" />;
    }
    
    console.log('AdminRoute - Access granted: User is admin');
    return <ErrorBoundary>{children}</ErrorBoundary>;
  } catch (err) {
    console.error('Error in AdminRoute render:', err);
    setError(err);
    toast.error(t('admin.authError'));
    return <Navigate to="/login" />;
  }
};

export default AdminRoute;
