import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ReportStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    aiReviewed: 0,
    messageReports: 0,
    userReports: 0,
    byReason: {}
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const querySnapshot = await getDocs(reportsRef);
        
        const newStats = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          aiReviewed: 0,
          messageReports: 0,
          userReports: 0,
          byReason: {}
        };
        
        querySnapshot.forEach((doc) => {
          const report = doc.data();
          
          newStats.total++;
          
          if (report.status === 'pending') newStats.pending++;
          if (report.status === 'approved') newStats.approved++;
          if (report.status === 'rejected') newStats.rejected++;
          if (report.status === 'ai-reviewed') newStats.aiReviewed++;
          
          if (report.messageId) newStats.messageReports++;
          else newStats.userReports++;
          
          if (report.reason) {
            if (!newStats.byReason[report.reason]) {
              newStats.byReason[report.reason] = 0;
            }
            newStats.byReason[report.reason]++;
          }
        });
        
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching report stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="report-stats">
      <h3>{t('admin.reportStats')}</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">{t('admin.totalReports')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">{t('admin.pendingReports')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">{t('admin.approvedReports')}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">{t('admin.rejectedReports')}</div>
        </div>
      </div>
      
      <div className="stats-section">
        <h4>{t('admin.reportTypes')}</h4>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">{t('report.messageReport')}:</span>
            <span className="stat-value">{stats.messageReports}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('report.userReport')}:</span>
            <span className="stat-value">{stats.userReports}</span>
          </div>
        </div>
      </div>
      
      {Object.keys(stats.byReason).length > 0 && (
        <div className="stats-section">
          <h4>{t('admin.reportReasons')}</h4>
          <div className="stats-table">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('report.reason')}</th>
                  <th>{t('common.count')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byReason)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([reason, count]) => (
                    <tr key={reason}>
                      <td>{t(`report.${reason}`, reason)}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportStats;
