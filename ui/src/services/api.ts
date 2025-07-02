/**
 * API service for communicating with the backend.
 */

export interface Scan {
  id: number;
  started_at: string;
  ended_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  file_count: number;
  suggestions?: Suggestion[];
}

export interface Suggestion {
  id: number;
  type: 'optimization' | 'automation';
  title: string;
  body_md: string;
  impact: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  created_at: string;
  diff?: Diff;
}

export interface Diff {
  id: number;
  file_path: string;
  patch: string;
  original_sha: string;
}

export interface Settings {
  yaml_includes: string[];
  yaml_excludes: string[];
  cron_expr?: string;
  db_dsn?: string;
  db_type: string;
}

export interface LLMProfile {
  id: number;
  name: string;
  provider: string;
  endpoint?: string;
  context_tokens: number;
  role: string;
  model_name?: string;
  is_active: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Check if we're running through Home Assistant Ingress
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    
    // If the path contains 'api/hassio_ingress', we're in an Ingress environment
    if (pathSegments.includes('api') && pathSegments.includes('hassio_ingress')) {
      // In Ingress, we're already at the right base path, so use relative URLs
      this.baseUrl = 'api';
      console.log('Detected Home Assistant Ingress environment, using relative base URL:', this.baseUrl);
    } else {
      // Development or direct access
      this.baseUrl = '/api';
      console.log('Using standard base URL:', this.baseUrl);
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making API request to:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Scan API
  async getScans(): Promise<Scan[]> {
    return this.request<Scan[]>('/scan/');
  }

  async createScan(files: string[], llmProfileId?: number, analysisTypes: string[] = ['optimization']): Promise<Scan> {
    return this.request<Scan>('/scan/', {
      method: 'POST',
      body: JSON.stringify({
        files,
        scan_type: 'manual',
        llm_profile_id: llmProfileId,
        analysis_types: analysisTypes,
      }),
    });
  }

  async createAutomationScan(files: string[] = [], llmProfileId?: number): Promise<Scan> {
    return this.createScan(files, llmProfileId, ['automation']);
  }

  async getScan(scanId: number): Promise<Scan> {
    return this.request<Scan>(`/scan/${scanId}`);
  }

  async getFileTree(): Promise<any> {
    return this.request('/scan/files/tree');
  }

  // Suggestions API
  async getSuggestions(scanId?: number): Promise<Suggestion[]> {
    const params = scanId ? `?scan_id=${scanId}` : '';
    return this.request<Suggestion[]>(`/suggestions/${params}`);
  }

  async updateSuggestion(suggestionId: number, status: string): Promise<Suggestion> {
    return this.request<Suggestion>(`/suggestions/${suggestionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteSuggestion(suggestionId: number): Promise<void> {
    await this.request(`/suggestions/${suggestionId}`, {
      method: 'DELETE',
    });
  }

  async applySuggestion(suggestionId: number): Promise<Suggestion> {
    return this.request<Suggestion>(`/suggestions/${suggestionId}/apply`, {
      method: 'POST',
    });
  }

  async previewSuggestion(suggestionId: number): Promise<any> {
    return this.request(`/suggestions/${suggestionId}/preview`, {
      method: 'POST',
    });
  }

  // Settings API
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/settings/');
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.request<Settings>('/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getLLMProfiles(): Promise<LLMProfile[]> {
    return this.request<LLMProfile[]>('/settings/llm-profiles');
  }

  async createLLMProfile(profile: Omit<LLMProfile, 'id' | 'is_active'>): Promise<LLMProfile> {
    return this.request<LLMProfile>('/settings/llm-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async deleteLLMProfile(profileId: number): Promise<void> {
    await this.request(`/settings/llm-profiles/${profileId}`, {
      method: 'DELETE',
    });
  }

  // Real-time monitoring
  startScanMonitoring(callback: (scans: Scan[]) => void, interval = 2000): () => void {
    const pollScans = async () => {
      try {
        const scans = await this.getScans();
        callback(scans);
      } catch (error) {
        console.error('Failed to poll scans:', error);
      }
    };

    // Initial call
    pollScans();

    // Set up interval
    const intervalId = setInterval(pollScans, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export const apiService = new ApiService();