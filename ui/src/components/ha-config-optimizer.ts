import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './tab-navigation.js';
import './scan-progress.js';
import '../views/optimizations-view.js';
import '../views/automations-view.js';
import '../views/logs-view.js';
import '../views/settings-view.js';
import type { TabId } from './tab-navigation.js';
import { apiService } from '../services/api.js';

@customElement('ha-config-optimizer')
export class HaConfigOptimizer extends LitElement {
  @state()
  private activeTab: TabId = 'optimizations';

  @state()
  private hasRunningScans = false;

  @state()
  private isLoading = true;

  @state()
  private error: string | null = null;

  @state()
  private isConnected = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      background: var(--primary-background-color, #fafafa);
      font-family: var(--font-family-primary, 'Roboto', sans-serif);
    }

    .header {
      background: var(--card-background-color, #ffffff);
      padding: 16px 24px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .subtitle {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      margin: 4px 0 0 0;
    }

    .content {
      height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .placeholder {
      text-align: center;
      color: var(--secondary-text-color, #757575);
      margin-top: 100px;
      padding: 24px;
    }

    .placeholder h2 {
      margin-bottom: 8px;
    }

    /* Default HA-like variables for theming */
    :host {
      --primary-color: #03a9f4;
      --accent-color: #ff9800;
      --primary-text-color: #212121;
      --secondary-text-color: #727272;
      --card-background-color: #ffffff;
      --primary-background-color: #fafafa;
      --secondary-background-color: #e5e5e5;
      --divider-color: #e0e0e0;
      --optimizer-success: #00c875;
      --optimizer-warning: #f57f17;
      --optimizer-error: #d32f2f;
      --optimizer-automation: #4caf50;
      --impact-high: #d32f2f;
      --impact-medium: #f57f17;
      --impact-low: #00c875;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      :host {
        --primary-text-color: #ffffff;
        --secondary-text-color: #b3b3b3;
        --card-background-color: #2d2d2d;
        --primary-background-color: #1a1a1a;
        --secondary-background-color: #333333;
        --divider-color: #404040;
      }
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      padding: 24px;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--divider-color, #e0e0e0);
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error {
      color: var(--optimizer-error, #d32f2f);
    }

    .error h2 {
      margin-bottom: 16px;
    }

    .error-details {
      background: var(--card-background-color, #ffffff);
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
      max-width: 600px;
      font-family: monospace;
      font-size: 12px;
      text-align: left;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    console.log('HA Config Optimizer component connected');
    
    // Add debug info
    console.log('Current location:', window.location.href);
    console.log('Path segments:', window.location.pathname.split('/').filter(Boolean));
    
    await this.checkConnection();
  }

  async checkConnection() {
    try {
      console.log('Checking API connection...');
      
      // In Home Assistant Ingress, we're already at the right base path
      // The health endpoint is at the same level as the index.html
      let healthUrl = 'health';  // Use relative URL
      
      console.log('Health check URL:', healthUrl);
      console.log('Current location:', window.location.href);
      
      const response = await fetch(healthUrl);
      this.isConnected = response.ok;
      
      if (this.isConnected) {
        console.log('API connection successful');
        this.error = null;
      } else {
        console.error('API health check failed:', response.status);
        this.error = `API health check failed with status: ${response.status}`;
        
        // Try the addon info endpoint as a fallback
        console.log('Trying addon/info endpoint...');
        try {
          const addonResponse = await fetch('addon/info');
          if (addonResponse.ok) {
            console.log('Addon info endpoint succeeded, API is accessible');
            this.isConnected = true;
            this.error = null;
          }
        } catch (e) {
          console.error('Addon info endpoint also failed:', e);
        }
      }
    } catch (error) {
      console.error('Failed to connect to API:', error);
      this.error = `Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.isConnected = false;
    } finally {
      this.isLoading = false;
    }
  }

  private handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tabId;
  }

  private handleScansUpdated(event: CustomEvent) {
    const { runningScans } = event.detail;
    this.hasRunningScans = runningScans.length > 0;
  }

  private renderView() {
    switch (this.activeTab) {
      case 'optimizations':
        return html`<optimizations-view></optimizations-view>`;
      case 'automations':
        return html`<automations-view></automations-view>`;
      case 'diffs':
        return html`
          <div class="placeholder">
            <h2>📝 Configuration Diffs</h2>
            <p>Review and apply changes to your configuration files.</p>
            <p><em>Coming soon...</em></p>
          </div>
        `;
      case 'logs':
        return html`<logs-view></logs-view>`;
      case 'settings':
        return html`<settings-view></settings-view>`;
      default:
        return html`<div class="placeholder">Unknown view</div>`;
    }
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Loading Config Optimizer...</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error">
          <h2>❌ Connection Error</h2>
          <p>Unable to connect to the Config Optimizer API</p>
          <div class="error-details">${this.error}</div>
          <button @click=${() => window.location.reload()}>Reload Page</button>
        </div>
      `;
    }

    return html`
      <div class="header">
        <h1 class="title">Config Optimizer</h1>
        <p class="subtitle">
          AI-powered Home Assistant configuration analysis
          ${this.hasRunningScans ? html`
            <scan-progress compact @scans-updated=${this.handleScansUpdated}></scan-progress>
          ` : ''}
        </p>
        ${!this.hasRunningScans ? html`
          <scan-progress 
            style="display: none;" 
            @scans-updated=${this.handleScansUpdated}
          ></scan-progress>
        ` : ''}
      </div>
      
      <tab-navigation 
        .activeTab=${this.activeTab}
        @tab-change=${this.handleTabChange}
      ></tab-navigation>
      
      <div class="content">
        ${this.renderView()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-config-optimizer': HaConfigOptimizer;
  }
}