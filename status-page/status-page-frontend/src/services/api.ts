import { StatusSummary, Service, Incident, MaintenanceWindow, Settings, AuditLog, ServiceCategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(options?.headers as Record<string, string>),
  };

  const headersObj = headers as Record<string, string>;

  if (options?.body) {
    headersObj['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('adminToken');
  if (token) {
    headersObj['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: headersObj,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    let errorMessage = 'Request failed';
    
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        errorMessage = error.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (typeof error.detail === 'object') {
        errorMessage = JSON.stringify(error.detail);
      } else {
        errorMessage = error.detail;
      }
    }
    
    throw new ApiError(response.status, errorMessage);
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
    login: async (code: string) => {
      const response = await fetchApi<{ success: boolean; message: string; token: string }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (response.token) {
        localStorage.setItem('adminToken', response.token);
      }
      return response;
    },
    
    logout: async () => {
      localStorage.removeItem('adminToken');
      return fetchApi<{ message: string }>('/api/admin/auth/logout', {
        method: 'POST',
      });
    },
    
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
