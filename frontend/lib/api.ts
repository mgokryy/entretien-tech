import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Alert {
  id: string;
  subject: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  metadata: {
    deviceId: string;
    location: string;
    [key: string]: any;
  };
}

export interface MonthlyStats {
  month: string;
  count: number;
  alertIds: string[];
}

class ApiClient {
  private async getAccessToken(): Promise<string | null> {
    try {
      const res = await fetch('/api/auth/token', { credentials: 'include' }); 
      if (!res.ok) return null;
      const data = await res.json();
      return data?.accessToken || null;
    } catch (err) {
      console.error('Erreur récupération token:', err);
      return null;
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAccessToken();
    if (!token) {
      console.warn('Aucun token disponible requête non authentifiée');
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }

  async getAlerts(params?: { subject?: string; month?: number; year?: number }): Promise<Alert[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_URL}/api/alerts`, { params, headers });
    return response.data.data;
  }

  async getAlert(id: string): Promise<Alert> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_URL}/api/alerts/${id}`, { headers });
    return response.data.data;
  }

  async getMonthlyStats(subject?: string): Promise<MonthlyStats[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_URL}/api/alerts/stats/monthly`, {
      params: subject ? { subject } : {},
      headers,
    });
    return response.data.data;
  }

  async getSubjects(): Promise<string[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_URL}/api/subjects`, { headers });
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
