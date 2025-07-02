import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiService, type Suggestion, type Scan } from '../services/api.js';

@customElement('optimizations-view')
export class OptimizationsView extends LitElement {
  @state()
  private suggestions: Suggestion[] = [];

  @state()
  private loading = false;

  @state()
  private scans: Scan[] = [];

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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
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
              <div class="suggestion-body">${suggestion.body_md}</div>
              <div class="suggestion-actions">
                <button 
                  class="action-button btn-view-diff"
                  @click=${() => console.log('View diff:', suggestion.id)}
                >
                  View Diff
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
          `)}
        </div>
      `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'optimizations-view': OptimizationsView;
  }
}