import {
  User,
  Lead,
  Company,
  Contact,
  Deal,
  DealStage,
  Activity,
  DashboardSummary,
  AnalyticsData,
  Workspace,
} from '../types/crm.ts';

const TOKEN_KEY = 'qavon_desk_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  register: async (name: string, email: string, password: string, companyName?: string) => {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, companyName }),
    });
    setStoredToken(res.token);
    return res;
  },

  getAuthConfig: async (): Promise<{ demoMode: boolean }> => {
    return request<{ demoMode: boolean }>('/api/auth/config');
  },

  demoSession: async (): Promise<{ user: User; token: string }> => {
    const res = await request<{ user: User; token: string }>('/api/auth/demo-session', {
      method: 'POST',
    });
    setStoredToken(res.token);
    return res;
  },

  getMe: async (): Promise<{ user: User; token: string }> => {
    return request<{ user: User; token: string }>('/api/auth/me');
  },

  switchRole: async (userId: string): Promise<{ user: User; token: string }> => {
    const res = await request<{ user: User; token: string }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    setStoredToken(res.token);
    return res;
  },

  logout: async () => {
    removeStoredToken();
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },

  // Dashboard
  getDashboardSummary: (): Promise<DashboardSummary> => {
    return request<DashboardSummary>('/api/dashboard/summary');
  },

  // Leads
  getLeads: (params?: { search?: string; status?: string; source?: string }): Promise<Lead[]> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.source) q.append('source', params.source);
    return request<Lead[]>(`/api/leads?${q.toString()}`);
  },

  createLead: (lead: Partial<Lead>): Promise<Lead> => {
    return request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  },

  updateLead: (id: string, updates: Partial<Lead>): Promise<Lead> => {
    return request<Lead>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteLead: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  },

  convertLeadToDeal: (leadId: string, dealData: any) => {
    return request<{ deal: Deal; company: Company; contact: Contact; lead: Lead }>(
      `/api/leads/${leadId}/convert`,
      {
        method: 'POST',
        body: JSON.stringify(dealData),
      }
    );
  },

  // Companies
  getCompanies: (search?: string): Promise<Company[]> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Company[]>(`/api/companies${q}`);
  },

  createCompany: (company: Partial<Company>): Promise<Company> => {
    return request<Company>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  },

  updateCompany: (id: string, updates: Partial<Company>): Promise<Company> => {
    return request<Company>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteCompany: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  },

  // Contacts
  getContacts: (params?: { search?: string; companyId?: string }): Promise<Contact[]> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.companyId) q.append('companyId', params.companyId);
    return request<Contact[]>(`/api/contacts?${q.toString()}`);
  },

  createContact: (contact: Partial<Contact>): Promise<Contact> => {
    return request<Contact>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  },

  updateContact: (id: string, updates: Partial<Contact>): Promise<Contact> => {
    return request<Contact>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteContact: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  // Deals
  getDeals: (params?: { search?: string; ownerId?: string; priority?: string }): Promise<Array<Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string }>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.ownerId) q.append('ownerId', params.ownerId);
    if (params?.priority) q.append('priority', params.priority);
    return request<Array<Deal & { companyName?: string; ownerName?: string; ownerAvatar?: string; contactName?: string }>>(`/api/deals?${q.toString()}`);
  },

  getDealById: (id: string): Promise<Deal & { company?: Company; owner?: User; contact?: Contact }> => {
    return request(`/api/deals/${id}`);
  },

  createDeal: (deal: Partial<Deal>): Promise<Deal> => {
    return request<Deal>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(deal),
    });
  },

  updateDeal: (id: string, updates: Partial<Deal>): Promise<Deal> => {
    return request<Deal>(`/api/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  updateDealStage: (id: string, stage: DealStage, order?: number): Promise<Deal> => {
    return request<Deal>(`/api/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, order }),
    });
  },

  deleteDeal: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/deals/${id}`, {
      method: 'DELETE',
    });
  },

  // Activities
  getActivities: (params?: { type?: string; completed?: boolean; search?: string }): Promise<Array<Activity & { assignedToName?: string; entityLabel?: string }>> => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (typeof params?.completed === 'boolean') q.append('completed', String(params.completed));
    if (params?.search) q.append('search', params.search);
    return request<Array<Activity & { assignedToName?: string; entityLabel?: string }>>(`/api/activities?${q.toString()}`);
  },

  createActivity: (activity: Partial<Activity>): Promise<Activity> => {
    return request<Activity>('/api/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },

  updateActivity: (id: string, updates: Partial<Activity>): Promise<Activity> => {
    return request<Activity>(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  toggleActivity: (id: string): Promise<Activity> => {
    return request<Activity>(`/api/activities/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  deleteActivity: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/activities/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  getAnalytics: (range = '30d'): Promise<AnalyticsData> => {
    return request<AnalyticsData>(`/api/analytics?range=${range}`);
  },

  // Team
  getTeam: (): Promise<{ users: User[]; workspace: Workspace }> => {
    return request<{ users: User[]; workspace: Workspace }>('/api/team');
  },

  inviteTeamMember: (data: { name: string; email: string; role: string; title: string }): Promise<User> => {
    return request<User>('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // System
  resetDemoData: (): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>('/api/system/reset-demo', {
      method: 'POST',
    });
  },

  exportWorkspaceData: async (): Promise<void> => {
    const token = getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch('/api/system/export', { headers });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qavon-desk-export.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
