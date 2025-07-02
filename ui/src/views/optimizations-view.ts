import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Suggestion, type Scan } from '../services/api.js';
import '../components/diff-viewer.js';
import '../components/scan-progress.js';
import type { DiffSection } from '../components/diff-viewer.js';

@customElement('optimizations-view')
export class OptimizationsView extends LitElement {
  @state()
  private suggestions: Suggestion[] = [];

  @state()
  private loading = false;

  @state()
  private scans: Scan[] = [];

  @state()
  private applyingIds = new Set<number>();

  @state()
  private showApplyConfirm = false;

  @state()
  private confirmSuggestion: Suggestion | null = null;

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
      background: var(--primary-color, #03a9f4);
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
      border-left: 4px solid var(--impact-medium, #f57f17);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .suggestion-card.impact-high {
      border-left-color: var(--impact-high, #d32f2f);
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

    .impact-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

    .btn-view-diff {
      background: transparent;
      color: var(--primary-color, #03a9f4);
      border: 1px solid var(--primary-color, #03a9f4);
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

    .btn-apply {
      background: var(--optimizer-automation, #4caf50);
      color: white;
    }

    .status-applied {
      color: var(--optimizer-success, #00c875);
      font-weight: 500;
      font-size: 14px;
    }

    .status-rejected {
      color: var(--optimizer-error, #d32f2f);
      font-weight: 500;
      font-size: 14px;
    }

    .apply-confirm-modal {
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

    .apply-confirm-content {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .apply-confirm-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 16px 0;
      color: var(--primary-text-color, #212121);
    }

    .apply-confirm-message {
      margin-bottom: 20px;
      color: var(--secondary-text-color, #757575);
      line-height: 1.5;
    }

    .apply-confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .confirm-button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .confirm-apply {
      background: var(--optimizer-automation, #4caf50);
      color: white;
    }

    .confirm-cancel {
      background: var(--divider-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .confirm-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
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
      this.suggestions = suggestions;
      this.scans = scans;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleScanClick() {
    this.loading = true;
    try {
      await apiService.createScan([]);
      await this.loadData();
    } catch (error) {
      console.error('Failed to create scan:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleSuggestionAction(suggestionId: number, action: string) {
    try {
      await apiService.updateSuggestion(suggestionId, action);
      await this.loadData();
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>⏳ Loading...</div>
        </div>
      `;
    }

    return html`
      <div class="header">
        <h1 class="title">Configuration Optimizations</h1>
        <button 
          class="scan-button" 
          @click=${this.handleScanClick}
          ?disabled=${this.loading}
        >
          ${this.loading ? '⏳ Scanning...' : '🔍 Run Scan'}
        </button>
      </div>

      <scan-progress @scans-updated=${this.handleScansUpdated}></scan-progress>

      ${this.suggestions.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>No optimizations found</h2>
          <p>Run a scan to analyze your Home Assistant configuration and get AI-powered optimization suggestions.</p>
        </div>
      ` : html`
        <div class="suggestions-list">
          ${this.suggestions.map(suggestion => html`
            <div class="suggestion-card impact-${suggestion.impact}">
              <div class="suggestion-header">
                <h3 class="suggestion-title">${suggestion.title}</h3>
                <span class="impact-badge impact-${suggestion.impact}">${suggestion.impact}</span>
              </div>
              <div class="suggestion-body">
                ${suggestion.body_md}
                ${suggestion.metadata?.category ? html`
                  <div style="margin-top: 8px;">
                    <strong>Category:</strong> ${suggestion.metadata.category}
                  </div>
                ` : ''}
                ${suggestion.metadata?.file_path ? html`
                  <div style="margin-top: 4px; font-size: 12px; color: var(--secondary-text-color, #757575);">
                    <strong>File:</strong> ${suggestion.metadata.file_path}
                  </div>
                ` : ''}
              </div>
              <div class="suggestion-actions">
                <button 
                  class="action-button btn-view-diff"
                  @click=${() => this.handleViewDiff(suggestion)}
                  ?disabled=${!suggestion.metadata || !suggestion.metadata.before}
                >
                  ${suggestion.metadata?.before ? 'View Diff' : 'No Diff Available'}
                </button>
                ${suggestion.status === 'pending' ? html`
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
                ` : suggestion.status === 'accepted' ? html`
                  <button 
                    class="action-button btn-apply"
                    @click=${() => this.handleApplyClick(suggestion)}
                    ?disabled=${this.applyingIds.has(suggestion.id)}
                  >
                    ${this.applyingIds.has(suggestion.id) ? '⏳ Applying...' : '✨ Apply Changes'}
                  </button>
                  <button 
                    class="action-button btn-reject"
                    @click=${() => this.handleSuggestionAction(suggestion.id, 'rejected')}
                  >
                    Cancel
                  </button>
                ` : suggestion.status === 'applied' ? html`
                  <span class="status-applied">✅ Applied</span>
                ` : html`
                  <span class="status-rejected">❌ Rejected</span>
                `}
              </div>
            </div>
          `)}
        </div>
      `}
      
      ${this.showDiffModal ? this.renderDiffModal() : ''}
      ${this.showApplyConfirm ? this.renderApplyConfirm() : ''}
    `;
  }

  private renderDiffModal() {
    if (!this.selectedSuggestion) return '';
    
    const diffSection = this.getDiffSection(this.selectedSuggestion);
    
    return html`
      <div class="diff-modal" @click=${this.closeDiffModal}>
        <div class="diff-modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="diff-modal-header">
            <h3 class="diff-modal-title">Configuration Changes</h3>
            <button class="close-button" @click=${this.closeDiffModal}>
              ✕
            </button>
          </div>
          <div class="diff-modal-body">
            ${diffSection ? html`
              <diff-viewer .diffSection=${diffSection} .showSideBySide=${true}></diff-viewer>
            ` : html`
              <div class="no-diff-content">
                <p>No configuration changes available for this suggestion.</p>
                <p>This may be a general recommendation or automation suggestion.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  private handleApplyClick(suggestion: Suggestion) {
    this.confirmSuggestion = suggestion;
    this.showApplyConfirm = true;
  }

  private closeApplyConfirm() {
    this.showApplyConfirm = false;
    this.confirmSuggestion = null;
  }

  private async confirmApply() {
    if (!this.confirmSuggestion) return;
    
    const suggestionId = this.confirmSuggestion.id;
    this.applyingIds.add(suggestionId);
    this.requestUpdate();
    
    try {
      await apiService.applySuggestion(suggestionId);
      await this.loadData();
      this.closeApplyConfirm();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      // Could show error toast here
    } finally {
      this.applyingIds.delete(suggestionId);
      this.requestUpdate();
    }
  }

  private renderApplyConfirm() {
    if (!this.confirmSuggestion) return '';
    
    return html`
      <div class="apply-confirm-modal" @click=${this.closeApplyConfirm}>
        <div class="apply-confirm-content" @click=${(e: Event) => e.stopPropagation()}>
          <h3 class="apply-confirm-title">Apply Configuration Changes</h3>
          <div class="apply-confirm-message">
            <p>Are you sure you want to apply the changes from "${this.confirmSuggestion.title}"?</p>
            <p><strong>This will modify your Home Assistant configuration files.</strong></p>
            <p>A backup will be created automatically before applying changes.</p>
            ${this.confirmSuggestion.metadata?.file_path ? html`
              <p><strong>File:</strong> ${this.confirmSuggestion.metadata.file_path}</p>
            ` : ''}
          </div>
          <div class="apply-confirm-actions">
            <button class="confirm-button confirm-cancel" @click=${this.closeApplyConfirm}>
              Cancel
            </button>
            <button class="confirm-button confirm-apply" @click=${this.confirmApply}>
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'optimizations-view': OptimizationsView;
  }
}