import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UserFriendlyError } from '../utils/error-handler.js';

@customElement('error-recovery')
export class ErrorRecovery extends LitElement {
  @property({ type: Object })
  error: UserFriendlyError | null = null;

  @property({ type: Boolean })
  show = false;

  @state()
  private showDetails = false;

  static styles = css`
    :host {
      display: block;
    }

    .error-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 400px;
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      border-left: 4px solid var(--optimizer-error, #d32f2f);
      z-index: 1002;
      animation: slideUp 0.3s ease-out;
      transform: translateY(0);
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    }

    .error-panel.hidden {
      transform: translateY(100%);
      opacity: 0;
      pointer-events: none;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .error-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: var(--optimizer-error, #d32f2f);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--secondary-text-color, #757575);
      padding: 0;
      margin-left: 8px;
    }

    .error-message {
      color: var(--primary-text-color, #212121);
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .error-suggestions {
      margin-bottom: 16px;
    }

    .suggestions-title {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: var(--primary-text-color, #212121);
    }

    .suggestions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .suggestion-item {
      padding: 6px 0;
      color: var(--secondary-text-color, #757575);
      font-size: 14px;
      line-height: 1.4;
      position: relative;
      padding-left: 16px;
    }

    .suggestion-item:before {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--primary-color, #03a9f4);
      font-weight: bold;
    }

    .error-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .action-button.secondary {
      background: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .action-button.secondary:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .toggle-details {
      background: none;
      border: none;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      font-size: 12px;
      text-decoration: underline;
      padding: 0;
      margin-top: 8px;
    }

    .error-details {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      font-family: monospace;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 8px;
      border-radius: 4px;
      max-height: 100px;
      overflow-y: auto;
    }

    .user-error-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(255, 193, 7, 0.1);
      color: var(--optimizer-warning, #f57f17);
      margin-bottom: 8px;
    }

    .system-error-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(211, 47, 47, 0.1);
      color: var(--optimizer-error, #d32f2f);
      margin-bottom: 8px;
    }
  `;

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private handleGoToSettings() {
    this.dispatchEvent(new CustomEvent('go-to-settings'));
    this.handleClose();
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('retry'));
    this.handleClose();
  }

  private handleTestConnection() {
    this.dispatchEvent(new CustomEvent('test-connection'));
    this.handleClose();
  }

  private toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  private getActionButtons() {
    if (!this.error) return [];

    const buttons = [];

    // Add contextual action buttons based on error type
    if (this.error.title.includes('API Key') || this.error.title.includes('LLM')) {
      buttons.push({
        label: 'Fix in Settings',
        action: this.handleGoToSettings,
        primary: true
      });
      buttons.push({
        label: 'Test Connection',
        action: this.handleTestConnection,
        primary: false
      });
    } else if (this.error.title.includes('Scan Failed')) {
      buttons.push({
        label: 'Try Again',
        action: this.handleRetry,
        primary: true
      });
      buttons.push({
        label: 'Check Settings',
        action: this.handleGoToSettings,
        primary: false
      });
    } else {
      buttons.push({
        label: 'Try Again',
        action: this.handleRetry,
        primary: true
      });
    }

    return buttons;
  }

  render() {
    if (!this.error || !this.show) {
      return html``;
    }

    const actionButtons = this.getActionButtons();

    return html`
      <div class="error-panel ${!this.show ? 'hidden' : ''}">
        <div class="error-header">
          <h3 class="error-title">
            ⚠️ ${this.error.title}
          </h3>
          <button class="error-close" @click=${this.handleClose}>×</button>
        </div>

        ${this.error.isUserError ? html`
          <div class="user-error-badge">
            ℹ️ Action Required
          </div>
        ` : html`
          <div class="system-error-badge">
            🔧 System Issue
          </div>
        `}

        <div class="error-message">
          ${this.error.message}
        </div>

        ${this.error.suggestions && this.error.suggestions.length > 0 ? html`
          <div class="error-suggestions">
            <div class="suggestions-title">💡 How to fix this:</div>
            <ul class="suggestions-list">
              ${this.error.suggestions.map(suggestion => html`
                <li class="suggestion-item">${suggestion}</li>
              `)}
            </ul>
          </div>
        ` : ''}

        <div class="error-actions">
          ${actionButtons.map(button => html`
            <button 
              class="action-button ${button.primary ? '' : 'secondary'}"
              @click=${button.action}
            >
              ${button.label}
            </button>
          `)}
          <button class="action-button secondary" @click=${this.handleClose}>
            Dismiss
          </button>
        </div>

        ${!this.error.isUserError ? html`
          <button class="toggle-details" @click=${this.toggleDetails}>
            ${this.showDetails ? 'Hide' : 'Show'} technical details
          </button>
          
          ${this.showDetails ? html`
            <div class="error-details">
              Error occurred at: ${new Date().toLocaleString()}<br>
              Type: ${this.error.isUserError ? 'User' : 'System'} error<br>
              Context: Home Assistant Config Optimizer
            </div>
          ` : ''}
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'error-recovery': ErrorRecovery;
  }
}