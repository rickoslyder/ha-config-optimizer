/**
 * API service for communicating with the backend.
 */
import { showErrorToast, parseApiError } from '../utils/error-handler.js';

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
  metadata?: {
    before?: string;
    after?: string;
    yaml?: string;
    file_path?: string;
    category?: string;
    trigger?: string;
    condition?: string;
    action?: string;
    entities_used?: string[];
    [key: string]: any;
  };
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
        let errorData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          errorData = { detail: errorText };
        }
        
        const error = new Error(errorData.detail || `HTTP ${response.status}`);
        (error as any).response = {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        };
        
        throw error;
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

  async updateLLMProfile(profileId: number, profile: Partial<LLMProfile>): Promise<LLMProfile> {
    return this.request<LLMProfile>(`/settings/llm-profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  async deleteLLMProfile(profileId: number): Promise<void> {
    await this.request(`/settings/llm-profiles/${profileId}`, {
      method: 'DELETE',
    });
  }

  // Error-aware wrapper methods
  async createScanWithErrorHandling(files: string[], llmProfileId?: number, analysisTypes: string[] = ['optimization']): Promise<Scan | null> {
    try {
      return await this.createScan(files, llmProfileId, analysisTypes);
    } catch (error) {
      showErrorToast(error, 'scan');
      return null;
    }
  }

  async updateSuggestionWithErrorHandling(suggestionId: number, status: string): Promise<Suggestion | null> {
    try {
      return await this.updateSuggestion(suggestionId, status);
    } catch (error) {
      showErrorToast(error, 'suggestion');
      return null;
    }
  }

  async applySuggestionWithErrorHandling(suggestionId: number): Promise<Suggestion | null> {
    try {
      return await this.applySuggestion(suggestionId);
    } catch (error) {
      showErrorToast(error, 'apply');
      return null;
    }
  }

  async testLLMConnectionWithErrorHandling(profile: any): Promise<boolean> {
    try {
      const response = await this.request('/settings/llm-profiles/test-connection', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      return true;
    } catch (error) {
      showErrorToast(error, 'llm_test');
      return false;
    }
  }

  // Real-time monitoring with improved error handling
  startScanMonitoring(callback: (scans: Scan[]) => void, interval = 2000): () => void {
    let consecutiveErrors = 0;
    const maxErrors = 3;
    
    const pollScans = async () => {
      try {
        const scans = await this.getScans();
        callback(scans);
        consecutiveErrors = 0; // Reset error count on success
      } catch (error) {
        consecutiveErrors++;
        console.error(`Failed to poll scans (attempt ${consecutiveErrors}):`, error);
        
        // Show error message after multiple failures
        if (consecutiveErrors >= maxErrors) {
          showErrorToast(error, 'scan');
          // Still continue polling but with less frequency
          interval = Math.min(interval * 2, 10000);
        }
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