import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './tab-navigation.js';
import '../views/optimizations-view.js';
import '../views/settings-view.js';
import type { TabId } from './tab-navigation.js';

@customElement('ha-config-optimizer')
export class HaConfigOptimizer extends LitElement {
  @state()
  private activeTab: TabId = 'optimizations';

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      background: var(--primary-background-color, #fafafa);
      font-family: var(--font-family-primary, 'Roboto', sans-serif);
    }

    .header {
      background: var(--card-background-color, #ffffff);
      padding: 16px 24px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      color: var(--primary-text-color, #212121);
    }

    .subtitle {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      margin: 4px 0 0 0;
    }

    .content {
      height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .placeholder {
      text-align: center;
      color: var(--secondary-text-color, #757575);
      margin-top: 100px;
      padding: 24px;
    }

    .placeholder h2 {
      margin-bottom: 8px;
    }

    /* Default HA-like variables for theming */
    :host {
      --primary-color: #03a9f4;
      --accent-color: #ff9800;
      --primary-text-color: #212121;
      --secondary-text-color: #727272;
      --card-background-color: #ffffff;
      --primary-background-color: #fafafa;
      --secondary-background-color: #e5e5e5;
      --divider-color: #e0e0e0;
      --optimizer-success: #00c875;
      --optimizer-warning: #f57f17;
      --optimizer-error: #d32f2f;
      --impact-high: #d32f2f;
      --impact-medium: #f57f17;
      --impact-low: #00c875;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      :host {
        --primary-text-color: #ffffff;
        --secondary-text-color: #b3b3b3;
        --card-background-color: #2d2d2d;
        --primary-background-color: #1a1a1a;
        --secondary-background-color: #333333;
        --divider-color: #404040;
      }
    }
  `;

  private handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tabId;
  }

  private renderView() {
    switch (this.activeTab) {
      case 'optimizations':
        return html`<optimizations-view></optimizations-view>`;
      case 'automations':
        return html`
          <div class="placeholder">
            <h2>🤖 Automation Suggestions</h2>
            <p>AI-powered automation suggestions based on your device usage patterns.</p>
            <p><em>Coming soon...</em></p>
          </div>
        `;
      case 'diffs':
        return html`
          <div class="placeholder">
            <h2>📝 Configuration Diffs</h2>
            <p>Review and apply changes to your configuration files.</p>
            <p><em>Coming soon...</em></p>
          </div>
        `;
      case 'logs':
        return html`
          <div class="placeholder">
            <h2>📋 Operation Logs</h2>
            <p>View detailed logs of scan operations and system events.</p>
            <p><em>Coming soon...</em></p>
          </div>
        `;
      case 'settings':
        return html`<settings-view></settings-view>`;
      default:
        return html`<div class="placeholder">Unknown view</div>`;
    }
  }

  render() {
    return html`
      <div class="header">
        <h1 class="title">Config Optimizer</h1>
        <p class="subtitle">AI-powered Home Assistant configuration analysis</p>
      </div>
      
      <tab-navigation 
        .activeTab=${this.activeTab}
        @tab-change=${this.handleTabChange}
      ></tab-navigation>
      
      <div class="content">
        ${this.renderView()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-config-optimizer': HaConfigOptimizer;
  }
}