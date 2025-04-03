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
import ReportDetails from './ReportDetails';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ ...doc.data(), id: doc.id });
      });
      setReports(reportsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleReportAction = async (action) => {
    if (!selectedReport) return;
    
    try {
      await updateDoc(doc(db, 'reports', selectedReport.id), {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: currentUser.displayName,
        reviewedAt: serverTimestamp()
      });
      
      if (action === 'approve' && selectedReport.messageId) {
        await updateDoc(doc(db, 'messages', selectedReport.messageId), {
          isDeleted: true,
          deletedBy: 'admin',
          deletedReason: selectedReport.reason
        });
        
        toast.success(t('report.messageDeleted'));
      }
      
      if (action === 'approve' && selectedReport.targetId) {
        const userDoc = await getDoc(doc(db, 'users', selectedReport.targetId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.status === 'banned' || userData.role === 'admin') {
            toast.info(t('report.userAlreadyBanned'));
            return;
          }
          
          const banExpiresAt = new Date();
          banExpiresAt.setMinutes(banExpiresAt.getMinutes() + 60); // 1 hour ban
          
          const banInfo = {
            id: selectedReport.id,
            reason: selectedReport.reason,
            duration: 60,
            bannedBy: currentUser.displayName,
            bannedAt: serverTimestamp(),
            expiresAt: banExpiresAt
          };
          
          await updateDoc(doc(db, 'users', selectedReport.targetId), {
            status: 'banned',
            banInfo
          });
          
          toast.success(t('report.userBanned'));
        }
      }
      
      toast.success(
        action === 'approve' 
          ? t('report.approved') 
          : t('report.rejected')
      );
      
      const updatedReport = await getDoc(doc(db, 'reports', selectedReport.id));
      if (updatedReport.exists()) {
        setSelectedReport({
          ...updatedReport.data(),
          id: updatedReport.id
        });
      }
    } catch (error) {
      console.error('Error handling report action:', error);
      toast.error(t('report.actionError'));
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return report.status === 'pending';
    if (filter === 'approved') return report.status === 'approved';
    if (filter === 'rejected') return report.status === 'rejected';
    if (filter === 'ai-reviewed') return report.status === 'ai-reviewed';
    return true;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="reports-management">
      <div className="section-header">
        <h2>{t('admin.reports')}</h2>
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
            <option value="ai-reviewed">{t('admin.aiReviewed')}</option>
          </select>
        </div>
      </div>
      
      <div className="reports-container">
        <div className="reports-list">
          {filteredReports.length === 0 ? (
            <p className="no-data">{t('report.noReports')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('report.type')}</th>
                    <th>{t('report.reason')}</th>
                    <th>{t('report.reporter')}</th>
                    <th>{t('report.timestamp')}</th>
                    <th>{t('report.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr 
                      key={report.id} 
                      className={`report-row ${report.status} ${selectedReport?.id === report.id ? 'selected' : ''}`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <td>
                        {report.messageId 
                          ? t('report.messageReport') 
                          : t('report.userReport')}
                      </td>
                      <td>{t(`report.${report.reason}`, report.reason)}</td>
                      <td>{report.reporterName}</td>
                      <td>{formatDate(report.timestamp)}</td>
                      <td>
                        <span className={`status-badge ${report.status}`}>
                          {t(`admin.${report.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="report-details-panel">
          {selectedReport ? (
            <ReportDetails 
              report={selectedReport} 
              onApprove={() => handleReportAction('approve')}
              onReject={() => handleReportAction('reject')}
            />
          ) : (
            <div className="no-selection">
              {t('report.selectReport')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportList;
