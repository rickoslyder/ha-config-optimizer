import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { apiService, type LLMProfile } from '../services/api.js';
import { showToast } from './toast-notification.js';

interface ProviderPreset {
  endpoint: string;
  models: string[];
  defaultModel: string;
  contextTokens: number;
  description: string;
  setupUrl: string;
}

@customElement('setup-wizard')
export class SetupWizard extends LitElement {
  @property({ type: Boolean })
  open = false;

  @state()
  private currentStep = 1;

  @state()
  private selectedProvider = '';

  @state()
  private formData: Partial<LLMProfile> = {
    name: '',
    provider: '',
    endpoint: '',
    model_name: '',
    context_tokens: 128000,
    role: 'optimize',
    is_active: true,
    api_key: ''
  };

  @state()
  private testingConnection = false;

  @state()
  private connectionTestResult: 'success' | 'error' | null = null;

  @state()
  private saving = false;

  static styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .wizard-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .wizard-title {
      font-size: 24px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin: 0 0 8px 0;
    }

    .wizard-subtitle {
      color: var(--secondary-text-color, #757575);
      margin: 0;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
    }

    .step.active .step-number {
      background: var(--primary-color, #03a9f4);
      color: white;
    }

    .step.completed .step-number {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .step.inactive .step-number {
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
    }

    .step-connector {
      width: 40px;
      height: 2px;
      background: var(--divider-color, #e0e0e0);
      margin: 0 8px;
    }

    .step.completed + .step .step-connector {
      background: var(--optimizer-success, #00c875);
    }

    .provider-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .provider-card {
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .provider-card:hover {
      border-color: var(--primary-color, #03a9f4);
      box-shadow: 0 2px 8px rgba(3, 169, 244, 0.2);
    }

    .provider-card.selected {
      border-color: var(--primary-color, #03a9f4);
      background: rgba(3, 169, 244, 0.1);
    }

    .provider-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .provider-name {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: var(--primary-text-color, #212121);
    }

    .provider-description {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--primary-text-color, #212121);
    }

    .form-input, .form-select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
      font-family: inherit;
      font-size: 16px;
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
      box-shadow: 0 0 0 2px rgba(3, 169, 244, 0.2);
    }

    .form-help {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      margin-top: 4px;
    }

    .setup-instructions {
      background: rgba(3, 169, 244, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .setup-instructions h4 {
      margin: 0 0 12px 0;
      color: var(--primary-text-color, #212121);
    }

    .setup-instructions ol {
      margin: 0;
      padding-left: 20px;
    }

    .setup-instructions li {
      margin-bottom: 8px;
      color: var(--secondary-text-color, #757575);
    }

    .external-link {
      color: var(--primary-color, #03a9f4);
      text-decoration: none;
    }

    .external-link:hover {
      text-decoration: underline;
    }

    .wizard-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
    }

    .button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px 24px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .button.secondary {
      background: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .button.secondary:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .test-button {
      background: var(--secondary-color, #9c27b0);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      margin-top: 8px;
    }

    .test-result {
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .test-result.success {
      background: rgba(0, 200, 117, 0.1);
      color: var(--optimizer-success, #00c875);
      border: 1px solid rgba(0, 200, 117, 0.3);
    }

    .test-result.error {
      background: rgba(211, 47, 47, 0.1);
      color: var(--optimizer-error, #d32f2f);
      border: 1px solid rgba(211, 47, 47, 0.3);
    }

    .success-message {
      text-align: center;
      padding: 40px 20px;
    }

    .success-icon {
      font-size: 64px;
      color: var(--optimizer-success, #00c875);
      margin-bottom: 16px;
    }

    .success-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: var(--primary-text-color, #212121);
    }

    .success-description {
      color: var(--secondary-text-color, #757575);
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
  `;

  private providerPresets: Record<string, ProviderPreset> = {
    openai: {
      endpoint: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
      defaultModel: 'gpt-4o-mini',
      contextTokens: 128000,
      description: 'Most popular choice with reliable performance',
      setupUrl: 'https://platform.openai.com/api-keys'
    },
    anthropic: {
      endpoint: 'https://api.anthropic.com/v1',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      defaultModel: 'claude-3-5-sonnet-20241022',
      contextTokens: 200000,
      description: 'Excellent reasoning capabilities and long context',
      setupUrl: 'https://console.anthropic.com'
    },
    google: {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
      defaultModel: 'gemini-1.5-flash',
      contextTokens: 1000000,
      description: 'Google\'s powerful models with huge context windows',
      setupUrl: 'https://makersuite.google.com/app/apikey'
    },
    groq: {
      endpoint: 'https://api.groq.com/openai/v1',
      models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
      defaultModel: 'llama3-70b-8192',
      contextTokens: 8192,
      description: 'Fast inference with open-source models',
      setupUrl: 'https://console.groq.com/keys'
    },
    ollama: {
      endpoint: 'http://localhost:11434',
      models: ['llama3.1', 'llama3', 'codellama', 'mistral', 'phi3'],
      defaultModel: 'llama3.1',
      contextTokens: 128000,
      description: 'Run models locally on your own hardware',
      setupUrl: 'https://ollama.ai/download'
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      this.handleClose();
    }
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private selectProvider(provider: string) {
    this.selectedProvider = provider;
    const preset = this.providerPresets[provider];
    
    this.formData = {
      ...this.formData,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Profile`,
      provider,
      endpoint: preset.endpoint,
      model_name: preset.defaultModel,
      context_tokens: preset.contextTokens
    };
  }

  private nextStep() {
    if (this.currentStep === 1 && this.selectedProvider) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.isFormValid()) {
      this.currentStep = 3;
    }
  }

  private prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private isFormValid(): boolean {
    if (!this.formData.name || !this.formData.endpoint) {
      return false;
    }
    
    // Check API key for providers that require it
    if (this.selectedProvider !== 'ollama' && !this.formData.api_key) {
      return false;
    }
    
    return true;
  }

  private handleInputChange(field: string, value: any) {
    this.formData = {
      ...this.formData,
      [field]: value
    };
  }

  private async handleTestConnection() {
    if (!this.isFormValid()) {
      showToast('Please fill in all required fields before testing', 'warning');
      return;
    }

    this.testingConnection = true;
    this.connectionTestResult = null;

    try {
      const testProfile = {
        ...this.formData,
        name: 'Test Connection'
      };

      const success = await apiService.testLLMConnectionWithErrorHandling(testProfile);
      
      if (success) {
        this.connectionTestResult = 'success';
        showToast('Connection test successful!', 'success');
      } else {
        this.connectionTestResult = 'error';
      }
    } catch (error) {
      this.connectionTestResult = 'error';
      showToast('Connection test failed', 'error');
      console.error('Connection test error:', error);
    } finally {
      this.testingConnection = false;
    }
  }

  private async handleFinish() {
    if (!this.isFormValid()) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.saving = true;

    try {
      await apiService.createLLMProfile(this.formData);
      this.currentStep = 4; // Success step
      showToast('LLM profile created successfully!', 'success');
      
      // Notify parent
      this.dispatchEvent(new CustomEvent('complete', {
        detail: { profile: this.formData }
      }));
      
      // Auto-close after success
      setTimeout(() => {
        this.handleClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to create profile:', error);
      showToast('Failed to create profile. Please try again.', 'error');
    } finally {
      this.saving = false;
    }
  }

  private getApiKeyHelp(provider: string): string {
    const preset = this.providerPresets[provider];
    if (provider === 'ollama') {
      return 'No API key required for local Ollama installations';
    }
    return `Get your API key from ${preset.setupUrl}`;
  }

  render() {
    return html`
      <div class="modal-overlay ${this.open ? 'open' : ''}" @click=${(e: Event) => {
        if (e.target === e.currentTarget) this.handleClose();
      }}>
        <div class="modal">
          ${this.currentStep < 4 ? html`
            <div class="wizard-header">
              <h2 class="wizard-title">🚀 Setup Your First LLM Provider</h2>
              <p class="wizard-subtitle">Get started with AI-powered Home Assistant configuration analysis</p>
            </div>

            <div class="step-indicator">
              <div class="step ${this.currentStep === 1 ? 'active' : this.currentStep > 1 ? 'completed' : 'inactive'}">
                <div class="step-number">1</div>
              </div>
              <div class="step-connector"></div>
              <div class="step ${this.currentStep === 2 ? 'active' : this.currentStep > 2 ? 'completed' : 'inactive'}">
                <div class="step-number">2</div>
              </div>
              <div class="step-connector"></div>
              <div class="step ${this.currentStep === 3 ? 'active' : this.currentStep > 3 ? 'completed' : 'inactive'}">
                <div class="step-number">3</div>
              </div>
            </div>
          ` : ''}

          ${this.renderStepContent()}

          ${this.currentStep < 4 ? html`
            <div class="wizard-actions">
              <button 
                class="button secondary" 
                @click=${this.currentStep === 1 ? this.handleClose : this.prevStep}
              >
                ${this.currentStep === 1 ? 'Cancel' : 'Back'}
              </button>
              <button 
                class="button" 
                @click=${this.currentStep === 3 ? this.handleFinish : this.nextStep}
                ?disabled=${
                  (this.currentStep === 1 && !this.selectedProvider) ||
                  (this.currentStep === 2 && !this.isFormValid()) ||
                  (this.currentStep === 3 && this.saving)
                }
              >
                ${this.currentStep === 3 ? (this.saving ? '⏳ Creating...' : 'Create Profile') : 'Next'}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderStepContent() {
    switch (this.currentStep) {
      case 1:
        return this.renderProviderSelection();
      case 2:
        return this.renderConfiguration();
      case 3:
        return this.renderTestConnection();
      case 4:
        return this.renderSuccess();
      default:
        return html``;
    }
  }

  private renderProviderSelection() {
    return html`
      <h3>Choose Your LLM Provider</h3>
      <div class="provider-grid">
        ${Object.entries(this.providerPresets).map(([key, preset]) => html`
          <div 
            class="provider-card ${this.selectedProvider === key ? 'selected' : ''}"
            @click=${() => this.selectProvider(key)}
          >
            <div class="provider-icon">
              ${key === 'openai' ? '🤖' : key === 'anthropic' ? '🧠' : key === 'google' ? '🔍' : key === 'groq' ? '⚡' : '🏠'}
            </div>
            <h4 class="provider-name">${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
            <p class="provider-description">${preset.description}</p>
          </div>
        `)}
      </div>
    `;
  }

  private renderConfiguration() {
    const preset = this.providerPresets[this.selectedProvider];
    const needsApiKey = this.selectedProvider !== 'ollama';

    return html`
      <h3>Configure ${this.selectedProvider.charAt(0).toUpperCase() + this.selectedProvider.slice(1)}</h3>
      
      ${needsApiKey ? html`
        <div class="setup-instructions">
          <h4>📋 Setup Instructions</h4>
          <ol>
            <li>Visit <a href="${preset.setupUrl}" target="_blank" class="external-link">${preset.setupUrl}</a></li>
            <li>Create an account or sign in</li>
            <li>Generate a new API key</li>
            <li>Copy the API key and paste it below</li>
          </ol>
        </div>
      ` : html`
        <div class="setup-instructions">
          <h4>🏠 Ollama Setup</h4>
          <ol>
            <li>Install Ollama from <a href="${preset.setupUrl}" target="_blank" class="external-link">${preset.setupUrl}</a></li>
            <li>Run: <code>ollama pull ${preset.defaultModel}</code></li>
            <li>Make sure Ollama is running on port 11434</li>
          </ol>
        </div>
      `}

      <div class="form-group">
        <label class="form-label">Profile Name</label>
        <input
          type="text"
          class="form-input"
          .value=${this.formData.name || ''}
          @input=${(e: Event) => this.handleInputChange('name', (e.target as HTMLInputElement).value)}
        />
      </div>

      ${needsApiKey ? html`
        <div class="form-group">
          <label class="form-label">
            API Key <span style="color: var(--optimizer-error, #d32f2f);">*</span>
          </label>
          <input
            type="password"
            class="form-input"
            .value=${this.formData.api_key || ''}
            @input=${(e: Event) => this.handleInputChange('api_key', (e.target as HTMLInputElement).value)}
            placeholder="Enter your API key"
            autocomplete="off"
          />
          <div class="form-help">${this.getApiKeyHelp(this.selectedProvider)}</div>
        </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">Model</label>
        <select
          class="form-select"
          .value=${this.formData.model_name || ''}
          @change=${(e: Event) => this.handleInputChange('model_name', (e.target as HTMLSelectElement).value)}
        >
          ${preset.models.map(model => html`
            <option value=${model}>${model}</option>
          `)}
        </select>
      </div>
    `;
  }

  private renderTestConnection() {
    return html`
      <h3>Test Your Configuration</h3>
      <p>Let's make sure everything is working correctly before we finish.</p>

      <div class="form-group">
        <label class="form-label">Configuration Summary</label>
        <div style="background: var(--secondary-background-color, #f5f5f5); padding: 12px; border-radius: 4px; font-size: 14px;">
          <strong>Provider:</strong> ${this.selectedProvider}<br>
          <strong>Model:</strong> ${this.formData.model_name}<br>
          <strong>Endpoint:</strong> ${this.formData.endpoint}<br>
          ${this.selectedProvider !== 'ollama' ? html`<strong>API Key:</strong> •••••••••<br>` : ''}
        </div>
      </div>

      <button 
        class="test-button"
        @click=${this.handleTestConnection}
        ?disabled=${this.testingConnection || !this.isFormValid()}
      >
        ${this.testingConnection ? '⏳ Testing...' : '🔗 Test Connection'}
      </button>

      ${this.connectionTestResult ? html`
        <div class="test-result ${this.connectionTestResult}">
          ${this.connectionTestResult === 'success' ? html`
            <span>✅ Connection successful! You're ready to analyze your Home Assistant configuration.</span>
          ` : html`
            <span>❌ Connection failed. Please check your settings and try again.</span>
          `}
        </div>
      ` : ''}
    `;
  }

  private renderSuccess() {
    return html`
      <div class="success-message">
        <div class="success-icon">🎉</div>
        <h3 class="success-title">Setup Complete!</h3>
        <p class="success-description">
          Your LLM profile has been created successfully. You can now run scans to analyze your 
          Home Assistant configuration and get AI-powered optimization suggestions.
        </p>
        <button class="button" @click=${this.handleClose}>
          Start Analyzing
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'setup-wizard': SetupWizard;
  }
}