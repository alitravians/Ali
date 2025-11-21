import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusSummary, ServiceStatus, IncidentStage } from '../types';
import { Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicStatusPage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await api.getStatusSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const eventSource = api.streamStatus();
    eventSource.onmessage = () => {
      loadData();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.OPERATIONAL:
        return 'bg-green-500';
      case ServiceStatus.DEGRADED:
        return 'bg-yellow-500';
      case ServiceStatus.PARTIAL_OUTAGE:
        return 'bg-orange-500';
      case ServiceStatus.MAJOR_OUTAGE:
        return 'bg-red-500';
      case ServiceStatus.MAINTENANCE:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.OPERATIONAL:
        return t('operational');
      case ServiceStatus.DEGRADED:
        return t('degraded');
      case ServiceStatus.PARTIAL_OUTAGE:
        return t('partial_outage_status');
      case ServiceStatus.MAJOR_OUTAGE:
        return t('major_outage_status');
      case ServiceStatus.MAINTENANCE:
        return t('maintenance_status');
      default:
        return status;
    }
  };

  const getOverallStatusText = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.OPERATIONAL:
        return t('all_systems_operational');
      case ServiceStatus.DEGRADED:
        return t('some_systems_degraded');
      case ServiceStatus.PARTIAL_OUTAGE:
        return t('partial_outage');
      case ServiceStatus.MAJOR_OUTAGE:
        return t('major_outage');
      case ServiceStatus.MAINTENANCE:
        return t('under_maintenance');
      default:
        return status;
    }
  };

  const getStageText = (stage: IncidentStage) => {
    switch (stage) {
      case IncidentStage.INVESTIGATING:
        return t('investigating');
      case IncidentStage.IDENTIFIED:
        return t('identified');
      case IncidentStage.MONITORING:
        return t('monitoring');
      case IncidentStage.RESOLVED:
        return t('resolved');
      default:
        return stage;
    }
  };

  const getStageColor = (stage: IncidentStage) => {
    switch (stage) {
      case IncidentStage.INVESTIGATING:
        return 'bg-red-100 text-red-800';
      case IncidentStage.IDENTIFIED:
        return 'bg-orange-100 text-orange-800';
      case IncidentStage.MONITORING:
        return 'bg-yellow-100 text-yellow-800';
      case IncidentStage.RESOLVED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('error')}: {error}</p>
          <Button onClick={loadData} className="mt-4">
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const siteName = i18n.language === 'ar' ? data.settings.site_name_ar : data.settings.site_name_en;

  if (data.settings.maintenance_mode) {
    const maintenanceMessage = i18n.language === 'ar' 
      ? data.settings.maintenance_message_ar 
      : data.settings.maintenance_message_en;

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background with cycling colors */}
        <div 
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #4facfe 60%, #00f2fe 80%, #667eea 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradient 10s ease infinite'
          }}
        />
        
        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>

        {/* Language toggle button - positioned at top right */}
        <div className="absolute top-6 right-6 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-white/90 hover:bg-white"
          >
            <Globe className="w-4 h-4" />
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </Button>
        </div>

        {/* Maintenance message popup frame */}
        <div className="relative z-10 max-w-2xl mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center transform hover:scale-105 transition-transform duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {i18n.language === 'ar' ? 'الموقع تحت الصيانة' : 'Site Under Maintenance'}
              </h1>
            </div>
            
            {maintenanceMessage && (
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                {maintenanceMessage}
              </p>
            )}
            
            <Link to="/admin/login">
              <Button size="lg" className="flex items-center gap-2 mx-auto">
                <Shield className="w-5 h-5" />
                {i18n.language === 'ar' ? 'إدارة الموقع' : 'Site Management'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{siteName}</h1>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
              <Link to="/admin/login">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t('admin')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className={`mb-8 p-6 rounded-lg ${getStatusColor(data.overall_status)} bg-opacity-10 border-2 ${getStatusColor(data.overall_status)} border-opacity-50`}>
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(data.overall_status)}`}></div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {getOverallStatusText(data.overall_status)}
            </h2>
          </div>
        </div>

        {data.active_incidents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('incidents')}</h3>
            <div className="space-y-4">
              {data.active_incidents.map((incident) => (
                <div key={incident.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {i18n.language === 'ar' ? incident.title_ar : incident.title_en}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(incident.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(incident.stage)}`}>
                      {getStageText(incident.stage)}
                    </span>
                  </div>
                  
                  {incident.affected_services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('affected_services')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.affected_services.map((serviceId) => {
                          const service = data.services.find(s => s.id === serviceId);
                          if (!service) return null;
                          return (
                            <span key={serviceId} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                              {i18n.language === 'ar' ? service.name_ar : service.name_en}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    {incident.updates.map((update) => (
                      <div key={update.id} className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusColor(ServiceStatus.OPERATIONAL)}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStageColor(update.stage)}`}>
                              {getStageText(update.stage)}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(update.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {i18n.language === 'ar' ? update.message_ar : update.message_en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.upcoming_maintenance.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('scheduled_maintenance')}</h3>
            <div className="space-y-4">
              {data.upcoming_maintenance.map((maintenance) => (
                <div key={maintenance.id} className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {i18n.language === 'ar' ? maintenance.title_ar : maintenance.title_en}
                  </h4>
                  <p className="text-gray-700 mb-3">
                    {i18n.language === 'ar' ? maintenance.description_ar : maintenance.description_en}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('scheduled_for')}: {formatDate(maintenance.scheduled_start)} {t('to')} {formatDate(maintenance.scheduled_end)}
                  </p>
                  {maintenance.affected_services.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('affected_services')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {maintenance.affected_services.map((serviceId) => {
                          const service = data.services.find(s => s.id === serviceId);
                          if (!service) return null;
                          return (
                            <span key={serviceId} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                              {i18n.language === 'ar' ? service.name_ar : service.name_en}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('services')}</h3>
          {data.categories.filter(c => c.visible).map((category) => {
            const categoryServices = data.services.filter(s => s.category_id === category.id && s.visible);
            if (categoryServices.length === 0) return null;

            return (
              <div key={category.id} className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">
                  {i18n.language === 'ar' ? category.name_ar : category.name_en}
                </h4>
                <div className="bg-white rounded-lg shadow-sm divide-y">
                  {categoryServices.map((service) => (
                    <div key={service.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {i18n.language === 'ar' ? service.name_ar : service.name_en}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {i18n.language === 'ar' ? service.description_ar : service.description_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusText(service.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>{t('last_updated')}: {data.services.length > 0 ? formatDate(data.services[0].last_updated) : '-'}</p>
        </div>
      </footer>
    </div>
  );
}
