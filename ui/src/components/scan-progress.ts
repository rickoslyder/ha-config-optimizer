import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { apiService, type Scan } from '../services/api.js';

@customElement('scan-progress')
export class ScanProgress extends LitElement {
  @property({ type: Boolean })
  autoRefresh = true;

  @property({ type: Number })
  refreshInterval = 2000;

  @state()
  private scans: Scan[] = [];

  @state()
  private runningScans: Scan[] = [];

  private stopMonitoring?: () => void;
  private lastUpdateTime = 0;

  static styles = css`
    :host {
      display: block;
    }

    .progress-container {
      background: var(--card-background-color, #ffffff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .progress-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .progress-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .last-update {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .toggle-button {
      background: transparent;
      border: 1px solid var(--primary-color, #03a9f4);
      color: var(--primary-color, #03a9f4);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-button:hover {
      background: var(--primary-color, #03a9f4);
      color: white;
    }

    .toggle-button.active {
      background: var(--primary-color, #03a9f4);
      color: white;
    }

    .scan-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .scan-item:last-child {
      margin-bottom: 0;
    }

    .scan-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-top: 2px solid var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .scan-info {
      flex: 1;
    }

    .scan-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 4px 0;
      color: var(--primary-text-color, #212121);
    }

    .scan-details {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .scan-duration {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      font-family: var(--font-family-code, 'Roboto Mono', monospace);
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--divider-color, #e0e0e0);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 8px;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color, #03a9f4);
      border-radius: 2px;
      transition: width 0.3s ease;
      animation: pulse 2s ease-in-out infinite alternate;
    }

    @keyframes pulse {
      0% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    .no-scans {
      text-align: center;
      padding: 20px;
      color: var(--secondary-text-color, #757575);
      font-size: 14px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .status-running {
      background: var(--optimizer-warning, #f57f17);
      animation: pulse-dot 1.5s ease-in-out infinite;
    }

    .status-completed {
      background: var(--optimizer-success, #00c875);
    }

    .status-failed {
      background: var(--optimizer-error, #d32f2f);
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .compact {
      padding: 8px 12px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .compact .scan-spinner {
      width: 14px;
      height: 14px;
      border-width: 1px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.autoRefresh) {
      this.startMonitoring();
    } else {
      this.loadScans();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCurrentMonitoring();
  }

  private startMonitoring() {
    this.stopCurrentMonitoring();
    this.stopMonitoring = apiService.startScanMonitoring(
      (scans) => this.handleScansUpdate(scans),
      this.refreshInterval
    );
  }

  private stopCurrentMonitoring() {
    if (this.stopMonitoring) {
      this.stopMonitoring();
      this.stopMonitoring = undefined;
    }
  }

  private async loadScans() {
    try {
      const scans = await apiService.getScans();
      this.handleScansUpdate(scans);
    } catch (error) {
      console.error('Failed to load scans:', error);
    }
  }

  private handleScansUpdate(scans: Scan[]) {
    this.scans = scans;
    this.runningScans = scans.filter(scan => 
      scan.status === 'running' || scan.status === 'pending'
    );
    this.lastUpdateTime = Date.now();
    
    // Dispatch event for parent components
    this.dispatchEvent(new CustomEvent('scans-updated', {
      detail: { scans, runningScans: this.runningScans },
      bubbles: true
    }));
  }

  private toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      this.startMonitoring();
    } else {
      this.stopCurrentMonitoring();
    }
  }

  private getScanDuration(scan: Scan): string {
    const start = new Date(scan.started_at).getTime();
    const end = scan.ended_at ? new Date(scan.ended_at).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  private getEstimatedProgress(scan: Scan): number {
    // Estimate progress based on duration (rough approximation)
    const duration = Date.now() - new Date(scan.started_at).getTime();
    const estimatedTotal = 30000; // 30 seconds estimated
    return Math.min(95, (duration / estimatedTotal) * 100);
  }

  private formatLastUpdate(): string {
    if (!this.lastUpdateTime) return '';
    const now = Date.now();
    const diff = Math.floor((now - this.lastUpdateTime) / 1000);
    return `Updated ${diff}s ago`;
  }

  render() {
    // Compact mode for when embedded in other components
    if (this.hasAttribute('compact')) {
      return this.renderCompact();
    }

    return html`
      <div class="progress-container">
        <div class="progress-header">
          <h3 class="progress-title">
            Scan Progress
            ${this.runningScans.length > 0 ? html`(${this.runningScans.length} running)` : ''}
          </h3>
          <div class="progress-controls">
            ${this.autoRefresh ? html`
              <span class="last-update">${this.formatLastUpdate()}</span>
            ` : ''}
            <button 
              class="toggle-button ${this.autoRefresh ? 'active' : ''}"
              @click=${this.toggleAutoRefresh}
            >
              ${this.autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
            </button>
          </div>
        </div>

        ${this.runningScans.length === 0 ? html`
          <div class="no-scans">
            No scans currently running
          </div>
        ` : html`
          ${this.runningScans.map(scan => this.renderScanItem(scan))}
        `}
      </div>
    `;
  }

  private renderCompact() {
    if (this.runningScans.length === 0) {
      return html``;
    }

    const scan = this.runningScans[0];
    return html`
      <div class="compact">
        <div class="scan-spinner"></div>
        <span>Scan #${scan.id} running... ${this.getScanDuration(scan)}</span>
      </div>
    `;
  }

  private renderScanItem(scan: Scan) {
    const progress = this.getEstimatedProgress(scan);
    
    return html`
      <div class="scan-item">
        <div class="scan-spinner"></div>
        <div class="status-indicator status-${scan.status}"></div>
        <div class="scan-info">
          <div class="scan-title">Scan #${scan.id}</div>
          <div class="scan-details">
            ${scan.file_count ? `Processing ${scan.file_count} files` : 'Initializing...'}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        <div class="scan-duration">${this.getScanDuration(scan)}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scan-progress': ScanProgress;
  }
}