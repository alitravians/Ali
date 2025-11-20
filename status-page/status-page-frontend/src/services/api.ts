import { StatusSummary, Service, Incident, MaintenanceWindow, Settings, AuditLog, ServiceCategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response.json();
}

export const api = {
  getStatusSummary: () => fetchApi<StatusSummary>('/api/status-summary'),
  
  getSettings: () => fetchApi<Settings>('/api/settings'),
  
  streamStatus: () => {
    const eventSource = new EventSource(`${API_URL}/api/stream/status`);
    return eventSource;
  },
  
  admin: {
    login: (code: string) => 
      fetchApi<{ message: string }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    
    logout: () => 
      fetchApi<{ message: string }>('/api/admin/auth/logout', {
        method: 'POST',
      }),
    
    verify: () => 
      fetchApi<{ authenticated: boolean }>('/api/admin/auth/verify'),
    
    getServices: () => 
      fetchApi<Service[]>('/api/admin/services'),
    
    createService: (service: Partial<Service>) => 
      fetchApi<Service>('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(service),
      }),
    
    updateService: (id: string, service: Partial<Service>) => 
      fetchApi<Service>(`/api/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(service),
      }),
    
    deleteService: (id: string) => 
      fetchApi<{ message: string }>(`/api/admin/services/${id}`, {
        method: 'DELETE',
      }),
    
    getIncidents: () => 
      fetchApi<Incident[]>('/api/admin/incidents'),
    
    createIncident: (incident: { title_ar: string; title_en: string; stage: string; affected_services: string[] }) => 
      fetchApi<Incident>('/api/admin/incidents', {
        method: 'POST',
        body: JSON.stringify(incident),
      }),
    
    addIncidentUpdate: (incidentId: string, update: { stage: string; message_ar: string; message_en: string }) => 
      fetchApi<Incident>(`/api/admin/incidents/${incidentId}/updates`, {
        method: 'POST',
        body: JSON.stringify(update),
      }),
    
    resolveIncident: (incidentId: string) => 
      fetchApi<Incident>(`/api/admin/incidents/${incidentId}/resolve`, {
        method: 'POST',
      }),
    
    getMaintenance: () => 
      fetchApi<MaintenanceWindow[]>('/api/admin/maintenance'),
    
    createMaintenance: (maintenance: Partial<MaintenanceWindow>) => 
      fetchApi<MaintenanceWindow>('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify(maintenance),
      }),
    
    deleteMaintenance: (id: string) => 
      fetchApi<{ message: string }>(`/api/admin/maintenance/${id}`, {
        method: 'DELETE',
      }),
    
    getSettings: () => 
      fetchApi<Settings>('/api/admin/settings'),
    
    updateSettings: (settings: Partial<Settings>) => 
      fetchApi<Settings>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    
    getAuditLogs: (limit?: number) => 
      fetchApi<AuditLog[]>(`/api/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
    
    getCategories: () => 
      fetchApi<ServiceCategory[]>('/api/admin/categories'),
  },
};
