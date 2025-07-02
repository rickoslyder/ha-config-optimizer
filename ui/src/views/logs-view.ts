import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Scan } from '../services/api.js';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
  scanId?: number;
}

@customElement('logs-view')
export class LogsView extends LitElement {
  @state()
  private scans: Scan[] = [];

  @state()
  private logs: LogEntry[] = [];

  @state()
  private loading = false;

  @state()
  private selectedScan: Scan | null = null;

  @state()
  private filterLevel: string = 'all';

  @state()
  private autoRefresh = false;

  private refreshInterval?: number;

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

    .auto-refresh-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--divider-color, #e0e0e0);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .toggle-switch.active {
      background: var(--primary-color, #03a9f4);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s ease;
    }

    .toggle-switch.active::after {
      transform: translateX(20px);
    }

    .content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
      height: calc(100vh - 200px);
    }

    .scans-panel {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid var(--divider-color, #e0e0e0);
      overflow-y: auto;
    }

    .scans-panel h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .scan-item {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
    }

    .scan-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .scan-item.selected {
      background: var(--secondary-background-color, #f5f5f5);
      border-left-color: var(--primary-color, #03a9f4);
    }

    .scan-item.status-running {
      border-left-color: var(--optimizer-warning, #f57f17);
    }

    .scan-item.status-completed {
      border-left-color: var(--optimizer-success, #00c875);
    }

    .scan-item.status-failed {
      border-left-color: var(--optimizer-error, #d32f2f);
    }

    .scan-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--primary-text-color, #212121);
    }

    .scan-meta {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .scan-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      margin-left: 8px;
    }

    .scan-status.pending {
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
    }

    .scan-status.running {
      background: var(--optimizer-warning, #f57f17);
      color: white;
    }

    .scan-status.completed {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .scan-status.failed {
      background: var(--optimizer-error, #d32f2f);
      color: white;
    }

    .logs-panel {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logs-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      background: var(--secondary-background-color, #f5f5f5);
    }

    .logs-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .logs-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      font-family: var(--font-family-code, 'Roboto Mono', monospace);
      font-size: 13px;
      line-height: 1.4;
    }

    .log-entry {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .log-entry:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .log-timestamp {
      color: var(--secondary-text-color, #757575);
      white-space: nowrap;
      flex-shrink: 0;
      width: 80px;
      font-size: 11px;
    }

    .log-level {
      width: 60px;
      text-align: center;
      border-radius: 3px;
      padding: 2px 4px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .log-level.info {
      background: var(--primary-color, #03a9f4);
      color: white;
    }

    .log-level.warning {
      background: var(--optimizer-warning, #f57f17);
      color: white;
    }

    .log-level.error {
      background: var(--optimizer-error, #d32f2f);
      color: white;
    }

    .log-level.success {
      background: var(--optimizer-success, #00c875);
      color: white;
    }

    .log-message {
      flex: 1;
      color: var(--primary-text-color, #212121);
      word-break: break-word;
    }

    .log-details {
      margin-top: 4px;
      padding: 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 3px;
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
      white-space: pre-wrap;
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

    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
        grid-template-rows: 200px 1fr;
      }
      
      .controls {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
    this.startAutoRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRefresh();
  }

  private async loadData() {
    this.loading = true;
    try {
      const scans = await apiService.getScans();
      this.scans = scans;
      
      // Auto-select the most recent scan if none selected
      if (!this.selectedScan && scans.length > 0) {
        this.selectedScan = scans[0];
      }
      
      this.generateLogsFromScans();
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      this.loading = false;
    }
  }

  private generateLogsFromScans() {
    // Generate synthetic logs from scan data
    // In a real implementation, these would come from actual log files or database
    const logs: LogEntry[] = [];
    
    this.scans.forEach(scan => {
      const baseTime = new Date(scan.started_at).getTime();
      
      // Scan started log
      logs.push({
        id: `${scan.id}-start`,
        timestamp: scan.started_at,
        level: 'info',
        message: `Scan #${scan.id} started`,
        details: `Type: ${scan.scan_type}\\nFiles: ${scan.file_count || 0}`,
        scanId: scan.id
      });
      
      // Progress logs for running/completed scans
      if (scan.status !== 'pending') {
        logs.push({
          id: `${scan.id}-analyzing`,
          timestamp: new Date(baseTime + 5000).toISOString(),
          level: 'info',
          message: `Analyzing configuration files`,
          details: `Processing ${scan.file_count || 0} YAML files`,
          scanId: scan.id
        });
        
        if (scan.suggestions && scan.suggestions.length > 0) {
          logs.push({
            id: `${scan.id}-suggestions`,
            timestamp: new Date(baseTime + 15000).toISOString(),
            level: 'success',
            message: `Generated ${scan.suggestions.length} suggestions`,
            details: `Found ${scan.suggestions.filter(s => s.impact === 'high').length} high-impact suggestions`,
            scanId: scan.id
          });
        }
      }
      
      // Final status log
      if (scan.ended_at) {
        const level = scan.status === 'completed' ? 'success' : 'error';
        const duration = Math.round((new Date(scan.ended_at).getTime() - baseTime) / 1000);
        
        logs.push({
          id: `${scan.id}-end`,
          timestamp: scan.ended_at,
          level,
          message: `Scan #${scan.id} ${scan.status}`,
          details: `Duration: ${duration}s\\nSuggestions: ${scan.suggestions?.length || 0}`,
          scanId: scan.id
        });
      } else if (scan.status === 'failed') {
        logs.push({
          id: `${scan.id}-failed`,
          timestamp: new Date(baseTime + 10000).toISOString(),
          level: 'error',
          message: `Scan #${scan.id} failed`,
          details: 'Check LLM configuration and API keys',
          scanId: scan.id
        });
      }
    });
    
    // Sort by timestamp descending (newest first)
    this.logs = logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private handleScanSelect(scan: Scan) {
    this.selectedScan = scan;
  }

  private handleFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filterLevel = select.value;
  }

  private toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    this.refreshInterval = window.setInterval(() => {
      this.loadData();
    }, 5000); // Refresh every 5 seconds
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private async handleRefresh() {
    await this.loadData();
  }

  private getFilteredLogs(): LogEntry[] {
    let filtered = this.logs;
    
    // Filter by selected scan
    if (this.selectedScan) {
      filtered = filtered.filter(log => log.scanId === this.selectedScan!.id);
    }
    
    // Filter by log level
    if (this.filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === this.filterLevel);
    }
    
    return filtered;
  }

  private formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>⏳ Loading scan logs...</div>
        </div>
      `;
    }

    const filteredLogs = this.getFilteredLogs();

    return html`
      <div class="header">
        <h1 class="title">Scan Logs</h1>
        <div class="controls">
          <select class="filter-select" @change=${this.handleFilterChange}>
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          
          <button class="refresh-button" @click=${this.handleRefresh} ?disabled=${this.loading}>
            🔄 Refresh
          </button>
          
          <div class="auto-refresh-toggle">
            <span>Auto-refresh</span>
            <div 
              class="toggle-switch ${this.autoRefresh ? 'active' : ''}"
              @click=${this.toggleAutoRefresh}
            ></div>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="scans-panel">
          <h3>Recent Scans</h3>
          ${this.scans.length === 0 ? html`
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <p>No scans found</p>
            </div>
          ` : html`
            <div class="scan-item ${this.selectedScan === null ? 'selected' : ''}" @click=${() => this.selectedScan = null}>
              <div class="scan-title">All Scans</div>
              <div class="scan-meta">View logs from all scans</div>
            </div>
            ${this.scans.map(scan => html`
              <div 
                class="scan-item status-${scan.status} ${this.selectedScan?.id === scan.id ? 'selected' : ''}"
                @click=${() => this.handleScanSelect(scan)}
              >
                <div class="scan-title">
                  Scan #${scan.id}
                  <span class="scan-status ${scan.status}">${scan.status}</span>
                </div>
                <div class="scan-meta">
                  ${this.formatDate(scan.started_at)}
                  ${scan.file_count ? ` • ${scan.file_count} files` : ''}
                  ${scan.suggestions ? ` • ${scan.suggestions.length} suggestions` : ''}
                </div>
              </div>
            `)}
          `}
        </div>

        <div class="logs-panel">
          <div class="logs-header">
            <h3>
              ${this.selectedScan ? `Scan #${this.selectedScan.id} Logs` : 'All Scan Logs'}
              ${filteredLogs.length > 0 ? `(${filteredLogs.length})` : ''}
            </h3>
          </div>
          <div class="logs-content">
            ${filteredLogs.length === 0 ? html`
              <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No logs found</h3>
                <p>No log entries match the current filters.</p>
              </div>
            ` : filteredLogs.map(log => html`
              <div class="log-entry">
                <div class="log-timestamp">${this.formatTime(log.timestamp)}</div>
                <div class="log-level ${log.level}">${log.level}</div>
                <div class="log-message">
                  ${log.message}
                  ${log.details ? html`
                    <div class="log-details">${log.details}</div>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'logs-view': LogsView;
  }
}