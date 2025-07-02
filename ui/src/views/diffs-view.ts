import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Suggestion, type Diff } from '../services/api.js';
import '../components/diff-viewer.js';
import { showToast } from '../components/toast-notification.js';
import type { DiffSection } from '../components/diff-viewer.js';

@customElement('diffs-view')
export class DiffsView extends LitElement {
  @state()
  private suggestions: Suggestion[] = [];

  @state()
  private loading = false;

  @state()
  private selectedSuggestion: Suggestion | null = null;

  @state()
  private filterStatus: 'all' | 'accepted' | 'applied' = 'all';

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

    .controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
      font-size: 14px;
    }

    .refresh-button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-button:hover {
      opacity: 0.9;
    }

    .refresh-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .content {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 24px;
      height: calc(100vh - 200px);
    }

    .suggestions-panel {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid var(--divider-color, #e0e0e0);
      overflow-y: auto;
    }

    .suggestions-panel h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .suggestion-item {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
    }

    .suggestion-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .suggestion-item.selected {
      background: var(--secondary-background-color, #f5f5f5);
      border-left-color: var(--primary-color, #03a9f4);
    }

    .suggestion-item.status-accepted {
      border-left-color: var(--optimizer-warning, #f57f17);
    }

    .suggestion-item.status-applied {
      border-left-color: var(--optimizer-success, #00c875);
    }

    .suggestion-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--primary-text-color, #212121);
    }

    .suggestion-meta {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .suggestion-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      margin-left: 8px;
    }

    .suggestion-status.accepted {
      background: var(--optimizer-warning, #f57f17);
      color: white;
    }

    .suggestion-status.applied {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .diff-panel {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .diff-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      background: var(--secondary-background-color, #f5f5f5);
    }

    .diff-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .diff-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--secondary-text-color, #757575);
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--secondary-text-color, #757575);
    }

    .diff-actions {
      padding: 16px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
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

    .btn-apply {
      background: var(--optimizer-automation, #4caf50);
      color: white;
    }

    .btn-revert {
      background: var(--optimizer-error, #d32f2f);
      color: white;
    }

    .action-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
        grid-template-rows: 250px 1fr;
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
      const suggestions = await apiService.getSuggestions();
      // Filter for suggestions with diffs
      this.suggestions = suggestions.filter(s => 
        (s.status === 'accepted' || s.status === 'applied') && 
        (s.metadata?.before || s.metadata?.after || s.diff)
      );
      
      // Auto-select first suggestion if none selected
      if (!this.selectedSuggestion && this.suggestions.length > 0) {
        this.selectedSuggestion = this.suggestions[0];
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      showToast('Failed to load diffs', 'error');
    } finally {
      this.loading = false;
    }
  }

  private handleFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filterStatus = select.value as 'all' | 'accepted' | 'applied';
  }

  private handleSuggestionSelect(suggestion: Suggestion) {
    this.selectedSuggestion = suggestion;
  }

  private async handleApply() {
    if (!this.selectedSuggestion) return;
    
    try {
      await apiService.applySuggestion(this.selectedSuggestion.id);
      await this.loadData();
      showToast('Changes applied successfully', 'success');
    } catch (error) {
      console.error('Failed to apply changes:', error);
      showToast('Failed to apply changes', 'error');
    }
  }

  private getFilteredSuggestions(): Suggestion[] {
    if (this.filterStatus === 'all') {
      return this.suggestions;
    }
    return this.suggestions.filter(s => s.status === this.filterStatus);
  }

  private getDiffSection(suggestion: Suggestion): DiffSection | null {
    if (!suggestion.metadata?.before || !suggestion.metadata?.after) {
      return null;
    }

    return {
      title: suggestion.title,
      before: suggestion.metadata.before,
      after: suggestion.metadata.after,
      filePath: suggestion.metadata.file_path || 'configuration.yaml'
    };
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>⏳ Loading diffs...</div>
        </div>
      `;
    }

    const filteredSuggestions = this.getFilteredSuggestions();

    return html`
      <div class="header">
        <h1 class="title">Configuration Diffs</h1>
        <div class="controls">
          <select class="filter-select" @change=${this.handleFilterChange}>
            <option value="all">All Diffs</option>
            <option value="accepted">Accepted</option>
            <option value="applied">Applied</option>
          </select>
          
          <button class="refresh-button" @click=${this.loadData} ?disabled=${this.loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div class="content">
        <div class="suggestions-panel">
          <h3>Changes (${filteredSuggestions.length})</h3>
          ${filteredSuggestions.length === 0 ? html`
            <div class="empty-state">
              <div class="empty-icon">📄</div>
              <p>No diffs available</p>
            </div>
          ` : filteredSuggestions.map(suggestion => html`
            <div 
              class="suggestion-item status-${suggestion.status} ${this.selectedSuggestion?.id === suggestion.id ? 'selected' : ''}"
              @click=${() => this.handleSuggestionSelect(suggestion)}
            >
              <div class="suggestion-title">
                ${suggestion.title}
                <span class="suggestion-status ${suggestion.status}">${suggestion.status}</span>
              </div>
              <div class="suggestion-meta">
                ${suggestion.metadata?.file_path || 'configuration.yaml'}
                ${suggestion.impact ? ` • ${suggestion.impact} impact` : ''}
              </div>
            </div>
          `)}
        </div>

        <div class="diff-panel">
          <div class="diff-header">
            <h3>
              ${this.selectedSuggestion ? this.selectedSuggestion.title : 'Select a change to view diff'}
            </h3>
          </div>
          <div class="diff-content">
            ${this.selectedSuggestion ? html`
              ${(() => {
                const diffSection = this.getDiffSection(this.selectedSuggestion);
                return diffSection ? html`
                  <diff-viewer .diffSection=${diffSection} .showSideBySide=${true}></diff-viewer>
                ` : html`
                  <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No diff available</h3>
                    <p>This suggestion doesn't have configuration changes to display.</p>
                  </div>
                `;
              })()}
            ` : html`
              <div class="empty-state">
                <div class="empty-icon">👈</div>
                <h3>Select a change</h3>
                <p>Choose a suggestion from the list to view its diff.</p>
              </div>
            `}
          </div>
          ${this.selectedSuggestion && this.selectedSuggestion.status === 'accepted' ? html`
            <div class="diff-actions">
              <button 
                class="action-button btn-apply"
                @click=${this.handleApply}
              >
                ✨ Apply Changes
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'diffs-view': DiffsView;
  }
}