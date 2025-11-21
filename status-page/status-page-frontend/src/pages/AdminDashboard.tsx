import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, 
  Server, 
  AlertCircle, 
  Wrench, 
  Settings as SettingsIcon, 
  FileText,
  LogOut,
  Globe,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { Service, Incident, MaintenanceWindow, Settings, AuditLog, ServiceCategory, ServiceStatus, IncidentStage } from '../types';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await api.admin.verify();
      if (!result.authenticated) {
        navigate('/admin/login');
      } else {
        setAuthenticated(true);
      }
    } catch {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.admin.logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/admin/services', icon: Server, label: t('service_management') },
    { path: '/admin/incidents', icon: AlertCircle, label: t('incident_management') },
    { path: '/admin/maintenance', icon: Wrench, label: t('maintenance_management') },
    { path: '/admin/settings', icon: SettingsIcon, label: t('settings') },
    { path: '/admin/audit-logs', icon: FileText, label: t('audit_logs') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin')} - {t('dashboard')}</h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                {t('view_public_page')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Routes>
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="incidents" element={<IncidentsManagement />} />
            <Route path="maintenance" element={<MaintenanceManagement />} />
            <Route path="settings" element={<SettingsManagement />} />
            <Route path="audit-logs" element={<AuditLogsView />} />
            <Route path="*" element={<DashboardOverview />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalServices: 0,
    operationalServices: 0,
    activeIncidents: 0,
    upcomingMaintenance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [services, incidents, maintenance] = await Promise.all([
        api.admin.getServices(),
        api.admin.getIncidents(),
        api.admin.getMaintenance(),
      ]);

      setStats({
        totalServices: services.length,
        operationalServices: services.filter(s => s.status === ServiceStatus.OPERATIONAL).length,
        activeIncidents: incidents.filter(i => i.stage !== IncidentStage.RESOLVED).length,
        upcomingMaintenance: maintenance.filter(m => new Date(m.scheduled_start) > new Date()).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  const statCards = [
    { label: t('total_services'), value: stats.totalServices, color: 'bg-blue-500' },
    { label: t('operational_services'), value: stats.operationalServices, color: 'bg-green-500' },
    { label: t('active_incidents'), value: stats.activeIncidents, color: 'bg-red-500' },
    { label: t('upcoming_maintenance'), value: stats.upcomingMaintenance, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesManagement() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, categoriesData] = await Promise.all([
        api.admin.getServices(),
        api.admin.getCategories(),
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (service: Partial<Service>) => {
    try {
      if (editingService) {
        await api.admin.updateService(editingService.id, service);
      } else {
        await api.admin.createService(service);
      }
      await loadData();
      setShowForm(false);
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    
    try {
      await api.admin.deleteService(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('service_management')}</h2>
        <Button onClick={() => { setShowForm(true); setEditingService(null); }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('add_service')}
        </Button>
      </div>

      {showForm && (
        <ServiceForm
          service={editingService}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingService(null); }}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('service_name_en')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('category')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('visible')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => {
              const category = categories.find(c => c.id === service.category_id);
              return (
                <tr key={service.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {i18n.language === 'ar' ? service.name_ar : service.name_en}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category ? (i18n.language === 'ar' ? category.name_ar : category.name_en) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      service.status === ServiceStatus.OPERATIONAL ? 'bg-green-100 text-green-800' :
                      service.status === ServiceStatus.DEGRADED ? 'bg-yellow-100 text-yellow-800' :
                      service.status === ServiceStatus.PARTIAL_OUTAGE ? 'bg-orange-100 text-orange-800' :
                      service.status === ServiceStatus.MAJOR_OUTAGE ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {service.visible ? t('yes') : t('no')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingService(service); setShowForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceForm({ service, categories, onSave, onCancel }: {
  service: Service | null;
  categories: ServiceCategory[];
  onSave: (service: Partial<Service>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Service>>(service || {
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    category_id: categories[0]?.id || '',
    status: ServiceStatus.OPERATIONAL,
    visible: true,
    order: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {service ? t('edit_service') : t('add_service')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name_en">{t('service_name_en')}</Label>
            <Input
              id="name_en"
              value={formData.name_en || ''}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="name_ar">{t('service_name_ar')}</Label>
            <Input
              id="name_ar"
              value={formData.name_ar || ''}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description_en">{t('description_en')}</Label>
            <Input
              id="description_en"
              value={formData.description_en || ''}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description_ar">{t('description_ar')}</Label>
            <Input
              id="description_ar"
              value={formData.description_ar || ''}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category">{t('category')}</Label>
            <select
              id="category"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="status">{t('status')}</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.status || ServiceStatus.OPERATIONAL}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceStatus })}
              required
            >
              <option value={ServiceStatus.OPERATIONAL}>{t('operational')}</option>
              <option value={ServiceStatus.DEGRADED}>{t('degraded')}</option>
              <option value={ServiceStatus.PARTIAL_OUTAGE}>{t('partial_outage_status')}</option>
              <option value={ServiceStatus.MAJOR_OUTAGE}>{t('major_outage_status')}</option>
              <option value={ServiceStatus.MAINTENANCE}>{t('maintenance_status')}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="order">{t('order')}</Label>
            <Input
              id="order"
              type="number"
              value={formData.order || 0}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="visible"
            checked={formData.visible || false}
            onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
          />
          <Label htmlFor="visible">{t('visible')}</Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {t('save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function IncidentsManagement() {
  const { t, i18n } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incidentsData, servicesData] = await Promise.all([
        api.admin.getIncidents(),
        api.admin.getServices(),
      ]);
      setIncidents(incidentsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (incident: { title_ar: string; title_en: string; stage: string; affected_services: string[]; message_ar: string; message_en: string }) => {
    try {
      await api.admin.createIncident(incident);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create incident:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddUpdate = async (incidentId: string, update: { stage: string; message_ar: string; message_en: string }) => {
    try {
      await api.admin.addIncidentUpdate(incidentId, update);
      await loadData();
      setSelectedIncident(null);
    } catch (error) {
      console.error('Failed to add update:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      await api.admin.resolveIncident(incidentId);
      await loadData();
    } catch (error) {
      console.error('Failed to resolve incident:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('incident_management')}</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('create_incident')}
        </Button>
      </div>

      {showForm && (
        <IncidentForm
          services={services}
          onSave={handleCreateIncident}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {i18n.language === 'ar' ? incident.title_ar : incident.title_en}
                </h3>
                <p className="text-sm text-gray-500">{new Date(incident.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  incident.stage === IncidentStage.INVESTIGATING ? 'bg-red-100 text-red-800' :
                  incident.stage === IncidentStage.IDENTIFIED ? 'bg-orange-100 text-orange-800' :
                  incident.stage === IncidentStage.MONITORING ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {incident.stage}
                </span>
                {incident.stage !== IncidentStage.RESOLVED && (
                  <Button size="sm" onClick={() => handleResolve(incident.id)}>
                    {t('resolve')}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {incident.updates.map((update) => (
                <div key={update.id} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">{update.stage}</span>
                    <span className="text-xs text-gray-400">{new Date(update.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {i18n.language === 'ar' ? update.message_ar : update.message_en}
                  </p>
                </div>
              ))}
            </div>

            {selectedIncident?.id === incident.id ? (
              <IncidentUpdateForm
                onSave={(update) => handleAddUpdate(incident.id, update)}
                onCancel={() => setSelectedIncident(null)}
              />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>
                {t('add_update')}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IncidentForm({ services, onSave, onCancel }: {
  services: Service[];
  onSave: (incident: { title_ar: string; title_en: string; stage: string; affected_services: string[]; message_ar: string; message_en: string }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    stage: IncidentStage.INVESTIGATING,
    affected_services: [] as string[],
    message_ar: '',
    message_en: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{t('create_incident')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title_en">{t('incident_title_en')}</Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="title_ar">{t('incident_title_ar')}</Label>
            <Input
              id="title_ar"
              value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="stage">{t('stage')}</Label>
          <select
            id="stage"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as IncidentStage })}
            required
          >
            <option value={IncidentStage.INVESTIGATING}>{t('investigating')}</option>
            <option value={IncidentStage.IDENTIFIED}>{t('identified')}</option>
            <option value={IncidentStage.MONITORING}>{t('monitoring')}</option>
            <option value={IncidentStage.RESOLVED}>{t('resolved')}</option>
          </select>
        </div>

        <div>
          <Label>{t('select_services')}</Label>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id={`service-${service.id}`}
                  checked={formData.affected_services.includes(service.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, affected_services: [...formData.affected_services, service.id] });
                    } else {
                      setFormData({ ...formData, affected_services: formData.affected_services.filter(id => id !== service.id) });
                    }
                  }}
                />
                <Label htmlFor={`service-${service.id}`}>{service.name_en}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="message_en">{t('message_en')}</Label>
            <textarea
              id="message_en"
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              value={formData.message_en}
              onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="message_ar">{t('message_ar')}</Label>
            <textarea
              id="message_ar"
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              value={formData.message_ar}
              onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">{t('save')}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

function IncidentUpdateForm({ onSave, onCancel }: {
  onSave: (update: { stage: string; message_ar: string; message_en: string }) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    stage: IncidentStage.INVESTIGATING,
    message_ar: '',
    message_en: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="update_stage">{t('stage')}</Label>
          <select
            id="update_stage"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as IncidentStage })}
            required
          >
            <option value={IncidentStage.INVESTIGATING}>{t('investigating')}</option>
            <option value={IncidentStage.IDENTIFIED}>{t('identified')}</option>
            <option value={IncidentStage.MONITORING}>{t('monitoring')}</option>
            <option value={IncidentStage.RESOLVED}>{t('resolved')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="message_en">{t('message_en')}</Label>
            <Input
              id="message_en"
              value={formData.message_en}
              onChange={(e) => setFormData({ ...formData, message_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="message_ar">{t('message_ar')}</Label>
            <Input
              id="message_ar"
              value={formData.message_ar}
              onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">{t('add_update')}</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

function MaintenanceManagement() {
  const { t, i18n } = useTranslation();
  const [maintenance, setMaintenance] = useState<MaintenanceWindow[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [maintenanceData, servicesData] = await Promise.all([
        api.admin.getMaintenance(),
        api.admin.getServices(),
      ]);
      setMaintenance(maintenanceData);
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<MaintenanceWindow>) => {
    try {
      await api.admin.createMaintenance(data);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create maintenance:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    
    try {
      await api.admin.deleteMaintenance(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete maintenance:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('maintenance_management')}</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('create_maintenance')}
        </Button>
      </div>

      {showForm && (
        <MaintenanceForm
          services={services}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {maintenance.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {i18n.language === 'ar' ? item.title_ar : item.title_en}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {i18n.language === 'ar' ? item.description_ar : item.description_en}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(item.scheduled_start).toLocaleString()} - {new Date(item.scheduled_end).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaintenanceForm({ services, onSave, onCancel }: {
  services: Service[];
  onSave: (data: Partial<MaintenanceWindow>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<MaintenanceWindow>>({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    affected_services: [],
    scheduled_start: '',
    scheduled_end: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{t('create_maintenance')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title_en">{t('maintenance_title_en')}</Label>
            <Input
              id="title_en"
              value={formData.title_en || ''}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="title_ar">{t('maintenance_title_ar')}</Label>
            <Input
              id="title_ar"
              value={formData.title_ar || ''}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description_en">{t('description_en')}</Label>
            <Input
              id="description_en"
              value={formData.description_en || ''}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description_ar">{t('description_ar')}</Label>
            <Input
              id="description_ar"
              value={formData.description_ar || ''}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">{t('start_time')}</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.scheduled_start || ''}
              onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_time">{t('end_time')}</Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={formData.scheduled_end || ''}
              onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label>{t('select_services')}</Label>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id={`maint-service-${service.id}`}
                  checked={formData.affected_services?.includes(service.id) || false}
                  onChange={(e) => {
                    const current = formData.affected_services || [];
                    if (e.target.checked) {
                      setFormData({ ...formData, affected_services: [...current, service.id] });
                    } else {
                      setFormData({ ...formData, affected_services: current.filter(id => id !== service.id) });
                    }
                  }}
                />
                <Label htmlFor={`maint-service-${service.id}`}>{service.name_en}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">{t('save')}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

function SettingsManagement() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.admin.updateSettings(settings);
      alert(t('settings_updated'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(t('error') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  if (!settings) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('settings')}</h2>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="site_name_en">{t('site_name_en')}</Label>
              <Input
                id="site_name_en"
                value={settings.site_name_en}
                onChange={(e) => setSettings({ ...settings, site_name_en: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="site_name_ar">{t('site_name_ar')}</Label>
              <Input
                id="site_name_ar"
                value={settings.site_name_ar}
                onChange={(e) => setSettings({ ...settings, site_name_ar: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="default_language">{t('default_language')}</Label>
            <select
              id="default_language"
              className="w-full px-3 py-2 border rounded-md"
              value={settings.default_language}
              onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
            />
            <Label htmlFor="maintenance_mode">{t('maintenance_mode')}</Label>
          </div>

          {settings.maintenance_mode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maintenance_message_en">{t('maintenance_message_en')}</Label>
                <Input
                  id="maintenance_message_en"
                  value={settings.maintenance_message_en}
                  onChange={(e) => setSettings({ ...settings, maintenance_message_en: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maintenance_message_ar">{t('maintenance_message_ar')}</Label>
                <Input
                  id="maintenance_message_ar"
                  value={settings.maintenance_message_ar}
                  onChange={(e) => setSettings({ ...settings, maintenance_message_ar: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_public_rss"
              checked={settings.allow_public_rss}
              onChange={(e) => setSettings({ ...settings, allow_public_rss: e.target.checked })}
            />
            <Label htmlFor="allow_public_rss">{t('allow_public_rss')}</Label>
          </div>

          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? t('loading') : t('save')}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AuditLogsView() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.admin.getAuditLogs(100);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">{t('loading')}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('audit_logs')}</h2>
      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('timestamp')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('action')}</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {log.action}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
