import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './tab-navigation.js';
import './scan-progress.js';
import './toast-notification.js';
import './setup-wizard.js';
import './error-recovery.js';
import '../views/optimizations-view.js';
import '../views/automations-view.js';
import '../views/diffs-view.js';
import '../views/logs-view.js';
import '../views/settings-view.js';
import type { TabId } from './tab-navigation.js';
import { apiService, type LLMProfile } from '../services/api.js';
import { showToast } from './toast-notification.js';

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

  @state()
  private hasValidProfiles = false;

  @state()
  private llmProfiles: LLMProfile[] = [];

  @state()
  private showSetupGuidance = false;

  @state()
  private showSetupWizard = false;

  @state()
  private currentError: any = null;

  @state()
  private showErrorRecovery = false;

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

    .setup-guidance {
      position: fixed;
      top: 80px;
      right: 24px;
      max-width: 400px;
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      border-left: 4px solid var(--optimizer-warning, #f57f17);
      z-index: 1001;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .setup-guidance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .setup-guidance-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .setup-guidance-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--secondary-text-color, #757575);
      padding: 0;
      margin-left: 8px;
    }

    .setup-guidance-content {
      color: var(--secondary-text-color, #757575);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .setup-guidance-actions {
      display: flex;
      gap: 8px;
    }

    .setup-button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .setup-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .setup-button.secondary {
      background: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .setup-button.secondary:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    console.log('HA Config Optimizer component connected');
    
    // Add debug info
    console.log('Current location:', window.location.href);
    console.log('Path segments:', window.location.pathname.split('/').filter(Boolean));
    
    await this.checkConnection();
    if (this.isConnected) {
      await this.checkSystemReadiness();
    }
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

  private async checkSystemReadiness() {
    try {
      console.log('Checking system readiness...');
      
      // Load LLM profiles
      this.llmProfiles = await apiService.getLLMProfiles();
      console.log('LLM profiles loaded:', this.llmProfiles.length);
      
      // Check if we have any valid profiles
      this.hasValidProfiles = this.hasUsableProfiles();
      
      if (!this.hasValidProfiles) {
        console.log('No valid LLM profiles found, showing setup guidance');
        this.showSetupGuidance = true;
        
        // Show guidance toast
        setTimeout(() => {
          showToast('No LLM profiles configured. Please add one in Settings to start analyzing your configuration.', 'warning');
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to check system readiness:', error);
      // Don't block the UI for readiness check failures
    }
  }

  private hasUsableProfiles(): boolean {
    return this.llmProfiles.some(profile => {
      // Check if profile has required fields
      if (!profile.name || !profile.provider || !profile.endpoint) {
        return false;
      }
      
      // Check if API key is present for providers that require it
      const needsApiKey = profile.provider !== 'ollama';
      if (needsApiKey && (!profile.api_key || profile.api_key.trim().length === 0)) {
        return false;
      }
      
      return true;
    });
  }

  private dismissSetupGuidance() {
    this.showSetupGuidance = false;
  }

  private navigateToSettings() {
    this.activeTab = 'settings';
    this.showSetupGuidance = false;
  }

  private showWizard() {
    this.showSetupWizard = true;
    this.showSetupGuidance = false;
  }

  private handleWizardClose() {
    this.showSetupWizard = false;
  }

  private async handleWizardComplete() {
    this.showSetupWizard = false;
    // Re-check system readiness
    await this.checkSystemReadiness();
  }

  private handleErrorRecoveryClose() {
    this.showErrorRecovery = false;
    this.currentError = null;
  }

  private handleErrorRecoveryGoToSettings() {
    this.activeTab = 'settings';
    this.showErrorRecovery = false;
  }

  private handleErrorRecoveryRetry() {
    // Refresh the page or retry the last action
    window.location.reload();
  }

  private handleErrorRecoveryTestConnection() {
    // Navigate to settings to test connection
    this.activeTab = 'settings';
    this.showErrorRecovery = false;
    
    // Show toast to guide user
    setTimeout(() => {
      import('./toast-notification.js').then(({ showToast }) => {
        showToast('Go to your LLM profile and click "Test Connection"', 'info');
      });
    }, 500);
  }

  // Method to show error recovery from anywhere in the app
  public showErrorRecoveryPanel(error: any) {
    this.currentError = error;
    this.showErrorRecovery = true;
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
        return html`<diffs-view></diffs-view>`;
      case 'logs':
        return html`<logs-view></logs-view>`;
      case 'settings':
        return html`<settings-view @profiles-updated=${this.handleProfilesUpdated}></settings-view>`;
      default:
        return html`<div class="placeholder">Unknown view</div>`;
    }
  }

  private async handleProfilesUpdated() {
    // Re-check system readiness when profiles are updated
    await this.checkSystemReadiness();
  }

  private renderSetupGuidance() {
    return html`
      <div class="setup-guidance">
        <div class="setup-guidance-header">
          <h3 class="setup-guidance-title">⚠️ Setup Required</h3>
          <button class="setup-guidance-close" @click=${this.dismissSetupGuidance}>×</button>
        </div>
        <div class="setup-guidance-content">
          <p>No LLM profiles are configured. You need to add at least one LLM provider to analyze your Home Assistant configuration.</p>
          <p><strong>What you need:</strong></p>
          <ul>
            <li>An API key from OpenAI, Anthropic, or another LLM provider</li>
            <li>Or a local Ollama installation</li>
          </ul>
        </div>
        <div class="setup-guidance-actions">
          <button class="setup-button" @click=${this.showWizard}>
            Quick Setup
          </button>
          <button class="setup-button secondary" @click=${this.navigateToSettings}>
            Go to Settings
          </button>
          <button class="setup-button secondary" @click=${this.dismissSetupGuidance}>
            Dismiss
          </button>
        </div>
      </div>
    `;
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
      
      <toast-notification></toast-notification>
      
      ${this.showSetupGuidance ? this.renderSetupGuidance() : ''}
      
      <setup-wizard
        .open=${this.showSetupWizard}
        @close=${this.handleWizardClose}
        @complete=${this.handleWizardComplete}
      ></setup-wizard>
      
      <error-recovery
        .error=${this.currentError}
        .show=${this.showErrorRecovery}
        @close=${this.handleErrorRecoveryClose}
        @go-to-settings=${this.handleErrorRecoveryGoToSettings}
        @retry=${this.handleErrorRecoveryRetry}
        @test-connection=${this.handleErrorRecoveryTestConnection}
      ></error-recovery>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-config-optimizer': HaConfigOptimizer;
  }
}