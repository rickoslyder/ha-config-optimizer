import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Settings, type LLMProfile } from '../services/api.js';
import '../components/llm-profile-modal.js';

@customElement('settings-view')
export class SettingsView extends LitElement {
  @state()
  private settings: Settings | null = null;

  @state()
  private llmProfiles: LLMProfile[] = [];

  @state()
  private loading = false;

  @state()
  private showProfileModal = false;

  @state()
  private editingProfile: LLMProfile | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 800px;
    }

    .title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 32px 0;
      color: var(--primary-text-color, #212121);
    }

    .section {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 16px 0;
      color: var(--primary-text-color, #212121);
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

    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
      font-family: inherit;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
      box-shadow: 0 0 0 2px rgba(3, 169, 244, 0.2);
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .form-help {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      margin-top: 4px;
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

    .button-secondary {
      background: transparent;
      color: var(--primary-color, #03a9f4);
      border: 1px solid var(--primary-color, #03a9f4);
    }

    .button-danger {
      background: var(--optimizer-error, #d32f2f);
    }

    .profile-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .profile-info {
      flex: 1;
    }

    .profile-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .profile-details {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
    }

    .profile-actions {
      display: flex;
      gap: 8px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--secondary-text-color, #757575);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [settings, profiles] = await Promise.all([
        apiService.getSettings(),
        apiService.getLLMProfiles(),
      ]);
      this.settings = settings;
      this.llmProfiles = profiles;
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleSaveSettings(event: Event) {
    event.preventDefault();
    if (!this.settings) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const updatedSettings = {
      yaml_includes: formData.get('yaml_includes')?.toString().split('\n').filter(Boolean) || [],
      yaml_excludes: formData.get('yaml_excludes')?.toString().split('\n').filter(Boolean) || [],
      cron_expr: formData.get('cron_expr')?.toString() || undefined,
      db_dsn: formData.get('db_dsn')?.toString() || undefined,
      db_type: formData.get('db_type')?.toString() || 'sqlite',
    };

    try {
      this.settings = await apiService.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private handleAddProfile() {
    this.editingProfile = null;
    this.showProfileModal = true;
  }

  private handleEditProfile(profile: LLMProfile) {
    this.editingProfile = profile;
    this.showProfileModal = true;
  }

  private async handleDeleteProfile(profileId: number) {
    if (!confirm('Are you sure you want to delete this LLM profile?')) return;

    try {
      await apiService.deleteLLMProfile(profileId);
      await this.loadData();
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  }

  private async handleSaveProfile(event: CustomEvent) {
    const profileData = event.detail;
    
    try {
      if (this.editingProfile?.id) {
        // Update existing profile
        await apiService.updateLLMProfile(this.editingProfile.id, profileData);
      } else {
        // Create new profile
        await apiService.createLLMProfile(profileData);
      }
      
      this.showProfileModal = false;
      this.editingProfile = null;
      await this.loadData();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please check your settings and try again.');
    }
  }

  private handleCloseModal() {
    this.showProfileModal = false;
    this.editingProfile = null;
  }

  render() {
    if (this.loading || !this.settings) {
      return html`
        <div class="loading">
          <div>⏳ Loading settings...</div>
        </div>
      `;
    }

    return html`
      <h1 class="title">Settings</h1>

      <!-- File Configuration -->
      <div class="section">
        <h2 class="section-title">File Configuration</h2>
        <form @submit=${this.handleSaveSettings}>
          <div class="form-group">
            <label class="form-label" for="yaml_includes">YAML Include Patterns</label>
            <textarea 
              class="form-input form-textarea" 
              id="yaml_includes"
              name="yaml_includes"
              .value=${this.settings.yaml_includes.join('\n')}
            ></textarea>
            <div class="form-help">One pattern per line (e.g., *.yaml, automations.yaml)</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="yaml_excludes">YAML Exclude Patterns</label>
            <textarea 
              class="form-input form-textarea" 
              id="yaml_excludes"
              name="yaml_excludes"
              .value=${this.settings.yaml_excludes.join('\n')}
            ></textarea>
            <div class="form-help">Files to exclude from analysis (e.g., secrets.yaml)</div>
          </div>

          <button type="submit" class="button">Save File Settings</button>
        </form>
      </div>

      <!-- Scheduling Configuration -->
      <div class="section">
        <h2 class="section-title">Scheduled Scans</h2>
        <form @submit=${this.handleSaveSettings}>
          <div class="form-group">
            <label class="form-label" for="cron_expr">Cron Expression</label>
            <input 
              type="text" 
              class="form-input" 
              id="cron_expr"
              name="cron_expr"
              .value=${this.settings.cron_expr || ''}
              placeholder="0 2 * * 0 (every Sunday at 2 AM)"
            />
            <div class="form-help">Leave empty to disable scheduled scans</div>
          </div>

          <button type="submit" class="button">Save Schedule</button>
        </form>
      </div>

      <!-- LLM Profiles -->
      <div class="section">
        <h2 class="section-title">LLM Providers</h2>
        
        ${this.llmProfiles.length === 0 ? html`
          <p>No LLM profiles configured. Add one to start analyzing your configuration.</p>
        ` : html`
          <div class="profiles-list">
            ${this.llmProfiles.map(profile => html`
              <div class="profile-item">
                <div class="profile-info">
                  <div class="profile-name">${profile.name}</div>
                  <div class="profile-details">
                    ${profile.provider} • ${profile.model_name || 'Default Model'} • ${profile.role}
                  </div>
                </div>
                <div class="profile-actions">
                  <button 
                    class="button button-secondary"
                    @click=${() => this.handleEditProfile(profile)}
                  >
                    Edit
                  </button>
                  <button 
                    class="button button-danger"
                    @click=${() => this.handleDeleteProfile(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}

        <button 
          class="button button-secondary"
          @click=${this.handleAddProfile}
          style="margin-top: 16px;"
        >
          + Add LLM Profile
        </button>
      </div>

      <!-- Database Configuration -->
      <div class="section">
        <h2 class="section-title">Database Configuration</h2>
        <form @submit=${this.handleSaveSettings}>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="db_type">Database Type</label>
              <select class="form-input" id="db_type" name="db_type" .value=${this.settings.db_type}>
                <option value="sqlite">SQLite</option>
                <option value="mysql">MySQL/MariaDB</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="db_dsn">Database Connection String</label>
              <input 
                type="text" 
                class="form-input" 
                id="db_dsn"
                name="db_dsn"
                .value=${this.settings.db_dsn || ''}
                placeholder="Leave empty for default SQLite"
              />
            </div>
          </div>

          <button type="submit" class="button">Save Database Settings</button>
        </form>
      </div>

      <!-- LLM Profile Modal -->
      <llm-profile-modal
        .open=${this.showProfileModal}
        .profile=${this.editingProfile}
        @close=${this.handleCloseModal}
        @save=${this.handleSaveProfile}
      ></llm-profile-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'settings-view': SettingsView;
  }
}