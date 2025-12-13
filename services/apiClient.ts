/**
 * API Client för DHL Lead Hunter
 * Centraliserad kommunikation mellan frontend och backend
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || 'Request failed',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // ============================================
  // AUTH
  // ============================================

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    this.clearToken();
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // ============================================
  // LEADS
  // ============================================

  async searchLeads(params: {
    search?: string;
    segment?: string;
    city?: string;
    postal_code?: string;
    status?: string;
    min_revenue?: number;
    max_revenue?: number;
    has_dhl?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      leads: any[];
      total: number;
      limit: number;
      offset: number;
    }>(`/leads?${queryParams.toString()}`);
  }

  async getLeadById(id: string) {
    return this.request<any>(`/leads/${id}`);
  }

  async createLead(leadData: any) {
    return this.request<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: string, updates: any) {
    return this.request<any>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string) {
    return this.request<any>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // LEAD ACTIONS
  // ============================================

  async analyzeLead(id: string) {
    return this.request<{ lead: any; status: string }>(
      `/lead-actions/${id}/analyze`,
      { method: 'POST' }
    );
  }

  async refreshLead(id: string) {
    return this.request<{ lead: any }>(`/lead-actions/${id}/refresh`, {
      method: 'POST',
    });
  }

  async downloadLead(id: string) {
    const response = await fetch(`${this.baseUrl}/lead-actions/${id}/download`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async reportLead(id: string, reason: string, description?: string) {
    return this.request<any>(`/lead-actions/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  }

  async deleteLeads(leadIds: string[], reason: string) {
    return this.request<{ count: number; reason: string }>(
      '/lead-actions/delete',
      {
        method: 'POST',
        body: JSON.stringify({ leadIds, reason }),
      }
    );
  }

  async batchDownloadLeads(leadIds: string[], format: 'csv' | 'excel' = 'csv') {
    const response = await fetch(`${this.baseUrl}/lead-actions/batch-download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify({ leadIds, format }),
    });

    if (!response.ok) {
      throw new Error('Batch download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async checkApiStatus() {
    return this.request<{
      status: string;
      apis: {
        allabolag: { configured: boolean; available: boolean };
        uc: { configured: boolean; available: boolean };
        bolagsverket: { configured: boolean; available: boolean };
        tavily: { configured: boolean; available: boolean };
      };
      timestamp: string;
    }>('/lead-actions/api-status');
  }

  // ============================================
  // SEARCH
  // ============================================

  async performSearch(params: {
    mode: 'single' | 'batch';
    company_name?: string;
    org_number?: string;
    specific_person?: string;
    geographic_area?: string;
    segment?: string;
    triggers?: string[];
    target_count?: number;
    focus_positions?: {
      prio1: string[];
      prio2: string[];
      prio3: string[];
    };
    ice_breaker?: string;
    protocol?: string;
    llm?: string;
  }) {
    return this.request<{ leads: any[]; job_id?: string }>('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // SETTINGS
  // ============================================

  async getSettings() {
    return this.request<{
      scraping: any;
      api: any;
      search: any;
      ui: any;
      data: any;
      security: any;
    }>('/settings');
  }

  async updateSettings(settings: any) {
    return this.request<{ message: string }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getSettingsByCategory(category: string) {
    return this.request<any>(`/settings/${category}`);
  }

  async exportSettings() {
    const response = await fetch(`${this.baseUrl}/settings/export`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dhl-settings-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async importSettings(settings: any) {
    return this.request<{ message: string; count: number }>('/settings/import', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  // ============================================
  // STATS
  // ============================================

  async getLeadStats() {
    return this.request<{
      total: number;
      new_count: number;
      analyzing_count: number;
      analyzed_count: number;
      contacted_count: number;
      avg_revenue: number;
      total_freight_budget: number;
    }>('/stats/leads');
  }

  async getApiUsage() {
    return this.request<{
      used: number;
      limit: number;
      reset_at: string;
    }>('/stats/api-usage');
  }

  // ============================================
  // USERS
  // ============================================

  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUserById(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, updates: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // ============================================
  // ADMIN
  // ============================================

  async getSystemStatus() {
    return this.request<{
      status: string;
      database: string;
      cache: string;
      scraper: string;
    }>('/admin/system-status');
  }

  async clearCache() {
    return this.request<{ message: string }>('/admin/clear-cache', {
      method: 'POST',
    });
  }

  async getReservoirCache() {
    return this.request<any>('/admin/reservoir-cache');
  }

  async refreshReservoirCache() {
    return this.request<any>('/admin/reservoir-cache/refresh', {
      method: 'POST',
    });
  }

  async getExclusions() {
    return this.request<any[]>('/exclusions');
  }

  async addExclusion(exclusionData: any) {
    return this.request<any>('/exclusions', {
      method: 'POST',
      body: JSON.stringify(exclusionData),
    });
  }

  async deleteExclusion(id: string) {
    return this.request<any>(`/exclusions/${id}`, {
      method: 'DELETE',
    });
  }

  async createBackup() {
    return this.request<{ message: string; backup_id: string }>(
      '/admin/backup',
      { method: 'POST' }
    );
  }

  async getBackups() {
    return this.request<any[]>('/admin/backups');
  }

  async restoreBackup(backupId: string) {
    return this.request<{ message: string }>(`/admin/backup/${backupId}/restore`, {
      method: 'POST',
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

export default apiClient;
