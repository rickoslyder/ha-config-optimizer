import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Suggestion, type Scan } from '../services/api.js';
import '../components/scan-progress.js';
import '../components/file-selector.js';
import { showToast } from '../components/toast-notification.js';

@customElement('automations-view')
export class AutomationsView extends LitElement {
  @state()
  private suggestions: Suggestion[] = [];

  @state()
  private loading = false;

  @state()
  private scans: Scan[] = [];

  @state()
  private selectedSuggestion: Suggestion | null = null;

  @state()
  private showYamlModal = false;

  @state()
  private showFileSelector = false;

  static styles = css`
    :host {
      display: block;
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .scan-button {
      background: var(--optimizer-automation, #4caf50);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px 24px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .scan-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .scan-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--secondary-text-color, #757575);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .suggestion-card {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid var(--optimizer-automation, #4caf50);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .suggestion-card.impact-high {
      border-left-color: var(--impact-high, #d32f2f);
    }

    .suggestion-card.impact-medium {
      border-left-color: var(--impact-medium, #f57f17);
    }

    .suggestion-card.impact-low {
      border-left-color: var(--impact-low, #00c875);
    }

    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .suggestion-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .category-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--optimizer-automation, #4caf50);
      color: white;
    }

    .impact-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 8px;
    }

    .impact-high {
      background: var(--impact-high, #d32f2f);
      color: white;
    }

    .impact-medium {
      background: var(--impact-medium, #f57f17);
      color: white;
    }

    .impact-low {
      background: var(--impact-low, #00c875);
      color: white;
    }

    .suggestion-body {
      margin: 12px 0 16px 0;
      color: var(--secondary-text-color, #757575);
      line-height: 1.5;
    }

    .automation-details {
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
      padding: 12px;
      margin: 8px 0;
      font-size: 14px;
    }

    .detail-row {
      margin-bottom: 6px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .entities-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }

    .entity-tag {
      background: var(--primary-color, #03a9f4);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-family: var(--font-family-code, 'Roboto Mono', monospace);
    }

    .suggestion-actions {
      display: flex;
      gap: 8px;
    }

    .action-button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-accept {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .btn-reject {
      background: var(--optimizer-error, #d32f2f);
      color: white;
    }

    .btn-view-yaml {
      background: transparent;
      color: var(--optimizer-automation, #4caf50);
      border: 1px solid var(--optimizer-automation, #4caf50);
    }

    .action-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--secondary-text-color, #757575);
    }

    .yaml-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .yaml-modal-content {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .yaml-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--secondary-background-color, #f5f5f5);
    }

    .yaml-modal-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: var(--secondary-text-color, #757575);
      transition: all 0.2s ease;
    }

    .close-button:hover {
      background: var(--divider-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .yaml-modal-body {
      flex: 1;
      overflow: auto;
      padding: 20px;
    }

    .yaml-code {
      background: var(--secondary-background-color, #f5f5f5);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      padding: 16px;
      font-family: var(--font-family-code, 'Roboto Mono', monospace);
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-wrap;
      overflow-x: auto;
      color: var(--primary-text-color, #212121);
    }

    .copy-button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 12px;
      transition: all 0.2s ease;
    }

    .copy-button:hover {
      opacity: 0.9;
    }

    .no-yaml-content {
      padding: 40px;
      text-align: center;
      color: var(--secondary-text-color, #757575);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleScansUpdated(event: CustomEvent) {
    const { scans, runningScans } = event.detail;
    // Update scans data and refresh suggestions if any scans completed
    const wasRunning = this.scans.some(s => s.status === 'running');
    const nowRunning = runningScans.length > 0;
    
    this.scans = scans;
    
    // If scans were running and now stopped, refresh suggestions
    if (wasRunning && !nowRunning) {
      this.loadData();
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      const [suggestions, scans] = await Promise.all([
        apiService.getSuggestions(),
        apiService.getScans(),
      ]);
      // Filter for automation suggestions only
      this.suggestions = suggestions.filter(s => s.type === 'automation');
      this.scans = scans;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleScanClick() {
    this.showFileSelector = true;
  }

  private async handleFileSelection(event: CustomEvent) {
    const { selectedFiles } = event.detail;
    this.showFileSelector = false;
    
    this.loading = true;
    try {
      // Create automation-specific scan
      await apiService.createAutomationScan(selectedFiles);
      await this.loadData();
      showToast(`Automation scan started for ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Failed to create automation scan:', error);
      showToast('Failed to start automation scan', 'error');
    } finally {
      this.loading = false;
    }
  }

  private handleFileSelectorClose() {
    this.showFileSelector = false;
  }

  private async handleSuggestionAction(suggestionId: number, action: string) {
    try {
      await apiService.updateSuggestion(suggestionId, action);
      await this.loadData();
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    }
  }

  private handleViewYaml(suggestion: Suggestion) {
    this.selectedSuggestion = suggestion;
    this.showYamlModal = true;
  }

  private closeYamlModal() {
    this.showYamlModal = false;
    this.selectedSuggestion = null;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.showYamlModal) {
      this.closeYamlModal();
    }
  }

  private async copyYamlToClipboard() {
    if (!this.selectedSuggestion?.metadata?.yaml) return;
    
    try {
      await navigator.clipboard.writeText(this.selectedSuggestion.metadata.yaml);
      showToast('YAML copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy YAML:', error);
      showToast('Failed to copy YAML', 'error');
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>⏳ Loading automation suggestions...</div>
        </div>
      `;
    }

    return html`
      <div class="header">
        <h1 class="title">Automation Suggestions</h1>
        <button 
          class="scan-button" 
          @click=${this.handleScanClick}
          ?disabled=${this.loading}
        >
          ${this.loading ? '⏳ Generating...' : '🤖 Generate Automations'}
        </button>
      </div>

      <scan-progress @scans-updated=${this.handleScansUpdated}></scan-progress>

      ${this.suggestions.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h2>No automation suggestions found</h2>
          <p>Generate AI-powered automation suggestions based on your Home Assistant configuration and available entities.</p>
        </div>
      ` : html`
        <div class="suggestions-list">
          ${this.suggestions.map(suggestion => this.renderSuggestionCard(suggestion))}
        </div>
      `}
      
      ${this.showYamlModal ? this.renderYamlModal() : ''}
      
      <file-selector
        .open=${this.showFileSelector}
        @close=${this.handleFileSelectorClose}
        @confirm=${this.handleFileSelection}
      ></file-selector>
    `;
  }

  private renderSuggestionCard(suggestion: Suggestion) {
    const metadata = suggestion.metadata as any;
    
    return html`
      <div class="suggestion-card impact-${suggestion.impact}">
        <div class="suggestion-header">
          <h3 class="suggestion-title">${suggestion.title}</h3>
          <div>
            ${metadata?.category ? html`
              <span class="category-badge">${metadata.category}</span>
            ` : ''}
            <span class="impact-badge impact-${suggestion.impact}">${suggestion.impact}</span>
          </div>
        </div>
        
        <div class="suggestion-body">
          ${suggestion.body_md}
          
          ${metadata ? html`
            <div class="automation-details">
              ${metadata.trigger ? html`
                <div class="detail-row">
                  <span class="detail-label">Trigger:</span> ${metadata.trigger}
                </div>
              ` : ''}
              
              ${metadata.condition ? html`
                <div class="detail-row">
                  <span class="detail-label">Condition:</span> ${metadata.condition}
                </div>
              ` : ''}
              
              ${metadata.action ? html`
                <div class="detail-row">
                  <span class="detail-label">Action:</span> ${metadata.action}
                </div>
              ` : ''}
              
              ${metadata.entities_used && metadata.entities_used.length > 0 ? html`
                <div class="detail-row">
                  <span class="detail-label">Entities Used:</span>
                  <div class="entities-list">
                    ${metadata.entities_used.map((entity: string) => html`
                      <span class="entity-tag">${entity}</span>
                    `)}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="suggestion-actions">
          <button 
            class="action-button btn-view-yaml"
            @click=${() => this.handleViewYaml(suggestion)}
            ?disabled=${!metadata?.yaml}
          >
            ${metadata?.yaml ? 'View YAML' : 'No YAML Available'}
          </button>
          <button 
            class="action-button btn-accept"
            @click=${() => this.handleSuggestionAction(suggestion.id, 'accepted')}
          >
            Accept
          </button>
          <button 
            class="action-button btn-reject"
            @click=${() => this.handleSuggestionAction(suggestion.id, 'rejected')}
          >
            Reject
          </button>
        </div>
      </div>
    `;
  }

  private renderYamlModal() {
    if (!this.selectedSuggestion) return '';
    
    const metadata = this.selectedSuggestion.metadata as any;
    
    return html`
      <div class="yaml-modal" @click=${this.closeYamlModal}>
        <div class="yaml-modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="yaml-modal-header">
            <h3 class="yaml-modal-title">Automation YAML</h3>
            <button class="close-button" @click=${this.closeYamlModal}>
              ✕
            </button>
          </div>
          <div class="yaml-modal-body">
            ${metadata?.yaml ? html`
              <div class="yaml-code">${metadata.yaml}</div>
              <button class="copy-button" @click=${this.copyYamlToClipboard}>
                📋 Copy to Clipboard
              </button>
            ` : html`
              <div class="no-yaml-content">
                <p>No YAML configuration available for this automation suggestion.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'automations-view': AutomationsView;
  }
}