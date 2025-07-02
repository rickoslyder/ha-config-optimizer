import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Suggestion, type Scan } from '../services/api.js';
import '../components/diff-viewer.js';
import '../components/scan-progress.js';
import '../components/file-selector.js';
import type { DiffSection } from '../components/diff-viewer.js';
import { showToast } from '../components/toast-notification.js';
import { showErrorToast } from '../utils/error-handler.js';
import { LoadingManager } from '../utils/loading-state.js';

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

  @state()
  private showDiffModal = false;

  @state()
  private selectedSuggestion: Suggestion | null = null;

  @state()
  private showFileSelector = false;

  @state()
  private selectedSuggestionIds = new Set<number>();

  @state()
  private showBulkConfirm = false;

  @state()
  private bulkAction: 'accept' | 'reject' | null = null;

  private loadingStates = new LoadingManager(() => this.requestUpdate());

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

    .bulk-actions {
      background: var(--card-background-color, #ffffff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bulk-actions.hidden {
      display: none;
    }

    .bulk-selection {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .select-all-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .bulk-count {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
    }

    .bulk-buttons {
      display: flex;
      gap: 8px;
    }

    .bulk-button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .bulk-accept {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .bulk-reject {
      background: var(--optimizer-error, #d32f2f);
      color: white;
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
      position: relative;
    }

    .suggestion-card.selected {
      box-shadow: 0 4px 12px rgba(3, 169, 244, 0.2);
      border-left-color: var(--primary-color, #03a9f4);
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

    .suggestion-checkbox {
      position: absolute;
      top: 16px;
      left: -2px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      z-index: 1;
    }

    .suggestion-content {
      margin-left: 24px;
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

    .bulk-confirm-modal {
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

    .bulk-confirm-content {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .bulk-confirm-title {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 16px 0;
      color: var(--primary-text-color, #212121);
    }

    .bulk-confirm-message {
      margin-bottom: 20px;
      color: var(--secondary-text-color, #757575);
      line-height: 1.5;
    }

    .bulk-confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .diff-modal {
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

    .diff-modal-content {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      max-width: 90vw;
      max-height: 90vh;
      width: 900px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .diff-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--secondary-background-color, #f5f5f5);
    }

    .diff-modal-title {
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

    .diff-modal-body {
      flex: 1;
      overflow: auto;
      padding: 20px;
    }

    .no-diff-content {
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
      this.suggestions = suggestions;
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
      const scan = await apiService.createScanWithErrorHandling(selectedFiles);
      if (scan) {
        await this.loadData();
        showToast(`Scan started for ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`, 'success');
      }
    } catch (error) {
      showErrorToast(error, 'scan');
    } finally {
      this.loading = false;
    }
  }

  private handleFileSelectorClose() {
    this.showFileSelector = false;
  }

  private async handleSuggestionAction(suggestionId: number, action: string) {
    try {
      const result = await apiService.updateSuggestionWithErrorHandling(suggestionId, action);
      if (result) {
        await this.loadData();
        showToast(`Suggestion ${action}`, 'success');
      }
    } catch (error) {
      showErrorToast(error, 'suggestion');
    }
  }

  private handleViewDiff(suggestion: Suggestion) {
    this.selectedSuggestion = suggestion;
    this.showDiffModal = true;
  }

  private closeDiffModal() {
    this.showDiffModal = false;
    this.selectedSuggestion = null;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this.showDiffModal) {
        this.closeDiffModal();
      }
      if (this.showApplyConfirm) {
        this.closeApplyConfirm();
      }
      if (this.showBulkConfirm) {
        this.closeBulkConfirm();
      }
    }
  }

  private toggleSuggestionSelection(suggestionId: number) {
    if (this.selectedSuggestionIds.has(suggestionId)) {
      this.selectedSuggestionIds.delete(suggestionId);
    } else {
      this.selectedSuggestionIds.add(suggestionId);
    }
    this.requestUpdate();
  }

  private toggleSelectAll() {
    const pendingSuggestions = this.suggestions.filter(s => s.status === 'pending');
    
    if (this.selectedSuggestionIds.size === pendingSuggestions.length) {
      this.selectedSuggestionIds.clear();
    } else {
      this.selectedSuggestionIds.clear();
      pendingSuggestions.forEach(s => this.selectedSuggestionIds.add(s.id));
    }
    this.requestUpdate();
  }

  private handleBulkAction(action: 'accept' | 'reject') {
    this.bulkAction = action;
    this.showBulkConfirm = true;
  }

  private closeBulkConfirm() {
    this.showBulkConfirm = false;
    this.bulkAction = null;
  }

  private async confirmBulkAction() {
    if (!this.bulkAction || this.selectedSuggestionIds.size === 0) return;
    
    const action = this.bulkAction === 'accept' ? 'accepted' : 'rejected';
    const selectedIds = Array.from(this.selectedSuggestionIds);
    
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => apiService.updateSuggestionWithErrorHandling(id, action))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      const failed = selectedIds.length - successful;
      
      await this.loadData();
      this.selectedSuggestionIds.clear();
      this.closeBulkConfirm();
      
      if (failed === 0) {
        showToast(`${selectedIds.length} suggestion${selectedIds.length !== 1 ? 's' : ''} ${action}`, 'success');
      } else {
        showToast(`${successful} suggestion${successful !== 1 ? 's' : ''} ${action}, ${failed} failed`, 'warning');
      }
    } catch (error) {
      showErrorToast(error, 'suggestion');
    }
  }

  private exportSuggestions(format: 'json' | 'csv' | 'markdown') {
    try {
      const dataToExport = this.selectedSuggestionIds.size > 0 
        ? this.suggestions.filter(s => this.selectedSuggestionIds.has(s.id))
        : this.suggestions;
      
      if (dataToExport.length === 0) {
        showToast('No suggestions to export', 'warning');
        return;
      }
      
      let content: string;
      let filename: string;
      let mimeType: string;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(dataToExport, null, 2);
          filename = 'ha-config-suggestions.json';
          mimeType = 'application/json';
          break;
          
        case 'csv':
          content = this.convertToCSV(dataToExport);
          filename = 'ha-config-suggestions.csv';
          mimeType = 'text/csv';
          break;
          
        case 'markdown':
          content = this.convertToMarkdown(dataToExport);
          filename = 'ha-config-suggestions.md';
          mimeType = 'text/markdown';
          break;
          
        default:
          return;
      }
      
      this.downloadFile(content, filename, mimeType);
      showToast(`Exported ${dataToExport.length} suggestion${dataToExport.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showErrorToast(error, 'export');
    }
  }

  private convertToCSV(suggestions: Suggestion[]): string {
    const headers = ['ID', 'Title', 'Type', 'Impact', 'Status', 'Category', 'File Path', 'Description'];
    const rows = suggestions.map(s => [
      s.id.toString(),
      `"${s.title.replace(/"/g, '""')}"`,
      s.type,
      s.impact,
      s.status,
      s.metadata?.category || '',
      s.metadata?.file_path || '',
      `"${s.body_md.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private convertToMarkdown(suggestions: Suggestion[]): string {
    let markdown = '# Home Assistant Configuration Suggestions\n\n';
    markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    for (const suggestion of suggestions) {
      markdown += `## ${suggestion.title}\n\n`;
      markdown += `**Type:** ${suggestion.type} | **Impact:** ${suggestion.impact} | **Status:** ${suggestion.status}\n\n`;
      
      if (suggestion.metadata?.category) {
        markdown += `**Category:** ${suggestion.metadata.category}\n\n`;
      }
      
      if (suggestion.metadata?.file_path) {
        markdown += `**File:** \`${suggestion.metadata.file_path}\`\n\n`;
      }
      
      markdown += `${suggestion.body_md}\n\n`;
      markdown += '---\n\n';
    }
    
    return markdown;
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div>⏳ Loading...</div>
        </div>
      `;
    }

    return html`
      <div class="header">
        <h1 class="title">Configuration Optimizations</h1>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${this.suggestions.length > 0 ? html`
            <button 
              class="export-button"
              @click=${() => this.exportSuggestions('json')}
              title="Export as JSON"
            >
              📄 JSON
            </button>
            <button 
              class="export-button"
              @click=${() => this.exportSuggestions('csv')}
              title="Export as CSV"
            >
              📊 CSV
            </button>
            <button 
              class="export-button"
              @click=${() => this.exportSuggestions('markdown')}
              title="Export as Markdown"
            >
              📝 MD
            </button>
          ` : ''}
          <button 
            class="scan-button" 
            @click=${this.handleScanClick}
            ?disabled=${this.loading}
          >
            ${this.loading ? '⏳ Scanning...' : '🔍 Run Scan'}
          </button>
        </div>
      </div>

      <scan-progress @scans-updated=${this.handleScansUpdated}></scan-progress>

      ${this.renderBulkActions()}

      ${this.suggestions.length === 0 ? this.renderEmptyState() : html`
        <div class="suggestions-list">
          ${this.suggestions.map(suggestion => this.renderSuggestionCard(suggestion))}
        </div>
      `}
      
      ${this.showDiffModal ? this.renderDiffModal() : ''}
      ${this.showApplyConfirm ? this.renderApplyConfirm() : ''}
      ${this.showBulkConfirm ? this.renderBulkConfirm() : ''}
      
      <file-selector
        .open=${this.showFileSelector}
        @close=${this.handleFileSelectorClose}
        @confirm=${this.handleFileSelection}
      ></file-selector>
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
      const result = await apiService.applySuggestionWithErrorHandling(suggestionId);
      if (result) {
        await this.loadData();
        this.closeApplyConfirm();
        showToast('Changes applied successfully', 'success');
      }
    } catch (error) {
      showErrorToast(error, 'apply');
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

  private renderBulkActions() {
    const pendingSuggestions = this.suggestions.filter(s => s.status === 'pending');
    const selectedCount = this.selectedSuggestionIds.size;
    
    if (pendingSuggestions.length === 0) {
      return html``;
    }
    
    const allSelected = selectedCount === pendingSuggestions.length;
    
    return html`
      <div class="bulk-actions ${selectedCount === 0 ? 'hidden' : ''}">
        <div class="bulk-selection">
          <input 
            type="checkbox" 
            class="select-all-checkbox"
            .checked=${allSelected}
            @change=${this.toggleSelectAll}
          >
          <span class="bulk-count">
            ${selectedCount} of ${pendingSuggestions.length} selected
          </span>
        </div>
        <div class="bulk-buttons">
          <button 
            class="bulk-button bulk-accept"
            @click=${() => this.handleBulkAction('accept')}
            ?disabled=${selectedCount === 0}
          >
            Accept Selected (${selectedCount})
          </button>
          <button 
            class="bulk-button bulk-reject"
            @click=${() => this.handleBulkAction('reject')}
            ?disabled=${selectedCount === 0}
          >
            Reject Selected (${selectedCount})
          </button>
        </div>
      </div>
    `;
  }

  private renderSuggestionCard(suggestion: Suggestion) {
    const isSelected = this.selectedSuggestionIds.has(suggestion.id);
    const isPending = suggestion.status === 'pending';
    
    return html`
      <div class="suggestion-card impact-${suggestion.impact} ${isSelected ? 'selected' : ''}">
        ${isPending ? html`
          <input 
            type="checkbox" 
            class="suggestion-checkbox"
            .checked=${isSelected}
            @change=${() => this.toggleSuggestionSelection(suggestion.id)}
          >
        ` : ''}
        
        <div class="suggestion-content">
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
                class="action-button btn-accept loading-button"
                @click=${() => this.handleSuggestionAction(suggestion.id, 'accepted')}
                ?disabled=${this.loadingStates.isLoading(`suggestion-${suggestion.id}`)}
              >
                ${this.loadingStates.isLoading(`suggestion-${suggestion.id}`) ? html`
                  <div class="loading-spinner"></div> Accepting...
                ` : 'Accept'}
              </button>
              <button 
                class="action-button btn-reject loading-button"
                @click=${() => this.handleSuggestionAction(suggestion.id, 'rejected')}
                ?disabled=${this.loadingStates.isLoading(`suggestion-${suggestion.id}`)}
              >
                ${this.loadingStates.isLoading(`suggestion-${suggestion.id}`) ? html`
                  <div class="loading-spinner"></div> Rejecting...
                ` : 'Reject'}
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
      </div>
    `;
  }

  private renderEmptyState() {
    const hasCompletedScans = this.scans.some(s => s.status === 'completed');
    const hasRunningScans = this.scans.some(s => s.status === 'running');
    
    if (hasRunningScans) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">⏳</div>
          <h2>Scan in Progress</h2>
          <p>Your Home Assistant configuration is being analyzed. This usually takes 1-2 minutes.</p>
          <p><strong>What's happening:</strong></p>
          <ul style="text-align: left; max-width: 400px; margin: 16px auto;">
            <li>Parsing YAML configuration files</li>
            <li>Analyzing automation patterns</li>
            <li>Generating optimization suggestions</li>
          </ul>
        </div>
      `;
    }
    
    if (hasCompletedScans) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h2>Configuration Looks Good!</h2>
          <p>No optimization suggestions were found in your latest scan.</p>
          <p>Your Home Assistant configuration appears to be well-optimized.</p>
          <button class="scan-button" @click=${this.handleScanClick} style="margin-top: 16px;">
            🔍 Run Another Scan
          </button>
        </div>
      `;
    }
    
    return html`
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Ready to Optimize Your Configuration</h2>
        <p>Run a scan to analyze your Home Assistant configuration and get AI-powered optimization suggestions.</p>
        <p><strong>What you'll get:</strong></p>
        <ul style="text-align: left; max-width: 400px; margin: 16px auto;">
          <li>Performance improvement recommendations</li>
          <li>Code cleanup suggestions</li>
          <li>Best practice implementations</li>
          <li>Security enhancement tips</li>
        </ul>
        <button class="scan-button" @click=${this.handleScanClick} style="margin-top: 16px;">
          🚀 Start Your First Scan
        </button>
      </div>
    `;
  }

  private renderBulkConfirm() {
    if (!this.bulkAction) return '';
    
    const action = this.bulkAction;
    const selectedCount = this.selectedSuggestionIds.size;
    
    return html`
      <div class="bulk-confirm-modal" @click=${this.closeBulkConfirm}>
        <div class="bulk-confirm-content" @click=${(e: Event) => e.stopPropagation()}>
          <h3 class="bulk-confirm-title">
            ${action === 'accept' ? 'Accept' : 'Reject'} Multiple Suggestions
          </h3>
          <div class="bulk-confirm-message">
            <p>Are you sure you want to ${action} ${selectedCount} suggestion${selectedCount !== 1 ? 's' : ''}?</p>
            ${action === 'accept' ? html`
              <p>Accepted suggestions can then be applied to modify your configuration files.</p>
            ` : html`
              <p>Rejected suggestions will be marked as dismissed and cannot be applied.</p>
            `}
          </div>
          <div class="bulk-confirm-actions">
            <button class="confirm-button confirm-cancel" @click=${this.closeBulkConfirm}>
              Cancel
            </button>
            <button 
              class="confirm-button ${action === 'accept' ? 'confirm-apply' : 'bulk-reject'} loading-button"
              @click=${this.confirmBulkAction}
              ?disabled=${this.loadingStates.isLoading('bulk-action')}
            >
              ${this.loadingStates.isLoading('bulk-action') ? html`
                <div class="loading-spinner"></div> Processing...
              ` : `${action === 'accept' ? 'Accept' : 'Reject'} ${selectedCount} Suggestion${selectedCount !== 1 ? 's' : ''}`}
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