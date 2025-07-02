import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { apiService, type LLMProfile } from '../services/api.js';
import { showToast } from './toast-notification.js';

@customElement('llm-profile-modal')
export class LLMProfileModal extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Object })
  profile: Partial<LLMProfile> | null = null;

  @state()
  private formData: Partial<LLMProfile> = {
    name: '',
    provider: 'openai',
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

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--secondary-text-color, #757575);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background-color: var(--secondary-background-color, #f5f5f5);
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

    .provider-presets {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }

    .preset-button {
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .preset-button:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .preset-button.selected {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
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

    .button.secondary {
      background: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .button.secondary:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .error-message {
      color: var(--error-color, #d32f2f);
      font-size: 14px;
      margin-top: 8px;
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

    .test-button:hover {
      opacity: 0.9;
    }

    .test-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
  `;

  private providerPresets = {
    openai: {
      endpoint: 'https://api.openai.com/v1',
      models: ['o4-mini', 'o4-mini-high', 'o3', 'o1-preview', 'gpt-4o', 'gpt-4-turbo'],
      defaultModel: 'o4-mini',
      contextTokens: 128000
    },
    anthropic: {
      endpoint: 'https://api.anthropic.com/v1',
      models: ['claude-opus-4', 'claude-sonnet-4', 'claude-3.5-sonnet', 'claude-3.5-haiku'],
      defaultModel: 'claude-sonnet-4',
      contextTokens: 200000
    },
    google: {
      endpoint: 'https://generativelanguage.googleapis.com/v1',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
      defaultModel: 'gemini-2.5-flash',
      contextTokens: 1048576
    },
    groq: {
      endpoint: 'https://api.groq.com/openai/v1',
      models: ['mixtral-8x7b-32768', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      defaultModel: 'llama-3.3-70b-versatile',
      contextTokens: 32768
    },
    ollama: {
      endpoint: 'http://localhost:11434',
      models: ['llama3.3:70b', 'mistral:latest', 'codellama:latest', 'qwen2.5-coder:32b'],
      defaultModel: 'llama3.3:70b',
      contextTokens: 128000
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.profile) {
      this.formData = { ...this.profile };
    }
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('profile') && this.profile) {
      this.formData = { ...this.profile };
    }
  }

  private handleProviderChange(provider: string) {
    const preset = this.providerPresets[provider as keyof typeof this.providerPresets];
    if (preset) {
      this.formData = {
        ...this.formData,
        provider,
        endpoint: preset.endpoint,
        model_name: preset.defaultModel,
        context_tokens: preset.contextTokens
      };
    }
  }

  private handleInputChange(field: string, value: any) {
    this.formData = {
      ...this.formData,
      [field]: value
    };
  }

  private getApiKeyHelp(provider: string): string {
    const helpText = {
      openai: 'Get your API key from platform.openai.com/api-keys',
      anthropic: 'Get your API key from console.anthropic.com',
      groq: 'Get your API key from console.groq.com/keys',
      google: 'Get your API key from console.cloud.google.com',
      ollama: 'No API key required for local Ollama installations'
    };
    
    return helpText[provider as keyof typeof helpText] || 'Enter your API key for this provider';
  }

  private requiresApiKey(provider: string): boolean {
    return provider !== 'ollama';
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      this.handleClose();
    }
  }

  private async handleTestConnection() {
    if (!this.formData.endpoint || !this.formData.model_name) {
      showToast('Please fill in endpoint and model before testing', 'warning');
      return;
    }

    // Check API key requirement
    if (this.requiresApiKey(this.formData.provider || '') && !this.formData.api_key) {
      showToast('API key is required for this provider', 'warning');
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
        // Error message already shown by testLLMConnectionWithErrorHandling
      }
    } catch (error) {
      this.connectionTestResult = 'error';
      showToast('Connection test failed', 'error');
      console.error('Connection test error:', error);
    } finally {
      this.testingConnection = false;
    }
  }

  private handleSave() {
    // Validate form
    if (!this.formData.name || !this.formData.provider || !this.formData.endpoint) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    // Validate API key for providers that require it
    if (this.requiresApiKey(this.formData.provider || '') && !this.formData.api_key) {
      showToast('API key is required for this provider', 'warning');
      return;
    }

    this.dispatchEvent(new CustomEvent('save', {
      detail: this.formData
    }));
  }

  render() {
    const isEdit = !!this.profile?.id;
    const currentProvider = this.formData.provider || 'openai';
    const preset = this.providerPresets[currentProvider as keyof typeof this.providerPresets];

    return html`
      <div class="modal-overlay ${this.open ? 'open' : ''}" @click=${(e: Event) => {
        if (e.target === e.currentTarget) this.handleClose();
      }}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">${isEdit ? 'Edit LLM Profile' : 'Add LLM Profile'}</h2>
            <button class="close-button" @click=${this.handleClose}>×</button>
          </div>

          <div class="form-group">
            <label class="form-label">Profile Name</label>
            <input
              type="text"
              class="form-input"
              .value=${this.formData.name || ''}
              @input=${(e: Event) => this.handleInputChange('name', (e.target as HTMLInputElement).value)}
              placeholder="e.g., OpenAI Config Optimizer"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Provider</label>
            <div class="provider-presets">
              ${Object.keys(this.providerPresets).map(provider => html`
                <button
                  class="preset-button ${currentProvider === provider ? 'selected' : ''}"
                  @click=${() => this.handleProviderChange(provider)}
                >
                  ${provider.charAt(0).toUpperCase() + provider.slice(1)}
                </button>
              `)}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              API Key
              ${this.requiresApiKey(this.formData.provider || '') ? html`<span style="color: var(--optimizer-error, #d32f2f);">*</span>` : ''}
            </label>
            <input
              type="password"
              class="form-input"
              .value=${this.formData.api_key || ''}
              @input=${(e: Event) => this.handleInputChange('api_key', (e.target as HTMLInputElement).value)}
              placeholder="${this.requiresApiKey(this.formData.provider || '') ? 'Enter your API key (required)' : 'Enter your API key (optional)'}"
              autocomplete="off"
              ?disabled=${!this.requiresApiKey(this.formData.provider || '')}
            />
            <div class="form-help">
              ${this.getApiKeyHelp(this.formData.provider || 'openai')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">API Endpoint</label>
            <input
              type="text"
              class="form-input"
              .value=${this.formData.endpoint || ''}
              @input=${(e: Event) => this.handleInputChange('endpoint', (e.target as HTMLInputElement).value)}
              placeholder="https://api.openai.com/v1"
            />
            <div class="form-help">API endpoint for the LLM provider</div>
            <button 
              class="test-button"
              @click=${this.handleTestConnection}
              ?disabled=${this.testingConnection || !this.formData.endpoint || !this.formData.model_name}
            >
              ${this.testingConnection ? '⏳ Testing...' : '🔗 Test Connection'}
            </button>
            ${this.connectionTestResult ? html`
              <div class="test-result ${this.connectionTestResult}">
                ${this.connectionTestResult === 'success' ? html`
                  <span>✅ Connection successful!</span>
                ` : html`
                  <span>❌ Connection failed</span>
                `}
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Model</label>
            <select
              class="form-select"
              .value=${this.formData.model_name || ''}
              @change=${(e: Event) => this.handleInputChange('model_name', (e.target as HTMLSelectElement).value)}
            >
              ${preset?.models.map(model => html`
                <option value=${model}>${model}</option>
              `) || html`<option value="">Select a model</option>`}
            </select>
            <div class="form-help">See LLM_PROVIDERS.md for model details</div>
          </div>

          <div class="form-group">
            <label class="form-label">Context Tokens</label>
            <input
              type="number"
              class="form-input"
              .value=${this.formData.context_tokens || 128000}
              @input=${(e: Event) => this.handleInputChange('context_tokens', parseInt((e.target as HTMLInputElement).value))}
            />
            <div class="form-help">Maximum number of tokens the model can process</div>
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select
              class="form-select"
              .value=${this.formData.role || 'optimize'}
              @change=${(e: Event) => this.handleInputChange('role', (e.target as HTMLSelectElement).value)}
            >
              <option value="optimize">Optimize (Configuration improvements)</option>
              <option value="automate">Automate (Suggest automations)</option>
              <option value="expert">Expert (Advanced analysis)</option>
            </select>
          </div>

          <div class="modal-footer">
            <button class="button secondary" @click=${this.handleClose}>Cancel</button>
            <button class="button" @click=${this.handleSave}>
              ${isEdit ? 'Update' : 'Create'} Profile
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'llm-profile-modal': LLMProfileModal;
  }
}