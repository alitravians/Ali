import { useState, useEffect } from 'react';
import axios from 'axios';

interface AIScannerProps {
  language: 'ar' | 'en';
  apiUrl: string;
  onBack: () => void;
}

interface DiagnosticCheck {
  check: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details: any;
  duration: number;
  weight: number;
}

interface DiagnosticRun {
  run_id: string;
  status: 'starting' | 'running' | 'completed';
  progress: number;
  started_at: string;
  completed_at?: string;
  current_check?: string;
  checks: DiagnosticCheck[];
  summary?: {
    total_checks: number;
    passed: number;
    warnings: number;
    errors: number;
    overall_status: string;
  };
}

const AIScanner = ({ language, apiUrl, onBack }: AIScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [currentRun, setCurrentRun] = useState<DiagnosticRun | null>(null);
  const [previousRuns, setPreviousRuns] = useState<DiagnosticRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<DiagnosticRun | null>(null);

  const texts = {
    ar: {
      title: 'الماسح الذكي للأخطاء',
      startScan: 'بدء المسح',
      scanning: 'جاري المسح...',
      progress: 'التقدم',
      currentCheck: 'الفحص الحالي',
      results: 'النتائج',
      summary: 'الملخص',
      totalChecks: 'إجمالي الفحوصات',
      passed: 'نجح',
      warnings: 'تحذيرات',
      errors: 'أخطاء',
      overallStatus: 'الحالة العامة',
      healthy: 'سليم',
      issuesFound: 'تم العثور على مشاكل',
      exportTxt: 'تصدير TXT',
      exportJson: 'تصدير JSON',
      back: 'رجوع',
      previousRuns: 'عمليات المسح السابقة',
      viewDetails: 'عرض التفاصيل',
      noRuns: 'لا توجد عمليات مسح سابقة',
      checkName: 'اسم الفحص',
      status: 'الحالة',
      message: 'الرسالة',
      duration: 'المدة',
      details: 'التفاصيل',
      success: 'نجاح',
      warning: 'تحذير',
      error: 'خطأ',
      startedAt: 'بدأ في',
      completedAt: 'انتهى في',
      scanCompleted: 'اكتمل المسح!',
      description: 'نظام مسح ذكي شامل يفحص جميع جوانب الموقع ويكتشف الأخطاء تلقائياً',
    },
    en: {
      title: 'AI Error Scanner',
      startScan: 'Start Scan',
      scanning: 'Scanning...',
      progress: 'Progress',
      currentCheck: 'Current Check',
      results: 'Results',
      summary: 'Summary',
      totalChecks: 'Total Checks',
      passed: 'Passed',
      warnings: 'Warnings',
      errors: 'Errors',
      overallStatus: 'Overall Status',
      healthy: 'Healthy',
      issuesFound: 'Issues Found',
      exportTxt: 'Export TXT',
      exportJson: 'Export JSON',
      back: 'Back',
      previousRuns: 'Previous Scans',
      viewDetails: 'View Details',
      noRuns: 'No previous scans',
      checkName: 'Check Name',
      status: 'Status',
      message: 'Message',
      duration: 'Duration',
      details: 'Details',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      startedAt: 'Started At',
      completedAt: 'Completed At',
      scanCompleted: 'Scan Completed!',
      description: 'Comprehensive AI-powered scanning system that checks all aspects of the site and automatically detects errors',
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadPreviousRuns();
  }, []);

  useEffect(() => {
    if (currentRun && currentRun.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${apiUrl}/api/diagnostics/run/${currentRun.run_id}`);
          setCurrentRun(response.data);
          
          if (response.data.status === 'completed') {
            setScanning(false);
            clearInterval(interval);
            loadPreviousRuns();
          }
        } catch (error) {
          console.error('Failed to fetch run status', error);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [currentRun]);

  const loadPreviousRuns = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/diagnostics/runs`);
      setPreviousRuns(response.data.runs);
    } catch (error) {
      console.error('Failed to load previous runs', error);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      setSelectedRun(null);
      const response = await axios.post(`${apiUrl}/api/diagnostics/scan`);
      const runId = response.data.run_id;
      
      const runResponse = await axios.get(`${apiUrl}/api/diagnostics/run/${runId}`);
      setCurrentRun(runResponse.data);
    } catch (error) {
      console.error('Failed to start scan', error);
      setScanning(false);
      alert('Failed to start scan');
    }
  };

  const exportTxt = async () => {
    if (!currentRun || currentRun.status !== 'completed') return;
    
    try {
      const response = await axios.get(`${apiUrl}/api/diagnostics/run/${currentRun.run_id}/report.txt`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diagnostic-report-${currentRun.run_id}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export TXT', error);
      alert('Failed to export report');
    }
  };

  const exportJson = () => {
    if (!currentRun || currentRun.status !== 'completed') return;
    
    const dataStr = JSON.stringify(currentRun, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `diagnostic-report-${currentRun.run_id}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success': return 'status-success';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return t.success;
      case 'warning': return t.warning;
      case 'error': return t.error;
      default: return status;
    }
  };

  const displayRun = selectedRun || currentRun;

  return (
    <div className="ai-scanner-page">
      <div className="ai-scanner-container">
        <div className="scanner-header">
          <h2>{t.title}</h2>
          <p className="scanner-description">{t.description}</p>
        </div>

        <div className="scanner-controls">
          <button 
            onClick={startScan} 
            disabled={scanning}
            className="scan-button"
          >
            {scanning ? t.scanning : t.startScan}
          </button>
          <button onClick={onBack} className="back-button">{t.back}</button>
        </div>

        {displayRun && (
          <div className="scan-results-container">
            {displayRun.status !== 'completed' && (
              <div className="progress-section">
                <div className="progress-header">
                  <span>{t.progress}: {displayRun.progress}%</span>
                  {displayRun.current_check && (
                    <span className="current-check">{t.currentCheck}: {displayRun.current_check}</span>
                  )}
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${displayRun.progress}%` }}
                  />
                </div>
              </div>
            )}

            {displayRun.status === 'completed' && displayRun.summary && (
              <>
                <div className="scan-completed-banner">
                  ✓ {t.scanCompleted}
                </div>

                <div className="summary-section">
                  <h3>{t.summary}</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">{t.totalChecks}:</span>
                      <span className="summary-value">{displayRun.summary.total_checks}</span>
                    </div>
                    <div className="summary-item success">
                      <span className="summary-label">{t.passed}:</span>
                      <span className="summary-value">{displayRun.summary.passed}</span>
                    </div>
                    <div className="summary-item warning">
                      <span className="summary-label">{t.warnings}:</span>
                      <span className="summary-value">{displayRun.summary.warnings}</span>
                    </div>
                    <div className="summary-item error">
                      <span className="summary-label">{t.errors}:</span>
                      <span className="summary-value">{displayRun.summary.errors}</span>
                    </div>
                    <div className="summary-item overall">
                      <span className="summary-label">{t.overallStatus}:</span>
                      <span className="summary-value">
                        {displayRun.summary.overall_status === 'healthy' ? t.healthy : t.issuesFound}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="export-buttons">
                  <button onClick={exportTxt} className="export-btn">{t.exportTxt}</button>
                  <button onClick={exportJson} className="export-btn">{t.exportJson}</button>
                </div>
              </>
            )}

            {displayRun.checks && displayRun.checks.length > 0 && (
              <div className="checks-section">
                <h3>{t.results}</h3>
                <div className="checks-list">
                  {displayRun.checks.map((check, index) => (
                    <div key={index} className={`check-item ${getStatusClass(check.status)}`}>
                      <div className="check-header">
                        <span className="check-name">{check.check}</span>
                        <span className={`check-status ${getStatusClass(check.status)}`}>
                          {getStatusText(check.status)}
                        </span>
                      </div>
                      <div className="check-message">{check.message}</div>
                      <div className="check-duration">{t.duration}: {check.duration.toFixed(3)}s</div>
                      {check.details && Object.keys(check.details).length > 0 && (
                        <div className="check-details">
                          <strong>{t.details}:</strong>
                          <pre>{JSON.stringify(check.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {previousRuns.length > 0 && !scanning && (
          <div className="previous-runs-section">
            <h3>{t.previousRuns}</h3>
            <div className="runs-list">
              {previousRuns.map((run) => (
                <div 
                  key={run.run_id} 
                  className={`run-item ${selectedRun?.run_id === run.run_id ? 'selected' : ''}`}
                  onClick={() => setSelectedRun(run)}
                >
                  <div className="run-header">
                    <span className="run-id">ID: {run.run_id.substring(0, 8)}...</span>
                    <span className={`run-status ${run.status}`}>{run.status}</span>
                  </div>
                  <div className="run-time">
                    {t.startedAt}: {new Date(run.started_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                  {run.summary && (
                    <div className="run-summary">
                      <span className="success">{run.summary.passed} ✓</span>
                      <span className="warning">{run.summary.warnings} ⚠</span>
                      <span className="error">{run.summary.errors} ✗</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {previousRuns.length === 0 && !scanning && !currentRun && (
          <div className="no-runs-message">
            <p>{t.noRuns}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIScanner;
